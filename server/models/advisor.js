// server/models/advisor.js
import pool from '../db.js';
import { promisify } from 'util';

/**
 * Inserts a new advisor into the database.
 * @param {{ firstName: string, lastName: string, email: string, phone?: string, building?: string, address?: string }} data
 * @returns {Promise<number>} the newly created advisor_id
 */
export async function createAdvisor(data) {
  const advisor = normalizeAdvisor(data);

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
        advisor.firstName,
        advisor.lastName,
        advisor.phone,
        advisor.email,
        advisor.building,
        advisor.address
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

function normalizeAdvisor(data = {}) {
  const firstName = String(data.firstName || '').trim();
  const lastName = String(data.lastName || '').trim();
  const email = String(data.email || '').trim();

  if (!firstName || !lastName || !email) {
    const err = new Error('First name, last name, and email are required');
    err.status = 400;
    throw err;
  }

  return {
    firstName,
    lastName,
    email,
    phone: String(data.phone || '').trim() || null,
    building: String(data.building || '').trim() || null,
    address: String(data.address || '').trim() || null,
  };
}

export async function updateAdvisor(advisorId, data) {
  const id = Number(advisorId);
  if (!Number.isInteger(id) || id <= 0) {
    const err = new Error('Invalid advisor id');
    err.status = 400;
    throw err;
  }

  const advisor = normalizeAdvisor(data);
  const result = await pool.query(
    `UPDATE Advisor
        SET advisor_first_name = ?,
            advisor_last_name = ?,
            advisor_phone = ?,
            advisor_email = ?,
            building_name = ?,
            address = ?
      WHERE advisor_id = ?`,
    [
      advisor.firstName,
      advisor.lastName,
      advisor.phone,
      advisor.email,
      advisor.building,
      advisor.address,
      id,
    ]
  );

  if (!result.affectedRows) {
    const err = new Error('Advisor not found');
    err.status = 404;
    throw err;
  }

  return { id, ...advisor };
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
