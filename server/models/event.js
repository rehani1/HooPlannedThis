// server/models/event.js
import pool from '../db.js';
import { promisify } from 'util';

async function insertSupplyForEvent(query, eventId, supply) {
  let vendorId = null;

  if (supply.vendor?.company) {
    const vendorRes = await query(
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
        supply.vendor.company,
        supply.vendor.contact_name    || null,
        supply.vendor.contact_address || null,
        supply.vendor.contact_email   || null,
        supply.vendor.contact_phone   || null
      ]
    );
    vendorId = vendorRes.insertId;
  }

  const supplyRes = await query(
    `INSERT INTO Supply
       (name, stock_qty, default_unit_cost, description, reusable)
     VALUES (?,?,?,?,?)`,
    [
      supply.name,
      supply.quantity || 0,
      supply.unitCost || 0,
      supply.notes || null,
      supply.reusable ? 1 : 0
    ]
  );
  const supplyId = supplyRes.insertId;

  await query(
    `INSERT INTO EventSupply
       (event_id, supply_id, quantity_needed, quantity_used,
        quantity_returned, unit_cost_at_time, return_needed, notes)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      eventId,
      supplyId,
      supply.quantity || 0,
      0,
      0,
      supply.unitCost || 0,
      supply.return_needed ? 1 : 0,
      supply.notes || null
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
        supply.unitCost || 0,
        supply.link || null,
        1
      ]
    );
  }

  return supplyId;
}

export async function createEvent(data) {
  const conn  = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);
  const beginTransaction = promisify(conn.beginTransaction).bind(conn);
  const commit = promisify(conn.commit).bind(conn);
  const rollback = promisify(conn.rollback).bind(conn);

  try {
    await beginTransaction();

    // 1) insert location (if provided)
    let locationId = null;
    if (data.locationName || data.locationAddress) {
      const locRes = await query(
        `INSERT INTO Location
           (name, address, city, state, zipcode, venue_email, venue_phone)
         VALUES (?,?,?,?,?,?,?)`,
        [
          data.locationName    || null,
          data.locationAddress || null,
          data.city            || null,
          data.state           || null,
          data.zipcode         || null,
          data.venueEmail      || null,
          data.venuePhone      || null
        ]
      );
      locationId = locRes.insertId;
    }

    // 2) insert event
    const evtRes = await query(
      `INSERT INTO CouncilEvent
         (name, event_date, event_time,
          description, budget_allocated,
          committee_id, location_id, created_by, status)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        data.title,
        data.date,
        data.startTime,
        data.description   || null,
        data.budget        ?? 0.00,
        data.committeeId,
        locationId,
        data.createdBy || null,
        data.status || 'planned'
      ]
    );
    const eventId = evtRes.insertId;

    for (const s of data.supplies || []) {
      await insertSupplyForEvent(query, eventId, s);
    }

    await commit();
    return eventId;

  } catch (err) {
    await rollback();
    throw err;

  } finally {
    conn.release();
  }
}

export async function getEvents(limit = 3, order = 'DESC') {
  const conn  = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);

  try {
    const rows = await query(
      `SELECT event_id AS id,
              event_id,
              committee_id,
              location_id,
              created_by,
              name,
              description,
              event_date,
              event_time,
              budget_allocated,
              status
         FROM CouncilEvent
        ORDER BY event_date ${order}
        LIMIT ?`,
      [limit]
    );
    return rows;
  } finally {
    conn.release();
  }
}
