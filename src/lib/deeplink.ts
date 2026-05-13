import * as Linking from 'expo-linking';

export const createDeepLink = () => {
  // Al dejarlo vacío, simplemente regresa a la raíz de la app
  const redirectUrl = Linking.createURL('');
  return redirectUrl;
};