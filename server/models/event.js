// server/models/event.js
import pool from '../db.js';
import { promisify } from 'util';

function requiredString(value, message) {
  const parsed = String(value || '').trim();
  if (!parsed) {
    const err = new Error(message);
    err.status = 400;
    throw err;
  }
  return parsed;
}

function optionalString(value) {
  const parsed = String(value || '').trim();
  return parsed || null;
}

function nonNegativeNumber(value, message) {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed) || parsed < 0) {
    const err = new Error(message);
    err.status = 400;
    throw err;
  }
  return parsed;
}

function nonNegativeInteger(value, message) {
  const parsed = Number(value || 0);
  if (!Number.isInteger(parsed) || parsed < 0) {
    const err = new Error(message);
    err.status = 400;
    throw err;
  }
  return parsed;
}

function positiveInteger(value, message) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    const err = new Error(message);
    err.status = 400;
    throw err;
  }
  return parsed;
}

function normalizeSupply(supply = {}) {
  const vendor = supply.vendor || {};
  const vendorCompany = optionalString(vendor.company);

  return {
    name: requiredString(supply.name, 'Item name is required'),
    quantity: nonNegativeInteger(supply.quantity ?? supply.quantityNeeded, 'Item quantity must be a non-negative whole number'),
    unitCost: nonNegativeNumber(supply.unitCost, 'Item unit cost must be a non-negative number'),
    notes: optionalString(supply.notes),
    reusable: Boolean(supply.reusable),
    returnNeeded: Boolean(supply.returnNeeded ?? supply.return_needed),
    link: optionalString(supply.link),
    vendor: vendorCompany
      ? {
          company: vendorCompany,
          contactName: optionalString(vendor.contactName ?? vendor.contact_name),
          contactAddress: optionalString(vendor.contactAddress ?? vendor.contact_address),
          contactEmail: optionalString(vendor.contactEmail ?? vendor.contact_email),
          contactPhone: optionalString(vendor.contactPhone ?? vendor.contact_phone),
        }
      : null,
  };
}

function normalizeEvent(data = {}) {
  const locationName = optionalString(data.locationName);
  const hasLocation =
    locationName ||
    optionalString(data.locationAddress) ||
    optionalString(data.city) ||
    optionalString(data.state) ||
    optionalString(data.zipcode) ||
    optionalString(data.venueEmail) ||
    optionalString(data.venuePhone);

  if (hasLocation && !locationName) {
    const err = new Error('Location name is required when adding a location');
    err.status = 400;
    throw err;
  }

  return {
    title: requiredString(data.title ?? data.name, 'Event name is required'),
    date: requiredString(data.date ?? data.eventDate, 'Event date is required'),
    startTime: requiredString(data.startTime ?? data.eventTime, 'Event time is required'),
    description: optionalString(data.description),
    budget: nonNegativeNumber(data.budget ?? data.budgetAllocated, 'Event budget must be a non-negative number'),
    committeeId: positiveInteger(data.committeeId, 'Committee is required'),
    status: optionalString(data.status) || 'planned',
    location: hasLocation
      ? {
          name: locationName,
          address: optionalString(data.locationAddress),
          city: optionalString(data.city),
          state: optionalString(data.state),
          zipcode: optionalString(data.zipcode),
          venueEmail: optionalString(data.venueEmail),
          venuePhone: optionalString(data.venuePhone),
        }
      : null,
    supplies: Array.isArray(data.supplies) ? data.supplies.map(normalizeSupply) : [],
    createdBy: optionalString(data.createdBy),
  };
}

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
        supply.vendor.contactName,
        supply.vendor.contactAddress,
        supply.vendor.contactEmail,
        supply.vendor.contactPhone
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
      supply.quantity,
      supply.unitCost,
      supply.notes,
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
      supply.quantity,
      0,
      0,
      supply.unitCost,
      supply.returnNeeded ? 1 : 0,
      supply.notes
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
        supply.unitCost,
        supply.link,
        1
      ]
    );
  }

  return supplyId;
}

export async function createEvent(data) {
  const event = normalizeEvent(data);
  const conn  = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);
  const beginTransaction = promisify(conn.beginTransaction).bind(conn);
  const commit = promisify(conn.commit).bind(conn);
  const rollback = promisify(conn.rollback).bind(conn);

  try {
    await beginTransaction();

    // 1) insert location (if provided)
    let locationId = null;
    if (event.location) {
      const locRes = await query(
        `INSERT INTO Location
           (name, address, city, state, zipcode, venue_email, venue_phone)
         VALUES (?,?,?,?,?,?,?)`,
        [
          event.location.name,
          event.location.address,
          event.location.city,
          event.location.state,
          event.location.zipcode,
          event.location.venueEmail,
          event.location.venuePhone
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
        event.title,
        event.date,
        event.startTime,
        event.description,
        event.budget,
        event.committeeId,
        locationId,
        event.createdBy,
        event.status
      ]
    );
    const eventId = evtRes.insertId;

    for (const s of event.supplies) {
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

export async function getEvents(limit = 3, order = 'DESC', committeeId = null) {
  const conn  = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);
  const filters = [];
  const params = [];

  if (committeeId !== null) {
    filters.push('committee_id = ?');
    params.push(committeeId);
  }

  params.push(limit);

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
        ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
        ORDER BY event_date ${order}
        LIMIT ?`,
      params
    );
    return rows;
  } finally {
    conn.release();
  }
}
