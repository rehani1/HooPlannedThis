import pool from '../db.js';
import { promisify } from 'util';


export async function getUserByUsername(username) {
  const rows = await pool.query(
    `SELECT cm.computing_id AS id,
            cm.computing_id AS username,
            cm.password_hash AS passwordHash,
            cy.grad_year AS gradYear,
            MIN(cmem.committee_id) AS committeeId
       FROM CouncilMember cm
       LEFT JOIN CouncilYear cy ON cm.council_year_id = cy.council_year_id
       LEFT JOIN CommitteeMembership cmem ON cm.computing_id = cmem.computing_id
      WHERE cm.computing_id = ?
      GROUP BY cm.computing_id, cm.password_hash, cy.grad_year`,
    [username]
  )
  return rows[0] || null
}

export async function createUser({
  firstName,
  lastName,
  email,
  classId,
  academicYear,
  username,
  passwordHash,
  role,
  committee,
}) {
  const conn = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);
  const beginTransaction = promisify(conn.beginTransaction).bind(conn);
  const commit = promisify(conn.commit).bind(conn);
  const rollback = promisify(conn.rollback).bind(conn);

  try {
    await beginTransaction();

    const councilRows = await query(
      `SELECT council_year_id
         FROM CouncilYear
        WHERE grad_year = ? AND academic_year = ?
        LIMIT 1`,
      [classId, academicYear]
    );
    const councilYearId = councilRows[0]?.council_year_id;

    if (!councilYearId) {
      const err = new Error('Council year not found for selected class and academic year');
      err.status = 400;
      throw err;
    }

    await query(
      `INSERT INTO CouncilMember
         (computing_id, council_year_id, first_name, last_name, email, password_hash)
       VALUES (?,?,?,?,?,?)`,
      [username, councilYearId, firstName, lastName, email, passwordHash]
    );

    const committeeName = committee?.trim();
    const hasCommittee =
      committeeName &&
      !committeeName.toLowerCase().startsWith('not in committee');

    if (hasCommittee) {
      const committeeRows = await query(
        `SELECT committee_id
           FROM Committee
          WHERE council_year_id = ? AND committee_name = ?
          LIMIT 1`,
        [councilYearId, committeeName]
      );
      const committeeId = committeeRows[0]?.committee_id;

      if (!committeeId) {
        const err = new Error('Selected committee was not found for this council year');
        err.status = 400;
        throw err;
      }

      await query(
        `INSERT INTO CommitteeMembership
           (computing_id, committee_id, membership_role, start_date)
         VALUES (?,?,?,CURRENT_DATE)`,
        [username, committeeId, role || 'member']
      );
    } else if (role) {
      await query(
        `INSERT INTO ExecutivePosition
           (computing_id, council_year_id, role)
         VALUES (?,?,?)`,
        [username, councilYearId, role]
      );
    }

    await commit();
    return { id: username };
  } catch (err) {
    await rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      err.status = 409;
      err.message = 'Email or username already exists';
    }
    throw err;
  } finally {
    conn.release();
  }
}

function normalizeCommitteeName(committee) {
  const committeeName = committee?.trim();
  const hasCommittee =
    committeeName &&
    !committeeName.toLowerCase().startsWith('not in committee');

  return hasCommittee ? committeeName : null;
}

async function findCouncilYear(query, classId, academicYear) {
  const councilRows = await query(
    `SELECT council_year_id
       FROM CouncilYear
      WHERE grad_year = ? AND academic_year = ?
      LIMIT 1`,
    [classId, academicYear]
  );
  return councilRows[0]?.council_year_id;
}

async function ensureAccountDoesNotExist(query, username, email) {
  const existingMembers = await query(
    `SELECT computing_id
       FROM CouncilMember
      WHERE computing_id = ? OR email = ?
      LIMIT 1`,
    [username, email]
  );

  if (existingMembers.length) {
    const err = new Error('An account with that computing ID or email already exists');
    err.status = 409;
    throw err;
  }
}

async function ensurePendingRequestDoesNotExist(query, username, email) {
  const existingRequests = await query(
    `SELECT request_id
       FROM AccountRequest
      WHERE request_status = 'pending'
        AND (computing_id = ? OR email = ?)
      LIMIT 1`,
    [username, email]
  );

  if (existingRequests.length) {
    const err = new Error('An account request is already pending for that computing ID or email');
    err.status = 409;
    throw err;
  }
}

