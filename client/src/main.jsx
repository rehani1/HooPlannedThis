
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { AuthContext } from './AuthContext';
import App from './App.jsx';
import './index.css';
import './styles/root.css';

export function Root() {

  const [isAuth, setIsAuth] = useState(Boolean(localStorage.getItem('token')));

  useEffect(() => {
    const syncAuth = () => setIsAuth(Boolean(localStorage.getItem('token')));
    window.addEventListener('storage', syncAuth);
    return () => window.removeEventListener('storage', syncAuth);
  }, []);

  return (
    <StrictMode>
      <BrowserRouter>
        <AuthContext.Provider value={{ isAuth, setIsAuth }}>
          <App />
        </AuthContext.Provider>
      </BrowserRouter>
    </StrictMode>
  );
}

createRoot(document.getElementById('root')).render(<Root />);
