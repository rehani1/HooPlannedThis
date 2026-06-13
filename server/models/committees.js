
import express from 'express';
import pool   from '../db.js';      

const router = express.Router();

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
