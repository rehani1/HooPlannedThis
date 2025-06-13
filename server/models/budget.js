import pool from '../db.js';

export async function getTotalCouncilBudget() {
  const rows = await pool.query(
    `SELECT budget_total, budget_used
       FROM TotalCouncilBudget
       LIMIT 1`
  );
  return rows[0];
}

export async function getCommitteeBudgets() {
  const rows = await pool.query(
    `SELECT committee_id, committee_name, committee_budget
       FROM Committee
       ORDER BY committee_name`
  );
  return rows;
}
