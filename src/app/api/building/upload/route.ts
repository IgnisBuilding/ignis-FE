import { NextRequest, NextResponse } from 'next/server';

// Store building data in memory (in production, use a database)
let buildingData: any = null;

// CORS headers for cross-origin requests from Map Editor
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle full payload structure from Map Editor
    // Expected: { building, rooms (GeoJSON), routing, safePoints }
    if (body.building && body.rooms) {
      // Full payload from Map Editor
      const geojson = body.rooms;

      // Validate GeoJSON structure
      if (!geojson || geojson.type !== 'FeatureCollection') {
        return NextResponse.json(
          { success: false, error: 'Invalid rooms GeoJSON: Must be a FeatureCollection' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Extract features from GeoJSON
      const rooms = geojson.features?.filter((f: any) =>
        f.geometry?.type === 'Polygon'
      ) || [];
      const openings = geojson.features?.filter((f: any) =>
        f.geometry?.type === 'LineString' && (f.properties?.type === 'opening' || f.properties?.opening_type)
      ) || [];
      const safePointsFromGeoJSON = geojson.features?.filter((f: any) =>
        f.geometry?.type === 'Point' && (f.properties?.type === 'safe_point' || f.properties?.is_safe_point)
      ) || [];

      // Generate a unique building ID
      const buildingId = `bld-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Store the building data
      buildingData = {
        buildingId,
        building: body.building,
        geojson,
        routing: body.routing || { nodes: [], edges: [] },
        safePoints: body.safePoints || safePointsFromGeoJSON,
        metadata: {
          uploadedAt: new Date().toISOString(),
          roomCount: rooms.length,
          openingCount: openings.length,
          safePointCount: (body.safePoints || safePointsFromGeoJSON).length,
          routingNodes: body.routing?.nodes?.length || 0,
          routingEdges: body.routing?.edges?.length || 0,
        },
      };

      console.log('[Building Upload] Received full building payload:', {
        buildingId,
        buildingName: body.building?.name,
        rooms: rooms.length,
        openings: openings.length,
        safePoints: buildingData.safePoints.length,
        routingNodes: buildingData.metadata.routingNodes,
        routingEdges: buildingData.metadata.routingEdges,
      });

      return NextResponse.json({
        success: true,
        message: 'Building data uploaded successfully',
        buildingId,
        data: {
          roomCount: rooms.length,
          openingCount: openings.length,
          safePointCount: buildingData.safePoints.length,
          routingNodes: buildingData.metadata.routingNodes,
          routingEdges: buildingData.metadata.routingEdges,
          timestamp: buildingData.metadata.uploadedAt,
        },
      }, { headers: corsHeaders });
    }

    // Handle direct GeoJSON upload (legacy format)
    if (body.type === 'FeatureCollection') {
      if (!body.features || !Array.isArray(body.features)) {
        return NextResponse.json(
          { success: false, error: 'Invalid GeoJSON: Missing features array' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Extract and validate features
      const rooms = body.features.filter((f: any) =>
        f.geometry?.type === 'Polygon' && f.properties?.type !== 'safe_point'
      );
      const openings = body.features.filter((f: any) =>
        f.geometry?.type === 'LineString' && (f.properties?.type === 'opening' || f.properties?.opening_type)
      );
      const safePoints = body.features.filter((f: any) =>
        f.geometry?.type === 'Point' && (f.properties?.type === 'safe_point' || f.properties?.is_safe_point)
      );

      const buildingId = `bld-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Store the building data
      buildingData = {
        buildingId,
        geojson: body,
        metadata: {
          uploadedAt: new Date().toISOString(),
          roomCount: rooms.length,
          openingCount: openings.length,
          safePointCount: safePoints.length,
          levels: body.properties?.levels || ['1'],
          buildingLocation: body.properties?.center_lat && body.properties?.center_lng
            ? { lat: body.properties.center_lat, lng: body.properties.center_lng }
            : null,
          scale: body.properties?.scale_pixels_per_meter || null,
        },
        rooms,
        openings,
        safePoints,
      };

      console.log('[Building Upload] Received GeoJSON data:', {
        buildingId,
        rooms: rooms.length,
        openings: openings.length,
        safePoints: safePoints.length,
      });

      return NextResponse.json({
        success: true,
        message: 'Building data uploaded successfully',
        buildingId,
        data: {
          roomCount: rooms.length,
          openingCount: openings.length,
          safePointCount: safePoints.length,
          timestamp: buildingData.metadata.uploadedAt,
        },
      }, { headers: corsHeaders });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid payload format' },
      { status: 400, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('[Building Upload] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process building data' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET() {
  if (!buildingData) {
    return NextResponse.json(
      { success: false, error: 'No building data available' },
      { status: 404, headers: corsHeaders }
    );
  }

  return NextResponse.json({
    success: true,
    data: buildingData,
  }, { headers: corsHeaders });
}
