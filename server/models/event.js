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

function normalizeLocation(data = {}, message = 'Location name is required when adding a location') {
  const locationName = optionalString(data.locationName);
  const locationAddress = optionalString(data.locationAddress);
  const city = optionalString(data.city);
  const state = optionalString(data.state);
  const zipcode = optionalString(data.zipcode);
  const venueEmail = optionalString(data.venueEmail);
  const venuePhone = optionalString(data.venuePhone);
  const hasLocation =
    locationName ||
    locationAddress ||
    city ||
    state ||
    zipcode ||
    venueEmail ||
    venuePhone;

  if (hasLocation && !locationName) {
    const err = new Error(message);
    err.status = 400;
    throw err;
  }

  return hasLocation
    ? {
        name: locationName,
        address: locationAddress,
        city,
        state,
        zipcode,
        venueEmail,
        venuePhone,
      }
    : null;
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

function normalizeEventContact(contact = {}) {
  return {
    computingId: requiredString(contact.computingId ?? contact.computing_id, 'Contact computing ID is required'),
    contactRole: optionalString(contact.contactRole ?? contact.contact_role),
    isPrimary: Boolean(contact.isPrimary ?? contact.is_primary),
  };
}

function normalizeAdvertisement(advertisement = {}) {
  return {
    platform: optionalString(advertisement.platform),
    advertisementType: optionalString(advertisement.advertisementType ?? advertisement.advertisement_type),
    contentLink: optionalString(advertisement.contentLink ?? advertisement.content_link),
    scheduledPostDate: optionalString(advertisement.scheduledPostDate ?? advertisement.scheduled_post_date),
    actualPostDate: optionalString(advertisement.actualPostDate ?? advertisement.actual_post_date),
    status: optionalString(advertisement.status) || 'planned',
  };
}

function normalizeEventDocument(document = {}) {
  return {
    documentName: requiredString(document.documentName ?? document.document_name, 'Document name is required'),
    documentType: optionalString(document.documentType ?? document.document_type),
    fileUrl: requiredString(document.fileUrl ?? document.file_url, 'Document URL is required'),
  };
}

function normalizeAdvertisementInput(data = {}) {
  return normalizeAdvertisement(data);
}

function normalizeEvent(data = {}) {
  const location = normalizeLocation(data);

  return {
    title: requiredString(data.title ?? data.name, 'Event name is required'),
    date: requiredString(data.date ?? data.eventDate, 'Event date is required'),
    startTime: requiredString(data.startTime ?? data.eventTime, 'Event time is required'),
    description: optionalString(data.description),
    budget: nonNegativeNumber(data.budget ?? data.budgetAllocated, 'Event budget must be a non-negative number'),
    volunteerSlots: nonNegativeInteger(data.volunteerSlots ?? data.volunteer_slots, 'Volunteer slots must be a non-negative whole number'),
    committeeId: positiveInteger(data.committeeId, 'Committee is required'),
    status: optionalString(data.status) || 'planned',
    location,
    supplies: Array.isArray(data.supplies) ? data.supplies.map(normalizeSupply) : [],
    contacts: Array.isArray(data.contacts) ? data.contacts.map(normalizeEventContact) : [],
    advertisements: Array.isArray(data.advertisements) ? data.advertisements.map(normalizeAdvertisement) : [],
    documents: Array.isArray(data.documents) ? data.documents.map(normalizeEventDocument) : [],
    createdBy: optionalString(data.createdBy),
  };
}

function normalizeEventUpdate(data = {}) {
  const committeeValue = data.committeeId ?? data.committee_id;
  const locationProvided = [
    'locationName',
    'locationAddress',
    'city',
    'state',
    'zipcode',
    'venueEmail',
    'venuePhone',
  ].some(key => Object.prototype.hasOwnProperty.call(data, key));

  return {
    title: requiredString(data.title ?? data.name, 'Event name is required'),
    date: requiredString(data.date ?? data.eventDate, 'Event date is required'),
    startTime: requiredString(data.startTime ?? data.eventTime, 'Event time is required'),
    description: optionalString(data.description),
    budget: nonNegativeNumber(data.budget ?? data.budgetAllocated, 'Event budget must be a non-negative number'),
    volunteerSlots: nonNegativeInteger(data.volunteerSlots ?? data.volunteer_slots, 'Volunteer slots must be a non-negative whole number'),
    status: optionalString(data.status) || 'planned',
    committeeId: committeeValue === undefined || committeeValue === null || committeeValue === ''
      ? null
      : positiveInteger(committeeValue, 'Committee is required'),
    locationProvided,
    location: locationProvided
      ? normalizeLocation(data, 'Location name is required when updating a location')
      : null,
  };
}

async function saveLocationForEvent(query, existingLocationId, location) {
  if (!location) return null;

  if (!existingLocationId) {
    const result = await query(
      `INSERT INTO Location
         (name, address, city, state, zipcode, venue_email, venue_phone)
       VALUES (?,?,?,?,?,?,?)`,
      [
        location.name,
        location.address,
        location.city,
        location.state,
        location.zipcode,
        location.venueEmail,
        location.venuePhone,
      ]
    );
    return result.insertId;
  }

  const usageRows = await query(
    `SELECT COUNT(*) AS usageCount
       FROM CouncilEvent
      WHERE location_id = ?`,
    [existingLocationId]
  );
  const isShared = Number(usageRows[0]?.usageCount || 0) > 1;

  if (isShared) {
    const result = await query(
      `INSERT INTO Location
         (name, address, city, state, zipcode, venue_email, venue_phone)
       VALUES (?,?,?,?,?,?,?)`,
      [
        location.name,
        location.address,
        location.city,
        location.state,
        location.zipcode,
        location.venueEmail,
        location.venuePhone,
      ]
    );
    return result.insertId;
  }

  await query(
    `UPDATE Location
        SET name = ?,
            address = ?,
            city = ?,
            state = ?,
            zipcode = ?,
            venue_email = ?,
            venue_phone = ?
      WHERE location_id = ?`,
    [
      location.name,
      location.address,
      location.city,
      location.state,
      location.zipcode,
      location.venueEmail,
      location.venuePhone,
      existingLocationId,
    ]
  );
  return existingLocationId;
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

async function insertContactForEvent(query, eventId, contact) {
  await query(
    `INSERT INTO EventContact
       (event_id, computing_id, contact_role, is_primary)
     VALUES (?,?,?,?)
     ON DUPLICATE KEY UPDATE
       contact_role = VALUES(contact_role),
       is_primary = VALUES(is_primary)`,
    [
      eventId,
      contact.computingId,
      contact.contactRole,
      contact.isPrimary ? 1 : 0,
    ]
  );
}

async function insertAdvertisementForEvent(query, eventId, advertisement, createdBy) {
  await query(
    `INSERT INTO Advertisement
       (event_id, created_by, platform, advertisement_type, content_link,
        scheduled_post_date, actual_post_date, status)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      eventId,
      createdBy,
      advertisement.platform,
      advertisement.advertisementType,
      advertisement.contentLink,
      advertisement.scheduledPostDate,
      advertisement.actualPostDate,
      advertisement.status,
    ]
  );
}

async function insertDocumentForEvent(query, eventId, document, uploadedBy) {
  const result = await query(
    `INSERT INTO EventDocument
       (event_id, uploaded_by, document_name, document_type, file_url)
     VALUES (?,?,?,?,?)`,
    [
      eventId,
      uploadedBy,
      document.documentName,
      document.documentType,
      document.fileUrl,
    ]
  );
  return result.insertId;
}

async function attachEventDetails(query, events) {
  if (!events.length) return events;

  const eventIds = events.map(event => event.event_id);
  const placeholders = eventIds.map(() => '?').join(',');

  const [contacts, advertisements, documents] = await Promise.all([
    query(
      `SELECT ec.event_id,
              ec.computing_id,
              ec.contact_role,
              ec.is_primary,
              cm.first_name,
              cm.last_name,
              cm.email
         FROM EventContact ec
         LEFT JOIN CouncilMember cm ON ec.computing_id = cm.computing_id
        WHERE ec.event_id IN (${placeholders})
        ORDER BY ec.is_primary DESC, cm.last_name, cm.first_name`,
      eventIds
    ),
    query(
      `SELECT advertisement_id,
              event_id,
              created_by,
              platform,
              advertisement_type,
              content_link,
              scheduled_post_date,
              actual_post_date,
              status
         FROM Advertisement
        WHERE event_id IN (${placeholders})
        ORDER BY scheduled_post_date IS NULL, scheduled_post_date, advertisement_id`,
      eventIds
    ),
    query(
      `SELECT document_id,
              event_id,
              uploaded_by,
              document_name,
              document_type,
              uploaded_at
         FROM EventDocument
        WHERE event_id IN (${placeholders})
        ORDER BY uploaded_at DESC, document_id DESC`,
      eventIds
    ),
  ]);

  const byEvent = rows => rows.reduce((map, row) => {
    const id = Number(row.event_id);
    if (!map.has(id)) map.set(id, []);
    map.get(id).push(row);
    return map;
  }, new Map());

  const contactMap = byEvent(contacts);
  const advertisementMap = byEvent(advertisements);
  const documentMap = byEvent(documents);

  return events.map(event => ({
    ...event,
    contacts: contactMap.get(Number(event.event_id)) || [],
    advertisements: advertisementMap.get(Number(event.event_id)) || [],
    documents: documentMap.get(Number(event.event_id)) || [],
  }));
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
          committee_id, location_id, created_by, status, volunteer_slots)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        event.title,
        event.date,
        event.startTime,
        event.description,
        event.budget,
        event.committeeId,
        locationId,
        event.createdBy,
        event.status,
        event.volunteerSlots
      ]
    );
    const eventId = evtRes.insertId;

    for (const s of event.supplies) {
      await insertSupplyForEvent(query, eventId, s);
    }

    for (const contact of event.contacts) {
      await insertContactForEvent(query, eventId, contact);
    }

    for (const advertisement of event.advertisements) {
      await insertAdvertisementForEvent(query, eventId, advertisement, event.createdBy);
    }

    for (const document of event.documents) {
      await insertDocumentForEvent(query, eventId, document, event.createdBy);
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

export async function createEventDocument(eventId, data, uploadedBy) {
  const id = positiveInteger(eventId, 'Invalid event id');
  const document = normalizeEventDocument(data);
  const conn = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);

  try {
    const documentId = await insertDocumentForEvent(query, id, document, uploadedBy);
    return getEventDocumentById(documentId);
  } finally {
    conn.release();
  }
}

export async function getEventDocumentById(documentId) {
  const id = positiveInteger(documentId, 'Invalid document id');
  const rows = await pool.query(
    `SELECT ed.document_id,
            ed.event_id,
            ed.uploaded_by,
            ed.document_name,
            ed.document_type,
            ed.file_url,
            ed.uploaded_at,
            e.committee_id,
            c.council_year_id
       FROM EventDocument ed
       JOIN CouncilEvent e ON ed.event_id = e.event_id
       JOIN Committee c ON e.committee_id = c.committee_id
      WHERE ed.document_id = ?
      LIMIT 1`,
    [id]
  );

  if (!rows.length) {
    const err = new Error('Document not found');
    err.status = 404;
    throw err;
  }

  return rows[0];
}

export async function deleteEventDocument(documentId) {
  const document = await getEventDocumentById(documentId);
  await pool.query(
    `DELETE FROM EventDocument
      WHERE document_id = ?`,
    [document.document_id]
  );
  return document;
}

export async function updateEventDocument(documentId, data) {
  const id = positiveInteger(documentId, 'Invalid document id');
  const documentName = requiredString(data.documentName ?? data.document_name, 'Document name is required');
  const documentType = optionalString(data.documentType ?? data.document_type);

  await pool.query(
    `UPDATE EventDocument
        SET document_name = ?,
            document_type = ?
      WHERE document_id = ?`,
    [documentName, documentType, id]
  );

  return getEventDocumentById(id);
}

export async function createEventContact(eventId, data) {
  const id = positiveInteger(eventId, 'Invalid event id');
  const contact = normalizeEventContact(data);
  await pool.query(
    `INSERT INTO EventContact
       (event_id, computing_id, contact_role, is_primary)
     VALUES (?,?,?,?)
     ON DUPLICATE KEY UPDATE
       contact_role = VALUES(contact_role),
       is_primary = VALUES(is_primary)`,
    [id, contact.computingId, contact.contactRole, contact.isPrimary ? 1 : 0]
  );
  return { event_id: id, computing_id: contact.computingId, contact_role: contact.contactRole, is_primary: contact.isPrimary ? 1 : 0 };
}

export async function updateEventContact(eventId, computingId, data) {
  const id = positiveInteger(eventId, 'Invalid event id');
  const contactRole = optionalString(data.contactRole ?? data.contact_role);
  const isPrimary = Boolean(data.isPrimary ?? data.is_primary);
  const result = await pool.query(
    `UPDATE EventContact
        SET contact_role = ?,
            is_primary = ?
      WHERE event_id = ?
        AND computing_id = ?`,
    [contactRole, isPrimary ? 1 : 0, id, computingId]
  );
  if (!result.affectedRows) {
    const err = new Error('Event contact not found');
    err.status = 404;
    throw err;
  }
  return { event_id: id, computing_id: computingId, contact_role: contactRole, is_primary: isPrimary ? 1 : 0 };
}

export async function deleteEventContact(eventId, computingId) {
  const id = positiveInteger(eventId, 'Invalid event id');
  const result = await pool.query(
    `DELETE FROM EventContact
      WHERE event_id = ?
        AND computing_id = ?`,
    [id, computingId]
  );
  if (!result.affectedRows) {
    const err = new Error('Event contact not found');
    err.status = 404;
    throw err;
  }
}

export async function createEventAdvertisement(eventId, data, createdBy) {
  const id = positiveInteger(eventId, 'Invalid event id');
  const advertisement = normalizeAdvertisementInput(data);
  const result = await pool.query(
    `INSERT INTO Advertisement
       (event_id, created_by, platform, advertisement_type, content_link,
        scheduled_post_date, actual_post_date, status)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      id,
      createdBy,
      advertisement.platform,
      advertisement.advertisementType,
      advertisement.contentLink,
      advertisement.scheduledPostDate,
      advertisement.actualPostDate,
      advertisement.status,
    ]
  );
  return getEventAdvertisementById(result.insertId);
}

export async function getEventAdvertisementById(advertisementId) {
  const id = positiveInteger(advertisementId, 'Invalid advertisement id');
  const rows = await pool.query(
    `SELECT a.advertisement_id,
            a.event_id,
            a.created_by,
            a.platform,
            a.advertisement_type,
            a.content_link,
            a.scheduled_post_date,
            a.actual_post_date,
            a.status,
            e.committee_id,
            c.council_year_id
       FROM Advertisement a
       JOIN CouncilEvent e ON a.event_id = e.event_id
       JOIN Committee c ON e.committee_id = c.committee_id
      WHERE a.advertisement_id = ?
      LIMIT 1`,
    [id]
  );
  if (!rows.length) {
    const err = new Error('Advertisement not found');
    err.status = 404;
    throw err;
  }
  return rows[0];
}

export async function updateEventAdvertisement(advertisementId, data) {
  const existing = await getEventAdvertisementById(advertisementId);
  const advertisement = normalizeAdvertisementInput(data);
  await pool.query(
    `UPDATE Advertisement
        SET platform = ?,
            advertisement_type = ?,
            content_link = ?,
            scheduled_post_date = ?,
            actual_post_date = ?,
            status = ?
      WHERE advertisement_id = ?`,
    [
      advertisement.platform,
      advertisement.advertisementType,
      advertisement.contentLink,
      advertisement.scheduledPostDate,
      advertisement.actualPostDate,
      advertisement.status,
      existing.advertisement_id,
    ]
  );
  return getEventAdvertisementById(existing.advertisement_id);
}

export async function deleteEventAdvertisement(advertisementId) {
  const advertisement = await getEventAdvertisementById(advertisementId);
  await pool.query(
    `DELETE FROM Advertisement
      WHERE advertisement_id = ?`,
    [advertisement.advertisement_id]
  );
  return advertisement;
}

export async function getEventById(eventId) {
  const id = positiveInteger(eventId, 'Invalid event id');
  const conn  = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);

  try {
    const rows = await query(
      `SELECT e.event_id AS id,
              e.event_id,
              e.committee_id,
              c.council_year_id AS councilYearId,
              c.committee_name AS committeeName,
              e.location_id,
              l.name AS locationName,
              l.address AS locationAddress,
              l.city AS locationCity,
              l.state AS locationState,
              l.zipcode AS locationZipcode,
              l.venue_email AS venueEmail,
              l.venue_phone AS venuePhone,
              e.created_by,
              e.name,
              e.description,
              e.event_date,
              e.event_time,
              e.budget_allocated,
              e.status,
              e.volunteer_slots AS volunteerSlots,
              (
                SELECT COUNT(*)
                  FROM VolunteerSignup vs
                 WHERE vs.event_id = e.event_id
                   AND vs.signup_status = 'signed_up'
              ) AS signupCount
         FROM CouncilEvent e
         JOIN Committee c ON e.committee_id = c.committee_id
         LEFT JOIN Location l ON e.location_id = l.location_id
        WHERE e.event_id = ?
        LIMIT 1`,
      [id]
    );

    if (!rows.length) {
      const err = new Error('Event not found');
      err.status = 404;
      throw err;
    }

    const [event] = await attachEventDetails(query, rows);
    return event;
  } finally {
    conn.release();
  }
}

