// server/models/event.js
import pool from '../db.js';
import { promisify } from 'util';

export async function createEvent(data) {
  const conn  = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);

  try {
    await conn.beginTransaction();

    // 1) insert location (if provided)
    let locationId = null;
    if (data.locationName || data.locationAddress) {
      const locRes = await query(
        `INSERT INTO Location
           (name, address, city, state, zipcode, venue_email)
         VALUES (?,?,?,?,?,?)`,
        [
          data.locationName    || null,
          data.locationAddress || null,
          data.city            || null,
          data.state           || null,
          data.zipcode         || null,
          data.venueEmail      || null
        ]
      );
      locationId = locRes.insertId;
    }

    // 2) insert event
    const evtRes = await query(
      `INSERT INTO Event
         (name, event_date, event_time,
          description, budget_allocated,
          committee_id, location_id)
       VALUES (?,?,?,?,?,?,?)`,
      [
        data.title,
        data.date,
        data.startTime,            // XXX if you only have one time column
        data.description   || null,
        data.budget        ?? 0.00,
        data.committeeId,
        locationId
      ]
    );
    const eventId = evtRes.insertId;

    // 3) insert supplies + vendors
    for (const s of data.supplies || []) {
      // upsert vendor
      if (s.vendor?.company) {
        await query(
          `INSERT INTO Vendor
             (company_name, contact_name, contact_address, contact_email, contact_phone)
           VALUES (?,?,?,?,?)
           ON DUPLICATE KEY UPDATE
             contact_name    = VALUES(contact_name),
             contact_address = VALUES(contact_address),
             contact_email   = VALUES(contact_email),
             contact_phone   = VALUES(contact_phone)`,
          [
            s.vendor.company,
            s.vendor.contact_name    || null,
            s.vendor.contact_address || null,
            s.vendor.contact_email   || null,
            s.vendor.contact_phone   || null
          ]
        );
      }

      // insert supply
      await query(
        `INSERT INTO Supply
           (event_id, company_name, name, stock_qty, cost,
            description, link, reusable, return_needed)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [
          eventId,
          s.vendor?.company   || null,
          s.name,
          s.quantity,
          s.unitCost,
          s.notes            || null,
          s.link             || null,
          s.reusable   ? 1   : 0,
          s.return_needed ? 1 : 0
        ]
      );
    }

    await conn.commit();
    return eventId;

  } catch (err) {
    await conn.rollback();
    throw err;

  } finally {
    conn.release();
  }
}

export async function getEvents(limit = 3, order = 'DESC') {
  const conn  = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);

  try {
    const rows = await query(
      `SELECT *
         FROM Event
        ORDER BY event_date ${order}
        LIMIT ?`,
      [limit]
    );
    return rows;
  } finally {
    conn.release();
  }
}
