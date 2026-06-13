
import pool from '../db.js';
import { promisify } from 'util';

function parseCouncilPayload({
  gradYear,
  academicYear,
  className,
  advisorId,
  budgetTotal = 0,
  committees = [],
} = {}) {
  const parsedGradYear = Number(gradYear);
  if (!Number.isInteger(parsedGradYear)) {
    const err = new Error('Graduation year must be a whole number');
    err.status = 400;
    throw err;
  }

  const parsedBudgetTotal = Number(budgetTotal);
  if (!Number.isFinite(parsedBudgetTotal) || parsedBudgetTotal < 0) {
    const err = new Error('Budget total must be a non-negative number');
    err.status = 400;
    throw err;
  }

  const committeeRows = [];
  const seenCommitteeNames = new Set();
  const committeeValues = Array.isArray(committees) ? committees : [];
  for (const committee of committeeValues) {
    const rawName = typeof committee === 'object' && committee !== null
      ? committee.name ?? committee.committee_name ?? committee.committeeName
      : committee;
    const name = String(rawName || '').trim();
    const nameKey = name.toLowerCase();
    if (!name || seenCommitteeNames.has(nameKey)) continue;

    const rawId = typeof committee === 'object' && committee !== null
      ? committee.id ?? committee.committee_id
      : null;
    const id = Number(rawId);

    committeeRows.push({
      id: Number.isInteger(id) && id > 0 ? id : null,
      name,
    });
    seenCommitteeNames.add(nameKey);
  }
  const parsedAcademicYear = String(academicYear || '').trim();
  const parsedClassName = String(className || '').trim();

  if (!parsedAcademicYear || !parsedClassName) {
    const err = new Error('Council, graduation year, and academic year are required');
    err.status = 400;
    throw err;
  }

  return {
    gradYear: parsedGradYear,
    academicYear: parsedAcademicYear,
    className: parsedClassName,
    advisorId: Number(advisorId) || null,
    budgetTotal: parsedBudgetTotal,
    committees: committeeRows,
  };
}

async function syncCouncilCommittees(query, councilYearId, committees) {
  const existingRows = await query(
    `SELECT committee_id, committee_name
       FROM Committee
      WHERE council_year_id = ?`,
    [councilYearId]
  );
  const existingIds = new Set(existingRows.map(row => row.committee_id));
  const incomingIds = new Set(committees.map(row => row.id).filter(Boolean));
  const incomingNames = committees.map(row => row.name);
  const newCommitteeNames = committees.filter(row => !row.id).map(row => row.name);

  for (const id of incomingIds) {
    if (!existingIds.has(id)) {
      const err = new Error('Committee not found for this council year');
      err.status = 400;
      throw err;
    }
  }

  if (incomingNames.length && newCommitteeNames.length) {
    await query(
      `DELETE FROM Committee
        WHERE council_year_id = ?
          AND committee_id NOT IN (?)
          AND committee_name NOT IN (?)`,
      [councilYearId, [...incomingIds, 0], newCommitteeNames]
    );
  } else if (incomingNames.length) {
    await query(
      `DELETE FROM Committee
        WHERE council_year_id = ?
          AND committee_id NOT IN (?)`,
      [councilYearId, [...incomingIds, 0]]
    );
  } else {
    await query(
      `DELETE FROM Committee
        WHERE council_year_id = ?`,
      [councilYearId]
    );
  }

  for (const committee of committees) {
    if (committee.id) {
      await query(
        `UPDATE Committee
            SET committee_name = ?
          WHERE committee_id = ?
            AND council_year_id = ?`,
        [committee.name, committee.id, councilYearId]
      );
      continue;
    }

    await query(
      `INSERT INTO Committee (council_year_id, committee_name, budget_allocated)
       VALUES (?,?,?)
       ON DUPLICATE KEY UPDATE committee_name = VALUES(committee_name)`,
      [councilYearId, committee.name, 0]
    );
  }
}


