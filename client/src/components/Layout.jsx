// src/components/Layout.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import NavBar from './NavBar';
import CalendarIcon from './CalendarIcon';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout-wrapper">
      <header className="top-header">
        <Link to="/home" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="logo-with-icon">
                <CalendarIcon />
                <span>HooPlannedThis</span>
            </div>
        </Link>
        {}
    </header>

      <div className="layout-container">
        <div className="NavBar">
          <NavBar />
        </div>
        <div className="main-content">
          <div className="page-content">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Layout;






// import React from 'react';
// import NavBar from './NavBar';
// import './Layout.css';

// const Layout = ({ children }) => {
//   return (
//     <div className="layout-container">
//       <NavBar />
//       <div className="main-content">
//         <header className="top-header">
//           <div className="logo">🟧 HooPlannedThis</div>
//           <div className="icons">🔔 ✉️</div>
//         </header>
//         <div className="page-content">
//           {children}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Layout;