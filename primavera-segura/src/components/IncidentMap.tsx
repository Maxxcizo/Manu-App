import React, { useEffect, useMemo, useRef, useState } from 'react';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { build_map_html, EMPTY_PAYLOAD, map_payload, safe_json } from '../lib/map_html';
import { parse_map_message } from '../lib/map_protocol';
import { MapFrame, type IncidentMapProps } from './map_frame';

// Android: Leaflet inside a WebView. Messages from the page are parsed strictly (map_protocol).
export function IncidentMap(props: IncidentMapProps) {
  const { mode = 'view', on_select, on_pick } = props;
  // Callback ref: react-native-webview's class typings reject a React 19 RefObject.
  const ref = useRef<{ injectJavaScript: (script: string) => void } | null>(null);
  const [status, set_status] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, set_attempt] = useState(0);
  const { incidents, zones, show_incidents, show_zones, selected_id, pick, focus } = props;
  const payload = useMemo(
    () => map_payload({ incidents, zones, show_incidents, show_zones, selected_id, pick, focus }),
    [incidents, zones, show_incidents, show_zones, selected_id, pick, focus],
  );
  // The document is created once per mode; data is pushed in after the page reports "ready",
  // so filtering never reloads the map or loses the current zoom.
  const html = useMemo(() => build_map_html(mode, EMPTY_PAYLOAD), [mode]);

  useEffect(() => {
    if (status === 'ready') ref.current?.injectJavaScript(`window.__ps_update(${safe_json(payload)});true;`);
  }, [payload, status]);

  function on_message(event: WebViewMessageEvent) {
    const msg = parse_map_message(event.nativeEvent.data);
    if (!msg) return;
    if (msg.type === 'ready') set_status('ready');
    else if (msg.type === 'error') set_status('error');
    else if (msg.type === 'select') on_select?.(msg.id);
    else if (msg.type === 'pick') on_pick?.(msg);
  }

  return (
    <MapFrame
      {...props}
      status={status}
      on_retry={() => {
        set_status('loading');
        set_attempt((n) => n + 1);
      }}
    >
      <WebView
        key={attempt}
        ref={(view: { injectJavaScript: (script: string) => void } | null) => {
          ref.current = view;
        }}
        originWhitelist={['about:*']}
        source={{ html }}
        onMessage={on_message}
        onError={() => set_status('error')}
        onShouldStartLoadWithRequest={(req: ShouldStartLoadRequest) => req.url === 'about:blank' || req.url.startsWith('data:')}
        javaScriptEnabled
        domStorageEnabled={false}
        cacheEnabled={false}
        setSupportMultipleWindows={false}
        style={{ backgroundColor: 'transparent' }}
      />
    </MapFrame>
  );
}

export type { IncidentMapProps };
