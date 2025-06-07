import React from 'react';
import './NavBar.css';

const NavBar = () => {
  return (
    <div className="navbar">
      <div className="logo">HooPlannedThis</div>
      <nav>
        <ul>
          <li>Class Council</li>
          <li>Committee</li>
          <li>Events</li>
          <li>Budget</li>
          <li>Volunteer Sign Ups</li>
        </ul>
      </nav>
      <div className="settings">
        <ul>
          <li>Profile</li>
          <li>Settings</li>
          <li>Log Out</li>
        </ul>
      </div>
    </div>
  );
};

export default NavBar;
