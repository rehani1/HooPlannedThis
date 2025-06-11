import pool from '../db.js'
import { promisify } from 'util'

export async function createEvent(data) {
  const conn  = await pool.getConnection()
  const query = promisify(conn.query).bind(conn)

  try {
    await conn.beginTransaction()

    const result = await query(
      `INSERT INTO events
         (title, committee, event_date, start_time, end_time,
          venue_name, venue_contact, venue_address,
          latitude, longitude, budget, description)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        data.title, data.committee, data.date,
        data.startTime, data.endTime,
        data.venueName, data.venueContact, data.location,
        data.locationCoordinates?.latitude ?? null,
        data.locationCoordinates?.longitude ?? null,
        data.budget ?? 0, data.description ?? null
      ]
    )
    const eventId = result.insertId

    for (const s of data.supplies ?? []) {
      let vendorId = null
      if (s.vendor) {
        const vr = await query(
          `INSERT INTO vendors
             (company, contact_name, contact_address,
              contact_email, contact_phone, notes)
           VALUES (?,?,?,?,?,?)`,
          [
            s.vendor.company,
            s.vendor.contact_name,
            s.vendor.contact_address,
            s.vendor.contact_email,
            s.vendor.contact_phone,
            s.vendor.notes
          ]
        )
        vendorId = vr.insertId
      }

      await query(
        `INSERT INTO event_supplies
           (event_id, name, quantity, unit_cost, total_cost,
            notes, link, reusable, return_needed, vendor_id)
         VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          eventId,
          s.name,
          s.quantity,
          s.unitCost,
          s.totalCost,
          s.notes,
          s.link,
          s.reusable ? 1 : 0,
          s.return_needed ? 1 : 0,
          vendorId
        ]
      )
    }

    await conn.commit()
    return eventId

  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}
