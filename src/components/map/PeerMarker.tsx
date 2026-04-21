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
