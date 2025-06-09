import pool from '../db.js';


export async function getUserByUsername(username) {
  const rows = await pool.query(
    'SELECT id, username, password_hash AS passwordHash FROM users WHERE username = ?',
    [username]
  )
  return rows[0] || null
}

export async function createUser({ firstName, lastName, email, classId, username, passwordHash }) {
  const result = await pool.query(
    `INSERT INTO users
      (first_name, last_name, email, class_id, username, password_hash)
    VALUES (?,?,?,?,?,?)`,
    [firstName, lastName, email, classId, username, passwordHash]
  )
  return { id: result.insertId }
}

export async function createAccountRequest({ firstName, lastName, email, classId }) {
  await pool.query(
    `INSERT INTO account_requests
      (first_name, last_name, email, class_id)
    VALUES (?,?,?,?)`,
    [firstName, lastName, email, classId]
  )
}
