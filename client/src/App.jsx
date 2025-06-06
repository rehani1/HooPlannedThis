
import { useState } from 'react';
import './App.css';
import Dashboard from './Dashboard';
import Login from './login';

function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <div className="a">
      {showDashboard ? (
        <Dashboard />
      ) : (
        <Login onSuccess={() => setShowDashboard(true)} />
      )}
    </div>
  );
}

export default App;
