import { Linking, Platform } from 'react-native';

export const openNavigation = (lat: number, lon: number, label: string) => {
  const scheme = Platform.select({ 
    ios: 'maps:0,0?q=', 
    android: 'geo:0,0?q=' 
  });
  const latLng = `${lat},${lon}`;
  
  const url = Platform.select({
    ios: `maps:0,0?q=${encodeURIComponent(label)}@${latLng}`,
    android: `geo:0,0?q=${lat},${lon}(${encodeURIComponent(label)})`
  });

  Linking.openURL(url!);
};