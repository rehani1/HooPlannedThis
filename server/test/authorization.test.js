import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  canManageDocument,
  canManageEvent,
  isCommitteeLeadRole,
} from '../authorization.js';

describe('event document authorization helpers', () => {
  test('recognizes normalized committee lead roles', () => {
    assert.equal(isCommitteeLeadRole('committee chair'), true);
    assert.equal(isCommitteeLeadRole('committee-lead'), true);
    assert.equal(isCommitteeLeadRole('lead'), true);
    assert.equal(isCommitteeLeadRole('member'), false);
  });

  test('allows executives for the event council year', () => {
    assert.equal(
      canManageEvent(
        { executivePositions: [{ councilYearId: 2027 }], committeeMemberships: [] },
        { council_year_id: 2027, committee_id: 12 }
      ),
      true
    );
  });

  test('allows committee leads for the event committee', () => {
    assert.equal(
      canManageEvent(
        {
          executivePositions: [],
          committeeMemberships: [{ committeeId: 12, role: 'chair' }],
        },
        { council_year_id: 2027, committee_id: 12 }
      ),
      true
    );
  });

  test('denies users outside the event council year and committee leadership', () => {
    const user = {
      executivePositions: [{ councilYearId: 2026 }],
      committeeMemberships: [{ committeeId: 12, role: 'member' }],
    };

    assert.equal(canManageEvent(user, { council_year_id: 2027, committee_id: 12 }), false);
    assert.equal(canManageDocument(user, { council_year_id: 2027, committee_id: 12 }), false);
  });
});
