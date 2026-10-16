# Rondines Grupo ATA — Plan de Desarrollo

## Descripción
App para rondines de vigilancia con escaneo QR y GPS en tiempo real.

## Servidor
- **Hetzner VPS**: `62.238.3.136`
- **Dominio**: `seguridadgrupoata.com`
- **Usuario SSH**: `root`

## Arquitectura

### App móvil (React Native + Expo)
- Login de guardia
- Escaneo de QR con cámara
- Captura automática de GPS al escanear
- Bitácora local + sincronización

### Backend (Node.js + Express + PostgreSQL)
- API REST para registrar escaneos
- Gestión de guardias, puntos de rondín y rutas
- Sistema de alertas por tiempo excedido

### Panel web para supervisores (React)
- Mapa en tiempo real de rondines
- Historial y reportes
- Configuración de puntos QR y alertas

## Plan de desarrollo por fases

| Fase | Qué construimos |
|------|----------------|
| 1 | Backend + base de datos + API |
| 2 | App móvil: login + escaneo QR + GPS |
| 3 | Panel web: mapa + bitácora |
| 4 | Alertas automáticas |

## Estado actual
- Código original en servidor Hetzner (`62.238.3.136`)
- Pendiente: recuperar acceso SSH y bajar archivos
