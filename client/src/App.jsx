
import { useState } from 'react';
import './App.css';
import Home from './Home';
import Login from './login';

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
