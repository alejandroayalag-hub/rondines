# 📱 Rondines App — Móvil (React Native + Expo)

App Android para guardias de seguridad con escaneo de QR y geolocalización.

## 🛠️ Tecnologías
- **React Native + Expo** (SDK 51)
- **expo-camera** — Escaneo de QR
- **expo-location** — GPS
- **expo-haptics** — Vibración táctil
- **React Navigation** — Navegación
- **Axios** — Comunicación con el backend

---

## 🚀 Instalación

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar URL del backend
Editar `src/services/api.js`:
```js
const API_BASE_URL = 'http://TU_IP_LOCAL:3000/api';
// Ejemplo: 'http://192.168.1.50:3000/api'
```
> ⚠️ Usa la IP local de tu servidor, no localhost (el teléfono no puede acceder a localhost de tu PC).

### 3. Iniciar en modo desarrollo
```bash
npx expo start
# Escanea el QR con la app Expo Go en tu teléfono Android
```

### 4. Generar APK para instalar
```bash
# Instala EAS CLI
npm install -g eas-cli

# Inicia sesión en Expo
eas login

# Construir APK
eas build --platform android --profile preview
```

---

## 📱 Pantallas

| Pantalla | Descripción |
|----------|-------------|
| **Login** | Autenticación con email y contraseña |
| **Inicio** | Estado del turno, escaneos del día, acciones rápidas |
| **Scanner** | Cámara para escanear QR + validación GPS |
| **SOS** | Botón de alerta de emergencia |
| **Historial** | Bitácora de escaneos por día |

---

## 🗂️ Estructura del proyecto

```
mobile/
├── App.js                        ← Entry point
├── app.json                      ← Config Expo
└── src/
    ├── context/
    │   └── AuthContext.js        ← Sesión global
    ├── navigation/
    │   └── AppNavigator.js       ← Rutas y tabs
    ├── screens/
    │   ├── LoginScreen.js
    │   ├── HomeScreen.js
    │   ├── ScannerScreen.js      ← QR + GPS (pantalla principal)
    │   ├── SOSScreen.js
    │   └── HistorialScreen.js
    ├── services/
    │   └── api.js                ← Llamadas al backend
    └── theme/
        └── tokens.js             ← Colores, tipografía, espaciado
```

---

## 🔐 Permisos requeridos (Android)
- `CAMERA` — Para escanear códigos QR
- `ACCESS_FINE_LOCATION` — Para verificar ubicación GPS
- `VIBRATE` — Para feedback háptico

---

## 📋 Flujo del guardia

1. **Login** con credenciales
2. **Iniciar turno** desde la pantalla de inicio
3. **Escanear QR** en cada punto de rondín → se registra automáticamente la ubicación GPS
4. Si el GPS no coincide con el punto → se genera alerta automática
5. En caso de emergencia → botón **SOS**
6. Al finalizar → **Terminar turno**
