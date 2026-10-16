import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { pushAPI } from './api';

// Mostrar notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registrarPushToken() {
  if (!Device.isDevice) return null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

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

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'c8f1aaa7-8ac8-463e-9c8c-093a5d03fc88',
    });
    const token = tokenData.data;

    await pushAPI.registrar(token, Platform.OS);
    return token;
  } catch (err) {
    console.error('Error registrando push token:', err.message);
    return null;
  }
}

export async function removerPushToken() {
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'c8f1aaa7-8ac8-463e-9c8c-093a5d03fc88',
    });
    await pushAPI.remover(tokenData.data);
  } catch (err) {
    console.error('Error removiendo push token:', err.message);
  }
}

export function escucharNotificaciones(onNotificacion) {
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    const { title, body, data } = notification.request.content;
    if (onNotificacion) onNotificacion({ title, body, data });
  });
  return () => subscription.remove();
}
