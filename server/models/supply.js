// server/models/supply.js
import pool from '../db.js';
import { promisify } from 'util';

/**
 * List all supplies for a given event ID
 * @param {number|string} eventId
 * @returns {Promise<Array>} array of supply records
 */
export async function listSuppliesByEvent(eventId) {
  const conn = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);
  try {
    const rows = await query(
      `SELECT s.*, 
              v.contact_name AS vendor_contact_name,
              v.contact_address AS vendor_contact_address,
              v.contact_email AS vendor_contact_email,
              v.contact_phone AS vendor_contact_phone
         FROM Supply s
    LEFT JOIN Vendor v ON s.company_name = v.company_name
        WHERE s.event_id = ?`,
      [eventId]
    );
    return rows;
  } finally {
    conn.release();
  }
}

/**
 * Create a new supply (and upsert vendor) for a specific event
 * @param {number|string} eventId
 * @param {Object} data  supply data with nested vendor
 * @returns {Promise<Object>} inserted record info
 */
export async function createSupplyForEvent(eventId, data) {
  const conn = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);
  try {
    await conn.beginTransaction();

    // Upsert vendor if provided
    if (data.vendor && data.vendor.company) {
      await query(
        `INSERT INTO Vendor
           (company_name, contact_name, contact_address, contact_email, contact_phone)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           contact_name    = VALUES(contact_name),
           contact_address = VALUES(contact_address),
           contact_email   = VALUES(contact_email),
           contact_phone   = VALUES(contact_phone)`,
        [
          data.vendor.company,
          data.vendor.contact_name || null,
          data.vendor.contact_address || null,
          data.vendor.contact_email || null,
          data.vendor.contact_phone || null
        ]
      );
    }

    // Insert supply record
    const result = await query(
      `INSERT INTO Supply
         (event_id, company_name, name, stock_qty, cost, description, link, reusable, return_needed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventId,
        data.vendor?.company || null,
        data.name,
        data.quantity || 0,
        data.unitCost || 0.0,
        data.notes || null,
        data.link || null,
        data.reusable ? 1 : 0,
        data.return_needed ? 1 : 0
      ]
    );

    await conn.commit();
    return { id: result.insertId };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
