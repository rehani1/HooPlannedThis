// server/models/advisor.js
import pool from '../db.js';
import { promisify } from 'util';

/**
 * Inserts a new advisor into the database.
 * @param {{ firstName: string, lastName: string, phone?: string, email?: string, building?: string, address?: string }} data
 * @returns {Promise<number>} the newly created advisor_id
 */
export async function createAdvisor(data) {
  const conn = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);
  const beginTransaction = promisify(conn.beginTransaction).bind(conn);
  const commit = promisify(conn.commit).bind(conn);
  const rollback = promisify(conn.rollback).bind(conn);

  try {
    await beginTransaction();

    const res = await query(
      `INSERT INTO Advisor
         (advisor_first_name, advisor_last_name, advisor_phone,
          advisor_email, building_name, address)
       VALUES (?,?,?,?,?,?)`,
      [
        data.firstName,
        data.lastName,
        data.phone        || null,
        data.email        || null,
        data.building     || null,
        data.address      || null
      ]
    );

    await commit();
    return res.insertId;
  } catch (err) {
    await rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Fetches a list of advisors from the database.
 * @returns {Promise<Array>} array of advisor objects
 */
export async function getAdvisors() {
  const conn = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);
  try {
    const rows = await query(
      `SELECT
         advisor_id         AS id,
         advisor_first_name AS firstName,
         advisor_last_name  AS lastName,
         advisor_phone      AS phone,
         advisor_email      AS email,
         building_name      AS building,
         address
       FROM Advisor`
    );
    return rows;
  } finally {
    conn.release();
  }
}
