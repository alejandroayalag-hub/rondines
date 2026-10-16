# 🖥️ Rondines Panel — Supervisores (React Web)

Panel web para supervisores con mapa en tiempo real, alertas y reportes.

## 🛠️ Tecnologías
- **React 18** — Framework UI
- **React Router v6** — Navegación SPA
- **React Leaflet** — Mapa interactivo (OpenStreetMap)
- **Recharts** — Gráficas de reportes
- **CSS Modules** — Estilos encapsulados
- **Axios** — Comunicación con el backend

---

## 🚀 Instalación

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar URL del backend
Crea un archivo `.env` en la raíz:
```env
REACT_APP_API_URL=http://localhost:3000/api
```

### 3. Iniciar en desarrollo
```bash
npm start
# Abre http://localhost:3001
```

### 4. Compilar para producción
```bash
npm run build
# Genera la carpeta /build lista para servidor
```

---

## 🗂️ Estructura del proyecto

```
panel/
├── public/
│   └── index.html
└── src/
    ├── App.js                    ← Router principal
    ├── index.js                  ← Entry point
    ├── index.css                 ← Estilos globales + variables CSS
    ├── context/
    │   └── AuthContext.js        ← Sesión en localStorage
    ├── services/
    │   └── api.js                ← Llamadas al backend
    ├── components/
    │   ├── Layout.js             ← Wrapper con sidebar
    │   └── Sidebar.js            ← Navegación lateral
    └── pages/
        ├── Login.js              ← Autenticación
        ├── Dashboard.js          ← Centro de control (inicio)
        ├── Mapa.js               ← Mapa en tiempo real + Leaflet
        ├── Alertas.js            ← Gestión de alertas
        ├── Reportes.js           ← Gráficas y bitácora
        └── Puntos.js             ← Alta y gestión de puntos QR
```

---

## 📱 Páginas del panel

| Página | Ruta | Descripción |
|--------|------|-------------|
| **Centro de Control** | `/` | KPIs del día, guardias activos, alertas recientes |
| **Mapa en Vivo** | `/mapa` | Mapa OpenStreetMap con puntos QR y estado de guardias |
| **Alertas** | `/alertas` | Tabla filtrable de alertas, resolución con un clic |
| **Reportes** | `/reportes` | Gráficas 7 días, historial de turnos |
| **Puntos QR** | `/puntos` | Alta de puntos, visualización de códigos QR |

---

## 🔄 Auto-actualización

El panel se actualiza automáticamente cada 30 segundos sin necesidad de recargar la página.

---

## 🎨 Diseño

Estética industrial-táctica: fondo negro azulado con rejilla sutil, fuente monospace para datos críticos, acentos en verde fosforescente. Inspirado en salas de control militares.
