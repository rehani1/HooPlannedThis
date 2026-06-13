import pool from '../db.js';
import { promisify } from 'util';

const RESET_TABLE_ORDER = [
  'EventDocument',
  'Advertisement',
  'EventExpense',
  'EventSupply',
  'VendorSupply',
  'VolunteerSignup',
  'EventContact',
  'CouncilEvent',
  'CommitteeMembership',
  'ExecutivePosition',
  'AccountRequest',
  'CouncilMember',
  'Committee',
  'CouncilBudget',
  'CouncilYear',
  'Location',
  'Supply',
  'Vendor',
  'Advisor',
];

export async function resetApplicationData() {
  const conn = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);
  const beginTransaction = promisify(conn.beginTransaction).bind(conn);
  const commit = promisify(conn.commit).bind(conn);
  const rollback = promisify(conn.rollback).bind(conn);

  try {
    await beginTransaction();

    const deleted = {};
    for (const table of RESET_TABLE_ORDER) {
      const result = await query(`DELETE FROM ${table}`);
      deleted[table] = result.affectedRows;
    }

    await commit();
    return deleted;
  } catch (err) {
    await rollback();
    throw err;
  } finally {
    conn.release();
  }
}
