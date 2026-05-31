import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configuración de cómo se muestran las notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, // <-- Añadido para corregir el error
    shouldShowList: true,   // <-- Añadido para corregir el error
  }),
});

// Función para pedir permiso y guardar el token en el perfil del usuario
export async function registerForPushNotificationsAsync(userId: string) {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Permiso denegado para notificaciones push');
      return;
    }
    
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    if (!projectId) {
      console.log('No se encontró el Project ID de Expo. Configura eas.json primero.');
      return;
    }
    try {
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      
      if (token) {
        await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId);
      }
    } catch (error) {
      console.log('No se pudo obtener el token Push (es normal si usas un emulador).');
      return;
    }
    
    // Guardamos el token en Supabase en el perfil del usuario
    if (token) {
      await supabase.from('profiles').update({ expo_push_token: token }).eq('id', userId);
    }
  } else {
    console.log('Debes usar un dispositivo físico para las notificaciones Push');
  }

  return token;
}

// Función para Enviar Notificación (Guarda en BD y envía Push al celular)
export async function sendNotification(userId: string, title: string, message: string, icon: string = 'bell') {
  try {
    // 1. Guardar en la base de datos (para la pantalla de notificaciones)
    await supabase.from('notifications').insert({ user_id: userId, title, message, icon });

    // 2. Obtener el token del usuario para enviarle el Push real
    const { data } = await supabase.from('profiles').select('expo_push_token').eq('id', userId).single();
    
    if (data && data.expo_push_token) {
      // 3. Consumir la API de Expo para hacer sonar el celular
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: data.expo_push_token,
          sound: 'default',
          title: title,
          body: message,
          data: { someData: 'goes here' },
        }),
      });
    }
  } catch (error) {
    console.error('Error enviando notificación:', error);
  }
}