export async function createCouncilYear({
  gradYear,
  academicYear,
  className,
  advisorId,
  budgetTotal = 0,
  committees = [],
}) {
  const council = parseCouncilPayload({ gradYear, academicYear, className, advisorId, budgetTotal, committees });
  const conn  = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);
  const beginTransaction = promisify(conn.beginTransaction).bind(conn);
  const commit = promisify(conn.commit).bind(conn);
  const rollback = promisify(conn.rollback).bind(conn);

  try {
    await beginTransaction();

    const existingRows = await query(
      `SELECT council_year_id
         FROM CouncilYear
        WHERE grad_year = ? AND academic_year = ?
        LIMIT 1`,
      [council.gradYear, council.academicYear]
    );

    let councilYearId = existingRows[0]?.council_year_id;

    if (councilYearId) {
      await query(
        `UPDATE CouncilYear
            SET class_name = ?, advisor_id = ?
          WHERE council_year_id = ?`,
        [council.className, council.advisorId, councilYearId]
      );
    } else {
      const result = await query(
        `INSERT INTO CouncilYear (grad_year, academic_year, class_name, advisor_id)
         VALUES (?,?,?,?)`,
        [council.gradYear, council.academicYear, council.className, council.advisorId]
      );
      councilYearId = result.insertId;
    }

    await query(
      `INSERT INTO CouncilBudget (council_year_id, budget_total)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE budget_total = VALUES(budget_total)`,
      [councilYearId, council.budgetTotal]
    );

    await syncCouncilCommittees(query, councilYearId, council.committees);

    await commit();
    return {
      councilYearId,
      gradYear: council.gradYear,
      academicYear: council.academicYear,
      budgetTotal: council.budgetTotal,
    };
  } catch (err) {
    await rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      err.status = 409;
      err.message = 'A council already exists for that graduation year and academic year';
    } else if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      err.status = 409;
      err.message = 'Cannot remove a committee that has related events. Rename it or remove the related events first';
    }
    throw err;
  } finally {
    conn.release();
  }
}

export async function updateCouncilYear(councilYearId, data) {
  const id = Number(councilYearId);
  if (!Number.isInteger(id) || id <= 0) {
    const err = new Error('Invalid council id');
    err.status = 400;
    throw err;
  }

  const council = parseCouncilPayload(data);
  const conn  = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);
  const beginTransaction = promisify(conn.beginTransaction).bind(conn);
  const commit = promisify(conn.commit).bind(conn);
  const rollback = promisify(conn.rollback).bind(conn);

  try {
    await beginTransaction();

    const existingRows = await query(
      `SELECT council_year_id
         FROM CouncilYear
        WHERE council_year_id = ?
        LIMIT 1`,
      [id]
    );

    if (!existingRows.length) {
      const err = new Error('Council year not found');
      err.status = 404;
      throw err;
    }

    await query(
      `UPDATE CouncilYear
          SET grad_year = ?,
              academic_year = ?,
              class_name = ?,
              advisor_id = ?
        WHERE council_year_id = ?`,
      [council.gradYear, council.academicYear, council.className, council.advisorId, id]
    );

    await query(
      `INSERT INTO CouncilBudget (council_year_id, budget_total)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE budget_total = VALUES(budget_total)`,
      [id, council.budgetTotal]
    );

    await syncCouncilCommittees(query, id, council.committees);

    await commit();
    return {
      councilYearId: id,
      gradYear: council.gradYear,
      academicYear: council.academicYear,
      budgetTotal: council.budgetTotal,
    };
  } catch (err) {
    await rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      err.status = 409;
      err.message = 'A council already exists for that graduation year and academic year';
    } else if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      err.status = 409;
      err.message = 'Cannot remove a committee that has related events. Rename it or remove the related events first';
    }
    throw err;
  } finally {
    conn.release();
  }
}

export async function getAllCouncilYears() {
  const conn  = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);

  try {
    const years  = await query(
      `SELECT cy.council_year_id,
              cy.grad_year,
              cy.academic_year,
              cy.class_name,
              cy.advisor_id,
              COALESCE(cb.budget_total, 0) AS budget_total
         FROM CouncilYear cy
         LEFT JOIN CouncilBudget cb ON cy.council_year_id = cb.council_year_id
        ORDER BY academic_year, grad_year`
    );
    const comms  = await query(
      `SELECT committee_id, council_year_id, committee_name, budget_allocated
         FROM Committee
        ORDER BY committee_name`
    );

    return years.map((y) => ({
      council_year_id: y.council_year_id,
      grad_year:     y.grad_year,
      academic_year: y.academic_year,
      class_name:    y.class_name,
      advisor_id:    y.advisor_id,
      budget_total:  Number(y.budget_total) || 0,
      committeeRecords: comms
                      .filter(
                        (c) =>
                          c.council_year_id === y.council_year_id
                      )
                      .map((c) => ({
                        id: c.committee_id,
                        name: c.committee_name,
                        budgetAllocated: Number(c.budget_allocated) || 0,
                      })),
      committees:    comms
                      .filter(
                        (c) =>
                          c.council_year_id === y.council_year_id
                      )
                      .map((c) => c.committee_name),
    }));
  } finally {
    conn.release();
  }
}

function parseCouncilYearId(councilYearId) {
  const id = Number(councilYearId);
  if (!Number.isInteger(id) || id <= 0) {
    const err = new Error('Invalid council id');
    err.status = 400;
    throw err;
  }
  return id;
}

