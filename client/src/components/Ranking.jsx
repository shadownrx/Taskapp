import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL || '/api';

const MEDALS = ['🥇', '🥈', '🥉'];
const REFRESH_INTERVAL = 1000; // 1 segundo

/**
 * Componente Ranking
 * Muestra un leaderboard de usuarios ordenados por TPs finalizados.
 * Se actualiza automáticamente cada 60 segundos.
 */
const Ranking = ({ token }) => {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(60);

  const fetchRanking = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/tps/ranking`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRanking(data);
    } catch (err) {
      console.error('Error fetching ranking:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch inicial + intervalo de 60s
  useEffect(() => {
    fetchRanking();
    const interval = setInterval(() => {
      fetchRanking();
      setCountdown(60);
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchRanking]);

  // Countdown visual
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="glass-card ranking-section" style={{ textAlign: 'center', padding: '40px' }}>
        <span className="spinner" style={{ width: 24, height: 24 }}></span>
      </div>
    );
  }

  return (
    <div className="glass-card ranking-section fade-up" style={{ animationDelay: '0.35s' }}>
      <div className="ranking-header">
        <h3>🏆 Ranking de TPs</h3>
        <span className="ranking-refresh">
          🟢 En vivo
        </span>
      </div>

      {ranking.length === 0 ? (
        <div className="ranking-empty">
          <p>No hay datos de ranking todavía</p>
        </div>
      ) : (
        <div className="ranking-table">
          <div className="ranking-row ranking-row-header">
            <span className="ranking-pos">#</span>
            <span className="ranking-user">Usuario</span>
            <span className="ranking-stat ranking-stat-warn">📝</span>
            <span className="ranking-stat ranking-stat-info">📤</span>
            <span className="ranking-stat ranking-stat-ok">✅</span>
            <span className="ranking-total">Total</span>
          </div>

          <AnimatePresence>
            {ranking.map((user, i) => (
              <motion.div
                key={user.username}
                className={`ranking-row ${i < 3 ? 'ranking-row-top' : ''}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                layout
              >
                <span className="ranking-pos">
                  {i < 3 ? MEDALS[i] : i + 1}
                </span>
                <span className="ranking-user">
                  <span className="ranking-avatar" style={{
                    background: i === 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' :
                      i === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' :
                        i === 2 ? 'linear-gradient(135deg, #d97706, #b45309)' :
                          'linear-gradient(135deg, var(--primary-dark), var(--primary))'
                  }}>
                    {user.username[0].toUpperCase()}
                  </span>
                  {user.username}
                </span>
                <span className="ranking-stat ranking-stat-warn">{user.presentar}</span>
                <span className="ranking-stat ranking-stat-info">{user.entregar}</span>
                <span className="ranking-stat ranking-stat-ok">{user.finalizado}</span>
                <span className="ranking-total">{user.total}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Ranking;
