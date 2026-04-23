# 📋 TP Tracker

Aplicación full-stack para hacer seguimiento de Trabajos Prácticos (TPs) universitarios. Permite registrar, organizar y cambiar el estado de cada TP a través de un flujo claro: **Presentar → Entregar → Finalizado**.

> 📖 **¿Sos nuevo?** Mirá la [Guía de Usuario](./Guia_de_Usuario.md) para aprender a usar la app.

---

## 📸 Características

- **Autenticación segura** — Registro e inicio de sesión con contraseñas hasheadas (bcrypt) y tokens JWT.
- **Búsqueda en tiempo real** — Filtrá tus TPs por título o descripción al instante.
- **Seguimiento visual** — Barra de progreso en cada TP para ver cuánto falta para terminar.
- **Ranking en Tiempo Real** — Leaderboard público que se actualiza cada segundo para ver quién completa más TPs.
- **Flujo de estados** — Cada TP avanza por: `Presentar` → `Entregar` → `Finalizado`.
- **Dashboard con estadísticas** — Contadores en tiempo real por estado.
- **Filtros** — Visualizá solo los TPs del estado que necesitás.
- **Notificaciones toast** — Feedback visual para cada acción (éxito, error, info, advertencia).
- **Diseño premium** — Interfaz glassmorphism con modo oscuro, animaciones fluidas y responsive.
- **Deploy en Vercel** — Configurado para deploy con frontend estático + backend serverless.

---

## 🛠️ Stack Tecnológico

| Capa       | Tecnología                                             |
| ---------- | ------------------------------------------------------ |
| Frontend   | React 19, Vite 8, Framer Motion, Axios                |
| Backend    | Node.js, Express 4                                     |
| Base de datos | MongoDB Atlas (Mongoose 8)                          |
| Auth       | JSON Web Tokens (JWT), bcryptjs                        |
| Deploy     | Vercel (Static + Serverless Functions)                 |
| Estilos    | CSS puro (Glassmorphism, CSS Variables, Responsive)    |

---

## 📁 Estructura del Proyecto

```
Taskapp/
├── api/
│   └── index.js              # Entry point para Vercel Serverless Functions
├── client/                   # Frontend (Vite + React)
│   ├── index.html            # HTML principal con SEO y fuentes
│   ├── vite.config.js        # Configuración de Vite + proxy de desarrollo
│   ├── package.json
│   └── src/
│       ├── main.jsx          # Punto de entrada de React
│       ├── App.jsx           # Componente raíz con auth state y ToastProvider
│       ├── index.css          # Sistema de diseño completo (variables, componentes, responsive)
│       └── components/
│           ├── Auth.jsx      # Formulario de Login / Registro
│           ├── Dashboard.jsx # Panel principal con CRUD de TPs
│           └── Toast.jsx     # Sistema de notificaciones toast
├── server/                   # Backend (Express + MongoDB)
│   ├── server.js             # App Express + conexión MongoDB (exportable para serverless)
│   ├── .env                  # Variables de entorno (NO subir a git)
│   ├── package.json
│   ├── models/
│   │   ├── User.js           # Modelo de usuario (username, password hash)
│   │   └── TP.js             # Modelo de TP (title, description, status, user)
│   └── routes/
│       ├── auth.js           # POST /api/auth/register, POST /api/auth/login
│       └── tps.js            # CRUD: GET, POST, PUT, DELETE /api/tps
├── vercel.json               # Configuración de deploy en Vercel
├── .gitignore
├── package.json              # Package raíz (scripts de desarrollo)
└── README.md                 # ← Este archivo
```

---

## 🚀 Instalación y Desarrollo Local

### Prerequisitos

