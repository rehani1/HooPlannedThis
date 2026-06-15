// src/pages/Events.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Clock, DollarSign, PackagePlus, Pencil, Plus, Search } from 'lucide-react';
import EventEditModal from '../components/EventEditModal';
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

function display(value) {
  if (value === null || value === undefined) return 'N/A';
  const text = String(value).trim();
  return text ? text : 'N/A';
}

function eventId(event) {
  return event.id || event.event_id;
}

function isLeadRole(role) {
  const value = String(role || '').toLowerCase().replace(/[\s-]+/g, '_');
  return ['committee_chair', 'chair', 'committee_lead', 'lead'].includes(value);
}

function canManageEvent(user, event) {
  if (!user || !event) return false;

  const councilYearId = Number(event.council_year_id ?? event.councilYearId);
  const committeeId = Number(event.committee_id ?? event.committeeId);
  const executiveForCouncil = (user.executivePositions || []).some(position =>
    Number(position.councilYearId) === councilYearId
  );
  const leadForCommittee = (user.committeeMemberships || []).some(membership =>
    Number(membership.committeeId) === committeeId && isLeadRole(membership.role)
  );

  return executiveForCouncil || leadForCommittee;
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

function buildManageableCommitteeOptions(councils, user) {
  if (!user) return [];

  const executiveCouncilIds = new Set(
    (user.executivePositions || []).map(position => Number(position.councilYearId))
  );
  const leadCommitteeIds = new Set(
    (user.committeeMemberships || [])
      .filter(membership => isLeadRole(membership.role))
      .map(membership => Number(membership.committeeId))
  );

  return councils.flatMap(council =>
    (council.committeeRecords || []).map(record => {
      const id = Number(record.id);
      const executiveAccess = executiveCouncilIds.has(Number(council.council_year_id));
      const leadAccess = leadCommitteeIds.has(id);

      return {
        id,
        label: `${record.name} - ${classLabel(council.class_name)} (${council.academic_year})`,
        accessible: executiveAccess || leadAccess,
      };
    })
  ).filter(option => option.accessible);
}

function parseMoney(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function formatCurrency(value) {
  return parseMoney(value).toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) return 'N/A';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);

  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(value) {
  if (!value) return 'N/A';
  const text = String(value);
  const match = text.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return display(value);

  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function normalizeStatus(value) {
  return display(value).toLowerCase().replace(/_/g, ' ');
}

function statusStyles(value) {
  const status = normalizeStatus(value);
  if (status === 'completed') return { background: 'var(--button-orange-soft)', color: '#003e83' };
  if (status === 'cancelled') return { background: '#fee4e2', color: '#b42318' };
  if (status === 'in progress') return { background: '#e0f2fe', color: '#075985' };
  return { background: '#fff7e6', color: '#9a5b00' };
}

function eventTimestamp(event) {
  const rawDate = event.event_date;
  const rawTime = event.event_time || '00:00:00';
  const dateMatch = String(rawDate || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  const timeMatch = String(rawTime).match(/^(\d{1,2}):(\d{2})/);

  if (!dateMatch) return 0;
  const hours = timeMatch ? Number(timeMatch[1]) : 0;
  const minutes = timeMatch ? Number(timeMatch[2]) : 0;
  return new Date(
    Number(dateMatch[1]),
    Number(dateMatch[2]) - 1,
    Number(dateMatch[3]),
    hours,
    minutes,
    0,
    0
  ).getTime();
}

function StatCard({ icon, label, value }) {
  return (
    <article style={styles.statCard}>
      <span style={styles.statIcon}>{icon}</span>
      <div>
        <span style={styles.statLabel}>{label}</span>
        <strong style={styles.statValue}>{value}</strong>
      </div>
    </article>
  );
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [councils, setCouncils] = useState([]);
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingEvent, setEditingEvent] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      setError('');

      try {
        const authHeaders = getAuthHeaders();
        const [eventsRes, profileRes, councilsRes] = await Promise.all([
          fetch(`${API_BASE}/api/events?limit=100&order=asc`, {
            headers: { Accept: 'application/json', ...authHeaders },
          }),
          authHeaders.Authorization
            ? fetch(`${API_BASE}/api/profile`, { headers: { Accept: 'application/json', ...authHeaders } })
            : Promise.resolve(null),
          fetch(`${API_BASE}/api/councils`, { headers: { Accept: 'application/json' } }),
        ]);

        const data = await eventsRes.json().catch(() => []);
        if (!eventsRes.ok) throw new Error(data.message || `Request failed ${eventsRes.status}`);
        setEvents(Array.isArray(data) ? data : []);

        const councilData = await councilsRes.json().catch(() => []);
        if (!councilsRes.ok) throw new Error(councilData.message || `Council request failed ${councilsRes.status}`);
        setCouncils(Array.isArray(councilData) ? councilData : []);

        if (profileRes) {
          if (!profileRes.ok) throw new Error(`Profile request failed ${profileRes.status}`);
          const profile = await profileRes.json();
          localStorage.setItem('user', JSON.stringify(profile));
          setUser(profile);
        }
      } catch (err) {
        setError(err.message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  const statuses = useMemo(() => {
    const values = new Set(events.map(event => normalizeStatus(event.status)));
    return ['all', ...Array.from(values).filter(value => value !== 'N/A'.toLowerCase()).sort()];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();
    const now = Date.now();

    return [...events]
      .filter(event => {
        const haystack = [
          event.name,
          event.description,
          event.committee_id,
          event.location_id,
          event.status,
        ].map(value => display(value).toLowerCase()).join(' ');
        const matchesSearch = !query || haystack.includes(query);
        const matchesStatus = statusFilter === 'all' || normalizeStatus(event.status) === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const aTime = eventTimestamp(a);
        const bTime = eventTimestamp(b);
        if (aTime >= now && bTime < now) return -1;
        if (aTime < now && bTime >= now) return 1;
        return aTime - bTime;
      });
  }, [events, search, statusFilter]);

  const totalBudget = events.reduce((sum, event) => sum + parseMoney(event.budget_allocated), 0);
  const upcomingCount = events.filter(event => eventTimestamp(event) >= Date.now()).length;
  const plannedCount = events.filter(event => normalizeStatus(event.status) === 'planned').length;
  const committeeOptions = useMemo(() => buildManageableCommitteeOptions(councils, user), [councils, user]);

  const openDocument = async (event, document) => {
    try {
      const res = await fetch(`${API_BASE}/api/events/${eventId(event)}/documents/${document.document_id}/download-url`, {
        headers: {
          ...getAuthHeaders(),
          Accept: 'application/json',
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Download failed ${res.status}`);
      window.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err.message || 'Failed to open document');
    }
  };

  const openEdit = event => {
    setEditingEvent(event);
    setSaveError('');
  };

  const cancelEdit = () => {
    setEditingEvent(null);
    setSaveError('');
  };

  const saveEdit = async form => {
    const currentEvent = editingEvent;
    if (!currentEvent) return;

    setSaveError('');
    setSaving(true);

    try {
      const id = eventId(currentEvent);
      const res = await fetch(`${API_BASE}/api/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          title: form.name.trim(),
          committeeId: Number(form.committeeId),
          date: form.eventDate,
          startTime: form.eventTime,
          description: form.description.trim() || null,
          budget: Number(form.budgetAllocated) || 0,
          volunteerSlots: parseInt(form.volunteerSlots, 10) || 0,
          status: form.status,
          locationName: form.locationName.trim(),
          locationAddress: form.locationAddress.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim() || null,
          zipcode: form.zipcode.trim() || null,
          venueEmail: form.venueEmail.trim() || null,
          venuePhone: form.venuePhone.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Request failed ${res.status}`);

      const updated = {
        ...data,
        committee_id: data.committee_id ?? data.committeeId ?? currentEvent.committee_id,
        council_year_id: data.council_year_id ?? data.councilYearId ?? currentEvent.council_year_id,
        committee_name: data.committee_name ?? data.committeeName ?? currentEvent.committee_name,
        location_id: data.location_id ?? data.locationId ?? currentEvent.location_id,
        location_name: data.location_name ?? data.locationName ?? currentEvent.location_name,
        location_address: data.location_address ?? data.locationAddress ?? currentEvent.location_address,
        location_city: data.location_city ?? data.locationCity ?? currentEvent.location_city,
        location_state: data.location_state ?? data.locationState ?? currentEvent.location_state,
        location_zipcode: data.location_zipcode ?? data.locationZipcode ?? currentEvent.location_zipcode,
        venue_email: data.venue_email ?? data.venueEmail ?? currentEvent.venue_email,
        venue_phone: data.venue_phone ?? data.venuePhone ?? currentEvent.venue_phone,
        volunteer_slots: data.volunteer_slots ?? data.volunteerSlots ?? currentEvent.volunteer_slots,
        volunteer_signup_count: data.volunteer_signup_count ?? data.signupCount ?? currentEvent.volunteer_signup_count,
      };

      setEvents(current =>
        current.map(event => Number(eventId(event)) === Number(eventId(updated)) ? { ...event, ...updated } : event)
      );
      setEditingEvent(null);
    } catch (err) {
      setSaveError(err.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <main style={styles.page}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.h1}>Events</h1>
            <p style={styles.subhead}>Review class council events, dates, statuses, budgets, and supply workflows.</p>
          </div>
          <div style={styles.actions}>
            <Link to="/events/manage" style={styles.secondaryButton}>
              <PackagePlus size={18} />
              Manage Supplies
            </Link>
            <Link to="/events/createevent" style={styles.primaryButton}>
              <Plus size={18} />
              Create Event
            </Link>
          </div>
        </header>

        <section style={styles.statsGrid}>
          <StatCard icon={<CalendarDays size={20} />} label="Total Events" value={events.length} />
          <StatCard icon={<Clock size={20} />} label="Upcoming" value={upcomingCount} />
          <StatCard icon={<CalendarDays size={20} />} label="Planned" value={plannedCount} />
          <StatCard icon={<DollarSign size={20} />} label="Event Budgets" value={formatCurrency(totalBudget)} />
        </section>

        <section style={styles.toolbar}>
          <label style={styles.searchLabel}>
            <Search size={18} />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search events"
              style={styles.searchInput}
            />
          </label>
          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
            style={styles.select}
            aria-label="Filter events by status"
          >
            {statuses.map(status => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Statuses' : status}
              </option>
            ))}
          </select>
        </section>

        {loading && <p style={styles.statusText}>Loading events...</p>}
        {error && <p style={styles.errorText}>Error: {error}</p>}

        {!loading && !error && (
          <section style={styles.eventList}>
            {!filteredEvents.length && (
              <article style={styles.emptyState}>
                <h2 style={styles.emptyTitle}>No events found</h2>
                <p style={styles.bodyText}>Try adjusting the search or status filter.</p>
              </article>
            )}

            {filteredEvents.map(event => {
              const id = eventId(event);
              const status = normalizeStatus(event.status);
              const canEdit = canManageEvent(user, event);
              const contacts = Array.isArray(event.contacts) ? event.contacts : [];
              const advertisements = Array.isArray(event.advertisements) ? event.advertisements : [];
              const documents = Array.isArray(event.documents) ? event.documents : [];
              const primaryContact = contacts.find(contact => Boolean(contact.is_primary));

              return (
                <article key={id || `${event.name}-${event.event_date}`} style={styles.eventCard}>
                  <div style={styles.eventMain}>
                    <div style={styles.eventDateBox}>
                      <span>{formatDate(event.event_date).split(',')[0]}</span>
                      <strong>{formatTime(event.event_time)}</strong>
                    </div>
                    <div style={styles.eventContent}>
                      <div style={styles.eventHeader}>
                        <h2 style={styles.eventTitle}>{display(event.name)}</h2>
                        <div style={styles.eventHeaderActions}>
                          <span style={{ ...styles.statusBadge, ...statusStyles(event.status) }}>
                            {status}
                          </span>
                          {canEdit && (
                            <button type="button" onClick={() => openEdit(event)} style={styles.editButton}>
                              <Pencil size={16} />
                              Edit
                            </button>
                          )}
                        </div>
                      </div>
                      <p style={styles.eventMeta}>
                        {formatDate(event.event_date)} at {formatTime(event.event_time)}
                      </p>
                      <p style={styles.eventDescription}>{display(event.description)}</p>
                      {(contacts.length || advertisements.length || documents.length) ? (
                        <div style={styles.relatedList}>
                          {primaryContact && (
                            <span style={styles.relatedPill}>
                              Contact: {display(`${primaryContact.first_name || ''} ${primaryContact.last_name || ''}`.trim() || primaryContact.computing_id)}
                            </span>
                          )}
                          {contacts.length > 0 && <span style={styles.relatedPill}>{contacts.length} contact{contacts.length === 1 ? '' : 's'}</span>}
                          {advertisements.length > 0 && <span style={styles.relatedPill}>{advertisements.length} ad{advertisements.length === 1 ? '' : 's'}</span>}
                          {documents.length > 0 && <span style={styles.relatedPill}>{documents.length} document{documents.length === 1 ? '' : 's'}</span>}
                        </div>
                      ) : null}
                      {canEdit && documents.length > 0 && (
                        <div style={styles.documentList}>
                          {documents.map(document => (
                            <button
                              key={document.document_id}
                              type="button"
                              onClick={() => openDocument(event, document)}
                              style={styles.documentButton}
                            >
                              {document.document_name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <dl style={styles.eventDetails}>
                    <div>
                      <dt style={styles.detailLabel}>Budget</dt>
                      <dd style={styles.detailValue}>{formatCurrency(event.budget_allocated)}</dd>
                    </div>
                    <div>
                      <dt style={styles.detailLabel}>Committee</dt>
                      <dd style={styles.detailValue}>{display(event.committee_name) !== 'N/A' ? event.committee_name : `#${display(event.committee_id)}`}</dd>
                    </div>
                    <div>
                      <dt style={styles.detailLabel}>Location</dt>
                      <dd style={styles.detailValue}>
                        {display(event.location_name) !== 'N/A'
                          ? event.location_name
                          : (event.location_id ? `#${event.location_id}` : 'N/A')}
                      </dd>
                    </div>
                    <div>
                      <dt style={styles.detailLabel}>Volunteers</dt>
                      <dd style={styles.detailValue}>
                        {Number(event.volunteer_signup_count || 0)} / {Number(event.volunteer_slots || 0)}
                      </dd>
                    </div>
                    <div>
                      <dt style={styles.detailLabel}>Created By</dt>
                      <dd style={styles.detailValue}>{display(event.created_by)}</dd>
                    </div>
                  </dl>
                </article>
              );
            })}
          </section>
        )}

        <EventEditModal
          open={Boolean(editingEvent)}
          event={editingEvent}
          committeeOptions={committeeOptions}
          saving={saving}
          error={saveError}
          onClose={cancelEdit}
          onSubmit={saveEdit}
        />
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
    marginBottom: 20,
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
    lineHeight: 1.45,
  },
  actions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    minHeight: 40,
    padding: '0 14px',
    borderRadius: 6,
    background: '#ff8937',
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 800,
  },
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    minHeight: 40,
    padding: '0 14px',
    border: '1px solid var(--button-border)',
    borderRadius: 6,
    background: '#fff',
    color: '#003e83',
    textDecoration: 'none',
    fontWeight: 800,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 14,
    marginBottom: 18,
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    minHeight: 86,
    padding: 16,
    border: '1px solid #dfe4ea',
    borderRadius: 8,
    background: '#fff',
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.06)',
  },
  statIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 38,
    borderRadius: 6,
    background: '#eef4ff',
    color: '#003e83',
  },
  statLabel: {
    display: 'block',
    color: '#667085',
    fontSize: 13,
    fontWeight: 800,
  },
  statValue: {
    display: 'block',
    color: '#003e83',
    fontSize: 22,
    lineHeight: 1.2,
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  searchLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: '1 1 260px',
    minHeight: 42,
    padding: '0 12px',
    border: '1px solid var(--button-border)',
    borderRadius: 6,
    background: '#fff',
    color: '#667085',
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    border: 'none',
    outline: 'none',
    fontSize: 15,
    fontFamily: 'Montserrat, sans-serif',
  },
  select: {
    minHeight: 42,
    padding: '0 12px',
    border: '1px solid var(--button-border)',
    borderRadius: 6,
    background: '#fff',
    color: '#003e83',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
  },
  eventList: {
    display: 'grid',
    gap: 14,
    marginBottom: 40,
  },
  eventCard: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
    gap: 18,
    padding: 18,
    border: '1px solid #dfe4ea',
    borderRadius: 8,
    background: '#fff',
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.06)',
  },
  eventMain: {
    display: 'flex',
    gap: 14,
    minWidth: 0,
  },
  eventDateBox: {
    display: 'grid',
    alignContent: 'center',
    justifyItems: 'center',
    flex: '0 0 86px',
    height: 86,
    borderRadius: 8,
    background: '#eef4ff',
    color: '#003e83',
    textAlign: 'center',
  },
  eventContent: {
    minWidth: 0,
  },
  eventHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  eventHeaderActions: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  eventTitle: {
    margin: 0,
    color: '#003e83',
    fontSize: 22,
    fontWeight: 800,
  },
  editButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 32,
    padding: '0 10px',
    border: '1px solid var(--button-border)',
    borderRadius: 6,
    background: '#fff',
    color: '#003e83',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 26,
    padding: '0 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    textTransform: 'capitalize',
  },
  eventMeta: {
    margin: '8px 0 0',
    color: '#667085',
    fontSize: 14,
    fontWeight: 700,
  },
  eventDescription: {
    margin: '10px 0 0',
    color: '#1b365d',
    lineHeight: 1.45,
  },
  relatedList: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 12,
  },
  relatedPill: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 28,
    padding: '4px 9px',
    borderRadius: 6,
    background: '#eef4ff',
    color: '#003e83',
    fontSize: 12,
    fontWeight: 800,
  },
  documentList: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 10,
  },
  documentButton: {
    border: '1px solid #c7d7fe',
    borderRadius: 6,
    background: '#fff',
    color: '#003e83',
    padding: '6px 10px',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
  },
  eventDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
    margin: 0,
    alignContent: 'start',
  },
  detailLabel: {
    color: '#667085',
    fontSize: 12,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  detailValue: {
    margin: '4px 0 0',
    color: '#1b365d',
    fontWeight: 800,
    overflowWrap: 'anywhere',
  },
  emptyState: {
    padding: 24,
    border: '1px solid #dfe4ea',
    borderRadius: 8,
    background: '#fff',
  },
  emptyTitle: {
    margin: '0 0 8px',
    color: '#003e83',
  },
  bodyText: {
    margin: 0,
    color: '#4d5b6a',
  },
  statusText: {
    margin: 0,
    color: '#4d5b6a',
    fontWeight: 700,
  },
  errorText: {
    margin: 0,
    color: '#b42318',
    fontWeight: 800,
  },
};
