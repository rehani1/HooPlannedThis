
import express from 'express';
import pool   from '../db.js';      

const router = express.Router();

router.get('/', async (req, res) => {
  const { academicYear, gradYear } = req.query;
  if (!academicYear || !gradYear) {
    return res.status(400).json({ message: 'Missing parameters' });
  }

  try {

    const rows = await pool.query(
      `SELECT c.committee_id, c.committee_name
         FROM Committee c
         JOIN CouncilYear cy ON c.council_year_id = cy.council_year_id
        WHERE cy.academic_year = ?
          AND cy.grad_year = ?
        ORDER BY c.committee_name`,
      [academicYear, gradYear]
    );
    res.json(rows);                 
  } catch (err) {
    console.error('DB error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
