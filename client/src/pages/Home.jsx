// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardList, DollarSign, Users } from 'lucide-react';
import Layout             from '../components/Layout';

const API_BASE = import.meta.env.VITE_API_URL || '';

const formatDate = value => {
  if (!value) return 'Date TBD';
  return new Date(value).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatTime = value => value?.slice(0, 5) || 'Time TBD';

export default function Home() {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const today = new Date().toISOString().slice(0,10);
        const url = `${API_BASE}/api/events?start_date=${today}&sort=asc&limit=3`;
        const res = await fetch(url, { headers:{ Accept:'application/json' }});
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        setEvents(await res.json());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Layout>
      <section style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Class council workspace</p>
          <h1 style={styles.title}>Home</h1>
        </div>

        <Link to="/events/createevent" style={styles.primaryAction}>
          <CalendarDays size={18} />
          Create Event
        </Link>
      </section>

      <section style={styles.summaryGrid}>
        <Link to="/events" style={styles.summaryCard}>
          <CalendarDays size={22} />
          <div>
            <strong style={styles.summaryValue}>{loading ? '--' : events.length}</strong>
            <span style={styles.summaryLabel}>Upcoming events</span>
          </div>
        </Link>
        <Link to="/classcouncil" style={styles.summaryCard}>
          <Users size={22} />
          <div>
            <strong style={styles.summaryValue}>Council</strong>
            <span style={styles.summaryLabel}>Members and committees</span>
          </div>
        </Link>
        <Link to="/budget" style={styles.summaryCard}>
          <DollarSign size={22} />
          <div>
            <strong style={styles.summaryValue}>$50k</strong>
            <span style={styles.summaryLabel}>Budget overview</span>
          </div>
        </Link>
        <Link to="/events/manage" style={styles.summaryCard}>
          <ClipboardList size={22} />
          <div>
            <strong style={styles.summaryValue}>Supplies</strong>
            <span style={styles.summaryLabel}>Manage event items</span>
          </div>
        </Link>
      </section>

      <section style={styles.contentGrid}>
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div>
              <h2 style={styles.panelTitle}>Upcoming Events</h2>
              <p style={styles.panelSubtext}>The next events on the class council calendar.</p>
            </div>
            <Link to="/events" style={styles.textLink}>View all</Link>
          </div>

          {loading && <p style={styles.mutedText}>Loading upcoming events...</p>}
          {error && <p style={styles.errorText}>Could not load events: {error}</p>}

          {!loading && !error && events.length === 0 && (
            <div style={styles.emptyState}>
              <CalendarDays size={28} />
              <p style={styles.emptyTitle}>No upcoming events</p>
              <p style={styles.mutedText}>Create an event to start planning supplies, budget, and details.</p>
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div style={styles.eventList}>
              {events.map(evt => (
                <article key={evt.event_id} style={styles.eventCard}>
                  <div style={styles.dateBadge}>
                    <span>{formatDate(evt.event_date).split(',')[0]}</span>
                    <strong>{formatTime(evt.event_time)}</strong>
                  </div>
                  <div style={styles.eventBody}>
                    <h3 style={styles.eventTitle}>{evt.name}</h3>
                    <p style={styles.eventMeta}>{formatDate(evt.event_date)}</p>
                    <p style={styles.eventDescription}>{evt.description || 'No description provided.'}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside style={styles.panel}>
          <h2 style={styles.panelTitle}>Quick Links</h2>
          <div style={styles.quickLinks}>
            <Link to="/advisors" style={styles.quickLink}>Advisors</Link>
            <Link to="/volunteers" style={styles.quickLink}>Volunteers</Link>
            <Link to="/committee" style={styles.quickLink}>Committee view</Link>
          </div>
        </aside>
      </section>
    </Layout>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  eyebrow: {
    margin: 0,
    color: '#5d6b7c',
    fontSize: 14,
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  title: {
    margin: '4px 0 0',
    color: '#003366',
    fontSize: 36,
    fontWeight: 800,
  },
  primaryAction: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: '#00479d',
    color: '#fff',
    borderRadius: 999,
    padding: '10px 18px',
    textDecoration: 'none',
    fontWeight: 700,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  summaryCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    background: '#fff',
    color: '#003366',
    border: '1px solid #e3e7ec',
    borderRadius: 8,
    padding: 18,
    textDecoration: 'none',
    boxShadow: '0 2px 6px rgba(0,0,0,.05)',
  },
  summaryValue: {
    display: 'block',
    fontSize: 20,
    lineHeight: 1.2,
  },
  summaryLabel: {
    display: 'block',
    color: '#5d6b7c',
    fontSize: 13,
    marginTop: 2,
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, .8fr)',
    gap: 24,
  },
  panel: {
    background: '#fff',
    border: '1px solid #e3e7ec',
    borderRadius: 8,
    padding: 24,
    boxShadow: '0 2px 6px rgba(0,0,0,.05)',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  panelTitle: {
    margin: 0,
    color: '#003366',
    fontSize: 22,
    fontWeight: 800,
  },
  panelSubtext: {
    margin: '6px 0 0',
    color: '#5d6b7c',
    fontSize: 14,
  },
  textLink: {
    color: '#00479d',
    fontWeight: 700,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  },
  eventList: {
    display: 'grid',
    gap: 14,
  },
  eventCard: {
    display: 'grid',
    gridTemplateColumns: '96px minmax(0, 1fr)',
    gap: 16,
    border: '1px solid #edf0f4',
    borderRadius: 8,
    padding: 16,
    background: '#fbfcfe',
  },
  dateBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 72,
    borderRadius: 8,
    background: '#eaf2fb',
    color: '#003366',
    fontSize: 13,
    fontWeight: 700,
    textAlign: 'center',
  },
  eventBody: {
    minWidth: 0,
  },
  eventTitle: {
    margin: 0,
    color: '#003366',
    fontSize: 18,
  },
  eventMeta: {
    margin: '4px 0 8px',
    color: '#5d6b7c',
    fontSize: 13,
  },
  eventDescription: {
    margin: 0,
    color: '#344154',
    fontSize: 14,
    lineHeight: 1.5,
  },
  quickLinks: {
    display: 'grid',
    gap: 10,
    marginTop: 16,
  },
  quickLink: {
    display: 'block',
    padding: '12px 14px',
    borderRadius: 8,
    background: '#f4f7fb',
    color: '#003366',
    fontWeight: 700,
    textDecoration: 'none',
  },
  mutedText: {
    margin: 0,
    color: '#5d6b7c',
    fontSize: 14,
  },
  errorText: {
    margin: 0,
    color: '#b42318',
    fontSize: 14,
    fontWeight: 600,
  },
  emptyState: {
    display: 'grid',
    justifyItems: 'center',
    gap: 8,
    padding: '32px 16px',
    color: '#5d6b7c',
    border: '1px dashed #c8d2df',
    borderRadius: 8,
  },
  emptyTitle: {
    margin: 0,
    color: '#003366',
    fontWeight: 800,
  },
};
