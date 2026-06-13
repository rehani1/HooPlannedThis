// server/models/advisor.js
import pool from '../db.js';
import { promisify } from 'util';

/**
 * Inserts a new advisor into the database.
 * @param {{ firstName: string, lastName: string, email: string, phone?: string, building?: string, address?: string }} data
 * @returns {Promise<number>} the newly created advisor_id
 */
export async function createAdvisor(data) {
  const firstName = data.firstName?.trim();
  const lastName = data.lastName?.trim();
  const email = data.email?.trim();

  if (!firstName || !lastName || !email) {
    const err = new Error('First name, last name, and email are required');
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

    const res = await query(
      `INSERT INTO Advisor
         (advisor_first_name, advisor_last_name, advisor_phone,
          advisor_email, building_name, address)
       VALUES (?,?,?,?,?,?)`,
      [
        firstName,
        lastName,
        data.phone?.trim()    || null,
        email,
        data.building?.trim() || null,
        data.address?.trim()  || null
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
