// src/pages/ClassCouncil.jsx
import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';

const API_BASE = import.meta.env.VITE_API_URL || '';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function display(value) {
  if (value === null || value === undefined) return 'N/A';
  const text = String(value).trim();
  return text ? text : 'N/A';
}

function classLabel(value) {
  const labels = {
    first: 'First-Year',
    second: 'Second-Year',
    third: 'Third-Year',
    trustees: 'Trustees',
  };
  return labels[value] || display(value);
}

function fullName(person) {
  const name = [person?.firstName, person?.lastName]
    .map(value => String(value || '').trim())
    .filter(Boolean)
    .join(' ');
  return name || 'N/A';
}

function normalizeRole(value) {
  return display(value).replace(/_/g, ' ');
}

function MailLink({ email }) {
  const value = display(email);
  if (value === 'N/A') return value;
  return <a href={`mailto:${value}`} style={styles.link}>{value}</a>;
}

function ExecutiveBoard({ rows }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div style={{ ...styles.card, width: '100%', maxWidth: 700 }}>
        <h2 style={styles.cardTitle}>Executive Board</h2>
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
              </tr>
            </thead>
            <tbody>
              {rows.length ? rows.map(row => (
                <tr key={`${row.id || row.role}-${row.computingId || 'na'}`}>
                  <td style={styles.td}>{normalizeRole(row.role)}</td>
                  <td style={styles.td}>{fullName(row)}</td>
                  <td style={styles.td}><MailLink email={row.email} /></td>
                </tr>
              )) : (
                <tr>
                  <td style={styles.td}>N/A</td>
                  <td style={styles.td}>N/A</td>
                  <td style={styles.td}>N/A</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CommitteeCard({ committee }) {
  const members = [...(committee.members || [])].sort((a, b) =>
    normalizeRole(b.role).localeCompare(normalizeRole(a.role))
  );

  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>{display(committee.name)}</h2>
      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <tbody>
            {members.length ? members.map(member => (
              <tr key={`${committee.id}-${member.computingId || fullName(member)}`}>
                <td style={{ ...styles.td, fontWeight: 700 }}>
                  {fullName(member)}
                  <span style={styles.roleText}> {normalizeRole(member.role)}</span>
                </td>
                <td style={styles.td}><MailLink email={member.email} /></td>
              </tr>
            )) : (
              <tr>
                <td style={styles.td}>N/A</td>
                <td style={styles.td}>N/A</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ClassCouncil() {
  const [council, setCouncil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCouncil() {
      setLoading(true);
      setError('');

      try {
        const authHeaders = getAuthHeaders();
        if (!authHeaders.Authorization) {
          throw new Error('Login required to view your class council');
        }

        const res = await fetch(`${API_BASE}/api/class-council`, {
          headers: {
            Accept: 'application/json',
            ...authHeaders,
          },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || `Request failed ${res.status}`);
        setCouncil(data);
      } catch (err) {
        setError(err.message || 'Failed to load class council');
      } finally {
        setLoading(false);
      }
    }

    loadCouncil();
  }, []);

  const title = council
    ? `${classLabel(council.className)} Class Council ${display(council.academicYear)}`
    : 'Class Council';

  return (
    <Layout>
      <main style={styles.page}>
        <h1 style={styles.title}>{title}</h1>

        {loading && <p style={styles.statusText}>Loading class council...</p>}
        {error && <p style={styles.errorText}>{error}</p>}

        {!loading && !error && council && (
          <>
            <ExecutiveBoard rows={council.executiveBoard || []} />

            <div style={styles.committeeGrid}>
              {council.committees?.length
                ? council.committees.map(committee => (
                    <CommitteeCard key={committee.id || committee.name} committee={committee} />
                  ))
                : <CommitteeCard committee={{ name: 'N/A', members: [] }} />}
            </div>
          </>
        )}
      </main>
    </Layout>
  );
}

const styles = {
  page: {
    color: '#003366',
  },
  title: {
    fontWeight: 700,
    fontSize: 32,
    margin: '0 0 24px',
    textAlign: 'left',
    color: '#003366',
  },
  card: {
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: 10,
    padding: 20,
    margin: 12,
    flex: '1 1 45%',
    maxWidth: 500,
  },
  cardTitle: {
    margin: '0 0 12px',
    textAlign: 'center',
    color: '#003366',
    fontSize: 22,
    fontWeight: 700,
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'center',
    fontWeight: 600,
    padding: '8px 6px',
    borderBottom: '1px solid #eee',
    color: '#003366',
  },
  td: {
    padding: '8px 6px',
    borderBottom: '1px solid #eee',
    color: '#003366',
  },
  committeeGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: 40,
  },
  roleText: {
    color: '#667085',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  link: {
    color: '#003366',
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