export async function getCouncilDetails(councilYearId) {
  const id = parseCouncilYearId(councilYearId);
  const conn  = await pool.getConnection();
  const query = promisify(conn.query).bind(conn);

  try {
    const councils = await query(
      `SELECT cy.council_year_id,
              cy.grad_year,
              cy.academic_year,
              cy.class_name,
              cy.advisor_id,
              COALESCE(cb.budget_total, 0) AS budget_total,
              a.advisor_first_name,
              a.advisor_last_name,
              a.advisor_phone,
              a.advisor_email,
              a.building_name,
              a.address
         FROM CouncilYear cy
         LEFT JOIN CouncilBudget cb ON cy.council_year_id = cb.council_year_id
         LEFT JOIN Advisor a ON cy.advisor_id = a.advisor_id
        WHERE cy.council_year_id = ?
        LIMIT 1`,
      [id]
    );

    const council = councils[0];
    if (!council) {
      const err = new Error('Council year not found');
      err.status = 404;
      throw err;
    }

    const [committees, members, memberships, executiveBoard] = await Promise.all([
      query(
        `SELECT c.committee_id,
                c.committee_name,
                c.budget_allocated,
                COUNT(cmem.computing_id) AS member_count
           FROM Committee c
           LEFT JOIN CommitteeMembership cmem ON c.committee_id = cmem.committee_id
          WHERE c.council_year_id = ?
          GROUP BY c.committee_id, c.committee_name, c.budget_allocated
          ORDER BY c.committee_name`,
        [id]
      ),
      query(
        `SELECT computing_id,
                first_name,
                last_name,
                email,
                bio,
                photo_url,
                created_account_at
           FROM CouncilMember
          WHERE council_year_id = ?
          ORDER BY last_name, first_name, computing_id`,
        [id]
      ),
      query(
        `SELECT cmem.computing_id,
                c.committee_id,
                c.committee_name,
                cmem.membership_role,
                cmem.start_date,
                cmem.end_date
           FROM CommitteeMembership cmem
           JOIN Committee c ON cmem.committee_id = c.committee_id
          WHERE c.council_year_id = ?
          ORDER BY c.committee_name, cmem.membership_role, cmem.computing_id`,
        [id]
      ),
      query(
        `SELECT ep.executive_position_id,
                ep.role,
                cm.computing_id,
                cm.first_name,
                cm.last_name,
                cm.email,
                cm.bio,
                cm.photo_url
           FROM ExecutivePosition ep
           LEFT JOIN CouncilMember cm ON ep.computing_id = cm.computing_id
          WHERE ep.council_year_id = ?
          ORDER BY ep.role, cm.last_name, cm.first_name`,
        [id]
      ),
    ]);

    const memberMap = new Map(members.map(member => [
      member.computing_id,
      {
        computingId: member.computing_id,
        firstName: member.first_name,
        lastName: member.last_name,
        email: member.email,
        bio: member.bio,
        photoUrl: member.photo_url,
        createdAccountAt: member.created_account_at,
        committees: [],
        executiveRoles: [],
      },
    ]));

    for (const membership of memberships) {
      const member = memberMap.get(membership.computing_id);
      if (!member) continue;
      member.committees.push({
        committeeId: membership.committee_id,
        committeeName: membership.committee_name,
        role: membership.membership_role,
        startDate: membership.start_date,
        endDate: membership.end_date,
      });
    }

    const executiveRows = executiveBoard.map(position => {
      const member = memberMap.get(position.computing_id);
      if (member) member.executiveRoles.push(position.role);

      return {
        id: position.executive_position_id,
        role: position.role,
        computingId: position.computing_id,
        firstName: position.first_name,
        lastName: position.last_name,
        email: position.email,
        bio: position.bio,
        photoUrl: position.photo_url,
      };
    });

    const committeeRows = committees.map(committee => ({
      id: committee.committee_id,
      name: committee.committee_name,
      budgetAllocated: Number(committee.budget_allocated) || 0,
      memberCount: Number(committee.member_count) || 0,
      members: memberships
        .filter(membership => membership.committee_id === committee.committee_id)
        .map(membership => {
          const member = memberMap.get(membership.computing_id);
          return {
            computingId: membership.computing_id,
            firstName: member?.firstName,
            lastName: member?.lastName,
            email: member?.email,
            role: membership.membership_role,
            startDate: membership.start_date,
            endDate: membership.end_date,
          };
        }),
    }));

    return {
      councilYearId: council.council_year_id,
      gradYear: council.grad_year,
      academicYear: council.academic_year,
      className: council.class_name,
      budgetTotal: Number(council.budget_total) || 0,
      advisor: {
        id: council.advisor_id,
        firstName: council.advisor_first_name,
        lastName: council.advisor_last_name,
        phone: council.advisor_phone,
        email: council.advisor_email,
        buildingName: council.building_name,
        address: council.address,
      },
      executiveBoard: executiveRows,
      committees: committeeRows,
      members: Array.from(memberMap.values()),
    };
  } finally {
    conn.release();
  }
}
