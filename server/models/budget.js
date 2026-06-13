import pool from '../db.js';

const toNumber = value => Number(value) || 0;

function parseCouncilYearId(councilYearId) {
  const id = Number(councilYearId);
  if (!Number.isInteger(id) || id <= 0) {
    const err = new Error('A valid council year is required');
    err.status = 400;
    throw err;
  }
  return id;
}

export async function getTotalCouncilBudget(councilYearId) {
  const id = parseCouncilYearId(councilYearId);
  const rows = await pool.query(
    `SELECT cy.council_year_id AS councilYearId,
            cy.grad_year AS gradYear,
            cy.academic_year AS academicYear,
            cy.class_name AS className,
            COALESCE(cb.budget_total, 0) AS total_budget,
            (SELECT COALESCE(SUM(c.budget_allocated), 0)
               FROM Committee c
              WHERE c.council_year_id = cy.council_year_id) AS committee_allocated,
            (SELECT COALESCE(SUM(e.budget_allocated), 0)
               FROM CouncilEvent e
               JOIN Committee c ON e.committee_id = c.committee_id
              WHERE c.council_year_id = cy.council_year_id) AS event_planned,
            (SELECT COALESCE(SUM(x.amount), 0)
               FROM EventExpense x
               JOIN CouncilEvent e ON x.event_id = e.event_id
               JOIN Committee c ON e.committee_id = c.committee_id
              WHERE c.council_year_id = cy.council_year_id) AS actual_spent,
            (SELECT COUNT(*)
               FROM Committee c
              WHERE c.council_year_id = cy.council_year_id) AS committee_count,
            (SELECT COUNT(*)
               FROM CouncilEvent e
               JOIN Committee c ON e.committee_id = c.committee_id
              WHERE c.council_year_id = cy.council_year_id) AS event_count,
            (SELECT COUNT(*)
               FROM EventExpense x
               JOIN CouncilEvent e ON x.event_id = e.event_id
               JOIN Committee c ON e.committee_id = c.committee_id
              WHERE c.council_year_id = cy.council_year_id) AS expense_count
       FROM CouncilYear cy
       LEFT JOIN CouncilBudget cb ON cy.council_year_id = cb.council_year_id
      WHERE cy.council_year_id = ?
      LIMIT 1`,
    [id]
  );
  const row = rows[0] || {};
  if (!rows.length) {
    const err = new Error('Council year not found');
    err.status = 404;
    throw err;
  }

  const totalBudget = toNumber(row.total_budget);
  const committeeAllocated = toNumber(row.committee_allocated);
  const eventPlanned = toNumber(row.event_planned);
  const actualSpent = toNumber(row.actual_spent);

  return {
    councilYearId: row.councilYearId,
    gradYear: row.gradYear,
    academicYear: row.academicYear,
    className: row.className,
    totalBudget,
    committeeAllocated,
    totalAllocated: eventPlanned,
    eventPlanned,
    actualSpent,
    unallocated: totalBudget - committeeAllocated,
    remainingAfterPlanned: committeeAllocated - eventPlanned,
    remainingAfterActual: committeeAllocated - actualSpent,
    councilCount: 1,
    committeeCount: Number(row.committee_count) || 0,
    eventCount: Number(row.event_count) || 0,
    expenseCount: Number(row.expense_count) || 0,
  };
}

export async function getCommitteeBudgets(councilYearId) {
  const id = parseCouncilYearId(councilYearId);
  const rows = await pool.query(
    `SELECT c.committee_id AS committeeId,
            c.committee_name AS committeeName,
            c.budget_allocated AS budgetAllocated,
            cy.council_year_id AS councilYearId,
            cy.grad_year AS gradYear,
            cy.academic_year AS academicYear,
            cy.class_name AS className,
            COALESCE(cb.budget_total, 0) AS councilBudget,
            COALESCE(events.event_count, 0) AS eventCount,
            COALESCE(events.planned_budget, 0) AS plannedEventBudget,
            COALESCE(expenses.expense_count, 0) AS expenseCount,
            COALESCE(expenses.actual_spent, 0) AS actualSpent
       FROM Committee c
       JOIN CouncilYear cy ON c.council_year_id = cy.council_year_id
       LEFT JOIN CouncilBudget cb ON cy.council_year_id = cb.council_year_id
       LEFT JOIN (
            SELECT committee_id,
                   COUNT(*) AS event_count,
                   COALESCE(SUM(budget_allocated), 0) AS planned_budget
              FROM CouncilEvent
             GROUP BY committee_id
       ) events ON c.committee_id = events.committee_id
       LEFT JOIN (
            SELECT e.committee_id,
                   COUNT(x.expense_id) AS expense_count,
                   COALESCE(SUM(x.amount), 0) AS actual_spent
              FROM CouncilEvent e
              JOIN EventExpense x ON e.event_id = x.event_id
             GROUP BY e.committee_id
       ) expenses ON c.committee_id = expenses.committee_id
      WHERE c.council_year_id = ?
      ORDER BY c.committee_name`,
    [id]
  );

  return rows.map(row => {
    const budgetAllocated = toNumber(row.budgetAllocated);
    const plannedEventBudget = toNumber(row.plannedEventBudget);
    const actualSpent = toNumber(row.actualSpent);

    return {
      committeeId: row.committeeId,
      committeeName: row.committeeName,
      allocated: budgetAllocated,
      budgetAllocated,
      plannedEventBudget,
      actualSpent,
      remainingPlanned: budgetAllocated - plannedEventBudget,
      remainingActual: budgetAllocated - actualSpent,
      eventCount: Number(row.eventCount) || 0,
      expenseCount: Number(row.expenseCount) || 0,
      councilYearId: row.councilYearId,
      gradYear: row.gradYear,
      academicYear: row.academicYear,
      className: row.className,
      councilBudget: toNumber(row.councilBudget),
    };
  });
}
