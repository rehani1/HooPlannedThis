
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { AuthContext } from './AuthContext';   // ⬅️ context you created
import App from './App.jsx';
import './index.css';

function Root() {

  const [isAuth, setIsAuth] = useState(Boolean(localStorage.getItem('token')));

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
