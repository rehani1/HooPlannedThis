import pool from '../db.js';

const toNumber = value => Number(value) || 0;

export async function getTotalCouncilBudget() {
  const rows = await pool.query(
    `SELECT COALESCE(SUM(budget_allocated), 0) AS total_allocated
       FROM Event`
  );

  return {
    totalAllocated: toNumber(rows[0]?.total_allocated)
  };
}

export async function getCommitteeBudgets() {
  const rows = await pool.query(
    `SELECT e.committee_id AS committeeId,
            COALESCE(c.committee_name, CONCAT('Committee ', e.committee_id)) AS committeeName,
            COALESCE(SUM(budget_allocated), 0) AS allocated
       FROM Event e
       LEFT JOIN Committee c ON e.committee_id = c.committee_id
      GROUP BY e.committee_id, c.committee_name
      ORDER BY c.committee_name, e.committee_id`
  );

  return rows.map(row => ({
    committeeId: row.committeeId,
    committeeName: row.committeeName,
    allocated: toNumber(row.allocated)
  }));
}
