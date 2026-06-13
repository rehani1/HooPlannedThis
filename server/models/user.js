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
