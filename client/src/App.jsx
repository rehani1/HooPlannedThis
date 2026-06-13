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


function App() {
  const { isAuth } = useContext(AuthContext);
  const publicRoute = element => (isAuth ? <Navigate to="/home" /> : element);
  const protectedRoute = element => (isAuth ? element : <Navigate to="/login" />);

  return (
      <Routes>
        {/* public routes */}
        <Route path="/login"    element={publicRoute(<Login />)} />
        <Route path="/register" element={publicRoute(<RegisterAccount />)} />

        {/* protected routes */}
        <Route path="/home"               element={protectedRoute(<Home />)} />
        <Route path="/events"             element={protectedRoute(<Events />)} />
        <Route path="/events/createevent" element={protectedRoute(<CreateEvent />)} />
        <Route path="/events/manage"      element={protectedRoute(<ManageEvents />)} />
        <Route path="/committees"         element={protectedRoute(<Committees />)} />
        <Route path="/profile"            element={protectedRoute(<Profile />)} />
        <Route path="/classcouncil"       element={protectedRoute(<ClassCouncil />)} />
        <Route path="/advisors"           element={protectedRoute(<Advisors />)} />
        <Route path="/budget"             element={protectedRoute(<Budget />)} />
        <Route path="/volunteersignup"    element={protectedRoute(<VolunteerSignUp />)} />
        <Route path="/admincreatecouncil" element={protectedRoute(<AdminCreateCouncil />)} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
  );
}

export default App;
