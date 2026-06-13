
import React, { useContext } from 'react'; 
import { Link, useNavigate } from 'react-router-dom';
import './NavBar.css';
import { FaCog, FaSignOutAlt } from 'react-icons/fa';
import { AuthContext } from '../AuthContext';


const NavBar = () => {
  const navigate   = useNavigate();
  const { setIsAuth } = useContext(AuthContext); 

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuth(false);                        
    navigate('/login', { replace: true });   

  };

  return (
    <div className="navbar">
      <div className="nav-section">
        <h4 className="section-title">Navigation</h4>
        <ul className="nav-list">
          <li><Link to="/home">Home</Link></li>
          <li><Link to="/classcouncil">Class Council</Link></li>
          <li><Link to="/events">Events</Link></li>
          <li><Link to="/advisors">Advisors</Link></li>
        </ul>
      </div>

      <div className="nav-section">
        <h4 className="section-title">Settings</h4>
        <ul className="nav-list">
          <li><FaCog className="icon" /><Link to="/admincreatecouncil">Admin</Link></li>
          <li>
            <button onClick={handleLogout} className="link-button">
              <FaSignOutAlt className="icon" /> Log Out
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default NavBar;


