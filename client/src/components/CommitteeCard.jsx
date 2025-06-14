import React from 'react';

// A simple card that displays a committee's name and its members
export default function CommitteeCard({ committee }) {
  return (
    <div style={cardStyle}>
      <h3 style={titleStyle}>{committee.name}</h3>
      <ul style={listStyle}>
        {committee.members.map((member, idx) => (
          <li key={idx} style={itemStyle}>
            {member.first_name ? `${member.first_name} ${member.last_name}` : member.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Inline styles for brevity
const cardStyle = {
  border: '1px solid #e2e2e2',
  borderRadius: 8,
  padding: '1rem',
  background: '#fff',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  maxWidth: 300
};

const titleStyle = {
  margin: '0 0 0.5rem',
  fontSize: '1.25rem',
  color: '#333'
};

const listStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0
};

const itemStyle = {
  padding: '4px 0',
  fontSize: '0.9rem',
  color: '#555'
};
