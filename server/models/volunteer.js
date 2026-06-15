import pool from '../db.js';
import { promisify } from 'util';

function positiveInteger(value, message) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    const err = new Error(message);
    err.status = 400;
    throw err;
  }
  return parsed;
}

function optionalString(value) {
  const parsed = String(value || '').trim();
  return parsed || null;
}

function normalizeDateTime(value, message) {
  const parsed = optionalString(value);
  if (!parsed) return null;

  const normalized = parsed.replace('T', ' ');
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(normalized)) {
    return `${normalized}:00`;
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized)) {
    return normalized;
  }

  const err = new Error(message);
  err.status = 400;
  throw err;
}

function mapSignup(row) {
  if (!row) return null;
  return {
    id: row.id,
    eventId: row.event_id,
    computingId: row.computing_id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    volunteerRole: row.volunteer_role,
    shiftStart: row.shift_start,
    shiftEnd: row.shift_end,
    status: row.signup_status,
  };
}

export async function listVolunteerEvents(councilYearId, computingId) {
  const yearId = positiveInteger(councilYearId, 'Invalid council id');
  const conn = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);

  try {
    const events = await query(
      `SELECT e.event_id AS id,
              e.event_id,
              e.name,
              e.description,
              e.event_date,
              e.event_time,
              e.status,
              e.budget_allocated,
              e.volunteer_slots,
              c.committee_id,
              c.committee_name,
              l.name AS location_name,
              COALESCE(signups.signed_up_count, 0) AS signup_count
         FROM CouncilEvent e
         JOIN Committee c ON e.committee_id = c.committee_id
         LEFT JOIN Location l ON e.location_id = l.location_id
         LEFT JOIN (
           SELECT event_id, COUNT(*) AS signed_up_count
             FROM VolunteerSignup
            WHERE signup_status = 'signed_up'
            GROUP BY event_id
         ) signups ON signups.event_id = e.event_id
        WHERE c.council_year_id = ?
        ORDER BY e.event_date ASC, e.event_time ASC`,
      [yearId]
    );

    if (!events.length) return [];

    const eventIds = events.map(event => event.event_id);
    const signupRows = await query(
      `SELECT vs.volunteer_signup_id AS id,
              vs.event_id,
              vs.computing_id,
              cm.first_name,
              cm.last_name,
              cm.email,
              vs.volunteer_role,
              vs.shift_start,
              vs.shift_end,
              vs.signup_status
         FROM VolunteerSignup vs
         LEFT JOIN CouncilMember cm ON vs.computing_id = cm.computing_id
        WHERE vs.event_id IN (?)
        ORDER BY vs.event_id, vs.signup_status, cm.last_name, cm.first_name, vs.computing_id`,
      [eventIds]
    );

    const signupsByEvent = new Map();
    for (const row of signupRows) {
      const list = signupsByEvent.get(row.event_id) || [];
      list.push(mapSignup(row));
      signupsByEvent.set(row.event_id, list);
    }

    return events.map(event => {
      const signups = signupsByEvent.get(event.event_id) || [];
      const activeSignups = signups.filter(signup => signup.status === 'signed_up');
      const currentUserSignup = signups.find(signup =>
        signup.computingId === computingId && signup.status === 'signed_up'
      ) || null;
      const slots = Number(event.volunteer_slots) || 0;
      const count = Number(event.signup_count) || activeSignups.length;

      return {
        ...event,
        volunteer_slots: slots,
        signup_count: count,
        spots_remaining: Math.max(slots - count, 0),
        signups: activeSignups,
        currentUserSignup,
      };
    });
  } finally {
    conn.release();
  }
}

