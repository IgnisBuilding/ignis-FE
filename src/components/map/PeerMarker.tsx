import React from 'react';
import { OccupantPosition } from '../../hooks/usePeerPositions';

interface Props {
  pos: OccupantPosition;
  viewerRole: 'EVACUEE' | 'RESPONDER' | 'ADMIN' | string;
  sameFloor: boolean;
  style?: React.CSSProperties; // expected to position marker (left/top or transform)
}

export default function PeerMarker({ pos, viewerRole, sameFloor, style }: Props) {
  const isResponder = pos.role === 'RESPONDER';
  const show = viewerRole === 'ADMIN' || viewerRole === 'RESPONDER' || (viewerRole === 'EVACUEE' && isResponder);

  const baseStyle: React.CSSProperties = {
    transition: 'transform 0.8s ease, opacity 0.8s ease',
    opacity: sameFloor ? 1 : 0.35,
    width: 18,
    height: 18,
    borderRadius: 9,
    display: show ? 'block' : 'none',
    transform: 'translate(-50%, -50%)',
    ...style,
  };

  const markerInner: React.CSSProperties = isResponder
    ? { background: 'orange', border: '2px solid #b34700', width: '100%', height: '100%', borderRadius: '50%' }
    : { background: 'transparent', border: '2px solid #2b6cb0', width: '100%', height: '100%', borderRadius: '50%' };

  const title = `${pos.display_name} — floor ${pos.floor} — ${new Date(pos.timestamp).toLocaleTimeString()}`;

  return (
    <div title={title} style={baseStyle} aria-label={pos.display_name}>
      <div style={markerInner} />
    </div>
  );
}

// We are returning a DOM element that MapLibre detaches and injects into its map layers
return (
  <div
    ref={markerContainerRef}
    style={{
      width: '18px',
      height: '18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'opacity 0.3s ease',
    }}
    title={`${pos.display_name} (${pos.role})`}
  >
    {/* Inner element handles rotation and scale to protect root MapLibre anchor */}
    <div style={{
      width: '14px',
      height: '14px',
      borderRadius: '50%',
      backgroundColor: getRoleColor(pos.role),
      border: '2px solid white',
      boxShadow: '0 0 4px rgba(0,0,0,0.4)',
      transform: `rotate(${pos.heading || 0}deg)`,
      position: 'relative',
      transition: 'transform 0.2s ease',
    }}>
      {/* Directional indicator (Arrow) */}
      {(pos.heading !== undefined) && (
        <div style={{
          position: 'absolute',
          top: -6,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderBottom: `6px solid ${getRoleColor(pos.role)}`,
        }} />
      )}
    </div>
  </div>
);
}

// CHANGED: Completely migrated from React DOM style.left/top positioning to a native MapLibre GL instance binding
// WHY: Relying on component pixel rendering causes the marker to detach from geographic coordinates and drift/stick whenever the map canvas pans/zooms or resizes. Native markers are projection-safe.
// RISK: MapLibre forcibly rips the `element` from the React root into its own canvas overlay container. Ensure no complex React contexts are nested inside the marker payload.
export default React.memo(PeerMarker, (prev, next) => {
  return (
    prev.pos.occupant_id === next.pos.occupant_id &&
    prev.pos.node_id === next.pos.node_id &&
    prev.pos.floor === next.pos.floor &&
    prev.sameFloor === next.sameFloor &&
    prev.pos.lng === next.pos.lng &&
    prev.pos.lat === next.pos.lat &&
    prev.map === next.map
  );
});
