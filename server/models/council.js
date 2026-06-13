
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
  const beginTransaction = promisify(conn.beginTransaction).bind(conn);
  const commit = promisify(conn.commit).bind(conn);
  const rollback = promisify(conn.rollback).bind(conn);

  try {
    await beginTransaction();

    const existingRows = await query(
      `SELECT council_year_id
         FROM CouncilYear
        WHERE grad_year = ? AND academic_year = ?
        LIMIT 1`,
      [gradYear, academicYear]
    );

    let councilYearId = existingRows[0]?.council_year_id;

    if (councilYearId) {
      await query(
        `UPDATE CouncilYear
            SET class_name = ?, advisor_id = ?
          WHERE council_year_id = ?`,
        [className, advisorId || null, councilYearId]
      );
    } else {
      const result = await query(
        `INSERT INTO CouncilYear (grad_year, academic_year, class_name, advisor_id)
         VALUES (?,?,?,?)`,
        [gradYear, academicYear, className, advisorId || null]
      );
      councilYearId = result.insertId;
    }

    await query(
      `DELETE FROM Committee
         WHERE council_year_id = ?`,
      [councilYearId]
    );

    await query(
      `INSERT INTO CouncilBudget (council_year_id, budget_total)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE budget_total = budget_total`,
      [councilYearId, 0]
    );

    const committeeNames = [...new Set(committees.map(name => String(name).trim()).filter(Boolean))];
    for (const name of committeeNames) {
      await query(
        `INSERT INTO Committee (council_year_id, committee_name, budget_allocated)
         VALUES (?,?,?)`,
        [councilYearId, name, 0]
      );
    }

    await commit();
    return { councilYearId, gradYear, academicYear };
  } catch (err) {
    await rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function getAllCouncilYears() {
  const conn  = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);

  try {
    const years  = await query(
      `SELECT council_year_id, grad_year, academic_year, class_name, advisor_id
         FROM CouncilYear
        ORDER BY academic_year, grad_year`
    );
    const comms  = await query(
      `SELECT council_year_id, committee_name
         FROM Committee
        ORDER BY committee_name`
    );

    return years.map((y) => ({
      council_year_id: y.council_year_id,
      grad_year:     y.grad_year,
      academic_year: y.academic_year,
      class_name:    y.class_name,
      advisor_id:    y.advisor_id,
      committees:    comms
                      .filter(
                        (c) =>
                          c.council_year_id === y.council_year_id
                      )
                      .map((c) => c.committee_name),
    }));
  } finally {
    conn.release();
  }
}
