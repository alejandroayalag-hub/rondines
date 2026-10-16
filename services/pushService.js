/**
 * pushService.js
 * Servicio de notificaciones push usando la API gratuita de Expo.
 * No requiere Firebase ni APNs directamente — Expo actúa como proxy.
 *
 * Flujo:
 *  1. La app móvil registra su ExpoPushToken al hacer login
 *  2. El backend guarda el token en la tabla `push_tokens`
 *  3. Este servicio envía notificaciones usando https://exp.host/--/api/v2/push/send
 */

const https = require('https');

const EXPO_PUSH_URL = 'exp.host';
const EXPO_PUSH_PATH = '/--/api/v2/push/send';

/**
 * Envía una notificación push a uno o varios tokens Expo.
 * @param {string|string[]} tokens  - ExpoPushToken(s)
 * @param {string} title            - Título de la notificación
 * @param {string} body             - Cuerpo del mensaje
 * @param {object} data             - Datos extra (opcional)
 * @param {string} sound            - 'default' | null
 * @param {string} priority         - 'default' | 'normal' | 'high'
 */
async function enviarPush(tokens, title, body, data = {}, sound = 'default', priority = 'high') {
  const tokenArray = Array.isArray(tokens) ? tokens : [tokens];

  // Filtra tokens válidos (deben empezar con ExponentPushToken o ExpoPushToken)
  const validos = tokenArray.filter(t => t && (t.startsWith('ExponentPushToken') || t.startsWith('ExpoPushToken')));
  if (validos.length === 0) return { enviados: 0, errores: ['Sin tokens válidos'] };

  const mensajes = validos.map(to => ({
    to,
    title,
    body,
    data,
    sound,
    priority,
    channelId: 'rondines-alertas', // canal Android
  }));

  return new Promise((resolve) => {
    const payload = JSON.stringify(mensajes);

    const options = {
      hostname: EXPO_PUSH_URL,
      path: EXPO_PUSH_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          const errores = (parsed.data || [])
            .filter(r => r.status === 'error')
            .map(r => r.message);

          console.log(`📲 Push enviado → ${validos.length} dispositivo(s). Errores: ${errores.length}`);
          resolve({ enviados: validos.length - errores.length, errores });
        } catch (e) {
          resolve({ enviados: 0, errores: [e.message] });
        }
      });
    });

    req.on('error', (e) => {
      console.error('Error enviando push:', e.message);
      resolve({ enviados: 0, errores: [e.message] });
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Notificación predefinida: Guardia sin escanear
 */
async function notificarSinEscaneo(tokens, guardiaNombre, minutosTranscurridos) {
  return enviarPush(
    tokens,
    '⚠️ Guardia sin actividad',
    `${guardiaNombre} lleva ${minutosTranscurridos} min sin escanear ningún punto.`,
    { tipo: 'no_escaneo', guardia: guardiaNombre },
    'default',
    'high'
  );
}

/**
 * Notificación predefinida: Alerta SOS
 */
async function notificarSOS(tokens, guardiaNombre, mensaje) {
  return enviarPush(
    tokens,
    '🆘 ALERTA SOS',
    `${guardiaNombre} solicita ayuda urgente. ${mensaje || ''}`.trim(),
    { tipo: 'sos', guardia: guardiaNombre },
    'default',
    'high'
  );
}

/**
 * Notificación predefinida: Escaneo fuera de rango GPS
 */
async function notificarFueraDeRango(tokens, guardiaNombre, puntoNombre, distanciaMetros) {
  return enviarPush(
    tokens,
    '📍 Escaneo fuera de rango',
    `${guardiaNombre} escaneó "${puntoNombre}" a ${distanciaMetros}m del punto esperado.`,
    { tipo: 'fuera_de_rango', guardia: guardiaNombre },
    'default',
    'normal'
  );
}

module.exports = {
  enviarPush,
  notificarSinEscaneo,
  notificarSOS,
  notificarFueraDeRango,
};
