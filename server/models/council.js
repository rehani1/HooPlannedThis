
import pool from '../db.js';
import { promisify } from 'util';


export async function createCouncilYear({
  gradYear,
  academicYear,
  className,
  advisorId,
  committees = [],
}) {
  const conn  = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);

  try {
    await conn.beginTransaction();


    await query(
      `INSERT INTO CouncilYear (grad_year, academic_year, class_name, advisor_id)
       VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE
         class_name = VALUES(class_name),
         advisor_id = VALUES(advisor_id)`,
      [gradYear, academicYear, className, advisorId || null]
    );


    await query(
      `DELETE FROM Committee
         WHERE grad_year = ? AND academic_year = ?`,
      [gradYear, academicYear]
    );

    // 3) Insert committees
    for (const name of committees.filter(Boolean)) {
      await query(
        `INSERT INTO Committee (grad_year, academic_year, committee_name)
         VALUES (?,?,?)`,
        [gradYear, academicYear, name]
      );
    }

    await conn.commit();
    return { gradYear, academicYear };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function getAllCouncilYears() {
  const conn  = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);

  try {
    const years  = await query('SELECT * FROM CouncilYear');
    const comms  = await query('SELECT * FROM Committee');

    return years.map((y) => ({
      grad_year:     y.grad_year,
      academic_year: y.academic_year,
      class_name:    y.class_name,
      advisor_id:    y.advisor_id,
      committees:    comms
                      .filter(
                        (c) =>
                          c.grad_year === y.grad_year &&
                          c.academic_year === y.academic_year
                      )
                      .map((c) => c.committee_name),
    }));
  } finally {
    conn.release();
  }
}
