import { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import { AuthContext } from './AuthContext';
import Login           from './pages/login';
import Home            from './pages/Home';
import Events          from './pages/Events';
import Committees      from './pages/Committees';
import Profile         from './pages/profile';
import ClassCouncil    from './pages/ClassCouncil';
import CreateEvent     from './pages/CreateEvent';
import RegisterAccount from './pages/RegisterAccount';
import Advisors        from './pages/Advisors';
import Budget          from './pages/Budget';
import VolunteerSignUp from './pages/VolunteerSignUp';
import AdminCreateCouncil from './pages/AdminCreateCouncil';
import ManageEvents from './pages/ManageEvents';
import { hasAdminSetupAccess } from './adminSetupAuth';

function App() {
  const { isAuth } = useContext(AuthContext);
  const publicRoute = element => (isAuth ? <Navigate to="/home" /> : element);
  const adminSetupRoute = element =>
    hasAdminSetupAccess()
      ? element
      : <Navigate to="/login" replace />;

  return (
      <Routes>
        {/* public routes */}
        <Route path="/login"    element={publicRoute(<Login />)} />
        <Route path="/register" element={publicRoute(<RegisterAccount />)} />

        {/* protected routes */}
        <Route path="/home"               element={<Home />} />
        <Route path="/events"             element={<Events />} />
        <Route path="/events/createevent" element={<CreateEvent />} />
        <Route path="/events/manage"      element={<ManageEvents />} />
        <Route path="/committee"          element={<Committees />} />
        <Route path="/committees"         element={<Navigate to="/committee" replace />} />
        <Route path="/profile"            element={<Profile />} />
        <Route path="/classcouncil"       element={<ClassCouncil />} />
        <Route path="/advisors"           element={<Advisors />} />
        <Route path="/budget"             element={<Budget />} />
        <Route path="/volunteers"         element={<VolunteerSignUp />} />
        <Route path="/volunteersignup"    element={<Navigate to="/volunteers" replace />} />
        <Route path="/admincreatecouncil" element={adminSetupRoute(<AdminCreateCouncil />)} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
  );
}

export default App;
