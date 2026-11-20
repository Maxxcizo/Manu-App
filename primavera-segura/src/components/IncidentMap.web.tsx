import React, { useEffect, useMemo, useRef, useState } from 'react';
import { build_map_html, EMPTY_PAYLOAD, map_payload } from '../lib/map_html';
import { parse_map_message } from '../lib/map_protocol';
import { MapFrame, type IncidentMapProps } from './map_frame';

// Web: sandboxed iframe (scripts only, no same-origin). Messages are accepted only from that frame.
export function IncidentMap(props: IncidentMapProps) {
  const { mode = 'view', on_select, on_pick } = props;
  const frame = useRef<HTMLIFrameElement | null>(null);
  const [status, set_status] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, set_attempt] = useState(0);
  const { incidents, zones, show_incidents, show_zones, selected_id, pick, focus } = props;
  const payload = useMemo(
    () => map_payload({ incidents, zones, show_incidents, show_zones, selected_id, pick, focus }),
    [incidents, zones, show_incidents, show_zones, selected_id, pick, focus],
  );
  // Built once per mode; data arrives by postMessage after "ready" (keeps zoom while filtering).
  const html = useMemo(() => build_map_html(mode, EMPTY_PAYLOAD), [mode]);
  const handlers = useRef({ on_select, on_pick });
  useEffect(() => {
    handlers.current = { on_select, on_pick };
  }, [on_select, on_pick]);

  useEffect(() => {
    function listen(event: MessageEvent) {
      if (!frame.current || event.source !== frame.current.contentWindow) return;
      const msg = parse_map_message(event.data);
      if (!msg) return;
      if (msg.type === 'ready') set_status('ready');
      else if (msg.type === 'error') set_status('error');
      else if (msg.type === 'select') handlers.current.on_select?.(msg.id);
      else if (msg.type === 'pick') handlers.current.on_pick?.(msg);
    }
    window.addEventListener('message', listen);
    return () => window.removeEventListener('message', listen);
  }, []);

  useEffect(() => {
    if (status === 'ready') frame.current?.contentWindow?.postMessage({ source: 'primavera-app', type: 'update', payload }, '*');
  }, [payload, status]);

  return (
    <MapFrame
      {...props}
      status={status}
      on_retry={() => {
        set_status('loading');
        set_attempt((n) => n + 1);
      }}
    >
      {React.createElement('iframe', {
        key: attempt,
        ref: frame,
        title: props.label ?? 'Mapa de incidentes',
        srcDoc: html,
        sandbox: 'allow-scripts',
        style: { border: 0, width: '100%', height: '100%', display: 'block' },
      })}
    </MapFrame>
  );
}

export type { IncidentMapProps };
