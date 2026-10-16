# 🛡️ Rondines App — Backend

API REST para la aplicación de rondines de guardias de seguridad.

## 🛠️ Tecnologías
- **Node.js + Express** — Servidor API
- **PostgreSQL** — Base de datos
- **JWT** — Autenticación
- **node-cron** — Alertas automáticas

---

## 🚀 Instalación

### 1. Requisitos previos
- Node.js v18+
- PostgreSQL 14+

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL
```

### 4. Crear base de datos
```sql
-- En PostgreSQL:
CREATE DATABASE rondines_db;
```

### 5. Ejecutar migraciones
```bash
npm run migrate
```

### 6. Insertar datos de prueba (opcional)
```bash
npm run seed
```

### 7. Iniciar servidor
```bash
# Desarrollo (con hot-reload)
npm run dev

# Producción
npm start
```

---

## 📋 Endpoints principales

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| POST | `/api/auth/login` | Iniciar sesión | Todos |
| POST | `/api/turnos/iniciar` | Iniciar turno | Guardia |
| PUT | `/api/turnos/terminar` | Terminar turno | Guardia |
| POST | `/api/escaneos` | Registrar escaneo QR | Guardia |
| GET | `/api/escaneos/mis-escaneos` | Ver mis escaneos del día | Guardia |
| POST | `/api/alertas/sos` | Enviar alerta de emergencia | Guardia |
| GET | `/api/alertas` | Ver alertas | Supervisor/Admin |
| GET | `/api/reportes/resumen` | Resumen del día | Supervisor/Admin |
| GET | `/api/reportes/actividad-tiempo-real` | Guardias activos | Supervisor/Admin |
| POST | `/api/puntos` | Crear punto de rondín | Supervisor/Admin |

---

## 🔑 Autenticación

Todas las rutas (excepto login) requieren el header:
```
Authorization: Bearer <token>
```

---

## 📊 Estructura de la BD

```
usuarios          → Guardias y supervisores
sitios            → Instalaciones/empresas
puntos_rondin     → Puntos de control con QR
rutas             → Secuencia de puntos
ruta_puntos       → Relación ruta-puntos
turnos            → Turnos de trabajo
escaneos          → Registro de cada QR escaneado (con GPS)
alertas           → Alertas automáticas y manuales (SOS)
```

---

## 🔔 Alertas automáticas

El sistema genera alertas automáticamente cuando:
- Un guardia no escanea en X minutos (configurable en `.env`)
- Un escaneo ocurre fuera del rango GPS del punto
- El guardia envía una alerta SOS manual
