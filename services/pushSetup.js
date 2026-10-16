/**
 * pushSetup.js
 * Registra el ExpoPushToken del dispositivo en el backend
 * al iniciar sesión. Llamar desde AuthContext después del login.
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';

// Configuración global: cómo mostrar notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Solicita permisos, obtiene el ExpoPushToken y lo registra en el backend.
 * @returns {string|null} token registrado o null si falló
 */
export async function registrarPushToken() {
  // Solo funciona en dispositivos físicos (no en simuladores)
  if (!Device.isDevice) {
    console.log('Push notifications solo funcionan en dispositivos físicos');
    return null;
  }

  try {
    // Verificar/solicitar permisos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permiso de notificaciones denegado');
      return null;
    }

    // Crear canal de notificaciones en Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('rondines-alertas', {
        name: 'Alertas de Rondines',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00FF88',
        sound: 'default',
        enableVibrate: true,
      });
    }

    // Obtener el Expo Push Token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'tu-project-id-de-expo', // Reemplaza con tu ID de proyecto Expo
    });

    const token = tokenData.data;
    console.log('ExpoPushToken obtenido:', token);

    // Registrar en el backend
    await api.post('/push/registrar', {
      token,
      plataforma: Platform.OS,
    });

    console.log('Push token registrado en el servidor');
    return token;
  } catch (err) {
    console.error('Error registrando push token:', err.message);
    return null;
  }
}

/**
 * Elimina el token del backend al cerrar sesión.
 */
export async function removerPushToken() {
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'tu-project-id-de-expo',
    });
    await api.delete('/push/remover', { data: { token: tokenData.data } });
    console.log('Push token removido del servidor');
  } catch (err) {
    console.error('Error removiendo push token:', err.message);
  }
}

/**
 * Escucha notificaciones push mientras la app está abierta.
 * Devuelve una función de cleanup para usar en useEffect.
 * 
 * Uso:
 *   useEffect(() => {
 *     return escucharNotificaciones((notif) => console.log(notif));
 *   }, []);
 */
export function escucharNotificaciones(onNotificacion) {
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    const { title, body, data } = notification.request.content;
    console.log('Notificación recibida:', title, body, data);
    if (onNotificacion) onNotificacion({ title, body, data });
  });

  return () => subscription.remove();
}
