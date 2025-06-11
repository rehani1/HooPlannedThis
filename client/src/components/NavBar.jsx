
import React from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css';
import { FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';

const NavBar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true })
  };
  return (
    <div className="navbar">
      <div className="nav-section">
        <h4 className="section-title">Navigation</h4>
        <ul className="nav-list">
          <li><Link to="/home">Home</Link></li>
          <li><Link to="/classcouncil">Class Council</Link></li>
          <li><Link to="/committees">Committees</Link></li>
          <li><Link to="/events">Events</Link></li>
          <li><Link to="/advisors">Advisors</Link></li>
          <li><Link to="/budget">Budget</Link></li>
          <li><Link to="/volunteersignup">Volunteer Sign Up</Link></li>
        </ul>
      </div>

      <div className="nav-section">
        <h4 className="section-title">Settings</h4>
        <ul className="nav-list">
          <li><FaUser className="icon" /> <Link to="/profile">Profile</Link></li>
          <li><FaCog className="icon" /> Settings</li>
          <li><FaSignOutAlt className="icon" /><Link to="/login">Log Out</Link></li>
        </ul>
      </div>
    </div>
  );
};

export default NavBar;




