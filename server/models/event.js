
import pool from '../db.js';
import { promisify } from 'util';

/* ------------------------------------------------------------------ */
/*  CREATE EVENT (with optional supplies & vendor rows)               */
/* ------------------------------------------------------------------ */
export async function createEvent(data) {
  const conn  = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);

  try {
    await conn.beginTransaction();

    /* 1 ▸ insert into Event -------------------------------------- */
    const result = await query(
      `INSERT INTO Event
         (name,            event_date, event_time,
          description,     budget_allocated,
          committee_id,    location_id)
       VALUES (?,?,?,?,?,?,?)`,
      [
        data.title,                        // name
        data.date,                         // event_date  ('YYYY-MM-DD')
        data.startTime,                    // event_time  ('HH:MM:SS')
        data.description ?? null,          // description
        data.budget        ?? 0,           // budget_allocated
        data.committeeId,                  // FK → Committee
        data.locationId     ?? null        // FK → Location (nullable)
      ]
    );
    const eventId = result.insertId;

    /* 2 ▸ loop through supplies ---------------------------------- */
    for (const s of data.supplies ?? []) {
      /* 2a ▸ ensure Vendor row exists (or update contact info) ---- */
      if (s.vendor?.company) {
        await query(
          `INSERT INTO Vendor
             (company_name,  contact_name, contact_address,
              contact_email, contact_phone)
           VALUES (?,?,?,?,?)
           ON DUPLICATE KEY UPDATE
             contact_name    = VALUES(contact_name),
             contact_address = VALUES(contact_address),
             contact_email   = VALUES(contact_email),
             contact_phone   = VALUES(contact_phone)`,
          [
            s.vendor.company,
            s.vendor.contact_name    ?? null,
            s.vendor.contact_address ?? null,
            s.vendor.contact_email   ?? null,
            s.vendor.contact_phone   ?? null
          ]
        );
      }

      /* 2b ▸ insert Supply row ----------------------------------- */
      await query(
        `INSERT INTO Supply
           (event_id, company_name,
            name, stock_qty, cost,
            description, link,
            reusable, return_needed)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [
          eventId,
          s.vendor?.company           ?? null,  // FK string to Vendor (nullable)

          s.name,
          s.quantity                  ?? 1,     // stock_qty
          s.unitCost                  ?? 0,     // cost
          s.description               ?? null,
          s.link                      ?? null,
          s.reusable        ? 1 : 0,
          s.return_needed    ? 1 : 0
        ]
      );
    }

    await conn.commit();
    return eventId;

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/* ------------------------------------------------------------------ */
/*  GET most-recent events                                            */
/* ------------------------------------------------------------------ */
export async function getEvents(limit = 3) {
  const conn  = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);

  try {
    const rows = await query(
      `SELECT *
         FROM Event
        ORDER BY event_date DESC, event_time DESC    /* newest first */
        LIMIT ?`,
      [limit]
    );
    return rows;

  } finally {
    conn.release();
  }
}
