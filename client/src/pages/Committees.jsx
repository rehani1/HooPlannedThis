import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const API_BASE = import.meta.env.VITE_API_URL || '';

function readStoredUser() {
  const saved = localStorage.getItem('user');
  if (!saved) return null;

  try {
    return JSON.parse(saved);
  } catch (err) {
    console.error('Could not parse user from localStorage', err);
    return null;
  }
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDate(value) {
  if (!value) return 'Date TBD';
  return new Date(value).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(value) {
  return value ? value.slice(0, 5) : 'Time TBD';
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
}

function classLabel(value) {
  const labels = {
    first: 'First-Year Council',
    second: 'Second-Year Council',
    third: 'Third-Year Council',
    trustees: 'Trustees',
  };
  return labels[value] || value || 'Council';
}

function isLeadRole(role) {
  const value = String(role || '').toLowerCase().replace(/[\s-]+/g, '_');
  return ['committee_chair', 'chair', 'committee_lead', 'lead'].includes(value);
}

function buildCommitteeList(councils, user) {
  const executiveCouncilIds = new Set(
    (user?.executivePositions || []).map(position => Number(position.councilYearId))
  );
  const membershipByCommittee = new Map(
    (user?.committeeMemberships || []).map(membership => [
      Number(membership.committeeId),
      membership,
    ])
  );

  return councils.flatMap(council =>
    (council.committeeRecords || []).map(record => {
      const id = Number(record.id);
      const membership = membershipByCommittee.get(id);
      const executiveCanEdit = executiveCouncilIds.has(Number(council.council_year_id));
      const leadCanEdit = isLeadRole(membership?.role);
      return {
        id,
        name: record.name,
        budgetAllocated: Number(record.budgetAllocated || 0),
        council,
        membershipRole: membership?.role || '',
        canEdit: executiveCanEdit || leadCanEdit,
        visible: executiveCanEdit || Boolean(membership),
      };
    })
  ).filter(committee => committee.visible);
}

export default function Committees() {
  const [user, setUser] = useState(() => readStoredUser());
  const [councils, setCouncils] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedCommitteeId, setSelectedCommitteeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', budgetAllocated: '' });
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadProfileAndCouncils() {
      setLoading(true);
      setError('');

      try {
        const headers = getAuthHeaders();
        const [profileRes, councilsRes] = await Promise.all([
          headers.Authorization
            ? fetch(`${API_BASE}/api/profile`, { headers: { ...headers, Accept: 'application/json' } })
            : Promise.resolve(null),
          fetch(`${API_BASE}/api/councils`, { headers: { Accept: 'application/json' } }),
        ]);

        if (profileRes) {
          if (!profileRes.ok) throw new Error(`Profile request failed ${profileRes.status}`);
          const profile = await profileRes.json();
          localStorage.setItem('user', JSON.stringify(profile));
          setUser(profile);
        }

        if (!councilsRes.ok) throw new Error(`Council request failed ${councilsRes.status}`);
        setCouncils(await councilsRes.json());
      } catch (err) {
        setError(err.message || 'Failed to load committee details');
      } finally {
        setLoading(false);
      }
    }

    loadProfileAndCouncils();
  }, []);

  const committees = useMemo(() => buildCommitteeList(councils, user), [councils, user]);

  useEffect(() => {
    if (!committees.length) {
      setSelectedCommitteeId(null);
      return;
    }

    if (!committees.some(committee => committee.id === selectedCommitteeId)) {
      setSelectedCommitteeId(committees[0].id);
    }
  }, [committees, selectedCommitteeId]);

  const selectedCommittee = committees.find(committee => committee.id === selectedCommitteeId) || null;
  const executiveLabels = (user?.executivePositions || []).map(position =>
    `${position.role} of ${classLabel(position.councilClassName)}`
  );

  useEffect(() => {
    if (!selectedCommittee) {
      setEvents([]);
      setEditMode(false);
      return;
    }

    setEditForm({
      name: selectedCommittee.name,
      budgetAllocated: String(selectedCommittee.budgetAllocated),
    });
    setEditMode(false);
    setSaveError('');

    async function loadEvents() {
      setEventsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/events?limit=25&order=asc&committeeId=${selectedCommittee.id}`, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`Events request failed ${res.status}`);
        setEvents(await res.json());
      } catch (err) {
        setSaveError(err.message || 'Failed to load committee events');
      } finally {
        setEventsLoading(false);
      }
    }

    loadEvents();
  }, [selectedCommittee]);

  const saveCommittee = async () => {
    if (!selectedCommittee) return;

    setIsSaving(true);
    setSaveError('');

    try {
      const res = await fetch(`${API_BASE}/api/committees/${selectedCommittee.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          name: editForm.name,
          budgetAllocated: Number(editForm.budgetAllocated) || 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Request failed ${res.status}`);

      setCouncils(current =>
        current.map(council => ({
          ...council,
          committeeRecords: (council.committeeRecords || []).map(record =>
            Number(record.id) === selectedCommittee.id
              ? { ...record, name: data.name, budgetAllocated: data.budgetAllocated }
              : record
          ),
          committees: (council.committeeRecords || []).map(record =>
            Number(record.id) === selectedCommittee.id ? data.name : record.name
          ),
        }))
      );
      setEditMode(false);
    } catch (err) {
      setSaveError(err.message || 'Failed to save committee');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Layout>
      <main style={styles.page}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.h1}>Committee</h1>
            <p style={styles.subhead}>
              {executiveLabels.length
                ? executiveLabels.join(', ')
                : 'Your class council committee workspace'}
            </p>
          </div>
          <Link to="/events/createevent" style={styles.primaryLink}>
            + Create Event
          </Link>
        </header>

        {loading && <p style={styles.statusText}>Loading committees...</p>}
        {error && <p style={styles.errorText}>{error}</p>}

        {!loading && !error && !committees.length && (
          <section style={styles.panel}>
            <h2 style={styles.panelTitle}>No Committee Access</h2>
            <p style={styles.bodyText}>
              Your account is not assigned to a committee and does not have an executive position for a council.
            </p>
          </section>
        )}

        {!loading && !error && Boolean(committees.length) && (
          <div style={styles.layoutGrid}>
            <aside style={styles.panel}>
              <h2 style={styles.panelTitle}>Committees</h2>
              <div style={styles.committeeList}>
                {committees.map(committee => (
                  <button
                    key={committee.id}
                    type="button"
                    onClick={() => setSelectedCommitteeId(committee.id)}
                    style={{
                      ...styles.committeeButton,
                      ...(committee.id === selectedCommitteeId ? styles.committeeButtonActive : {}),
                    }}
                  >
                    <span style={styles.committeeName}>{committee.name}</span>
                    <span style={styles.committeeMeta}>
                      {classLabel(committee.council.class_name)}
                    </span>
                  </button>
                ))}
              </div>
            </aside>

            <section>
              {selectedCommittee && (
                <>
                  <section style={styles.summaryGrid}>
                    <article style={styles.panel}>
                      <div style={styles.panelHeader}>
                        <h2 style={styles.panelTitle}>{selectedCommittee.name}</h2>
                        {selectedCommittee.canEdit && (
                          <button
                            type="button"
                            onClick={() => setEditMode(value => !value)}
                            style={styles.editButton}
                          >
                            {editMode ? 'Cancel' : 'Edit'}
                          </button>
                        )}
                      </div>

                      {editMode ? (
                        <div style={styles.editForm}>
                          <label style={styles.label}>
                            Committee Name
                            <input
                              value={editForm.name}
                              onChange={event => setEditForm(form => ({ ...form, name: event.target.value }))}
                              style={styles.input}
                            />
                          </label>
                          <label style={styles.label}>
                            Committee Budget
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editForm.budgetAllocated}
                              onChange={event => setEditForm(form => ({ ...form, budgetAllocated: event.target.value }))}
                              style={styles.input}
                            />
                          </label>
                          {saveError && <p style={styles.errorText}>{saveError}</p>}
                          <button type="button" onClick={saveCommittee} disabled={isSaving} style={styles.saveButton}>
                            {isSaving ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      ) : (
                        <dl style={styles.metaGrid}>
                          <div>
                            <dt style={styles.metaLabel}>Committee ID</dt>
                            <dd style={styles.metaValue}>{selectedCommittee.id}</dd>
                          </div>
                          <div>
                            <dt style={styles.metaLabel}>Academic Year</dt>
                            <dd style={styles.metaValue}>{selectedCommittee.council.academic_year}</dd>
                          </div>
                          <div>
                            <dt style={styles.metaLabel}>Council</dt>
                            <dd style={styles.metaValue}>{classLabel(selectedCommittee.council.class_name)}</dd>
                          </div>
                          <div>
                            <dt style={styles.metaLabel}>Committee Budget</dt>
                            <dd style={styles.metaValue}>{formatCurrency(selectedCommittee.budgetAllocated)}</dd>
                          </div>
                          {selectedCommittee.membershipRole && (
                            <div>
                              <dt style={styles.metaLabel}>Your Role</dt>
                              <dd style={styles.metaValue}>{selectedCommittee.membershipRole.replace(/_/g, ' ')}</dd>
                            </div>
                          )}
                        </dl>
                      )}
                    </article>

                    <article style={styles.panel}>
                      <h2 style={styles.panelTitle}>Event Snapshot</h2>
                      <dl style={styles.metaGrid}>
                        <div>
                          <dt style={styles.metaLabel}>Total Events</dt>
                          <dd style={styles.metaValue}>{events.length}</dd>
                        </div>
                        <div>
                          <dt style={styles.metaLabel}>Planned</dt>
                          <dd style={styles.metaValue}>{events.filter(event => event.status === 'planned').length}</dd>
                        </div>
                        <div>
                          <dt style={styles.metaLabel}>Allocated</dt>
                          <dd style={styles.metaValue}>
                            {formatCurrency(events.reduce((sum, event) => sum + Number(event.budget_allocated || 0), 0))}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  </section>

                  <section style={styles.panel}>
                    <div style={styles.panelHeader}>
                      <h2 style={styles.panelTitle}>Committee Events</h2>
                      <Link to="/events/manage" style={styles.secondaryLink}>Manage Events</Link>
                    </div>

                    {eventsLoading && <p style={styles.statusText}>Loading events...</p>}
                    {!eventsLoading && events.length ? (
                      <div style={styles.eventList}>
                        {events.map(event => (
                          <article key={event.event_id} style={styles.eventCard}>
                            <div>
                              <h3 style={styles.eventTitle}>{event.name}</h3>
                              <p style={styles.eventMeta}>
                                {formatDate(event.event_date)} at {formatTime(event.event_time)}
                              </p>
                              {event.description && <p style={styles.eventDescription}>{event.description}</p>}
                            </div>
                            <div style={styles.eventBudget}>
                              <span style={styles.metaLabel}>Budget</span>
                              <strong>{formatCurrency(event.budget_allocated)}</strong>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : null}
                    {!eventsLoading && !events.length && (
                      <p style={styles.bodyText}>No events have been created for this committee yet.</p>
                    )}
                  </section>
                </>
              )}
            </section>
          </div>
        )}
      </main>
    </Layout>
  );
}

const styles = {
  page: {
    maxWidth: 1180,
    margin: '0 auto',
    color: '#1b365d',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 20,
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  h1: {
    margin: 0,
    color: '#003e83',
    fontSize: 36,
    fontWeight: 800,
  },
  subhead: {
    margin: '8px 0 0',
    color: '#4d5b6a',
    fontSize: 16,
    textTransform: 'capitalize',
  },
  primaryLink: {
    flex: '0 0 auto',
    background: 'var(--button-orange)',
    color: '#fff',
    textDecoration: 'none',
    padding: '10px 16px',
    borderRadius: 6,
    fontWeight: 700,
  },
  secondaryLink: {
    color: '#003e83',
    fontWeight: 700,
    textDecoration: 'none',
  },
  layoutGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
    gap: 20,
    alignItems: 'start',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 20,
    marginBottom: 20,
  },
  panel: {
    background: '#fff',
    border: '1px solid #dfe4ea',
    borderRadius: 8,
    padding: 20,
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.06)',
    marginBottom: 20,
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
  panelTitle: {
    margin: 0,
    color: '#003e83',
    fontSize: 22,
    fontWeight: 700,
  },
  committeeList: {
    display: 'grid',
    gap: 8,
    marginTop: 16,
  },
  committeeButton: {
    width: '100%',
    border: '1px solid #dfe4ea',
    background: '#fff',
    borderRadius: 6,
    padding: 12,
    cursor: 'pointer',
    textAlign: 'left',
    color: '#1b365d',
  },
  committeeButtonActive: {
    borderColor: 'var(--button-orange)',
    background: '#eef6ff',
  },
  committeeName: {
    display: 'block',
    fontWeight: 700,
    marginBottom: 4,
  },
  committeeMeta: {
    display: 'block',
    color: '#667085',
    fontSize: 13,
  },
  metaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 16,
    margin: '18px 0 0',
  },
  metaLabel: {
    color: '#667085',
    display: 'block',
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metaValue: {
    margin: 0,
    color: '#1b365d',
    fontSize: 18,
    fontWeight: 700,
    textTransform: 'capitalize',
  },
  bodyText: {
    margin: '14px 0 0',
    color: '#4d5b6a',
    lineHeight: 1.5,
  },
  statusText: {
    color: '#4d5b6a',
    fontWeight: 600,
  },
  errorText: {
    color: '#b42318',
    fontWeight: 700,
  },
  editButton: {
    background: '#fff',
    color: '#003e83',
    border: '1px solid var(--button-border)',
    borderRadius: 6,
    padding: '7px 12px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  editForm: {
    display: 'grid',
    gap: 14,
  },
  label: {
    display: 'grid',
    gap: 6,
    color: '#1b365d',
    fontWeight: 700,
  },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    border: '1px solid var(--button-border)',
    borderRadius: 6,
    padding: 10,
    fontSize: 15,
  },
  saveButton: {
    justifySelf: 'start',
    background: 'var(--button-orange)',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    padding: '10px 16px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  eventList: {
    display: 'grid',
    gap: 12,
  },
  eventCard: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
    border: '1px solid #edf0f3',
    borderRadius: 8,
    padding: 16,
    background: '#fbfcfd',
  },
  eventTitle: {
    margin: 0,
    color: '#1b365d',
    fontSize: 18,
    fontWeight: 700,
  },
  eventMeta: {
    margin: '6px 0 0',
    color: '#667085',
    fontSize: 14,
  },
  eventDescription: {
    margin: '10px 0 0',
    color: '#4d5b6a',
    lineHeight: 1.45,
  },
  eventBudget: {
    flex: '0 0 120px',
    textAlign: 'right',
    color: '#1b365d',
  },
};
