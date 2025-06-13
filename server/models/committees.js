
import express from 'express';
import pool   from '../db.js';      

const router = express.Router();

router.get('/', async (req, res) => {
  const { academicYear, gradYear } = req.query;
  if (!academicYear || !gradYear) {
    return res.status(400).json({ message: 'Missing parameters' });
  }

  try {

    const [rows] = await pool.query(
      `SELECT committee_name
         FROM Committee
        WHERE academic_year = ?
          AND grad_year     = ?`,
      [academicYear, gradYear]
    );
    res.json(rows);                 
  } catch (err) {
    console.error('DB error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
