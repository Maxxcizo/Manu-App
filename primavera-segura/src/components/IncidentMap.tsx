import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { build_map_html, type MapData } from '../lib/map_html';

// Native (Android/iOS): Leaflet inside a WebView. The web build uses IncidentMap.web.tsx.
export function IncidentMap({ height = 360, ...data }: MapData & { height?: number }) {
  return (
    <View style={{ height, borderRadius: 16, overflow: 'hidden' }}>
      <WebView
        originWhitelist={['about:*', 'https://*']}
        source={{ html: build_map_html(data) }}
        javaScriptEnabled
        domStorageEnabled={false}
        cacheEnabled={false}
        setSupportMultipleWindows={false}
      />
    </View>
  );
}