export async function signUpForEvent({ eventId, computingId, councilYearId, volunteerRole, shiftStart, shiftEnd }) {
  const parsedEventId = positiveInteger(eventId, 'Invalid event id');
  const yearId = positiveInteger(councilYearId, 'Invalid council id');
  const role = optionalString(volunteerRole) || 'General Volunteer';
  const start = normalizeDateTime(shiftStart, 'Shift start must be a valid date and time');
  const end = normalizeDateTime(shiftEnd, 'Shift end must be a valid date and time');

  if (start && end && new Date(start).getTime() > new Date(end).getTime()) {
    const err = new Error('Shift end must be after shift start');
    err.status = 400;
    throw err;
  }

  const conn = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);
  const beginTransaction = promisify(conn.beginTransaction).bind(conn);
  const commit = promisify(conn.commit).bind(conn);
  const rollback = promisify(conn.rollback).bind(conn);

  try {
    await beginTransaction();

    const eventRows = await query(
      `SELECT e.event_id, e.volunteer_slots, c.council_year_id
         FROM CouncilEvent e
         JOIN Committee c ON e.committee_id = c.committee_id
        WHERE e.event_id = ?
        LIMIT 1
        FOR UPDATE`,
      [parsedEventId]
    );

    if (!eventRows.length) {
      const err = new Error('Event not found');
      err.status = 404;
      throw err;
    }

    const event = eventRows[0];
    if (Number(event.council_year_id) !== yearId) {
      const err = new Error('You can only volunteer for your class council events');
      err.status = 403;
      throw err;
    }

    const slots = Number(event.volunteer_slots) || 0;
    if (slots <= 0) {
      const err = new Error('This event is not requesting volunteers');
      err.status = 400;
      throw err;
    }

    const existingRows = await query(
      `SELECT volunteer_signup_id, signup_status
         FROM VolunteerSignup
        WHERE event_id = ?
          AND computing_id = ?
        ORDER BY volunteer_signup_id DESC
        LIMIT 1
        FOR UPDATE`,
      [parsedEventId, computingId]
    );
    const existing = existingRows[0] || null;

    const countRows = await query(
      `SELECT COUNT(*) AS signupCount
         FROM VolunteerSignup
        WHERE event_id = ?
          AND signup_status = 'signed_up'
          AND volunteer_signup_id <> ?`,
      [parsedEventId, existing?.volunteer_signup_id || 0]
    );
    const signupCount = Number(countRows[0]?.signupCount || 0);

    if (signupCount >= slots && existing?.signup_status !== 'signed_up') {
      const err = new Error('All volunteer spots are filled');
      err.status = 409;
      throw err;
    }

    let signupId;
    if (existing) {
      await query(
        `UPDATE VolunteerSignup
            SET volunteer_role = ?,
                shift_start = ?,
                shift_end = ?,
                signup_status = 'signed_up'
          WHERE volunteer_signup_id = ?`,
        [role, start, end, existing.volunteer_signup_id]
      );
      signupId = existing.volunteer_signup_id;
    } else {
      const result = await query(
        `INSERT INTO VolunteerSignup
           (event_id, computing_id, volunteer_role, shift_start, shift_end, signup_status)
         VALUES (?,?,?,?,?,'signed_up')`,
        [parsedEventId, computingId, role, start, end]
      );
      signupId = result.insertId;
    }

    await commit();
    return { id: signupId, eventId: parsedEventId, status: 'signed_up' };
  } catch (err) {
    await rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function cancelVolunteerSignup({ eventId, computingId, councilYearId }) {
  const parsedEventId = positiveInteger(eventId, 'Invalid event id');
  const yearId = positiveInteger(councilYearId, 'Invalid council id');
  const conn = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);

  try {
    const eventRows = await query(
      `SELECT e.event_id, c.council_year_id
         FROM CouncilEvent e
         JOIN Committee c ON e.committee_id = c.committee_id
        WHERE e.event_id = ?
        LIMIT 1`,
      [parsedEventId]
    );

    if (!eventRows.length) {
      const err = new Error('Event not found');
      err.status = 404;
      throw err;
    }

    if (Number(eventRows[0].council_year_id) !== yearId) {
      const err = new Error('You can only update your class council volunteer signups');
      err.status = 403;
      throw err;
    }

    const result = await query(
      `UPDATE VolunteerSignup
          SET signup_status = 'cancelled'
        WHERE event_id = ?
          AND computing_id = ?
          AND signup_status = 'signed_up'`,
      [parsedEventId, computingId]
    );

    if (!result.affectedRows) {
      const err = new Error('No active volunteer signup found for this event');
      err.status = 404;
      throw err;
    }

    return { eventId: parsedEventId, status: 'cancelled' };
  } finally {
    conn.release();
  }
}