export async function updateEvent(eventId, data) {
  const id = positiveInteger(eventId, 'Invalid event id');
  const event = normalizeEventUpdate(data);
  const conn  = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);
  const beginTransaction = promisify(conn.beginTransaction).bind(conn);
  const commit = promisify(conn.commit).bind(conn);
  const rollback = promisify(conn.rollback).bind(conn);

  try {
    await beginTransaction();

    const existingRows = await query(
      `SELECT event_id, committee_id, location_id
         FROM CouncilEvent
        WHERE event_id = ?
        LIMIT 1`,
      [id]
    );

    if (!existingRows.length) {
      const err = new Error('Event not found');
      err.status = 404;
      throw err;
    }

    const existing = existingRows[0];
    const committeeId = event.committeeId || existing.committee_id;
    const locationId = event.locationProvided
      ? await saveLocationForEvent(query, existing.location_id, event.location)
      : existing.location_id;

    await query(
      `UPDATE CouncilEvent
          SET name = ?,
              event_date = ?,
              event_time = ?,
              description = ?,
              budget_allocated = ?,
              status = ?,
              volunteer_slots = ?,
              committee_id = ?,
              location_id = ?
        WHERE event_id = ?`,
      [
        event.title,
        event.date,
        event.startTime,
        event.description,
        event.budget,
        event.status,
        event.volunteerSlots,
        committeeId,
        locationId,
        id,
      ]
    );

    await commit();
  } catch (err) {
    await rollback();
    throw err;
  } finally {
    conn.release();
  }

  return getEventById(id);
}

