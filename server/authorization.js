export function isCommitteeLeadRole(role) {
  const value = String(role || '').toLowerCase().replace(/[\s-]+/g, '_');
  return ['committee_chair', 'chair', 'committee_lead', 'lead'].includes(value);
}

export function canManageCommittee(user, committee) {
  const councilYearId = Number(committee.councilYearId);
  const executiveForCouncil = (user.executivePositions || []).some(position =>
    Number(position.councilYearId) === councilYearId
  );
  const leadForCommittee = (user.committeeMemberships || []).some(membership =>
    Number(membership.committeeId) === Number(committee.id) &&
    isCommitteeLeadRole(membership.role)
  );

  return executiveForCouncil || leadForCommittee;
}

export function canManageEvent(user, event) {
  const councilYearId = Number(event.councilYearId ?? event.council_year_id);
  const committeeId = Number(event.committee_id ?? event.committeeId);
  const executiveForCouncil = (user.executivePositions || []).some(position =>
    Number(position.councilYearId) === councilYearId
  );
  const leadForCommittee = (user.committeeMemberships || []).some(membership =>
    Number(membership.committeeId) === committeeId &&
    isCommitteeLeadRole(membership.role)
  );

  return executiveForCouncil || leadForCommittee;
}

export function canManageDocument(user, document) {
  return canManageEvent(user, {
    councilYearId: document.council_year_id,
    committee_id: document.committee_id,
  });
}

export function canManageExpense(user, expense) {
  return canManageEvent(user, {
    councilYearId: expense.council_year_id,
    committee_id: expense.committee_id,
  });
}
