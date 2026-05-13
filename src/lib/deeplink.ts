import * as Linking from 'expo-linking';

export const createDeepLink = () => {
  const redirectUrl = Linking.createURL('/auth/callback');
  return redirectUrl;
};