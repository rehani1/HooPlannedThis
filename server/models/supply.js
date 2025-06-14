// server/models/supply.js
import pool from '../db.js';
import { promisify } from 'util';

/**
 * List all items for an event via a query param.
 */
export async function listItemsByEvent(eventId) {
  const conn  = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);
  try {
    const rows = await query(
      `SELECT 
         s.supply_id AS id,
         s.event_id,
         s.company_name,
         s.name,
         s.stock_qty  AS quantity,
         s.cost       AS unitCost,
         s.description AS notes,
         s.link,
         s.reusable,
         s.return_needed,
         v.contact_name,
         v.contact_address,
         v.contact_email,
         v.contact_phone
       FROM Supply s
       LEFT JOIN Vendor v ON s.company_name = v.company_name
       WHERE s.event_id = ?`,
      [eventId]
    );
    return rows.map(r => ({
      id:            r.id,
      event_id:      r.event_id,
      name:          r.name,
      quantity:      r.quantity,
      unitCost:      parseFloat(r.unitCost),
      notes:         r.notes,
      link:          r.link,
      reusable:      Boolean(r.reusable),
      return_needed: Boolean(r.return_needed),
      vendor: {
        company:        r.company_name,
        contact_name:   r.contact_name,
        contact_address:r.contact_address,
        contact_email:  r.contact_email,
        contact_phone:  r.contact_phone
      }
    }));
  } finally {
    conn.release();
  }
}

/**
 * Upsert vendor, then insert a new item row.
 * Expects data.event_id in the payload instead of URL.
 */
export async function createItem(data) {
  const conn  = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);
  const eventId = data.event_id;
  try {
    await conn.beginTransaction();

    if (data.vendor?.company) {
      await query(
        `INSERT INTO Vendor
           (company_name, contact_name, contact_address, contact_email, contact_phone)
         VALUES (?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           contact_name    = VALUES(contact_name),
           contact_address = VALUES(contact_address),
           contact_email   = VALUES(contact_email),
           contact_phone   = VALUES(contact_phone)`,
        [
          data.vendor.company,
          data.vendor.contact_name   || null,
          data.vendor.contact_address|| null,
          data.vendor.contact_email  || null,
          data.vendor.contact_phone  || null
        ]
      );
    }

    const result = await query(
      `INSERT INTO Supply
         (event_id, company_name, name, stock_qty, cost,
          description, link, reusable, return_needed)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        eventId,
        data.vendor?.company || null,
        data.name,
        data.quantity || 0,
        data.unitCost || 0.0,
        data.notes    || null,
        data.link     || null,
        data.reusable ? 1 : 0,
        data.return_needed ? 1 : 0
      ]
    );

    await conn.commit();
    return result.insertId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
