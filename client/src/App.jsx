import { useState } from 'react';
import { ToastProvider } from './components/Toast';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
  };

  return (
    <ToastProvider>
      {token ? (
        <Dashboard token={token} logout={logout} />
      ) : (
        <Auth setToken={setToken} />
      )}
    </ToastProvider>
  );
}

export default App;
