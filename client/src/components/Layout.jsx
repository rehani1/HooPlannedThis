import React from 'react';
import NavBar from './NavBar';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout-container">
      <NavBar />
      <div className="main-content">
        <header className="top-header">
          <div className="logo">🟧 HooPlannedThis</div>
          <div className="icons">🔔 ✉️</div>
        </header>
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;