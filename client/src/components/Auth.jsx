import { useState } from 'react';
import { useToast } from './Toast';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '/api';

const Auth = ({ setToken }) => {
  const toast = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('Completá todos los campos');
      setLoading(false);
      return;
    }

    if (password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      setLoading(false);
      return;
    }

    const endpoint = isLogin ? '/auth/login' : '/auth/register';

    try {
      const { data } = await axios.post(`${API}${endpoint}`, {
        username: username.trim(),
        password
      });

      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        setToken(data.token);
        toast.success(`¡Bienvenido, ${data.username}!`);
      } else {
        toast.success('¡Cuenta creada! Ahora podés iniciar sesión');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      if (err.response) {
        const msg = err.response.data?.error || 'Error del servidor';
        setError(msg);
        toast.error(msg);
      } else if (err.request) {
        setError('No se pudo conectar con el servidor');
        toast.error('Servidor no disponible');
      } else {
        setError('Error inesperado');
        toast.error('Algo salió mal');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <div className="landing-container">
      <div className="landing-content fade-up">
        <div className="hero-section">
          <div className="badge">v1.2.0 — ¡NUEVO DRAG & DROP! 🚀</div>
          <h1 className="hero-title">
            Domina tus <span className="text-gradient">Trabajos Prácticos</span>
          </h1>
          <p className="hero-subtitle">
            La plataforma definitiva para estudiantes universitarios. Organizá tus entregas, 
            personalizá tu entorno y competí sanamente con tus compañeros.
          </p>
          
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">📋</div>
              <div>
                <h3>Seguimiento Inteligente</h3>
                <p>Flujo claro de estados: Presentar → Entregar → Finalizado.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🎨</div>
              <div>
                <h3>Temas Inmersivos</h3>
                <p>Cambiá el estilo con temas Matrix, Neon y Synthwave.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🤝</div>
              <div>
                <h3>Comunidad Social</h3>
                <p>Seguí a tus amigos y compará tu progreso en el ranking.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📱</div>
              <div>
                <h3>Multi-dispositivo</h3>
                <p>Accedé desde tu PC o celular con un diseño responsive premium.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="landing-footer">
          <p>© 2026 TP Tracker — Desarrollado para mentes productivas</p>
        </div>
      </div>

      <div className="auth-section">
        <div className="auth-card glass-card scale-in">
          <div className="auth-logo">
            <div className="logo-icon">📋</div>
            <h1>{isLogin ? 'Bienvenido' : 'Unite a nosotros'}</h1>
            <p>{isLogin ? 'Ingresá tus credenciales para continuar' : 'Completá los datos para crear tu cuenta'}</p>
          </div>

          {error && (
            <div className="error-msg">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Usuario</label>
              <input
                type="text"
                placeholder="Tu nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={loading}
            >
              {loading ? <span className="spinner"></span> : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
            </button>
          </form>

          <div className="auth-toggle">
            {isLogin ? '¿No tenés cuenta? ' : '¿Ya tenés cuenta? '}
            <span onClick={switchMode}>
              {isLogin ? 'Registrate gratis' : 'Iniciá sesión'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
