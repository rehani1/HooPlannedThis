// server/models/supply.js
import pool from '../db.js';
import { promisify } from 'util';

async function upsertVendor(query, vendor) {
  if (!vendor?.company) return null;

  const result = await query(
    `INSERT INTO Vendor
       (company_name, contact_name, contact_address, contact_email, contact_phone)
     VALUES (?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       vendor_id       = LAST_INSERT_ID(vendor_id),
       contact_name    = VALUES(contact_name),
       contact_address = VALUES(contact_address),
       contact_email   = VALUES(contact_email),
       contact_phone   = VALUES(contact_phone)`,
    [
      vendor.company,
      vendor.contact_name    || null,
      vendor.contact_address || null,
      vendor.contact_email   || null,
      vendor.contact_phone   || null
    ]
  );

  return result.insertId;
}

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
         es.event_id,
         v.company_name,
         s.name,
         es.quantity_needed AS quantity,
         es.unit_cost_at_time AS unitCost,
         es.notes,
         vs.product_link AS link,
         s.reusable,
         es.return_needed,
         v.contact_name,
         v.contact_address,
         v.contact_email,
         v.contact_phone
       FROM EventSupply es
       JOIN Supply s ON es.supply_id = s.supply_id
       LEFT JOIN VendorSupply vs
              ON vs.supply_id = s.supply_id
             AND vs.preferred_vendor = 1
       LEFT JOIN Vendor v ON vs.vendor_id = v.vendor_id
       WHERE es.event_id = ?
       ORDER BY s.name`,
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
  const beginTransaction = promisify(conn.beginTransaction).bind(conn);
  const commit = promisify(conn.commit).bind(conn);
  const rollback = promisify(conn.rollback).bind(conn);
  const eventId = data.event_id;
  try {
    await beginTransaction();

    const vendorId = await upsertVendor(query, data.vendor);

    const supplyResult = await query(
      `INSERT INTO Supply
         (name, stock_qty, default_unit_cost, description, reusable)
       VALUES (?,?,?,?,?)`,
      [
        data.name,
        data.quantity || 0,
        data.unitCost || 0.0,
        data.notes    || null,
        data.reusable ? 1 : 0
      ]
    );
    const supplyId = supplyResult.insertId;

    await query(
      `INSERT INTO EventSupply
         (event_id, supply_id, quantity_needed, quantity_used,
          quantity_returned, unit_cost_at_time, return_needed, notes)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        eventId,
        supplyId,
        data.quantity || 0,
        0,
        0,
        data.unitCost || 0.0,
        data.return_needed ? 1 : 0,
        data.notes || null
      ]
    );

    if (vendorId) {
      await query(
        `INSERT INTO VendorSupply
           (vendor_id, supply_id, vendor_price, product_link, preferred_vendor)
         VALUES (?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           vendor_price     = VALUES(vendor_price),
           product_link     = VALUES(product_link),
           preferred_vendor = VALUES(preferred_vendor)`,
        [
          vendorId,
          supplyId,
          data.unitCost || 0.0,
          data.link || null,
          1
        ]
      );
    }

    await commit();
    return supplyId;
  } catch (err) {
    await rollback();
    throw err;
  } finally {
    conn.release();
  }
}
