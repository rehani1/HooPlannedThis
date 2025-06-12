import pool from '../db.js';


export async function getUserByUsername(username) {
  const rows = await pool.query(
    'SELECT id, username, password_hash AS passwordHash FROM CouncilMember WHERE username = ?',
    [username]
  )
  return rows[0] || null
}

export async function createUser({ firstName, lastName, email, classId, username, passwordHash }) {
  try {
    const result = await pool.query(
      `INSERT INTO CouncilMember
         (first_name, last_name, email, class_id, username, password_hash)
       VALUES (?,?,?,?,?,?)`,
      [firstName, lastName, email, classId, username, passwordHash]
    );
    return { id: result.insertId };
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      err.status = 409;            
      err.message = 'Email or username already exists';
    }
    throw err;
  }
}
export async function createAccountRequest({ firstName, lastName, email, classId }) {
  await pool.query(
    `INSERT INTO AccountRequest
      (first_name, last_name, email, class_id)
    VALUES (?,?,?,?)`,
    [firstName, lastName, email, classId]
  )
}