async function createApprovedUserFromRequest(query, request) {
  await ensureAccountDoesNotExist(query, request.computing_id, request.email);

  await query(
    `INSERT INTO CouncilMember
       (computing_id, council_year_id, first_name, last_name, email, password_hash)
     VALUES (?,?,?,?,?,?)`,
    [
      request.computing_id,
      request.council_year_id,
      request.first_name,
      request.last_name,
      request.email,
      request.password_hash,
    ]
  );

  const committeeName = normalizeCommitteeName(request.requested_committee_name);

  if (committeeName) {
    const committeeRows = await query(
      `SELECT committee_id
         FROM Committee
        WHERE council_year_id = ? AND committee_name = ?
        LIMIT 1`,
      [request.council_year_id, committeeName]
    );
    const committeeId = committeeRows[0]?.committee_id;

    if (!committeeId) {
      const err = new Error('Selected committee was not found for this council year');
      err.status = 400;
      throw err;
    }

    await query(
      `INSERT INTO CommitteeMembership
         (computing_id, committee_id, membership_role, start_date)
       VALUES (?,?,?,CURRENT_DATE)`,
      [request.computing_id, committeeId, request.requested_role || 'member']
    );
  } else if (request.requested_role) {
    await query(
      `INSERT INTO ExecutivePosition
         (computing_id, council_year_id, role)
       VALUES (?,?,?)`,
      [request.computing_id, request.council_year_id, request.requested_role]
    );
  }
}

export async function createAccountRequest({
  firstName,
  lastName,
  email,
  classId,
  academicYear,
  username,
  passwordHash,
  role,
  committee,
}) {
  const conn = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);
  const beginTransaction = promisify(conn.beginTransaction).bind(conn);
  const commit = promisify(conn.commit).bind(conn);
  const rollback = promisify(conn.rollback).bind(conn);

  try {
    await beginTransaction();

    const councilYearId = await findCouncilYear(query, classId, academicYear);
    if (!councilYearId) {
      const err = new Error('Council year not found for selected class and academic year');
      err.status = 400;
      throw err;
    }

    await ensureAccountDoesNotExist(query, username, email);
    await ensurePendingRequestDoesNotExist(query, username, email);

    const result = await query(
      `INSERT INTO AccountRequest
         (computing_id, council_year_id, first_name, last_name, email, password_hash,
          requested_role, requested_committee_name)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        username,
        councilYearId,
        firstName,
        lastName,
        email,
        passwordHash,
        role || null,
        committee || null,
      ]
    );

    await commit();
    return { id: result.insertId };
  } catch (err) {
    await rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function listPendingAccountRequests() {
  const rows = await pool.query(
    `SELECT ar.request_id AS id,
            ar.computing_id AS username,
            ar.first_name AS firstName,
            ar.last_name AS lastName,
            ar.email,
            ar.requested_role AS role,
            ar.requested_committee_name AS committee,
            ar.requested_at AS requestedAt,
            cy.grad_year AS classId,
            cy.academic_year AS academicYear
       FROM AccountRequest ar
       JOIN CouncilYear cy ON ar.council_year_id = cy.council_year_id
      WHERE ar.request_status = 'pending'
      ORDER BY ar.requested_at ASC, ar.request_id ASC`
  );
  return rows;
}

export async function approveAccountRequest(requestId) {
  const conn = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);
  const beginTransaction = promisify(conn.beginTransaction).bind(conn);
  const commit = promisify(conn.commit).bind(conn);
  const rollback = promisify(conn.rollback).bind(conn);

  try {
    await beginTransaction();

    const requestRows = await query(
      `SELECT *
         FROM AccountRequest
        WHERE request_id = ? AND request_status = 'pending'
        FOR UPDATE`,
      [requestId]
    );
    const request = requestRows[0];

    if (!request) {
      const err = new Error('Pending account request not found');
      err.status = 404;
      throw err;
    }

    await createApprovedUserFromRequest(query, request);

    await query(
      `UPDATE AccountRequest
          SET request_status = 'approved',
              reviewed_at = CURRENT_TIMESTAMP
        WHERE request_id = ?`,
      [requestId]
    );

    await commit();
    return { id: request.computing_id };
  } catch (err) {
    await rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function denyAccountRequest(requestId) {
  const result = await pool.query(
    `UPDATE AccountRequest
        SET request_status = 'denied',
            reviewed_at = CURRENT_TIMESTAMP
      WHERE request_id = ? AND request_status = 'pending'`,
    [requestId]
  );

  if (!result.affectedRows) {
    const err = new Error('Pending account request not found');
    err.status = 404;
    throw err;
  }

  return { id: Number(requestId) };
}
