// src/components/Layout.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import NavBar from './NavBar';
import CalendarIcon from './CalendarIcon';
import { ArrowLeft } from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();
  
  const fullWidthPages = ['/register', '/login', '/dashboard'];
  
  const isFullWidth = fullWidthPages.includes(location.pathname);
  
  // Determine the CSS class for page-content
  const pageContentClass = isFullWidth ? 'page-content full-width' : 'page-content with-padding';

  return (
    <div className="layout-wrapper">
      <header className="top-header">
        {location.pathname === '/register' && (
          <Link to="/login" className="back-arrow" aria-label="Back to login">
            <ArrowLeft size={24} strokeWidth={2.2} />
          </Link>
        )}
        <Link to="/home" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="logo-with-icon">
                <CalendarIcon />
                <span>HooPlannedThis</span>
            </div>
        </Link>
        {}
    </header>

      <div className="layout-container">
        {!isFullWidth && (
          <div className="NavBar">
            <NavBar />
          </div>
        )}

        <div className="main-content">
          <div className={pageContentClass}>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
