import React from 'react';

function Dashboard({ user = '[User]' }) {
    const cards = [
      { id: 1, title: 'Class of 26', detail: '📊' },
      { id: 2, title: 'Committee', detail: 'Aug 22' },
      { id: 3, title: 'Manage Profile', detail: '👤' },
      { id: 4, title: 'Events', detail: '26' },
    ];
  
   
    return(
    <div className="dashboard">
      <h2>Welcome, {user}!</h2>
      <div className="card-container">
      {cards.map(card => (
          <div key={card.id} className="card">
            <h3>{card.title}</h3>
            <p>{card.detail}</p>
          </div>
        ))}
    </div>
    </div>
    );
  }
  export default Dashboard