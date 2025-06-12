import pool from '../db.js';

export async function createCouncilYear({ gradYear, academicYear, className, advisorId, committees }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) upsert the CouncilYear row
    await conn.query(
      `INSERT INTO CouncilYear (grad_year, academic_year, class_name, advisor_id)
       VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE
         class_name = VALUES(class_name),
         advisor_id = VALUES(advisor_id)`,
      [gradYear, academicYear, className, advisorId || null]
    );

    // 2) delete any old committees for this council (if you want a clean slate)
    await conn.query(
      `DELETE FROM Committee
         WHERE grad_year = ? AND academic_year = ?`,
      [gradYear, academicYear]
    );

    // 3) insert the new committees
    for (let name of committees.filter(Boolean)) {
      await conn.query(
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
  const conn = await pool.getConnection();
  try {
    // fetch all CouncilYears
    const [years] = await conn.query(`SELECT * FROM CouncilYear`);
    // fetch all Committees
    const [comms] = await conn.query(`SELECT * FROM Committee`);

    return years.map(y => ({
      gradYear:       y.grad_year,
      academicYear:   y.academic_year,
      className:      y.class_name,
      advisorId:      y.advisor_id,
      committees:     comms
                        .filter(c => c.grad_year === y.grad_year && c.academic_year === y.academic_year)
                        .map(c => c.committee_name)
    }));
  } finally {
    conn.release();
  }
}
