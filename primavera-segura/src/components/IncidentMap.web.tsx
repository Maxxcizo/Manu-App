import React from 'react';
import { View } from 'react-native';
import { build_map_html, type MapData } from '../lib/map_html';

// Web: sandboxed iframe, scripts allowed but no same-origin access to the app (C06).
export function IncidentMap({ height = 360, ...data }: MapData & { height?: number }) {
  return (
    <View style={{ height, borderRadius: 16, overflow: 'hidden' }}>
      {React.createElement('iframe', {
        title: 'Mapa de incidentes',
        srcDoc: build_map_html(data),
        sandbox: 'allow-scripts',
        style: { border: 0, width: '100%', height: '100%' },
      })}
    </View>
  );
}