export async function getEvents(limit = 3, order = 'DESC', committeeId = null) {
  const conn  = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);
  const filters = [];
  const params = [];

  if (committeeId !== null) {
    filters.push('e.committee_id = ?');
    params.push(committeeId);
  }

  params.push(limit);

  try {
    const rows = await query(
      `SELECT event_id AS id,
              e.event_id,
              e.committee_id,
              c.council_year_id,
              c.committee_name,
              e.location_id,
              l.name AS location_name,
              l.address AS location_address,
              l.city AS location_city,
              l.state AS location_state,
              l.zipcode AS location_zipcode,
              l.venue_email,
              l.venue_phone,
              e.created_by,
              e.name,
              e.description,
              e.event_date,
              e.event_time,
              e.budget_allocated,
              e.status,
              e.volunteer_slots,
              (
                SELECT COUNT(*)
                  FROM VolunteerSignup vs
                 WHERE vs.event_id = e.event_id
                   AND vs.signup_status = 'signed_up'
              ) AS volunteer_signup_count
         FROM CouncilEvent e
         JOIN Committee c ON e.committee_id = c.committee_id
         LEFT JOIN Location l ON e.location_id = l.location_id
        ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
        ORDER BY e.event_date ${order}, e.event_time ${order}
        LIMIT ?`,
      params
    );
    return attachEventDetails(query, rows);
  } finally {
    conn.release();
  }
}
