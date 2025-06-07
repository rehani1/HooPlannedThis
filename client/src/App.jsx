import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login'; 
import Home from './pages/Home';

function App() {
  const isAuthenticated = true; // Replace with actual login logic or context

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/home"
        element={isAuthenticated ? <Home /> : <Navigate to="/login" />}
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;

// import { Routes, Route, Navigate } from 'react-router-dom';
// import { useState } from 'react';
// import './App.css';
// import Login from './pages/Login';
// import Home from './pages/Home';


// function App() {
//   const [isLoggedIn, setIsLoggedIn] = useState(false);

//   return (
//     <Routes>
//       {!isLoggedIn ? (
//         <Route path="*" element={<Login onSuccess={() => setIsLoggedIn(true)} />} />
//       ) : (
//         <>
//           <Route element={<Layout />}>
//             <Route path="/" element={<Home />} />
//             <Route path="/events" element={<Events />} />
//             <Route path="/profile" element={<Profile />} />
          
//           </Route>
//           <Route path="*" element={<Navigate to="/" />} />
//         </>
//       )}
//     </Routes>
//   );
// }

// export default App;

// import { useState } from 'react';
// import './App.css';
// import Login from './pages/Login'; 
// import Home from './pages/Home';


// function App() {
//   const [showDashboard, setShowDashboard] = useState(false);

//   return (
//     <div className="a">
//       {showDashboard ? (
//         <Home />
//       ) : (
//         <Login onSuccess={() => setShowDashboard(true)} />
//       )}
//     </div>
//   );
  
// }

// export default App;
