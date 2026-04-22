import React, { useEffect, useState, useRef, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import { OccupantPosition } from '../../hooks/usePeerPositions';

interface NodeOccupantOverlayProps {
  map: maplibregl.Map | null;
  occupants: OccupantPosition[];
  nodes: Array<{ nodeId: string; coordinates?: [number, number] }>;
  visible?: boolean;
}

const ROLE_COLORS = {
  EVACUEE: '#3B82F6',   // Blue
  RESPONDER: '#10B981', // Green
  ADMIN: '#F59E0B',    // Amber
};

/**
 * NodeOccupantOverlay
 * Renders occupants as animated dots anchored to node positions on the map.
 * This is more performant than Lat/Lng tracking as it only updates when node changes.
 */
export const NodeOccupantOverlay: React.FC<NodeOccupantOverlayProps> = ({
  map,
  occupants,
  nodes,
  visible = true,
}) => {
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const overlayRef = useRef<HTMLDivElement>(null);

  // Group occupants by node to handle offsets for multiple users at same node
  const occupantsByNode = useMemo(() => {
    const groups: Record<string, OccupantPosition[]> = {};
    occupants.forEach((p) => {
      if (!groups[p.node_id]) groups[p.node_id] = [];
      groups[p.node_id].push(p);
    });
    return groups;
  }, [occupants]);

  // Update pixel positions of nodes when map moves or zoom changes
  const updatePixelPositions = () => {
    if (!map || !nodes.length) return;

    const newPositions: Record<string, { x: number; y: number }> = {};
    nodes.forEach((node) => {
      if (node.coordinates && node.nodeId) {
        try {
          const pixel = map.project(node.coordinates);
          newPositions[node.nodeId] = { x: pixel.x, y: pixel.y };
        } catch (e) {
          // ignore if coordinates invalid
        }
      }
    });
    setNodePositions(newPositions);
  };

  useEffect(() => {
    if (!map) return;

    updatePixelPositions();
    
    map.on('move', updatePixelPositions);
    map.on('zoom', updatePixelPositions);
    map.on('resize', updatePixelPositions);

    return () => {
      map.off('move', updatePixelPositions);
      map.off('zoom', updatePixelPositions);
      map.off('resize', updatePixelPositions);
    };
  }, [map, nodes]);

  if (!visible || !map) return null;

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 10,
        overflow: 'hidden',
      }}
    >
      {Object.entries(occupantsByNode).map(([nodeId, peers]) => {
        const pos = nodePositions[nodeId];
        if (!pos) return null;

        return peers.map((peer, index) => {
          // Calculate spiral or grid offset for multiple users at same node
          const offsetSize = 12;
          const angle = (index * (360 / Math.max(peers.length - 1, 1))) * (Math.PI / 180);
          const distance = index === 0 ? 0 : offsetSize;
          const offsetX = Math.cos(angle) * distance;
          const offsetY = Math.sin(angle) * distance;

          const color = ROLE_COLORS[peer.role] || ROLE_COLORS.EVACUEE;

          return (
            <div
              key={peer.user_id}
              className="node-occupant-dot"
              style={{
                position: 'absolute',
                left: pos.x + offsetX,
                top: pos.y + offsetY,
                width: '12px',
                height: '12px',
                backgroundColor: color,
                borderRadius: '50%',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                transform: 'translate(-50%, -50%)',
                transition: 'left 0.8s cubic-bezier(0.4, 0, 0.2, 1), top 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-20px',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
                className="occupant-label"
              >
                {peer.display_name}
              </div>
            </div>
          );
        });
      })}
      
      <style>{`
        .node-occupant-dot:hover .occupant-label {
          opacity: 1 !important;
        }
        .node-occupant-dot {
          pointer-events: auto;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};
