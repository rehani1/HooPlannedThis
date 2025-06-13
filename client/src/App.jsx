import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Login           from './pages/Login';
import Home            from './pages/Home';
import Events          from './pages/Events';
import Committees      from './pages/Committees';
import Profile         from './pages/Profile';
import ClassCouncil    from './pages/ClassCouncil';
import CreateEvent     from './pages/CreateEvent';
import RegisterAccount from './pages/RegisterAccount';
import Advisors        from './pages/Advisors';
import Budget          from './pages/Budget';
import VolunteerSignUp from './pages/VolunteerSignUp';
import AdminCreateCouncil from './pages/AdminCreateCouncil';
import ManageEvents from './pages/ManageEvents';


function App() {
  // const [isAuthenticated, setIsAuth] = useState(
  //   true);
  //   // Boolean(localStorage.getItem('token')) ;

    const [isAuthenticated, setIsAuth] = useState(
      Boolean(localStorage.getItem('token'))
    );

  useEffect(() => {
    const cb = () => setIsAuth(Boolean(localStorage.getItem('token')));
    window.addEventListener('storage', cb);
    return () => window.removeEventListener('storage', cb);
  }, []);

  return (
      <Routes>
        {/* public routes */}
        <Route path="/login"    element={isAuthenticated ? <Navigate to="/home" /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/home" /> : <RegisterAccount />} />

        {/* protected routes */}
        <Route path="/home"               element={isAuthenticated ? <Home />            : <Navigate to="/login" />} />
        <Route path="/events"             element={isAuthenticated ? <Events />          : <Navigate to="/login" />} />
        <Route path="/events/createevent" element={isAuthenticated ? <CreateEvent />     : <Navigate to="/login" />} />
        <Route path="/events/manage" element={<ManageEvents />} />
        <Route path="/committees"         element={isAuthenticated ? <Committees />      : <Navigate to="/login" />} />
        <Route path="/profile"            element={isAuthenticated ? <Profile />         : <Navigate to="/login" />} />
        <Route path="/classcouncil"       element={isAuthenticated ? <ClassCouncil />    : <Navigate to="/login" />} />
        <Route path="/advisors"           element={isAuthenticated ? <Advisors />        : <Navigate to="/login" />} />
        <Route path="/budget"             element={isAuthenticated ? <Budget />          : <Navigate to="/login" />} />
        <Route path="/volunteersignup"    element={isAuthenticated ? <VolunteerSignUp /> : <Navigate to="/login" />} />
        <Route path="/admincreatecouncil"    element={isAuthenticated ? <AdminCreateCouncil /> : <Navigate to="/login" />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
  );
}

export default App;
