
import express from 'express';
import pool   from '../db.js';      

const router = express.Router();

export async function getCommitteeById(committeeId) {
  const id = Number(committeeId);
  if (!Number.isInteger(id) || id <= 0) {
    const err = new Error('Invalid committee id');
    err.status = 400;
    throw err;
  }

  const rows = await pool.query(
    `SELECT committee_id AS id,
            council_year_id AS councilYearId,
            committee_name AS name,
            budget_allocated AS budgetAllocated
       FROM Committee
      WHERE committee_id = ?
      LIMIT 1`,
    [id]
  );

  if (!rows.length) {
    const err = new Error('Committee not found');
    err.status = 404;
    throw err;
  }

  return rows[0];
}

export async function updateCommittee(committeeId, data = {}) {
  const committee = await getCommitteeById(committeeId);
  const name = String(data.name || data.committeeName || '').trim();
  const budgetAllocated = Number(data.budgetAllocated ?? data.budget_allocated ?? 0);

  if (!name) {
    const err = new Error('Committee name is required');
    err.status = 400;
    throw err;
  }

  if (!Number.isFinite(budgetAllocated) || budgetAllocated < 0) {
    const err = new Error('Budget allocated must be a non-negative number');
    err.status = 400;
    throw err;
  }

  try {
    await pool.query(
      `UPDATE Committee
          SET committee_name = ?,
              budget_allocated = ?
        WHERE committee_id = ?`,
      [name, budgetAllocated, committee.id]
    );
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      err.status = 409;
      err.message = 'A committee with that name already exists for this council';
    }
    throw err;
  }

  return {
    id: committee.id,
    councilYearId: committee.councilYearId,
    name,
    budgetAllocated,
  };
}

router.get('/', async (req, res) => {
  const { academicYear, gradYear } = req.query;
  if (!academicYear || !gradYear) {
    return res.status(400).json({ message: 'Missing parameters' });
  }

  try {
    const councilRows = await pool.query(
      `SELECT council_year_id
         FROM CouncilYear
        WHERE academic_year = ?
          AND grad_year = ?
        LIMIT 1`,
      [academicYear, gradYear]
    );

    if (!councilRows.length) {
      return res.status(404).json({ message: 'Council year not found for selected class and academic year' });
    }

    const rows = await pool.query(
      `SELECT committee_id, committee_name
         FROM Committee
        WHERE council_year_id = ?
        ORDER BY committee_name`,
      [councilRows[0].council_year_id]
    );
    res.json(rows);                 
  } catch (err) {
    console.error('DB error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
