
import { useState } from 'react';
import './App.css';
import Login from './pages/Login'; 
import Home from './pages/Home';


function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <div className="a">
      {showDashboard ? (
        <Home />
      ) : (
        <Login onSuccess={() => setShowDashboard(true)} />
      )}
    </div>
  );
}

export default App;
