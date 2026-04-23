/**
 * @file server.js
 * @description Punto de entrada del servidor Express.
 * 
 * Responsabilidades:
 * - Configurar middleware (CORS, JSON parsing)
 * - Montar las rutas de la API (/api/auth, /api/tps, /api/health)
 * - Conectar a MongoDB (con conexión cacheada para Vercel serverless)
 * - Exportar `app` y `connectDB` para uso local y serverless
 * 
 * Modos de ejecución:
 * - Local: `node server.js` → escucha en el puerto definido en .env
 * - Serverless: importado por api/index.js → no llama a app.listen()
 */

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const tpRoutes = require('./routes/tps');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskapp';

// ──────────────────────────────────────────────
// Middleware
// ──────────────────────────────────────────────

/** Habilita CORS para permitir requests desde el frontend */
app.use(cors());

/** Parsea el body de requests con Content-Type: application/json */
app.use(express.json());

// ──────────────────────────────────────────────
// Rutas
// ──────────────────────────────────────────────

/** Rutas de autenticación (registro y login) */
app.use('/api/auth', authRoutes);

/** Rutas CRUD de Trabajos Prácticos (protegidas con JWT) */
app.use('/api/tps', tpRoutes);

/**
 * GET /api/health
 * Endpoint de salud para verificar el estado de la conexión a MongoDB.
 * Útil para monitoreo y debugging en producción.
 * 
 * @returns {{ db: "Conectado" | "Desconectado" }}
 */
app.get('/api/health', async (req, res) => {
    const status = mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado';
    res.json({ db: status });
});

// ──────────────────────────────────────────────
// Conexión a MongoDB
// ──────────────────────────────────────────────

/** Flag para evitar reconexiones en entorno serverless (cold starts) */
let isConnected = false;

/**
 * Conecta a MongoDB Atlas/local.
 * La conexión se cachea para que en Vercel serverless no se
 * abra una nueva conexión en cada invocación de la función.
 * 
 * @throws {Error} Si la conexión falla
 */
const connectDB = async () => {
    if (isConnected) return;
    try {
        await mongoose.connect(MONGODB_URI);
        isConnected = true;
        console.log('✅ Conexión exitosa a MongoDB');
    } catch (err) {
        console.error('❌ Error de conexión a MongoDB:', err.message);
        throw err;
    }
};

// ──────────────────────────────────────────────
// Inicialización
// ──────────────────────────────────────────────

/**
 * Si el archivo se ejecuta directamente (no importado como módulo),
 * conecta a la base de datos y levanta el servidor HTTP.
 */
if (require.main === module) {
    connectDB().then(() => {
        app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
    }).catch(() => process.exit(1));
}

/** Exporta para uso en Vercel serverless (api/index.js) */
module.exports = { app, connectDB };