- [Node.js](https://nodejs.org/) v18 o superior
- [MongoDB](https://www.mongodb.com/) local o una cuenta de [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/tp-tracker.git
cd tp-tracker
```

### 2. Instalar dependencias

```bash
# Dependencias del root (concurrently)
npm install

# Dependencias del servidor
cd server && npm install

# Dependencias del cliente
cd ../client && npm install
```

### 3. Configurar variables de entorno

Crear el archivo `server/.env`:

```env
MONGODB_URI=mongodb+srv://<usuario>:<contraseña>@<cluster>.mongodb.net/<database>
JWT_SECRET=tu_clave_secreta_super_segura
PORT=5000
```

> ⚠️ **Nunca subas el archivo `.env` a git.** Ya está incluido en `.gitignore`.

### 4. Iniciar en modo desarrollo

Desde la raíz del proyecto:

```bash
npm run dev
```

Esto levanta simultáneamente:
- **Backend** en `http://localhost:5000`
- **Frontend** en `http://localhost:5173` (con proxy automático a `/api`)

---

## 📡 API Reference

Todos los endpoints están bajo `/api`. Las rutas protegidas requieren el header:

```
Authorization: Bearer <token>
```

### Autenticación

| Método | Ruta                  | Body                              | Respuesta                            |
| ------ | --------------------- | --------------------------------- | ------------------------------------ |
| POST   | `/api/auth/register`  | `{ username, password }`          | `201` `{ message }`                  |
| POST   | `/api/auth/login`     | `{ username, password }`          | `200` `{ token, username }`          |

### Trabajos Prácticos (requiere autenticación)

| Método | Ruta              | Body                                           | Respuesta                   |
| ------ | ----------------- | ---------------------------------------------- | --------------------------- |
| GET    | `/api/tps`        | —                                              | `200` `[{ tp }, ...]`       |
| GET    | `/api/tps/ranking`| —                                              | `200` `[{ user, stats }, ...]`|
| POST   | `/api/tps`        | `{ title, description?, status?, dueDate? }`   | `201` `{ tp }`              |
| PUT    | `/api/tps/:id`    | `{ title?, description?, status?, dueDate? }`  | `200` `{ tp }`              |
| DELETE | `/api/tps/:id`    | —                                              | `200` `{ message }`         |

### Health Check

| Método | Ruta             | Respuesta                           |
| ------ | ---------------- | ----------------------------------- |
| GET    | `/api/health`    | `200` `{ db: "Conectado" }`         |

### Estados válidos para un TP

| Estado        | Significado                             |
| ------------- | --------------------------------------- |
| `Presentar`   | El TP está pendiente, aún no se presentó |
| `Entregar`    | El TP se presentó, falta entregarlo      |
| `Finalizado`  | El TP está completado                    |

---

## 🗄️ Modelos de Base de Datos

### User

| Campo      | Tipo     | Requerido | Notas                                  |
| ---------- | -------- | --------- | -------------------------------------- |
| `username` | String   | Sí        | Único                                  |
| `password` | String   | Sí        | Hasheado con bcrypt (10 salt rounds)   |

### TP

| Campo         | Tipo     | Requerido | Default       | Notas                                  |
| ------------- | -------- | --------- | ------------- | -------------------------------------- |
| `title`       | String   | Sí        | —             | Nombre del trabajo práctico            |
| `description` | String   | No        | —             | Materia o descripción adicional        |
| `status`      | String   | No        | `"Presentar"` | Enum: Presentar, Entregar, Finalizado  |
| `dueDate`     | Date     | No        | —             | Fecha de vencimiento                   |
| `user`        | ObjectId | Sí        | —             | Referencia al usuario dueño            |
| `createdAt`   | Date     | Auto      | —             | Timestamp automático de Mongoose       |
| `updatedAt`   | Date     | Auto      | —             | Timestamp automático de Mongoose       |

---

## 🌐 Deploy en Vercel

### 1. Subí el proyecto a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/tp-tracker.git
git push -u origin main
```

### 2. Importar en Vercel

1. Andá a [vercel.com/new](https://vercel.com/new)
2. Importá tu repositorio de GitHub
3. Vercel va a detectar automáticamente la configuración de `vercel.json`

### 3. Configurar Environment Variables

En el panel de Vercel, agregá:

| Variable       | Valor                                         |
| -------------- | --------------------------------------------- |
| `MONGODB_URI`  | Tu connection string de MongoDB Atlas          |
| `JWT_SECRET`   | Una clave secreta larga y aleatoria            |

### 4. Deploy

Click en **Deploy**. Vercel va a:
1. Instalar dependencias del cliente y servidor
2. Ejecutar `npm run build` en `/client`
3. Servir el frontend estático desde `client/dist`
4. Rutear todas las requests a `/api/*` hacia la función serverless en `api/index.js`

### Cómo funciona el deploy

```
vercel.json
  ├── buildCommand: "cd client && npm install && npm run build"
  ├── outputDirectory: "client/dist"         ← Frontend estático
  └── rewrites: /api/* → api/index.js        ← Backend serverless
         │
         └── api/index.js
               ├── connectDB()               ← Conexión cacheada a MongoDB
               └── app(req, res)             ← Express maneja la request
```

---

## 🧩 Arquitectura del Frontend

### Flujo de autenticación

```
App.jsx
 ├── token en localStorage? 
 │    ├── Sí  → <Dashboard />
 │    └── No  → <Auth />
 │
 └── <ToastProvider>  ← Envuelve toda la app para notificaciones
```

### Sistema de Toasts

El componente `Toast.jsx` expone un hook `useToast()` que retorna:

```js
const toast = useToast();

toast.success('Mensaje de éxito');    // ✅ Verde
toast.error('Mensaje de error');      // ❌ Rojo
toast.info('Mensaje informativo');    // ℹ️ Azul
toast.warning('Mensaje de alerta');   // ⚠️ Amarillo
```

Cada toast se auto-elimina después de 3.5 segundos e incluye una barra de progreso animada.

### Sistema de diseño (CSS)

Todo el diseño se basa en CSS Variables definidas en `index.css`:

```css
--primary: #6366f1;      /* Indigo principal */
--accent: #f43f5e;       /* Rosa para acciones peligrosas */
--success: #10b981;      /* Verde para "Finalizado" */
--warning: #f59e0b;      /* Amarillo para "Presentar" */
--bg-primary: #0a0a0f;   /* Fondo oscuro */
--glass: rgba(255, 255, 255, 0.05);  /* Efecto glassmorphism */
```

Breakpoints responsive:
- `768px` — Layout mobile (grids de 1 columna, header apilado)
- `480px` — Extra small (stats en 1 columna, toasts full-width)

---

## 🔒 Seguridad

- Las contraseñas se hashean con **bcrypt** (10 salt rounds) antes de guardarlas.
- Los tokens JWT expiran en **1 hora**.
- Cada ruta de TPs valida que el usuario autenticado sea el dueño del recurso.
- El archivo `.env` está excluido del control de versiones.

---

## 📄 Licencia

MIT — Usá el código como quieras.
