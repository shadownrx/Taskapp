import { useState, useEffect, useCallback } from 'react';
import { useToast } from './Toast';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import Ranking from './Ranking';

const API = import.meta.env.VITE_API_URL || '/api';

const STATUSES = ['Presentar', 'Entregar', 'Finalizado'];
const STATUS_ICONS = { Presentar: '📝', Entregar: '📤', Finalizado: '✅' };
const STATUS_NEXT = { Presentar: 'Entregar', Entregar: 'Finalizado', Finalizado: 'Presentar' };
const APP_VERSION = '1.2.0';
const THEMES = ['default', 'matrix', 'neon', 'synthwave', '90s'];
const THEME_ICONS = { default: '✨', matrix: '🕶️', neon: '🌃', synthwave: '🌅', '90s': '💾' };

const Dashboard = ({ token, logout }) => {
  const toast = useToast();
  const [tps, setTps] = useState([]);
  const [filter, setFilter] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTp, setNewTp] = useState({ title: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(localStorage.getItem('username') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || 'Usuario');
  const [theme, setTheme] = useState(localStorage.getItem('app_theme') || 'default');

  const authHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  const fetchTps = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/tps`, authHeaders());
      setTps(data);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Sesión expirada, volvé a iniciar sesión');
        logout();
      } else {
        toast.error('Error al cargar los TPs');
      }
    } finally {
      setLoading(false);
    }
  }, [authHeaders, logout, toast]);

  useEffect(() => { fetchTps(); }, [fetchTps]);

  useEffect(() => {
    const lastVersion = localStorage.getItem('app_version');
    if (lastVersion !== APP_VERSION) {
      setTimeout(() => {
        toast.info(`🚀 ¡Nueva versión disponible (v${APP_VERSION})!`, {
          description: 'Ahora podés arrastrar tus TPs para cambiar su estado.'
        });
        localStorage.setItem('app_version', APP_VERSION);
      }, 1500);
    }
  }, [toast]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTp.title.trim()) {
      toast.warning('Ponele un título al TP');
      return;
    }
    setCreating(true);
    try {
      await axios.post(`${API}/tps`, {
        title: newTp.title.trim(),
        description: newTp.description.trim(),
        status: 'Presentar'
      }, authHeaders());
      setNewTp({ title: '', description: '' });
      toast.success(`TP "${newTp.title.trim()}" agregado`);
      fetchTps();
    } catch (err) {
      toast.error('Error al crear el TP');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (id, currentStatus, forcedStatus = null) => {
    const nextStatus = forcedStatus || STATUS_NEXT[currentStatus];
    if (nextStatus === currentStatus) return;
    
    setTps(prev => prev.map(tp => tp._id === id ? { ...tp, status: nextStatus } : tp));
    try {
      await axios.put(`${API}/tps/${id}`, { status: nextStatus }, authHeaders());
      toast.info(`Estado cambiado a "${nextStatus}"`);
    } catch (err) {
      toast.error('Error al actualizar estado');
      fetchTps();
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que querés eliminar este TP?')) return;
    const deleted = tps.find(tp => tp._id === id);
    setTps(prev => prev.filter(tp => tp._id !== id));
    try {
      await axios.delete(`${API}/tps/${id}`, authHeaders());
      toast.success(`"${deleted?.title}" eliminado`);
    } catch (err) {
      toast.error('Error al eliminar');
      fetchTps();
    }
  };

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    if (!newUsername.trim() || newUsername.trim() === username) {
      setEditingUsername(false);
      return;
    }
    try {
      await axios.put(`${API}/auth/username`, { newUsername: newUsername.trim() }, authHeaders());
      localStorage.setItem('username', newUsername.trim());
      setUsername(newUsername.trim());
      setEditingUsername(false);
      toast.success('Nombre de usuario actualizado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar nombre');
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('app_theme', newTheme);
    toast.info(`Tema cambiado a "${newTheme}"`);
  };

  const filteredTps = tps
    .filter(tp => filter === 'Todos' || tp.status === filter)
    .filter(tp => 
      tp.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (tp.description && tp.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const counts = {
    Presentar: tps.filter(t => t.status === 'Presentar').length,
    Entregar: tps.filter(t => t.status === 'Entregar').length,
    Finalizado: tps.filter(t => t.status === 'Finalizado').length,
  };

  const formatDate = (d) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={`dashboard ${theme !== 'default' ? `theme-${theme}` : ''}`}>
      {/* Header */}
      <header className="dashboard-header fade-up">
        <div className="brand">
          <div className="logo-sm">📋</div>
          <h1>TP Tracker</h1>
          
          <div className="theme-selector">
            {THEMES.map(t => (
              <button 
                key={t}
                className={`theme-btn ${theme === t ? 'active' : ''}`}
                onClick={() => handleThemeChange(t)}
                title={`Tema ${t}`}
              >
                {THEME_ICONS[t]}
              </button>
            ))}
          </div>
        </div>
        <div className="user-info">
          {editingUsername ? (
            <form onSubmit={handleUpdateUsername} className="edit-username-form">
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                autoFocus
                onBlur={() => !newUsername.trim() && setEditingUsername(false)}
                className="edit-username-input"
              />
              <button type="submit" className="btn btn-primary btn-xs">OK</button>
            </form>
          ) : (
            <>
              <div className="user-avatar">{username[0]}</div>
              <span className="user-name" onClick={() => setEditingUsername(true)} title="Clic para cambiar nombre">
                {username} ✏️
              </span>
            </>
          )}
          <button onClick={logout} className="btn btn-ghost btn-sm">Salir</button>
        </div>
      </header>

      {/* Stats */}
      <div className="stats-row fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="glass-card stat-card stat-presentar">
          <div className="stat-number">{counts.Presentar}</div>
          <div className="stat-label">📝 Presentar</div>
        </div>
        <div className="glass-card stat-card stat-entregar">
          <div className="stat-number">{counts.Entregar}</div>
          <div className="stat-label">📤 Entregar</div>
        </div>
        <div className="glass-card stat-card stat-finalizado">
          <div className="stat-number">{counts.Finalizado}</div>
          <div className="stat-label">✅ Finalizado</div>
        </div>
      </div>

      {/* Create */}
      <div className="glass-card create-section fade-up" style={{ animationDelay: '0.2s' }}>
        <h3>➕ Nuevo TP</h3>
        <form onSubmit={handleCreate} className="create-form">
          <div className="input-group">
            <label>Título</label>
            <input
              type="text"
              placeholder="Ej: TP Final Matemática"
              value={newTp.title}
              onChange={(e) => setNewTp({ ...newTp, title: e.target.value })}
              disabled={creating}
              required
            />
          </div>
          <div className="input-group">
            <label>Materia / Descripción</label>
            <input
              type="text"
              placeholder="Ej: Análisis Matemático II"
              value={newTp.description}
              onChange={(e) => setNewTp({ ...newTp, description: e.target.value })}
              disabled={creating}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? <span className="spinner"></span> : 'Agregar'}
          </button>
        </form>
      </div>

      {/* Filter & Search */}
      <div className="filter-bar fade-up" style={{ animationDelay: '0.3s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['Todos', ...STATUSES].map(s => (
            <button
              key={s}
              className={`filter-btn ${filter === s ? 'active' : ''}`}
              onClick={() => setFilter(s)}
            >
              {s === 'Todos' ? '🔵' : STATUS_ICONS[s]} {s} {s !== 'Todos' && `(${counts[s]})`}
            </button>
          ))}
        </div>
        
        <div className="search-box" style={{ maxWidth: '250px', width: '100%' }}>
          <input 
            type="text" 
            placeholder="🔍 Buscar TP..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* TP Grid */}
      {loading ? (
        <div className="tp-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card tp-card skeleton" style={{ height: '180px' }}></div>
          ))}
        </div>
      ) : filteredTps.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>{filter === 'Todos' ? 'No tenés TPs todavía' : `No hay TPs con estado "${filter}"`}</h3>
          <p>Agregá uno nuevo arriba para empezar a organizarte</p>
        </div>
      ) : (
        <div className="tp-grid">
          <AnimatePresence mode="popLayout">
            {filteredTps.map((tp, i) => (
              <motion.div
                key={tp._id}
                layout
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                dragElastic={0.1}
                dragSnapToOrigin
                onDragStart={() => setIsDragging(true)}
                onDragEnd={(e, info) => {
                  setIsDragging(false);
                  const y = info.point.y;
                  const viewportHeight = window.innerHeight;
                  // Si se suelta cerca del fondo (donde estarán las zonas)
                  if (y > viewportHeight - 150) {
                    const x = info.point.x;
                    const width = window.innerWidth;
                    if (x < width / 3) handleStatusChange(tp._id, tp.status, 'Presentar');
                    else if (x < (width / 3) * 2) handleStatusChange(tp._id, tp.status, 'Entregar');
                    else handleStatusChange(tp._id, tp.status, 'Finalizado');
                  }
                }}
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileDrag={{ scale: 1.05, zIndex: 10, boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="glass-card tp-card"
                style={{ cursor: 'grab' }}
              >
                <div className="tp-card-header">
                  <h3>{tp.title}</h3>
                  <span className={`status-badge status-${tp.status.toLowerCase()}`}>
                    {STATUS_ICONS[tp.status]} {tp.status}
                  </span>
                </div>

                <div className="tp-card-body">
                  <p>{tp.description}</p>
                  
                  <div className="tp-progress-container" style={{ marginTop: '12px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div 
                      className="tp-progress-bar" 
                      style={{ 
                        height: '100%', 
                        width: tp.status === 'Presentar' ? '33%' : tp.status === 'Entregar' ? '66%' : '100%',
                        background: tp.status === 'Presentar' ? 'var(--warning)' : tp.status === 'Entregar' ? 'var(--primary)' : 'var(--success)',
                        transition: 'width 0.5s ease'
                      }}
                    />
                  </div>
                </div>

                {tp.createdAt && (
                  <div className="tp-card-date">
                    🕐 Creado: {formatDate(tp.createdAt)}
                  </div>
                )}

                <div className="tp-card-footer">
                  <button
                    onClick={() => handleStatusChange(tp._id, tp.status)}
                    className="btn btn-ghost btn-sm"
                  >
                    → {STATUS_NEXT[tp.status]}
                  </button>
                  <button
                    onClick={() => handleDelete(tp._id)}
                    className="btn btn-danger btn-icon btn-sm"
                    title="Eliminar TP"
                  >
                    🗑️
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Ranking */}
      <Ranking token={token} />

      {/* Drag Drop Zones Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="drop-zones-overlay"
          >
            <div className="drop-zone drop-presentar"><span>📝</span> Mover a Presentar</div>
            <div className="drop-zone drop-entregar"><span>📤</span> Mover a Entregar</div>
            <div className="drop-zone drop-finalizado"><span>✅</span> Mover a Finalizado</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
