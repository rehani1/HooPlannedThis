import express from 'express';
import pool from '../db.js';

const router = express.Router();

// GET all advisors
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
    console.error('Error fetching advisors:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST a new advisor
router.post('/', async (req, res) => {
  const {
    advisor_first_name,
    advisor_last_name,
    building_name,
    address,
    advisor_email,
    advisor_number
  } = req.body;

  // Validate required fields
  if (!advisor_first_name || !advisor_last_name) {
    return res.status(400).json({ message: 'First and last name are required' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO Advisor
         (advisor_first_name, advisor_last_name,
          building_name, address,
          advisor_email, advisor_number)
       VALUES (?,?,?,?,?,?)`,
      [
        advisor_first_name,
        advisor_last_name,
        building_name  || null,
        address        || null,
        advisor_email  || null,
        advisor_number || null
      ]
    );
    // Return the newly created advisor ID
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('Error inserting advisor:', err);
    res.status(500).json({ message: 'Failed to create advisor' });
  }
});

export default router;
