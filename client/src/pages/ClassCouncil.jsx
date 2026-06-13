// src/pages/ClassCouncil.jsx
import React from 'react';
import Layout from '../components/Layout';

const EXECUTIVE = [
  { role: 'President', name: 'Jordan Lee', email: 'jl4de@virginia.edu' },
  { role: 'Vice‑President', name: 'Priya Shah', email: 'ps2ab@virginia.edu' },
  { role: 'Treasurer', name: 'Alex Kim', email: 'ak3cd@virginia.edu' },
  { role: 'Secretary', name: 'Maria Lopez', email: 'ml7fg@virginia.edu' }
];

const COMMITTEES = [
  {
    name: 'Wellness Committee',
    members: [
      { name: 'Taylor Nguyen', chair: true, email: 'tn9hh@virginia.edu' },
      { name: 'Chris Owens' },
      { name: 'Jamie Patel' }
    ]
  },
  {
    name: 'Career Development Committee',
    members: [
      { name: 'Carmen Zhao', chair: true, email: 'cz3in@virginia.edu' },
      { name: 'Omar Hassan' },
      { name: 'Riley Smith' },
      { name: 'Liam Davis' }
    ]
  },
  {
    name: 'Social Committee',
    members: [
      { name: 'Daniel Park', chair: true, email: 'dp2kl@virginia.edu' },
      { name: 'Avery Johnson' },
      { name: 'Sofia Garcia' },
      { name: 'Noah Brown' }
    ]
  }
];

const card = {
  background: '#fff',
  border: '1px solid #ddd',
  borderRadius: 10,
  padding: 20,
  margin: 12,
  flex: '1 1 45%',
  maxWidth: 500
};

const tbl = {
  width: '100%',
  borderCollapse: 'collapse'
};

const th = {
  textAlign: 'center',
  fontWeight: 600,
  padding: '8px 6px',
  borderBottom: '1px solid #eee',
  color: '#003366'
};

const td = {
  padding: '8px 6px',
  borderBottom: '1px solid #eee',
  color: '#003366'
};

function CommitteeCard({ committee }) {
  const sorted = [
    ...committee.members.filter(m => m.chair),
    ...committee.members.filter(m => !m.chair)
  ];

  return (
    <div style={card}>
      <h2 style={{ margin: 0, marginBottom: 12, textAlign: 'center', color: '#003366'}}>
        {committee.name}
      </h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={tbl}>
          <tbody>
            {sorted.map(m => (
              <tr key={m.name}>
                <td style={{ ...td, fontWeight: m.chair ? 700 : 400 }}>
                  {m.name}{m.chair && ' (Chair)'}
                </td>
                <td style={td}>
                  {m.email ? <a href={`mailto:${m.email}`}>{m.email}</a> : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ClassCouncil() {
  return (
    <Layout>
      <h1 style={{ fontWeight: 700, fontSize: 32, marginBottom: 24, textAlign: 'left', color: '#003366' }}>
        Class Council 2025 - 2026
      </h1>

      {/* Executive Board */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <div style={{ ...card, width: '100%', maxWidth: 700 }}>
          <h2 style={{ margin: 0, marginBottom: 12, textAlign: 'center', color: '#003366' }}>
            Executive Board
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={tbl}>
              <thead>
                <tr>
                  <th style={th}>Role</th>
                  <th style={th}>Name</th>
                  <th style={th}>Email</th>
                </tr>
              </thead>
              <tbody>
                {EXECUTIVE.map(e => (
                  <tr key={e.role}>
                    <td style={td}>{e.role}</td>
                    <td style={td}>{e.name}</td>
                    <td style={td}>
                      <a href={`mailto:${e.email}`}>{e.email}</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Committee Cards in 2-column layout */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', marginTop: 40 }}>
        {COMMITTEES.map(c => (
          <CommitteeCard key={c.name} committee={c} />
        ))}
      </div>
    </Layout>
  );
}
