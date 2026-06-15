import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Clock, MapPin, RefreshCw, UserPlus, XCircle } from 'lucide-react';
import Layout from '../components/Layout';

const API_BASE = import.meta.env.VITE_API_URL || '';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function eventId(event) {
  return event.id || event.event_id;
}

function display(value) {
  if (value === null || value === undefined) return 'N/A';
  const text = String(value).trim();
  return text || 'N/A';
}

function formatDate(value) {
  if (!value) return 'Date TBD';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);

  if (Number.isNaN(date.getTime())) return 'Date TBD';
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(value) {
  if (!value) return 'Time TBD';
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return display(value);

  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function inputDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
}

function inputTime(value) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : '';
}

function datetimeLocal(value) {
  if (!value) return '';
  const text = String(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  return match ? `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}` : '';
}

function defaultShiftStart(event) {
  const date = inputDate(event.event_date);
  const time = inputTime(event.event_time);
  return date && time ? `${date}T${time}` : '';
}

function signupName(signup) {
  const fullName = [signup.firstName, signup.lastName].filter(Boolean).join(' ').trim();
  return fullName || signup.computingId || 'Volunteer';
}

export default function VolunteerSignUp() {
  const [events, setEvents] = useState([]);
  const [forms, setForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadVolunteers = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/volunteers`, {
        headers: { Accept: 'application/json', ...getAuthHeaders() },
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.message || `Request failed ${res.status}`);
      const rows = Array.isArray(data) ? data : [];
      setEvents(rows);
      setForms(current => {
        const next = { ...current };
        rows.forEach(event => {
          const id = eventId(event);
          if (!next[id]) {
            next[id] = {
              volunteerRole: event.currentUserSignup?.volunteerRole || 'General Volunteer',
              shiftStart: datetimeLocal(event.currentUserSignup?.shiftStart) || defaultShiftStart(event),
              shiftEnd: datetimeLocal(event.currentUserSignup?.shiftEnd),
            };
          }
        });
        return next;
      });
    } catch (err) {
      setError(err.message || 'Failed to load volunteer opportunities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVolunteers();
  }, []);

  const upcomingEvents = useMemo(() => {
    const now = Date.now();
    return [...events].sort((a, b) => {
      const aDate = new Date(`${inputDate(a.event_date)}T${inputTime(a.event_time) || '00:00'}`).getTime();
      const bDate = new Date(`${inputDate(b.event_date)}T${inputTime(b.event_time) || '00:00'}`).getTime();
      if (aDate >= now && bDate < now) return -1;
      if (aDate < now && bDate >= now) return 1;
      return aDate - bDate;
    });
  }, [events]);

  const updateForm = (id, field, value) => {
    setForms(current => ({
      ...current,
      [id]: {
        volunteerRole: 'General Volunteer',
        shiftStart: '',
        shiftEnd: '',
        ...(current[id] || {}),
        [field]: value,
      },
    }));
  };

  const signUp = async event => {
    const id = eventId(event);
    const form = forms[id] || {};
    setSavingKey(`signup:${id}`);
    setError('');
    setNotice('');

    try {
      const res = await fetch(`${API_BASE}/api/volunteers/${id}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          volunteerRole: form.volunteerRole || 'General Volunteer',
          shiftStart: form.shiftStart || null,
          shiftEnd: form.shiftEnd || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Request failed ${res.status}`);
      setNotice(`Volunteer signup saved for ${event.name}.`);
      await loadVolunteers();
    } catch (err) {
      setError(err.message || 'Failed to save volunteer signup');
    } finally {
      setSavingKey('');
    }
  };

  const cancelSignup = async event => {
    const id = eventId(event);
    setSavingKey(`cancel:${id}`);
    setError('');
    setNotice('');

    try {
      const res = await fetch(`${API_BASE}/api/volunteers/${id}/cancel`, {
        method: 'POST',
        headers: { Accept: 'application/json', ...getAuthHeaders() },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Request failed ${res.status}`);
      setNotice(`Volunteer signup cancelled for ${event.name}.`);
      await loadVolunteers();
    } catch (err) {
      setError(err.message || 'Failed to cancel volunteer signup');
    } finally {
      setSavingKey('');
    }
  };

  return (
    <Layout>
      <main style={styles.page}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.h1}>Volunteers</h1>
            <p style={styles.subhead}>Sign up for class council event shifts and see remaining volunteer spots.</p>
          </div>
          <button type="button" onClick={loadVolunteers} disabled={loading} style={styles.secondaryButton}>
            <RefreshCw size={18} />
            Refresh
          </button>
        </header>

        {error && <p style={styles.errorText}>Error: {error}</p>}
        {notice && <p style={styles.noticeText}>{notice}</p>}
        {loading && <p style={styles.statusText}>Loading volunteer opportunities...</p>}

        {!loading && !upcomingEvents.length && (
          <section style={styles.emptyState}>
            <h2 style={styles.emptyTitle}>No events found</h2>
            <p style={styles.bodyText}>Events will appear here once your class council creates them.</p>
          </section>
        )}

        {!loading && Boolean(upcomingEvents.length) && (
          <section style={styles.eventList}>
            {upcomingEvents.map(event => {
              const id = eventId(event);
              const form = forms[id] || {
                volunteerRole: 'General Volunteer',
                shiftStart: defaultShiftStart(event),
                shiftEnd: '',
              };
              const slots = Number(event.volunteer_slots || 0);
              const signupCount = Number(event.signup_count || 0);
              const remaining = Math.max(slots - signupCount, 0);
              const signedUp = Boolean(event.currentUserSignup);
              const canSignUp = slots > 0 && (remaining > 0 || signedUp);

              return (
                <article key={id} style={styles.eventCard}>
                  <div style={styles.eventTop}>
                    <div>
                      <h2 style={styles.eventTitle}>{display(event.name)}</h2>
                      <div style={styles.eventMetaRow}>
                        <span style={styles.metaItem}><CalendarDays size={16} /> {formatDate(event.event_date)}</span>
                        <span style={styles.metaItem}><Clock size={16} /> {formatTime(event.event_time)}</span>
                        <span style={styles.metaItem}><MapPin size={16} /> {display(event.location_name)}</span>
                      </div>
                    </div>
                    <div style={styles.capacityBox}>
                      <span style={styles.capacityLabel}>Volunteers</span>
                      <strong style={styles.capacityValue}>{signupCount} / {slots}</strong>
                      <span style={styles.capacityNote}>{slots > 0 ? `${remaining} open` : 'Not requested'}</span>
                    </div>
                  </div>

                  {event.description && <p style={styles.description}>{event.description}</p>}

                  <div style={styles.signupLayout}>
                    <div style={styles.signupForm}>
                      <label style={styles.label}>
                        Role
                        <input
                          value={form.volunteerRole}
                          onChange={change => updateForm(id, 'volunteerRole', change.target.value)}
                          disabled={!canSignUp}
                          style={styles.input}
                        />
                      </label>
                      <label style={styles.label}>
                        Shift Start
                        <input
                          type="datetime-local"
                          value={form.shiftStart}
                          onChange={change => updateForm(id, 'shiftStart', change.target.value)}
                          disabled={!canSignUp}
                          style={styles.input}
                        />
                      </label>
                      <label style={styles.label}>
                        Shift End
                        <input
                          type="datetime-local"
                          value={form.shiftEnd}
                          onChange={change => updateForm(id, 'shiftEnd', change.target.value)}
                          disabled={!canSignUp}
                          style={styles.input}
                        />
                      </label>
                    </div>

                    <div style={styles.actionColumn}>
                      {signedUp && <span style={styles.signedBadge}>Signed up</span>}
                      <button
                        type="button"
                        onClick={() => signUp(event)}
                        disabled={!canSignUp || savingKey === `signup:${id}`}
                        style={canSignUp ? styles.primaryButton : styles.disabledButton}
                      >
                        <UserPlus size={18} />
                        {signedUp ? 'Update Signup' : 'Sign Up'}
                      </button>
                      {signedUp && (
                        <button
                          type="button"
                          onClick={() => cancelSignup(event)}
                          disabled={savingKey === `cancel:${id}`}
                          style={styles.cancelButton}
                        >
                          <XCircle size={18} />
                          Cancel Signup
                        </button>
                      )}
                    </div>
                  </div>

                  <section style={styles.roster}>
                    <h3 style={styles.rosterTitle}>Current Volunteers</h3>
                    {event.signups?.length ? (
                      <div style={styles.rosterList}>
                        {event.signups.map(signup => (
                          <span key={signup.id} style={styles.rosterPill}>
                            {signupName(signup)} · {signup.volunteerRole || 'General Volunteer'}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p style={styles.bodyText}>No one has signed up yet.</p>
                    )}
                  </section>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </Layout>
  );
}

const styles = {
  page: {
    maxWidth: 1120,
    margin: '0 auto',
    color: '#1b365d',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 18,
    flexWrap: 'wrap',
    marginBottom: 22,
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
  eventList: {
    display: 'grid',
    gap: 16,
    marginBottom: 40,
  },
  eventCard: {
    display: 'grid',
    gap: 16,
    padding: 18,
    border: '1px solid #dfe4ea',
    borderRadius: 8,
    background: '#fff',
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.06)',
  },
  eventTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
  },
  eventTitle: {
    margin: 0,
    color: '#003e83',
    fontSize: 24,
    fontWeight: 800,
  },
  eventMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 8,
  },
  metaItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    color: '#667085',
    fontSize: 13,
    fontWeight: 800,
  },
  capacityBox: {
    display: 'grid',
    justifyItems: 'end',
    minWidth: 120,
  },
  capacityLabel: {
    color: '#667085',
    fontSize: 12,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  capacityValue: {
    color: '#003e83',
    fontSize: 28,
    lineHeight: 1.2,
  },
  capacityNote: {
    color: '#4d5b6a',
    fontSize: 13,
    fontWeight: 700,
  },
  description: {
    margin: 0,
    color: '#1b365d',
    lineHeight: 1.45,
  },
  signupLayout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: 14,
    alignItems: 'end',
  },
  signupForm: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: 12,
  },
  label: {
    display: 'grid',
    gap: 6,
    color: '#1b365d',
    fontSize: 13,
    fontWeight: 800,
  },
  input: {
    width: '100%',
    minHeight: 40,
    padding: '8px 10px',
    border: '1px solid #d7dce2',
    borderRadius: 6,
    background: '#fff',
    color: '#1b365d',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 14,
    boxSizing: 'border-box',
  },
  actionColumn: {
    display: 'grid',
    justifyItems: 'end',
    gap: 8,
    minWidth: 164,
  },
  primaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 40,
    padding: '0 14px',
    border: 'none',
    borderRadius: 6,
    background: '#003e83',
    color: '#fff',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
    cursor: 'pointer',
  },
  disabledButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 40,
    padding: '0 14px',
    border: '1px solid #d7dce2',
    borderRadius: 6,
    background: '#f2f4f7',
    color: '#98a2b3',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
    cursor: 'not-allowed',
  },
  secondaryButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 40,
    padding: '0 14px',
    border: '1px solid #d7dce2',
    borderRadius: 6,
    background: '#fff',
    color: '#003e83',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
    cursor: 'pointer',
  },
  cancelButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 38,
    padding: '0 12px',
    border: '1px solid #fecdca',
    borderRadius: 6,
    background: '#fff',
    color: '#b42318',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
    cursor: 'pointer',
  },
  signedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 26,
    padding: '0 10px',
    borderRadius: 999,
    background: '#ecfdf3',
    color: '#027a48',
    fontSize: 12,
    fontWeight: 800,
  },
  roster: {
    display: 'grid',
    gap: 8,
    paddingTop: 4,
    borderTop: '1px solid #edf0f3',
  },
  rosterTitle: {
    margin: 0,
    color: '#003e83',
    fontSize: 16,
    fontWeight: 800,
  },
  rosterList: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  rosterPill: {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: 28,
    padding: '0 10px',
    borderRadius: 999,
    background: '#eef4ff',
    color: '#003e83',
    fontSize: 13,
    fontWeight: 800,
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
    margin: '0 0 14px',
    color: '#b42318',
    fontWeight: 800,
  },
  noticeText: {
    margin: '0 0 14px',
    color: '#027a48',
    fontWeight: 800,
  },
};
