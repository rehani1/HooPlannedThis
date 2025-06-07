
import React from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css';
import { FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';

const NavBar = () => {
  return (
    <div className="navbar">
      <div className="nav-section">
        <h4 className="section-title">Navigation</h4>
        <ul className="nav-list">
          <li>Class Council</li>
          <li><Link to="/committees">Committees</Link></li>
          <li><Link to="/events">Events</Link></li>

          <li>Budget</li>
          <li>Volunteer Sign Ups</li>
        </ul>
      </div>

      <div className="nav-section">
        <h4 className="section-title">Settings</h4>
        <ul className="nav-list">
          <li><FaUser className="icon" /> Profile</li>
          <li><FaCog className="icon" /> Settings</li>
          <li><FaSignOutAlt className="icon" /> Log Out</li>
        </ul>
      </div>
    </div>
  );
};

export default NavBar;




