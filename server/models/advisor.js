import express from 'express';
import pool    from '../db.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         advisor_id         AS id,
         advisor_first_name AS firstName,
         advisor_last_name  AS lastName,
         building_name      AS building,
         address,
         advisor_email      AS email,
         advisor_number     AS phone
       FROM Advisor`
    );
    res.json(rows);         
  } catch (err) {
    console.error('advisor query error', err);
    res.status(500).json({ message: 'Server error' });
  }
});
export default router;