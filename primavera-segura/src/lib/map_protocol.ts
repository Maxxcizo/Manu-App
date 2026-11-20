// Messages exchanged between the app and the sandboxed Leaflet document.
// Everything coming from the map is treated as untrusted input and parsed strictly.

export type MapMessage =
  | { type: 'ready' }
  | { type: 'error'; reason: 'cdn' }
  | { type: 'select'; id: string }
  | { type: 'pick'; lat: number; lng: number };

const ID = /^[A-Za-z0-9_-]{1,64}$/;

export function parse_map_message(raw: unknown): MapMessage | null {
  let data: unknown = raw;
  if (typeof raw === 'string') {
    if (raw.length > 512) return null;
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== 'object') return null;
  const msg = data as Record<string, unknown>;
  if (msg.source !== 'primavera-map') return null;
  switch (msg.type) {
    case 'ready':
      return { type: 'ready' };
    case 'error':
      return msg.reason === 'cdn' ? { type: 'error', reason: 'cdn' } : null;
    case 'select':
      return typeof msg.id === 'string' && ID.test(msg.id) ? { type: 'select', id: msg.id } : null;
    case 'pick': {
      const lat = msg.lat;
      const lng = msg.lng;
      if (typeof lat !== 'number' || typeof lng !== 'number') return null;
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
      return { type: 'pick', lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) };
    }
    default:
      return null;
  }
}
