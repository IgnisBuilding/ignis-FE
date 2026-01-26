("use client");
import "./editor.css";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  Upload,
  Trash2,
  Download,
  Plus,
  Layers,
  Eye,
  EyeOff,
  Edit3,
  Check,
  X,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MapPin,
  Ruler,
  DoorOpen,
  Square,
  Route,
  AlertTriangle,
  Play,
  Settings,
  Map as MapIcon,
  Grid3X3,
  Navigation,
  Circle,
  Undo2,
  Redo2,
  Save,
  AlertCircle,
  Shield,
  Target,
  Video,
} from "lucide-react";


// Type definitions
interface Point {
  x: number;
  y: number;
}

interface Room {
  id: string;
  name: string;
  room_type: string;
  level: string;
  points: Point[];
  area_sqm: number;
  centroid: Point;
}

interface Opening {
  id: string;
  type: string;
  level: string;
  start: Point;
  end: Point;
  width: number;
  connects: string[];
}

interface SafePoint {
  id: string;
  position: Point;
  level: string;
  name: string;
  capacity: number;
}

interface Camera {
  id: string;
  position: Point;
  level: string;
  name: string;
  camera_id: string; // Unique identifier for fire-detect pipeline
  rtsp_url: string;
  is_fire_detection_enabled: boolean;
  linked_room_id?: string; // Optional link to a room
  rotation: number; // Camera rotation angle in degrees
}

interface ErrorState {
  message: string;
  type: 'error' | 'warning' | 'info';
  timestamp: number;
}

type EditorMode = 'calibrate' | 'draw' | 'door' | 'select' | 'pan' | 'route_test' | 'safe_point' | 'camera';


// ==================== CONSTANTS ====================
const STORAGE_KEY = "ignis-floor-plan-data";
const STORAGE_VERSION = 1;
const MAX_HISTORY_SIZE = 50;
const SPATIAL_GRID_SIZE = 100; // pixels per grid cell

// API Configuration for ignis-FE backend (Feature 5)
const API_CONFIG = {
  FIRE_SAFETY_API: process.env.NEXT_PUBLIC_API_BASE!,
  ENDPOINTS: {
    UPLOAD_BUILDING: "/building/upload",
    HEALTH: "/health",
  },
};

// Room type configurations
const ROOM_TYPES = {
  bedroom: {
    label: "Bedroom",
    color: "#5C6BC0",
    bg: "rgba(92, 107, 192, 0.3)",
  },
  bathroom: {
    label: "Bathroom",
    color: "#26C6DA",
    bg: "rgba(38, 198, 218, 0.3)",
  },
  kitchen: { label: "Kitchen", color: "#FF9800", bg: "rgba(255, 152, 0, 0.3)" },
  living: {
    label: "Living Room",
    color: "#66BB6A",
    bg: "rgba(102, 187, 106, 0.3)",
  },
  dining: {
    label: "Dining Room",
    color: "#FFC107",
    bg: "rgba(255, 193, 7, 0.3)",
  },
  office: {
    label: "Office/Den",
    color: "#7E57C2",
    bg: "rgba(126, 87, 194, 0.3)",
  },
  garage: { label: "Garage", color: "#9E9E9E", bg: "rgba(158, 158, 158, 0.3)" },
  stairs: { label: "Stairs", color: "#616161", bg: "rgba(97, 97, 97, 0.3)" },
  elevator: {
    label: "Elevator",
    color: "#FF5722",
    bg: "rgba(255, 87, 34, 0.3)",
  },
  hallway: {
    label: "Hallway",
    color: "#ECEFF1",
    bg: "rgba(236, 239, 241, 0.4)",
  },
  corridor: {
    label: "Corridor",
    color: "#78909C",
    bg: "rgba(120, 144, 156, 0.3)",
  },
  closet: { label: "Closet", color: "#BCAAA4", bg: "rgba(188, 170, 164, 0.3)" },
  storage: {
    label: "Storage",
    color: "#A1887F",
    bg: "rgba(161, 136, 127, 0.3)",
  },
  utility: {
    label: "Utility",
    color: "#8D6E63",
    bg: "rgba(141, 110, 99, 0.3)",
  },
  entry: {
    label: "Entry/Foyer",
    color: "#8D6E63",
    bg: "rgba(141, 110, 99, 0.3)",
  },
  outdoor: {
    label: "Outdoor/Porch",
    color: "#81C784",
    bg: "rgba(129, 199, 132, 0.3)",
  },
  recreation: {
    label: "Recreation",
    color: "#4DB6AC",
    bg: "rgba(77, 182, 172, 0.3)",
  },
  exit: {
    label: "Emergency Exit",
    color: "#f44336",
    bg: "rgba(244, 67, 54, 0.3)",
  },
};

const OPENING_TYPES = {
  door: { label: "Door", color: "#4CAF50", width: 0.9 }, // 90cm standard door
  window: { label: "Window", color: "#2196F3", width: 1.2 },
  emergency_exit: { label: "Emergency Exit", color: "#f44336", width: 1.2 },
  arch: { label: "Archway", color: "#9C27B0", width: 1.5 },
};

// ==================== ERROR HANDLING UTILITIES ====================

class AppError extends Error {
  constructor(message, type = "error", details = null) {
    super(message);
    this.type = type; // 'error', 'warning', 'info'
    this.details = details;
    this.timestamp = Date.now();
  }
}

const createErrorHandler = (setError) => ({
  handle: (error, context = "") => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}]`, error);
    setError({
      message: `${context}: ${message}`,
      type: "error",
      timestamp: Date.now(),
    });
  },
  warn: (message, context = "") => {
    console.warn(`[${context}]`, message);
    setError({ message, type: "warning", timestamp: Date.now() });
  },
  info: (message) => {
    setError({ message, type: "info", timestamp: Date.now() });
  },
  clear: () => setError(null),
});

// Safe wrapper for operations that might fail
const safeOperation = async (operation, errorHandler, context) => {
  try {
    return await operation();
  } catch (error) {
    errorHandler.handle(error, context);
    return null;
  }
};

// ==================== SPATIAL INDEX (Quadtree-like Grid) ====================

class SpatialIndex {
  constructor(gridSize = SPATIAL_GRID_SIZE) {
    this.gridSize = gridSize;
    this.grid = new Map();
  }

  _getCellKey(x, y) {
    const cellX = Math.floor(x / this.gridSize);
    const cellY = Math.floor(y / this.gridSize);
    return `${cellX},${cellY}`;
  }

  _getBoundingBox(points) {
    if (!points || points.length === 0) return null;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    return { minX, minY, maxX, maxY };
  }

  clear() {
    this.grid.clear();
  }

  insert(id, points, data = null) {
    const bbox = this._getBoundingBox(points);
    if (!bbox) return;

    const startCellX = Math.floor(bbox.minX / this.gridSize);
    const startCellY = Math.floor(bbox.minY / this.gridSize);
    const endCellX = Math.floor(bbox.maxX / this.gridSize);
    const endCellY = Math.floor(bbox.maxY / this.gridSize);

    for (let cx = startCellX; cx <= endCellX; cx++) {
      for (let cy = startCellY; cy <= endCellY; cy++) {
        const key = `${cx},${cy}`;
        if (!this.grid.has(key)) {
          this.grid.set(key, []);
        }
        this.grid.get(key).push({ id, points, bbox, data });
      }
    }
  }

  query(x, y, radius = 0) {
    const candidates = new Set();
    const startCellX = Math.floor((x - radius) / this.gridSize);
    const startCellY = Math.floor((y - radius) / this.gridSize);
    const endCellX = Math.floor((x + radius) / this.gridSize);
    const endCellY = Math.floor((y + radius) / this.gridSize);

    for (let cx = startCellX; cx <= endCellX; cx++) {
      for (let cy = startCellY; cy <= endCellY; cy++) {
        const key = `${cx},${cy}`;
        const cell = this.grid.get(key);
        if (cell) {
          for (const item of cell) {
            candidates.add(item);
          }
        }
      }
    }

    return Array.from(candidates);
  }

  remove(id) {
    for (const [key, items] of this.grid.entries()) {
      const filtered = items.filter((item) => item.id !== id);
      if (filtered.length === 0) {
        this.grid.delete(key);
      } else if (filtered.length !== items.length) {
        this.grid.set(key, filtered);
      }
    }
  }
}

// ==================== HISTORY MANAGEMENT (Undo/Redo) ====================

const createHistoryManager = (maxSize = MAX_HISTORY_SIZE) => {
  let history = [];
  let currentIndex = -1;

  return {
    push: (state) => {
      // Remove any future states if we're not at the end
      history = history.slice(0, currentIndex + 1);

      // Add new state
      history.push(JSON.parse(JSON.stringify(state)));

      // Limit history size
      if (history.length > maxSize) {
        history.shift();
      } else {
        currentIndex++;
      }
    },

    undo: () => {
      if (currentIndex > 0) {
        currentIndex--;
        return JSON.parse(JSON.stringify(history[currentIndex]));
      }
      return null;
    },

    redo: () => {
      if (currentIndex < history.length - 1) {
        currentIndex++;
        return JSON.parse(JSON.stringify(history[currentIndex]));
      }
      return null;
    },

    canUndo: () => currentIndex > 0,
    canRedo: () => currentIndex < history.length - 1,

    clear: () => {
      history = [];
      currentIndex = -1;
    },

    getLength: () => history.length,
    getCurrentIndex: () => currentIndex,
  };
};

// ==================== LOCAL STORAGE UTILITIES ====================

const storage = {
  save: (key, data) => {
    try {
      const payload = {
        version: STORAGE_VERSION,
        timestamp: Date.now(),
        data,
      };
      localStorage.setItem(key, JSON.stringify(payload));
      return true;
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
      return false;
    }
  },

  load: (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;

      const payload = JSON.parse(raw);

      // Version check for future migrations
      if (payload.version !== STORAGE_VERSION) {
        console.warn("Storage version mismatch, data may need migration");
      }

      return payload.data;
    } catch (error) {
      console.error("Failed to load from localStorage:", error);
      return null;
    }
  },

  clear: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
      return false;
    }
  },

  exists: (key) => {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  },
};

// ==================== VALIDATION UTILITIES ====================

const validators = {
  isValidCoordinate: (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num);
  },

  isValidLatitude: (lat) => {
    const num = parseFloat(lat);
    return !isNaN(num) && isFinite(num) && num >= -90 && num <= 90;
  },

  isValidLongitude: (lng) => {
    const num = parseFloat(lng);
    return !isNaN(num) && isFinite(num) && num >= -180 && num <= 180;
  },

  isValidDistance: (distance) => {
    const num = parseFloat(distance);
    return !isNaN(num) && isFinite(num) && num > 0;
  },

  isValidImageFile: (file) => {
    if (!file) return false;
    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
    ];
    const maxSize = 50 * 1024 * 1024; // 50MB
    return validTypes.includes(file.type) && file.size <= maxSize;
  },

  sanitizeNumber: (
    value,
    defaultValue = 0,
    min = -Infinity,
    max = Infinity
  ) => {
    const num = parseFloat(value);
    if (isNaN(num) || !isFinite(num)) return defaultValue;
    return Math.max(min, Math.min(max, num));
  },

  isValidGeoJSONFile: (file) => {
    if (!file) return false;
    const validExtensions = [".geojson", ".json"];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some((ext) =>
      fileName.endsWith(ext)
    );
    const maxSize = 50 * 1024 * 1024; // 50MB
    return hasValidExtension && file.size <= maxSize;
  },

  isValidGeoJSON: (data) => {
    if (!data || typeof data !== "object") return false;
    if (data.type !== "FeatureCollection") return false;
    if (!Array.isArray(data.features)) return false;
    return true;
  },

  isValidFeature: (feature) => {
    if (!feature || typeof feature !== "object") return false;
    if (feature.type !== "Feature") return false;
    if (!feature.geometry || !feature.properties) return false;
    return true;
  },
};

export default function IGNISFloorPlanEditor() {
  // ==================== STATE ====================

  // Image & Canvas State
  const [image, setImage] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Scale Calibration State
  const [scaleCalibrated, setScaleCalibrated] = useState(false);
  const [pixelsPerMeter, setPixelsPerMeter] = useState(100); // Default assumption
  const [calibrationLine, setCalibrationLine] = useState(null); // {start, end}
  const [calibrationDistance, setCalibrationDistance] = useState("");
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);

  // Building Location State
  const [buildingLocation, setBuildingLocation] = useState({
    lat: 24.862,
    lng: 67.1125,
  });
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Drawing State
  const [mode, setMode] = useState("calibrate"); // 'calibrate', 'draw', 'door', 'select', 'pan', 'route_test'
  const [currentPoints, setCurrentPoints] = useState([]);
  const [currentLevel, setCurrentLevel] = useState("1");
  const [levels, setLevels] = useState(["1"]);
  const [showLevels, setShowLevels] = useState({ 1: true });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Room & Opening State
  const [rooms, setRooms] = useState([]);
  const [openings, setOpenings] = useState([]); // doors, windows, exits
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedOpening, setSelectedOpening] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [currentOpeningType, setCurrentOpeningType] = useState("door");
  const [openingStart, setOpeningStart] = useState(null);

  // Routing & Preview State
  const [showPreview, setShowPreview] = useState(false);
  const [routingGraph, setRoutingGraph] = useState(null);
  const [testRoute, setTestRoute] = useState(null);
  const [routeStart, setRouteStart] = useState(null);
  const [routeEnd, setRouteEnd] = useState(null);

  // Safe Points State (Feature 2)
  const [safePoints, setSafePoints] = useState([]);
  const [selectedSafePoint, setSelectedSafePoint] = useState(null);

  // Camera State (Phase 6 - Fire Detection Integration)
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);

  // Point-Level History for Drawing (Feature 4)
  const [pointHistory, setPointHistory] = useState([]);
  const [pointHistoryIndex, setPointHistoryIndex] = useState(-1);

  // Default Room Type for Corridor Support (Feature 3)
  const [defaultRoomType, setDefaultRoomType] = useState("common");

  // API Connection State (Feature 5)
  const [isUploading, setIsUploading] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);

  // Error & Notification State
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  // Refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const fileInputGeoJSONRef = useRef(null);
  // History Manager (Undo/Redo)
  const historyRef = useRef(createHistoryManager(MAX_HISTORY_SIZE));

  // Spatial Index for performance optimization
  const spatialIndexRef = useRef(new SpatialIndex(SPATIAL_GRID_SIZE));

  // Error Handler
  const errorHandler = useMemo(() => createErrorHandler(setError), []);
  // ==================== HISTORY MANAGEMENT ====================

  // Get current state snapshot for history
  const getStateSnapShot = useCallback(
    () => ({
      rooms,
      openings,
      safePoints,
      cameras,
      levels,
      currentLevel,
      buildingLocation,
      pixelsPerMeter,
      scaleCalibrated,
      calibrationLine,
    }),
    [
      rooms,
      openings,
      safePoints,
      cameras,
      levels,
      currentLevel,
      buildingLocation,
      pixelsPerMeter,
      scaleCalibrated,
      calibrationLine,
    ]
  );

  // Apply state from history
  const applyStateSnapshot = useCallback((snapshot) => {
    if (!snapshot) return;
    setRooms(snapshot.rooms || []);
    setOpenings(snapshot.openings || []);
    setSafePoints(snapshot.safePoints || []);
    setCameras(snapshot.cameras || []);
    setLevels(snapshot.levels || ["1"]);
    setCurrentLevel(snapshot.currentLevel || "1");
    setBuildingLocation(
      snapshot.buildingLocation || { lat: 24.862, lng: 67.1125 }
    );
    setPixelsPerMeter(snapshot.pixelsPerMeter || 100);
    setScaleCalibrated(snapshot.scaleCalibrated || false);
    setCalibrationLine(snapshot.calibrationLine || null);
  }, []);

  // Push current state to history
  const pushToHistory = useCallback(() => {
    historyRef.current.push(getStateSnapShot());
    setHasUnsavedChanges(true);
  }, [getStateSnapShot]);

  // Undo action
  const handleUndo = useCallback(() => {
    const previousState = historyRef.current.undo();
    if (previousState) {
      applyStateSnapshot(previousState);
      setHasUnsavedChanges(true);
      errorHandler.info("Undo successful");
    }
  }, [applyStateSnapshot, errorHandler]);

  // Redo action
  const handleRedo = useCallback(() => {
    const nextState = historyRef.current.redo();
    if (nextState) {
      applyStateSnapshot(nextState);
      setHasUnsavedChanges(true);
      errorHandler.info("Redo successful");
    }
  }, [applyStateSnapshot, errorHandler]);

  // ==================== POINT-LEVEL UNDO/REDO (Feature 4) ====================

  // Undo last point while drawing
  const handleUndoPoint = useCallback(() => {
    if (mode === "draw" && currentPoints.length > 0) {
      const newPoints = currentPoints.slice(0, -1);
      setCurrentPoints(newPoints);

      // Update point history
      if (pointHistoryIndex > 0) {
        setPointHistoryIndex(pointHistoryIndex - 1);
      }

      errorHandler.info("Point removed");
      return true;
    }
    return false;
  }, [mode, currentPoints, pointHistoryIndex, errorHandler]);

  // Redo point while drawing
  const handleRedoPoint = useCallback(() => {
    if (mode === "draw" && pointHistoryIndex < pointHistory.length - 1) {
      const nextIndex = pointHistoryIndex + 1;
      setPointHistoryIndex(nextIndex);
      setCurrentPoints(pointHistory[nextIndex]);
      errorHandler.info("Point restored");
      return true;
    }
    return false;
  }, [mode, pointHistory, pointHistoryIndex, errorHandler]);

  // Clear point history (call when drawing completes or cancels)
  const clearPointHistory = useCallback(() => {
    setPointHistory([]);
    setPointHistoryIndex(-1);
  }, []);

  // Cancel drawing operation
  const cancelDrawing = useCallback(() => {
    setCurrentPoints([]);
    setOpeningStart(null);
    clearPointHistory();
  }, [clearPointHistory]);

  // ==================== LOCAL STORAGE PERSISTENCE ====================

  // Save current state to localStorage
  const saveToLocalStorage = useCallback(() => {
    try {
      const data = {
        image,
        imageSize,
        rooms,
        openings,
        safePoints,
        cameras,
        levels,
        currentLevel,
        buildingLocation,
        pixelsPerMeter,
        scaleCalibrated,
        calibrationLine,
        showLevels,
      };

      if (storage.save(STORAGE_KEY, data)) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        errorHandler.info("Project saved successfully");
      } else {
        errorHandler.warn("Failed to save project", "Storage");
      }
    } catch (err) {
      errorHandler.handle(err, "Save Project");
    }
  }, [
    image,
    imageSize,
    rooms,
    openings,
    safePoints,
    cameras,
    levels,
    currentLevel,
    buildingLocation,
    pixelsPerMeter,
    scaleCalibrated,
    calibrationLine,
    showLevels,
    errorHandler,
  ]);

  // Load state from localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const data = storage.load(STORAGE_KEY);
      if (!data) {
        errorHandler.info("No saved project found");
        return false;
      }

      if (data.image) setImage(data.image);
      if (data.imageSize) setImageSize(data.imageSize);
      if (data.rooms) setRooms(data.rooms);
      if (data.openings) setOpenings(data.openings);
      if (data.safePoints) setSafePoints(data.safePoints);
      if (data.cameras) setCameras(data.cameras);
      if (data.levels) setLevels(data.levels);
      if (data.currentLevel) setCurrentLevel(data.currentLevel);
      if (data.buildingLocation) setBuildingLocation(data.buildingLocation);
      if (data.pixelsPerMeter) setPixelsPerMeter(data.pixelsPerMeter);
      if (data.scaleCalibrated !== undefined)
        setScaleCalibrated(data.scaleCalibrated);
      if (data.calibrationLine) setCalibrationLine(data.calibrationLine);
      if (data.showLevels) setShowLevels(data.showLevels);

      setHasUnsavedChanges(false);
      historyRef.current.clear();
      historyRef.current.push(getStateSnapShot());
      errorHandler.info("Project loaded successfully");
      return true;
    } catch (err) {
      errorHandler.handle(err, "Load Project");
      return false;
    }
  }, [errorHandler, getStateSnapShot]);

  // Clear saved data
  const clearLocalStorage = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to clear all saved data? This cannot be undone."
      )
    ) {
      storage.clear(STORAGE_KEY);
      errorHandler.info("Saved data cleared");
    }
  }, [errorHandler]);

  // ==================== EFFECTS ====================

  // Keyboard shortcuts for undo/redo/save (Feature 4: Enhanced with point-level undo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          // Ctrl+Shift+Z = Redo
          if (mode === "draw" && currentPoints.length > 0) {
            handleRedoPoint();
          } else {
            handleRedo();
          }
        } else {
          // Ctrl+Z = Undo
          if (mode === "draw" && currentPoints.length > 0) {
            handleUndoPoint();
          } else {
            handleUndo();
          }
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        if (mode === "draw" && currentPoints.length > 0) {
          handleRedoPoint();
        } else {
          handleRedo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveToLocalStorage();
      }
      // Escape key to cancel drawing
      if (e.key === "Escape" && mode === "draw" && currentPoints.length > 0) {
        cancelDrawing();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleUndoPoint,
    handleRedoPoint,
    saveToLocalStorage,
    mode,
    currentPoints.length,
    cancelDrawing,
  ]);

  // Wheel event listener with passive: false to allow preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const wheelHandler = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prevZoom) => Math.max(0.25, Math.min(4, prevZoom + delta)));
    };

    container.addEventListener("wheel", wheelHandler, { passive: false });
    return () => container.removeEventListener("wheel", wheelHandler);
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (storage.exists(STORAGE_KEY)) {
      const shouldLoad = window.confirm(
        "Found saved project. Would you like to restore it?"
      );
      if (shouldLoad) {
        loadFromLocalStorage();
      }
    }
    // Initialize history with empty state
    historyRef.current.push(getStateSnapShot());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save on significant changes (debounced)
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const autoSaveTimer = setTimeout(() => {
      if (rooms.length > 0 || openings.length > 0 || image) {
        saveToLocalStorage();
      }
    }, 30000); // Auto-save every 30 seconds if there are changes

    return () => clearTimeout(autoSaveTimer);
  }, [
    hasUnsavedChanges,
    rooms.length,
    openings.length,
    image,
    saveToLocalStorage,
  ]);

  // Rebuild spatial index when rooms change
  useEffect(() => {
    spatialIndexRef.current.clear();
    rooms.forEach((room) => {
      spatialIndexRef.current.insert(room.id, room.points, room);
    });
  }, [rooms]);

  // Error notification auto-dismiss
  useEffect(() => {
    if (error) {
      const dismissTimer = setTimeout(
        () => {
          setError(null);
        },
        error.type === "error" ? 8000 : 4000
      );

      return () => clearTimeout(dismissTimer);
    }
  }, [error]);

  // ==================== OPTIMIZED ROOM LOOKUP ====================

  // Optimized room lookup using spatial index
  const findRoomAtPoint = useCallback(
    (point) => {
      const candidates = spatialIndexRef.current.query(point.x, point.y, 0);

      for (const candidate of candidates) {
        const room = rooms.find((r) => r.id === candidate.id);
        if (
          room &&
          showLevels[room.level] &&
          isPointInPolygon(point, room.points)
        ) {
          return room;
        }
      }
      return null;
    },
    [rooms, showLevels]
  );

  // ==================== MEMOIZED COMPUTATIONS ====================

  // Memoized visible rooms for current level visibility settings
  const visibleRooms = useMemo(() => {
    return rooms.filter((room) => showLevels[room.level]);
  }, [rooms, showLevels]);

  // Memoized visible openings
  const visibleOpenings = useMemo(() => {
    return openings.filter((op) => showLevels[op.level]);
  }, [openings, showLevels]);

  // Memoized room counts per level
  const roomCountsByLevel = useMemo(() => {
    const counts = {};
    levels.forEach((level) => {
      counts[level] = rooms.filter((r) => r.level === level).length;
    });
    return counts;
  }, [rooms, levels]);

  // Memoized total area
  const totalArea = useMemo(() => {
    return rooms.reduce((sum, room) => sum + (room.area_sqm || 0), 0);
  }, [rooms]);

  // Memoized selected room object
  const selectedRoomData = useMemo(() => {
    return selectedRoom ? rooms.find((r) => r.id === selectedRoom) : null;
  }, [rooms, selectedRoom]);

  // Memoized selected opening object
  const selectedOpeningData = useMemo(() => {
    return selectedOpening
      ? openings.find((op) => op.id === selectedOpening)
      : null;
  }, [openings, selectedOpening]);

  // ==================== SCALE & COORDINATE FUNCTIONS ====================

  // Calculate distance between two pixel points
  const pixelDistance = (p1, p2) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  // Convert pixels to meters
  const pixelsToMeters = (pixels) => {
    return pixels / pixelsPerMeter;
  };

  // Convert meters to pixels
  const metersToPixels = (meters) => {
    return meters * pixelsPerMeter;
  };

  // Convert pixel coordinates to geo coordinates (WGS84)
  // Using proper mercator projection approximation
  const pixelToGeo = (px, py) => {
    // Calculate offset from image center in meters
    const centerX = imageSize.width / 2;
    const centerY = imageSize.height / 2;
    const offsetXMeters = pixelsToMeters(px - centerX);
    const offsetYMeters = pixelsToMeters(centerY - py); // Y is inverted

    // Convert meters to degrees (approximate at given latitude)
    // 1 degree latitude ≈ 111,320 meters
    // 1 degree longitude ≈ 111,320 * cos(latitude) meters
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng =
      111320 * Math.cos((buildingLocation.lat * Math.PI) / 180);

    return {
      lng: buildingLocation.lng + offsetXMeters / metersPerDegreeLng,
      lat: buildingLocation.lat + offsetYMeters / metersPerDegreeLat,
    };
  };

  // Convert geo coordinates back to pixels (for preview verification)
  const geoToPixel = (lng, lat) => {
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng =
      111320 * Math.cos((buildingLocation.lat * Math.PI) / 180);

    const offsetXMeters = (lng - buildingLocation.lng) * metersPerDegreeLng;
    const offsetYMeters = (lat - buildingLocation.lat) * metersPerDegreeLat;

    const centerX = imageSize.width / 2;
    const centerY = imageSize.height / 2;

    return {
      x: centerX + metersToPixels(offsetXMeters),
      y: centerY - metersToPixels(offsetYMeters),
    };
  };

  // Calculate room area in square meters
  const calculateRoomArea = (points) => {
    if (points.length < 3) return 0;

    // Shoelace formula for polygon area
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    area = Math.abs(area) / 2;

    // Convert from square pixels to square meters
    return area / (pixelsPerMeter * pixelsPerMeter);
  };

  // Calculate room centroid
  const calculateCentroid = (points) => {
    const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    return { x, y };
  };

  // ==================== MOUSE HANDLERS ====================

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - pan.x) / zoom,
      y: (e.clientY - rect.top - pan.y) / zoom,
    };
  };

  const handleCanvasClick = (e) => {
    if (mode === "pan" || isPanning) return;

    const pos = getMousePos(e);

    if (mode === "calibrate") {
      if (!calibrationLine) {
        setCalibrationLine({ start: pos, end: null });
      } else if (!calibrationLine.end) {
        setCalibrationLine({ ...calibrationLine, end: pos });
        setShowCalibrationModal(true);
      }
    } else if (mode === "draw") {
      const newPoints = [...currentPoints, pos];

      // Track point-level history (Feature 4)
      const newPointHistory = pointHistory.slice(0, pointHistoryIndex + 1);
      newPointHistory.push([...newPoints]);
      setPointHistory(newPointHistory);
      setPointHistoryIndex(newPointHistory.length - 1);

      setCurrentPoints(newPoints);
      setSelectedRoom(null);
      setSelectedOpening(null);
      setSelectedSafePoint(null);
    } else if (mode === "door") {
      if (!openingStart) {
        setOpeningStart(pos);
      } else {
        try {
          // Create the opening
          const newOpening = {
            id: Date.now().toString(),
            type: currentOpeningType,
            level: currentLevel,
            start: openingStart,
            end: pos,
            width: OPENING_TYPES[currentOpeningType].width,
            connects: [], // Will store connected room IDs
          };

          // Find which rooms this opening connects
          const connectedRooms = rooms.filter(
            (room) =>
              room.level === currentLevel &&
              (isPointNearPolygonEdge(openingStart, room.points, 20) ||
                isPointNearPolygonEdge(pos, room.points, 20))
          );
          newOpening.connects = connectedRooms.map((r) => r.id);

          pushToHistory(); // Save state before modification
          setOpenings([...openings, newOpening]);
          setOpeningStart(null);
          setSelectedOpening(newOpening.id);
          setHasUnsavedChanges(true);
        } catch (err) {
          errorHandler.handle(err, "Create Opening");
        }
      }
    } else if (mode === "select") {
      // Check openings first (they're smaller targets)
      const clickedOpening = openings.find((op) => {
        if (!showLevels[op.level]) return false;
        const midpoint = {
          x: (op.start.x + op.end.x) / 2,
          y: (op.start.y + op.end.y) / 2,
        };
        return pixelDistance(pos, midpoint) < 15;
      });

      if (clickedOpening) {
        setSelectedOpening(clickedOpening.id);
        setSelectedRoom(null);
        return;
      }

      // Then check rooms
      const clickedRoom = rooms.find((room) => {
        if (!showLevels[room.level]) return false;
        return isPointInPolygon(pos, room.points);
      });
      setSelectedRoom(clickedRoom?.id || null);
      setSelectedOpening(null);
    } else if (mode === "route_test") {
      // Find clicked room for route testing
      const clickedRoom = rooms.find((room) => {
        if (!showLevels[room.level]) return false;
        return isPointInPolygon(pos, room.points);
      });

      if (clickedRoom) {
        if (!routeStart) {
          setRouteStart(clickedRoom.id);
        } else {
          setRouteEnd(clickedRoom.id);
          // Calculate route
          calculateTestRoute(routeStart, clickedRoom.id);
        }
      }
    } else if (mode === "safe_point") {
      // Feature 2: Place safe point
      try {
        const newSafePoint = {
          id: `safe-${Date.now()}`,
          position: pos,
          level: currentLevel,
          name: `Safe Point ${safePoints.length + 1}`,
          capacity: 50, // Default capacity
        };

        pushToHistory();
        setSafePoints([...safePoints, newSafePoint]);
        setSelectedSafePoint(newSafePoint.id);
        setSelectedRoom(null);
        setSelectedOpening(null);
        setHasUnsavedChanges(true);
        errorHandler.info("Safe point placed");
      } catch (err) {
        errorHandler.handle(err, "Place Safe Point");
      }
    } else if (mode === "camera") {
      // Phase 6: Place camera for fire detection
      try {
        // Find if camera is being placed inside a room
        let linkedRoomId: string | undefined = undefined;
        for (const room of rooms) {
          if (room.level === currentLevel && isPointInPolygon(pos, room.points)) {
            linkedRoomId = room.id;
            break;
          }
        }

        const newCamera: Camera = {
          id: `cam-${Date.now()}`,
          position: pos,
          level: currentLevel,
          name: `Camera ${cameras.length + 1}`,
          camera_id: `CAM${String(cameras.length + 1).padStart(3, '0')}`,
          rtsp_url: '',
          is_fire_detection_enabled: true,
          linked_room_id: linkedRoomId,
          rotation: 0,
        };

        pushToHistory();
        setCameras([...cameras, newCamera]);
        setSelectedCamera(newCamera.id);
        setSelectedRoom(null);
        setSelectedOpening(null);
        setSelectedSafePoint(null);
        setHasUnsavedChanges(true);
        errorHandler.info(linkedRoomId ? `Camera placed in room` : "Camera placed");
      } catch (err) {
        errorHandler.handle(err, "Place Camera");
      }
    }
  };

  // Check if point is inside polygon
  const isPointInPolygon = (point, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x,
        yi = polygon[i].y;
      const xj = polygon[j].x,
        yj = polygon[j].y;
      if (
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
      ) {
        inside = !inside;
      }
    }
    return inside;
  };

  // Check if point is near polygon edge
  const isPointNearPolygonEdge = (point, polygon, threshold) => {
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      const dist = pointToLineDistance(point, polygon[i], polygon[j]);
      if (dist < threshold) return true;
    }
    return false;
  };

  // Calculate distance from point to line segment
  const pointToLineDistance = (point, lineStart, lineEnd) => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    return Math.sqrt(Math.pow(point.x - xx, 2) + Math.pow(point.y - yy, 2));
  };

  // Pan and zoom handlers
  const handleMouseDown = (e) => {
    if (mode === "pan" || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // ==================== CALIBRATION ====================

  const completeCalibration = () => {
    try {
      if (
        !calibrationLine?.start ||
        !calibrationLine?.end ||
        !calibrationDistance
      ) {
        errorHandler.warn(
          "Please complete the calibration line and enter a distance"
        );
        return;
      }

      const pixelDist = pixelDistance(
        calibrationLine.start,
        calibrationLine.end
      );
      const realDistMeters = validators.sanitizeNumber(
        calibrationDistance,
        0,
        0.01,
        10000
      );

      if (!validators.isValidDistance(realDistMeters)) {
        errorHandler.warn("Please enter a valid distance (greater than 0)");
        return;
      }

      const calculatedPPM = pixelDist / realDistMeters;
      if (!isFinite(calculatedPPM) || calculatedPPM <= 0) {
        errorHandler.handle(
          new Error("Invalid scale calculation"),
          "Calibration"
        );
        return;
      }

      pushToHistory();
      setPixelsPerMeter(calculatedPPM);
      setScaleCalibrated(true);
      setShowCalibrationModal(false);
      setMode("draw");
      setHasUnsavedChanges(true);
      errorHandler.info(`Scale calibrated: ${calculatedPPM.toFixed(2)} px/m`);
    } catch (err) {
      errorHandler.handle(err, "Calibration");
    }
  };

  const resetCalibration = () => {
    pushToHistory();
    setCalibrationLine(null);
    setCalibrationDistance("");
    setScaleCalibrated(false);
    setMode("calibrate");
    setHasUnsavedChanges(true);
  };

  // ==================== ROOM & OPENING OPERATIONS ====================

  const completePolygon = () => {
    try {
      if (currentPoints.length < 3) {
        errorHandler.warn("Need at least 3 points to create a room");
        return;
      }

      const area = calculateRoomArea(currentPoints);
      const centroid = calculateCentroid(currentPoints);

      // Validate calculated values
      if (!isFinite(area) || area <= 0) {
        errorHandler.warn("Invalid room area calculated");
        return;
      }

      // Feature 3: Use defaultRoomType for corridors
      const newRoom = {
        id: Date.now().toString(),
        name:
          defaultRoomType === "corridor"
            ? `Corridor ${
                rooms.filter((r) => r.room_type === "corridor").length + 1
              }`
            : `Room ${rooms.length + 1}`,
        room_type: defaultRoomType,
        level: currentLevel,
        points: [...currentPoints],
        area_sqm: area,
        centroid: centroid,
      };

      pushToHistory(); // Save state before modification
      setRooms([...rooms, newRoom]);
      setCurrentPoints([]);
      clearPointHistory(); // Feature 4: Clear point history after completing polygon
      setSelectedRoom(newRoom.id);
      setEditingRoom(newRoom.id);
      setHasUnsavedChanges(true);
    } catch (err) {
      errorHandler.handle(err, "Complete Polygon");
    }
  };

  const deleteRoom = (id) => {
    try {
      pushToHistory(); // Save state before modification
      setRooms(rooms.filter((r) => r.id !== id));
      // Also remove openings connected to this room
      setOpenings(
        openings.map((op) => ({
          ...op,
          connects: op.connects.filter((rid) => rid !== id),
        }))
      );
      if (selectedRoom === id) setSelectedRoom(null);
      if (editingRoom === id) setEditingRoom(null);
      setHasUnsavedChanges(true);
    } catch (err) {
      errorHandler.handle(err, "Delete Room");
    }
  };

  const deleteOpening = (id) => {
    try {
      pushToHistory(); // Save state before modification
      setOpenings(openings.filter((op) => op.id !== id));
      if (selectedOpening === id) setSelectedOpening(null);
      setHasUnsavedChanges(true);
    } catch (err) {
      errorHandler.handle(err, "Delete Opening");
    }
  };

  // ==================== SAFE POINT OPERATIONS (Feature 2) ====================

  const updateSafePoint = (id, updates) => {
    try {
      pushToHistory();
      setSafePoints(
        safePoints.map((sp) => (sp.id === id ? { ...sp, ...updates } : sp))
      );
      setHasUnsavedChanges(true);
    } catch (err) {
      errorHandler.handle(err, "Update Safe Point");
    }
  };

  const deleteSafePoint = (id) => {
    try {
      pushToHistory();
      setSafePoints(safePoints.filter((sp) => sp.id !== id));
      if (selectedSafePoint === id) setSelectedSafePoint(null);
      setHasUnsavedChanges(true);
    } catch (err) {
      errorHandler.handle(err, "Delete Safe Point");
    }
  };

  // ==================== CAMERA OPERATIONS (Phase 6) ====================

  const updateCamera = (id: string, updates: Partial<Camera>) => {
    try {
      pushToHistory();
      setCameras(
        cameras.map((cam) => (cam.id === id ? { ...cam, ...updates } : cam))
      );
      setHasUnsavedChanges(true);
    } catch (err) {
      errorHandler.handle(err, "Update Camera");
    }
  };

  const deleteCamera = (id: string) => {
    try {
      pushToHistory();
      setCameras(cameras.filter((cam) => cam.id !== id));
      if (selectedCamera === id) setSelectedCamera(null);
      setHasUnsavedChanges(true);
    } catch (err) {
      errorHandler.handle(err, "Delete Camera");
    }
  };

  const updateRoom = (id, updates) => {
    try {
      pushToHistory(); // Save state before modification
      setRooms(rooms.map((r) => (r.id === id ? { ...r, ...updates } : r)));
      setHasUnsavedChanges(true);
    } catch (err) {
      errorHandler.handle(err, "Update Room");
    }
  };

  const updateOpening = (id, updates) => {
    try {
      pushToHistory(); // Save state before modification
      setOpenings(
        openings.map((op) => (op.id === id ? { ...op, ...updates } : op))
      );
      setHasUnsavedChanges(true);
    } catch (err) {
      errorHandler.handle(err, "Update Opening");
    }
  };

  // ==================== ROUTING GRAPH ====================

  // Build routing graph from rooms and openings
  const buildRoutingGraph = useMemo(() => {
    const nodes = [];
    const edges = [];

    // Create nodes for each room centroid
    rooms.forEach((room) => {
      const geo = pixelToGeo(room.centroid.x, room.centroid.y);
      nodes.push({
        id: room.id,
        name: room.name,
        type: room.room_type,
        level: room.level,
        x: room.centroid.x,
        y: room.centroid.y,
        lat: geo.lat,
        lng: geo.lng,
        is_exit: room.room_type === "exit" || room.room_type === "outdoor",
      });
    });

    // Create nodes for each opening (connection points)
    openings.forEach((op) => {
      const midpoint = {
        x: (op.start.x + op.end.x) / 2,
        y: (op.start.y + op.end.y) / 2,
      };
      const geo = pixelToGeo(midpoint.x, midpoint.y);

      nodes.push({
        id: `opening_${op.id}`,
        name: `${OPENING_TYPES[op.type].label}`,
        type: op.type,
        level: op.level,
        x: midpoint.x,
        y: midpoint.y,
        lat: geo.lat,
        lng: geo.lng,
        is_exit: op.type === "emergency_exit",
      });

      // Create edges from connected rooms to this opening
      op.connects.forEach((roomId) => {
        const room = rooms.find((r) => r.id === roomId);
        if (room) {
          const distance = pixelsToMeters(
            pixelDistance(room.centroid, midpoint)
          );
          edges.push({
            source: roomId,
            target: `opening_${op.id}`,
            distance: distance,
            type: "room_to_opening",
          });
        }
      });
    });

    // Create vertical connections between floors (stairs and elevators)
    // Only connect rooms with type 'stairs' or 'elevator' that have matching names
    const verticalRooms = rooms.filter(
      (r) => r.room_type === "stairs" || r.room_type === "elevator"
    );

    // Group vertical circulation rooms by name
    const verticalGroups = {};
    verticalRooms.forEach((room) => {
      const name = room.name.trim().toLowerCase(); // Normalize name for matching
      if (!verticalGroups[name]) {
        verticalGroups[name] = [];
      }
      verticalGroups[name].push(room);
    });

    // Create vertical edges for matching stairs/elevators across levels
    Object.values(verticalGroups).forEach((roomGroup) => {
      if (roomGroup.length < 2) return; // Need at least 2 levels to connect

      // Sort by level number
      roomGroup.sort((a, b) => Number(a.level) - Number(b.level));

      // Connect adjacent levels
      for (let i = 0; i < roomGroup.length - 1; i++) {
        const room1 = roomGroup[i];
        const room2 = roomGroup[i + 1];
        const levelDiff = Number(room2.level) - Number(room1.level);

        // Calculate vertical distance (3 meters per floor as standard)
        const verticalDistance = levelDiff * 3.0;

        edges.push({
          source: room1.id,
          target: room2.id,
          distance: verticalDistance,
          type: "vertical_connection",
          connection_type: room1.room_type,
          from_level: room1.level,
          to_level: room2.level,
        });
      }
    });

    return { nodes, edges };
  }, [rooms, openings, pixelsPerMeter, buildingLocation]);

  // Simple Dijkstra for route testing
  const calculateTestRoute = (startId, endId) => {
    const { nodes, edges } = buildRoutingGraph;

    // Build adjacency list
    const adj = {};
    nodes.forEach((n) => (adj[n.id] = []));
    edges.forEach((e) => {
      adj[e.source].push({ node: e.target, dist: e.distance });
      adj[e.target].push({ node: e.source, dist: e.distance });
    });

    // Dijkstra
    const dist = {};
    const prev = {};
    const visited = new Set();

    nodes.forEach((n) => (dist[n.id] = Infinity));
    dist[startId] = 0;

    while (visited.size < nodes.length) {
      // Find min distance unvisited node
      let minNode = null;
      let minDist = Infinity;
      Object.keys(dist).forEach((id) => {
        if (!visited.has(id) && dist[id] < minDist) {
          minDist = dist[id];
          minNode = id;
        }
      });

      if (!minNode || minDist === Infinity) break;
      visited.add(minNode);

      // Update neighbors
      adj[minNode]?.forEach(({ node, dist: d }) => {
        if (dist[minNode] + d < dist[node]) {
          dist[node] = dist[minNode] + d;
          prev[node] = minNode;
        }
      });
    }

    // Reconstruct path
    const path = [];
    let current = endId;
    while (current) {
      path.unshift(current);
      current = prev[current];
    }

    if (path[0] === startId) {
      setTestRoute({
        path,
        distance: dist[endId],
        nodes: path.map(
          (id) =>
            nodes.find((n) => n.id === id) || rooms.find((r) => r.id === id)
        ),
      });
    } else {
      setTestRoute({ path: [], distance: Infinity, error: "No path found" });
    }
  };

  const clearTestRoute = () => {
    setTestRoute(null);
    setRouteStart(null);
    setRouteEnd(null);
  };

  // ==================== EXPORT ====================

  const exportGeoJSON = () => {
    try {
      if (rooms.length === 0) {
        errorHandler.warn("No rooms to export. Please draw some rooms first.");
        return null;
      }

      const features = [];

      // Export rooms as polygons
      rooms.forEach((room) => {
        const coordinates = [
          [
            ...room.points.map((p) => {
              const geo = pixelToGeo(p.x, p.y);
              return [geo.lng, geo.lat];
            }),
            (() => {
              const geo = pixelToGeo(room.points[0].x, room.points[0].y);
              return [geo.lng, geo.lat];
            })(),
          ],
        ];

        features.push({
          type: "Feature",
          properties: {
            id: room.id,
            level: room.level,
            name: room.name,
            room_type: room.room_type,
            color: ROOM_TYPES[room.room_type]?.color || "#999999",
            area_sqm: Math.round(room.area_sqm * 100) / 100,
            centroid_lat: pixelToGeo(room.centroid.x, room.centroid.y).lat,
            centroid_lng: pixelToGeo(room.centroid.x, room.centroid.y).lng,
          },
          geometry: {
            type: "Polygon",
            coordinates,
          },
        });
      });

      // Export openings as LineStrings
      openings.forEach((op) => {
        const startGeo = pixelToGeo(op.start.x, op.start.y);
        const endGeo = pixelToGeo(op.end.x, op.end.y);

        features.push({
          type: "Feature",
          properties: {
            id: op.id,
            level: op.level,
            type: "opening",
            opening_type: op.type,
            color: OPENING_TYPES[op.type]?.color || "#999999",
            width_meters: op.width,
            connects_rooms: op.connects,
          },
          geometry: {
            type: "LineString",
            coordinates: [
              [startGeo.lng, startGeo.lat],
              [endGeo.lng, endGeo.lat],
            ],
          },
        });
      });

      // Export vertical connections (stairs/elevators between floors)
      const { edges } = buildRoutingGraph;
      const verticalEdges = edges.filter(
        (e) => e.type === "vertical_connection"
      );

      verticalEdges.forEach((edge, index) => {
        const sourceRoom = rooms.find((r) => r.id === edge.source);
        const targetRoom = rooms.find((r) => r.id === edge.target);

        if (sourceRoom && targetRoom) {
          const sourceGeo = pixelToGeo(
            sourceRoom.centroid.x,
            sourceRoom.centroid.y
          );
          const targetGeo = pixelToGeo(
            targetRoom.centroid.x,
            targetRoom.centroid.y
          );

          features.push({
            type: "Feature",
            properties: {
              id: `vertical_${index}`,
              type: "vertical_connection",
              connection_type: edge.connection_type,
              from_level: edge.from_level,
              to_level: edge.to_level,
              vertical_distance_meters: edge.distance,
              connects_rooms: [edge.source, edge.target],
              color:
                edge.connection_type === "elevator" ? "#FF5722" : "#616161",
            },
            geometry: {
              type: "LineString",
              coordinates: [
                [sourceGeo.lng, sourceGeo.lat],
                [targetGeo.lng, targetGeo.lat],
              ],
            },
          });
        }
      });

      // Feature 2: Export safe points as Points
      safePoints.forEach((sp) => {
        const geo = pixelToGeo(sp.position.x, sp.position.y);

        features.push({
          type: "Feature",
          properties: {
            id: sp.id,
            type: "safe_point",
            is_safe_point: true,
            level: sp.level,
            name: sp.name,
            capacity: sp.capacity,
            color: "#22c55e",
          },
          geometry: {
            type: "Point",
            coordinates: [geo.lng, geo.lat],
          },
        });
      });

      // Phase 6: Export cameras as Points
      cameras.forEach((cam) => {
        const geo = pixelToGeo(cam.position.x, cam.position.y);

        features.push({
          type: "Feature",
          properties: {
            id: cam.id,
            type: "camera",
            is_camera: true,
            level: cam.level,
            name: cam.name,
            camera_id: cam.camera_id,
            rtsp_url: cam.rtsp_url,
            is_fire_detection_enabled: cam.is_fire_detection_enabled,
            linked_room_id: cam.linked_room_id,
            rotation: cam.rotation,
            color: cam.is_fire_detection_enabled ? "#dc2626" : "#6b7280",
          },
          geometry: {
            type: "Point",
            coordinates: [geo.lng, geo.lat],
          },
        });
      });

      const geojson = {
        type: "FeatureCollection",
        properties: {
          building_name: "IGNIS Building",
          center_lat: buildingLocation.lat,
          center_lng: buildingLocation.lng,
          scale_pixels_per_meter: pixelsPerMeter,
          levels: levels,
          generated_at: new Date().toISOString(),
        },
        features,
      };

      const blob = new Blob([JSON.stringify(geojson, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ignis-floor-plan.geojson";
      a.click();
      URL.revokeObjectURL(url);

      errorHandler.info("GeoJSON exported successfully");
      return geojson;
    } catch (err) {
      errorHandler.handle(err, "Export GeoJSON");
      return null;
    }
  };

  // Export routing graph for PgRouting
  const exportRoutingGraph = () => {
    try {
      if (rooms.length === 0) {
        errorHandler.warn("No rooms to export. Please draw some rooms first.");
        return;
      }
      const { nodes, edges } = buildRoutingGraph;

      // Format for PgRouting import
      const pgRoutingData = {
        nodes: nodes.map((n) => ({
          id: n.id,
          name: n.name,
          type: n.type,
          level: n.level,
          geom: `POINT(${n.lng} ${n.lat})`,
          is_exit: n.is_exit,
        })),
        edges: edges.map((e, i) => ({
          id: i + 1,
          source: e.source,
          target: e.target,
          cost: e.distance, // Cost in meters
          reverse_cost: e.distance, // Bidirectional
          opening_type: e.opening_type || null,
        })),
        sql_create_nodes: `
CREATE TABLE IF NOT EXISTS ignis_nodes (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100),
  type VARCHAR(50),
  level VARCHAR(10),
  is_exit BOOLEAN DEFAULT FALSE,
  geom GEOMETRY(Point, 4326)
);`,
        sql_create_edges: `
CREATE TABLE IF NOT EXISTS ignis_edges (
  id SERIAL PRIMARY KEY,
  source VARCHAR(50) REFERENCES ignis_nodes(id),
  target VARCHAR(50) REFERENCES ignis_nodes(id),
  cost DOUBLE PRECISION,
  reverse_cost DOUBLE PRECISION,
  opening_type VARCHAR(50),
  geom GEOMETRY(LineString, 4326)
);`,
      };

      const blob = new Blob([JSON.stringify(pgRoutingData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ignis-routing-graph.json";
      a.click();
      URL.revokeObjectURL(url);

      errorHandler.info("Routing graph exported successfully");
    } catch (err) {
      errorHandler.handle(err, "Export Routing Graph");
    }
  };

  // ==================== API UPLOAD TO EMERGENCY SYSTEM (Feature 5) ====================

  const generateGeoJSONForAPI = () => {
    const features = [];

    // Export rooms as polygons
    rooms.forEach((room) => {
      const coordinates = [
        [
          ...room.points.map((p) => {
            const geo = pixelToGeo(p.x, p.y);
            return [geo.lng, geo.lat];
          }),
          (() => {
            const geo = pixelToGeo(room.points[0].x, room.points[0].y);
            return [geo.lng, geo.lat];
          })(),
        ],
      ];

      features.push({
        type: "Feature",
        properties: {
          id: room.id,
          level: room.level,
          name: room.name,
          room_type: room.room_type,
          color: ROOM_TYPES[room.room_type]?.color || "#999999",
          area_sqm: Math.round(room.area_sqm * 100) / 100,
          centroid_lat: pixelToGeo(room.centroid.x, room.centroid.y).lat,
          centroid_lng: pixelToGeo(room.centroid.x, room.centroid.y).lng,
        },
        geometry: {
          type: "Polygon",
          coordinates,
        },
      });
    });

    // Export openings as LineStrings
    openings.forEach((op) => {
      const startGeo = pixelToGeo(op.start.x, op.start.y);
      const endGeo = pixelToGeo(op.end.x, op.end.y);

      features.push({
        type: "Feature",
        properties: {
          id: op.id,
          level: op.level,
          type: "opening",
          opening_type: op.type,
          color: OPENING_TYPES[op.type]?.color || "#999999",
          width_meters: op.width,
          connects_rooms: op.connects,
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [startGeo.lng, startGeo.lat],
            [endGeo.lng, endGeo.lat],
          ],
        },
      });
    });

    // Export safe points as Points
    safePoints.forEach((sp) => {
      const geo = pixelToGeo(sp.position.x, sp.position.y);

      features.push({
        type: "Feature",
        properties: {
          id: sp.id,
          type: "safe_point",
          is_safe_point: true,
          level: sp.level,
          name: sp.name,
          capacity: sp.capacity,
          color: "#22c55e",
        },
        geometry: {
          type: "Point",
          coordinates: [geo.lng, geo.lat],
        },
      });
    });

    // Phase 6: Export cameras as Points
    cameras.forEach((cam) => {
      const geo = pixelToGeo(cam.position.x, cam.position.y);

      features.push({
        type: "Feature",
        properties: {
          id: cam.id,
          type: "camera",
          is_camera: true,
          level: cam.level,
          name: cam.name,
          camera_id: cam.camera_id,
          rtsp_url: cam.rtsp_url,
          is_fire_detection_enabled: cam.is_fire_detection_enabled,
          linked_room_id: cam.linked_room_id,
          rotation: cam.rotation,
          color: cam.is_fire_detection_enabled ? "#dc2626" : "#6b7280",
        },
        geometry: {
          type: "Point",
          coordinates: [geo.lng, geo.lat],
        },
      });
    });

    return {
      type: "FeatureCollection",
      properties: {
        building_name: "IGNIS Building",
        center_lat: buildingLocation.lat,
        center_lng: buildingLocation.lng,
        scale_pixels_per_meter: pixelsPerMeter,
        levels: levels,
        generated_at: new Date().toISOString(),
      },
      features,
    };
  };

  const uploadToEmergencySystem = async () => {
    if (rooms.length === 0) {
      errorHandler.warn("No rooms to upload. Please draw some rooms first.");
      return;
    }

    setIsUploading(true);

    try {
      // Generate GeoJSON
      const geojson = generateGeoJSONForAPI();
      const { nodes, edges } = buildRoutingGraph;

      // Prepare payload
      const payload = {
        building: {
          name: "IGNIS Building",
          center: buildingLocation,
          scale_pixels_per_meter: pixelsPerMeter,
          levels: levels,
          generated_at: new Date().toISOString(),
        },
        rooms: geojson,
        routing: {
          nodes: nodes.map((n) => ({
            id: n.id,
            name: n.name,
            type: n.type,
            level: n.level,
            lat: n.lat,
            lng: n.lng,
            is_exit: n.is_exit,
          })),
          edges: edges.map((e, i) => ({
            id: i + 1,
            source: e.source,
            target: e.target,
            cost: e.distance,
            reverse_cost: e.distance,
            opening_type: e.opening_type || null,
          })),
        },
        safePoints: safePoints.map((sp) => ({
          id: sp.id,
          name: sp.name,
          level: sp.level,
          capacity: sp.capacity,
          coordinates: pixelToGeo(sp.position.x, sp.position.y),
        })),
        cameras: cameras.map((cam) => ({
          id: cam.id,
          name: cam.name,
          camera_id: cam.camera_id,
          rtsp_url: cam.rtsp_url,
          is_fire_detection_enabled: cam.is_fire_detection_enabled,
          linked_room_id: cam.linked_room_id,
          level: cam.level,
          rotation: cam.rotation,
          coordinates: pixelToGeo(cam.position.x, cam.position.y),
        })),
      };

      // Send to Fire Safety API
      const response = await fetch(
        `${API_CONFIG.FIRE_SAFETY_API}${API_CONFIG.ENDPOINTS.UPLOAD_BUILDING}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      errorHandler.info(
        `Building uploaded successfully! ID: ${result.buildingId || "N/A"}`
      );
      setApiConnected(true);

      return result;
    } catch (err) {
      errorHandler.handle(err, "Upload to Emergency System");
      setApiConnected(false);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // ==================== UPLOAD ====================

  const handleImageUpload = (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file
      if (!validators.isValidImageFile(file)) {
        errorHandler.warn(
          "Invalid file. Please upload an image (JPEG, PNG, GIF, WebP, BMP) under 50MB."
        );
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => {
        errorHandler.handle(new Error("Failed to read file"), "Image Upload");
      };
      reader.onload = (event) => {
        const img = new Image();
        img.onerror = () => {
          errorHandler.handle(
            new Error("Failed to load image"),
            "Image Upload"
          );
        };
        img.onload = () => {
          setImageSize({ width: img.width, height: img.height });
          setImage(event.target.result);
          setZoom(1);
          setPan({ x: 0, y: 0 });
          resetCalibration();
          setHasUnsavedChanges(true);
          errorHandler.info(`Image loaded: ${img.width}x${img.height}px`);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      errorHandler.handle(err, "Image Upload");
    }
  };

  const handleGeoJSONImport = (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file type
      if (!file.name.endsWith(".geojson") && !file.name.endsWith(".json")) {
        errorHandler.warn(
          "Please select a valid GeoJSON file (.geojson or .json)"
        );
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => {
        errorHandler.handle(new Error("Failed to read file"), "GeoJSON Import");
      };

      reader.onload = (event) => {
        try {
          const geojson = JSON.parse(event.target.result);

          // Validate GeoJSON structure
          if (
            geojson.type !== "FeatureCollection" ||
            !Array.isArray(geojson.features)
          ) {
            errorHandler.warn(
              "Invalid GeoJSON: Expected FeatureCollection with features array"
            );
            return;
          }

          pushToHistory(); // Save current state before import
          importGeoJSONData(geojson);
          errorHandler.info(
            `Imported ${geojson.features.length} features successfully`
          );
        } catch (parseError) {
          errorHandler.handle(parseError, "GeoJSON Parse");
        }
      };

      reader.readAsText(file);

      // Reset input to allow reimporting same file
      e.target.value = "";
    } catch (err) {
      errorHandler.handle(err, "GeoJSON Import");
    }
  };

  const importGeoJSONData = (geojson) => {
    const importedRooms = [];
    const importedOpenings = [];
    const importedSafePoints = [];
    const importedCameras: Camera[] = [];
    const importedCorridors = [];
    const detectedLevels = new Set();

    // Extract building properties if available
    if (geojson.properties) {
      if (geojson.properties.center_lat && geojson.properties.center_lng) {
        setBuildingLocation({
          lat: geojson.properties.center_lat,
          lng: geojson.properties.center_lng,
        });
      }
      if (geojson.properties.scale_pixels_per_meter) {
        setPixelsPerMeter(geojson.properties.scale_pixels_per_meter);
        setScaleCalibrated(true);
      }
      if (geojson.properties.levels) {
        geojson.properties.levels.forEach((level) => detectedLevels.add(level));
      }
    }

    // Process each feature
    geojson.features.forEach((feature) => {
      const props = feature.properties || {};
      const geom = feature.geometry;

      if (!geom) return;

      // Detect level
      if (props.level) {
        detectedLevels.add(props.level);
      }

      if (geom.type === "Polygon") {
        // Room or Corridor
        const coordinates = geom.coordinates[0]; // Outer ring
        const points = coordinates.slice(0, -1).map((coord) => {
          const pixel = geoToPixel(coord[0], coord[1]);
          return { x: pixel.x, y: pixel.y };
        });

        const roomData = {
          id:
            props.id ||
            `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: props.name || `Imported Room`,
          room_type: props.room_type || "common",
          level: props.level || "1",
          points: points,
          area_sqm: props.area_sqm || calculateRoomArea(points),
          centroid: calculateCentroid(points),
        };

        if (props.room_type === "corridor") {
          importedCorridors.push(roomData);
        } else {
          importedRooms.push(roomData);
        }
      } else if (geom.type === "LineString") {
        // Opening (door, window, etc.) or Vertical Connection
        if (props.type === "opening" || props.opening_type) {
          const coords = geom.coordinates;
          const startPixel = geoToPixel(coords[0][0], coords[0][1]);
          const endPixel = geoToPixel(coords[1][0], coords[1][1]);

          importedOpenings.push({
            id:
              props.id ||
              `opening-${Date.now()}-${Math.random()
                .toString(36)
                .substr(2, 9)}`,
            type: props.opening_type || "door",
            level: props.level || "1",
            start: { x: startPixel.x, y: startPixel.y },
            end: { x: endPixel.x, y: endPixel.y },
            width:
              props.width_meters ||
              OPENING_TYPES[props.opening_type]?.width ||
              0.9,
            connects: props.connects_rooms || [],
          });
        }
      } else if (geom.type === "Point") {
        // Safe Point
        if (props.type === "safe_point" || props.is_safe_point) {
          const pixel = geoToPixel(geom.coordinates[0], geom.coordinates[1]);
          importedSafePoints.push({
            id:
              props.id ||
              `safe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            position: { x: pixel.x, y: pixel.y },
            level: props.level || "1",
            name: props.name || "Safe Point",
            capacity: props.capacity || 50,
          });
        }
        // Phase 6: Camera
        if (props.type === "camera" || props.is_camera) {
          const pixel = geoToPixel(geom.coordinates[0], geom.coordinates[1]);
          importedCameras.push({
            id:
              props.id ||
              `cam-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            position: { x: pixel.x, y: pixel.y },
            level: props.level || "1",
            name: props.name || "Camera",
            camera_id: props.camera_id || `CAM${String(importedCameras.length + 1).padStart(3, '0')}`,
            rtsp_url: props.rtsp_url || "",
            is_fire_detection_enabled: props.is_fire_detection_enabled !== false,
            linked_room_id: props.linked_room_id,
            rotation: props.rotation || 0,
          });
        }
      }
    });

    // Update state
    const allLevels = Array.from(detectedLevels).sort(
      (a, b) => Number(a) - Number(b)
    );
    if (allLevels.length > 0) {
      setLevels(allLevels);
      setShowLevels(Object.fromEntries(allLevels.map((l) => [l, true])));
      setCurrentLevel(allLevels[0]);
    }

    // Merge or replace based on user preference (for now, replace)
    setRooms([...importedRooms, ...importedCorridors]);
    setOpenings(importedOpenings);
    setSafePoints(importedSafePoints);
    setCameras(importedCameras);
    setHasUnsavedChanges(true);
  };
  // ==================== LEVEL MANAGEMENT ====================

  const addLevel = () => {
    const newLevel = (Math.max(...levels.map(Number)) + 1).toString();
    setLevels([...levels, newLevel]);
    setShowLevels({ ...showLevels, [newLevel]: true });
    setCurrentLevel(newLevel);
  };

  const toggleLevelVisibility = (level) => {
    setShowLevels({ ...showLevels, [level]: !showLevels[level] });
  };

  // ==================== RENDER HELPERS ====================

  const getPolygonPath = (points) => {
    if (points.length < 2) return "";
    return (
      points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") +
      " Z"
    );
  };

  const handleZoom = (delta) => {
    setZoom(Math.max(0.25, Math.min(4, zoom + delta)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // ==================== RENDER ====================

  return (
    <div className="h-full bg-cream-50 text-dark-green-800 font-['JetBrains_Mono',monospace] flex flex-col">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-cream-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-dark-green-500 to-dark-green-600 rounded-lg flex items-center justify-center text-lg shadow-md">
              🏠
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-dark-green-600 to-dark-green-500 bg-clip-text text-transparent">
                IGNIS Floor Plan Editor
              </h1>
              <p className="text-xs text-dark-green-500">
                Fire Evacuation System - Building Digitization Tool
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Scale indicator */}
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                scaleCalibrated
                  ? "bg-green-100 border border-green-300 text-green-700"
                  : "bg-yellow-100 border border-yellow-300 text-yellow-700"
              }`}
            >
              <Ruler
                size={16}
                className={
                  scaleCalibrated ? "text-green-600" : "text-yellow-600"
                }
              />
              <span>
                {scaleCalibrated
                  ? `${Math.round(pixelsPerMeter)} px/m`
                  : "Not Calibrated"}
              </span>
            </div>

            <button
              onClick={() => setShowLocationModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-cream-100 rounded-lg text-sm hover:bg-cream-200 transition-colors border border-cream-300"
            >
              <MapPin size={16} className="text-dark-green-600" />
              <span className="text-dark-green-700">Location</span>
            </button>

            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border ${
                showPreview
                  ? "bg-blue-100 border-blue-300 text-blue-700"
                  : "bg-cream-100 border-cream-300 hover:bg-cream-200 text-dark-green-700"
              }`}
            >
              <MapIcon size={16} />
              Preview
            </button>

            {/* Undo/Redo/Save buttons */}
            <div className="flex items-center gap-1 border-l border-cream-300 pl-3 ml-2">
              <button
                onClick={handleUndo}
                disabled={!historyRef.current.canUndo()}
                className="p-2 bg-cream-100 rounded-lg hover:bg-cream-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-dark-green-700"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 size={16} />
              </button>
              <button
                onClick={handleRedo}
                disabled={!historyRef.current.canRedo()}
                className="p-2 bg-cream-100 rounded-lg hover:bg-cream-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-dark-green-700"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 size={16} />
              </button>
              <button
                onClick={saveToLocalStorage}
                className={`p-2 rounded-lg transition-colors ${
                  hasUnsavedChanges
                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                    : "bg-cream-100 hover:bg-cream-200 text-dark-green-700"
                }`}
                title={`Save (Ctrl+S)${
                  lastSaved
                    ? ` - Last saved: ${lastSaved.toLocaleTimeString()}`
                    : ""
                }`}
              >
                <Save size={16} />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => fileInputGeoJSONRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 transition-colors border border-blue-300 rounded-lg text-blue-700"
              >
                <Upload size={16} />
                Import GeoJSON
              </button>
              <button
                onClick={exportGeoJSON}
                disabled={rooms.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-dark-green-500 to-dark-green-600 text-white rounded-l-lg text-sm font-medium hover:from-dark-green-600 hover:to-dark-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <Download size={16} />
                GeoJSON
              </button>
              <button
                onClick={exportRoutingGraph}
                disabled={rooms.length === 0 || openings.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-medium hover:from-purple-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                title="Export routing graph for PgRouting"
              >
                <Route size={16} />
                Routing
              </button>
              {/* Feature 5: Upload to Emergency System */}
              <button
                onClick={uploadToEmergencySystem}
                disabled={rooms.length === 0 || isUploading}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-r-lg text-sm font-medium hover:from-red-600 hover:to-rose-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                title="Upload building data to Emergency Response System"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Target size={16} />
                    To Emergency
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error/Info Notification */}
      {error && (
        <div
          className={`fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border backdrop-blur-sm animate-in slide-in-from-right duration-300 ${
            error.type === "error"
              ? "bg-red-500/20 border-red-500/50 text-red-400"
              : error.type === "warning"
              ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
              : "bg-blue-500/20 border-blue-500/50 text-blue-400"
          }`}
        >
          <AlertCircle size={18} />
          <span className="text-sm">{error.message}</span>
          <button
            onClick={() => setError(null)}
            className="ml-2 hover:opacity-70 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 bg-cream-100/80 border-r border-cream-300 p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Upload */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-dark-green-600 uppercase tracking-wider">
              Floor Plan Image
            </h3>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {/* Hidden file input for GeoJSON import */}
            <input
              ref={fileInputGeoJSONRef}
              type="file"
              accept=".geojson,.json"
              onChange={handleGeoJSONImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white rounded-lg text-sm hover:bg-cream-50 transition-colors border border-dashed border-cream-400 hover:border-dark-green-500"
            >
              <Upload size={18} className="text-dark-green-500" />
              {image ? "Change Image" : "Upload Floor Plan"}
            </button>
          </div>

          {/* Calibration Status */}
          {image && !scaleCalibrated && (
            <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
              <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium mb-2">
                <AlertTriangle size={16} />
                Scale Not Calibrated
              </div>
              <p className="text-xs text-dark-green-600">
                Draw a line between two points and enter the real distance to
                calibrate scale.
              </p>
            </div>
          )}

          {scaleCalibrated && (
            <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                  <Check size={16} />
                  Scale Calibrated
                </div>
                <button
                  onClick={resetCalibration}
                  className="text-xs text-dark-green-600 hover:text-dark-green-800"
                >
                  Reset
                </button>
              </div>
              <p className="text-xs text-dark-green-600 mt-1">
                1 pixel = {(1 / pixelsPerMeter).toFixed(4)} meters
              </p>
            </div>
          )}

          {/* Tools */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-dark-green-600 uppercase tracking-wider">
              Tools
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setMode("calibrate")}
                className={`p-3 rounded-lg transition-all ${
                  mode === "calibrate"
                    ? "bg-yellow-500/20 border-yellow-500 text-yellow-400"
                    : "bg-white border-cream-300 text-dark-green-600 hover:bg-cream-50"
                } border`}
                title="Calibrate Scale"
              >
                <Ruler size={18} className="mx-auto" />
              </button>
              <button
                onClick={() => {
                  setMode("draw");
                  setDefaultRoomType("common"); // Reset to common room type
                }}
                disabled={!scaleCalibrated}
                className={`p-3 rounded-lg transition-all ${
                  mode === "draw" && defaultRoomType !== "corridor"
                    ? "bg-dark-green-500/20 border-dark-green-500 text-dark-green-600"
                    : "bg-white border-cream-300 text-dark-green-600 hover:bg-cream-50"
                } border disabled:opacity-50`}
                title="Draw Room"
              >
                <Edit3 size={18} className="mx-auto" />
              </button>
              <button
                onClick={() => setMode("door")}
                disabled={!scaleCalibrated}
                className={`p-3 rounded-lg transition-all ${
                  mode === "door"
                    ? "bg-green-500/20 border-green-500 text-green-400"
                    : "bg-white border-cream-300 text-dark-green-600 hover:bg-cream-50"
                } border disabled:opacity-50`}
                title="Add Door/Window"
              >
                <DoorOpen size={18} className="mx-auto" />
              </button>
              <button
                onClick={() => setMode("select")}
                className={`p-3 rounded-lg transition-all ${
                  mode === "select"
                    ? "bg-dark-green-500/20 border-dark-green-500 text-dark-green-600"
                    : "bg-white border-cream-300 text-dark-green-600 hover:bg-cream-50"
                } border`}
                title="Select"
              >
                <Move size={18} className="mx-auto" />
              </button>
              <button
                onClick={() => setMode("pan")}
                className={`p-3 rounded-lg transition-all ${
                  mode === "pan"
                    ? "bg-dark-green-500/20 border-dark-green-500 text-dark-green-600"
                    : "bg-white border-cream-300 text-dark-green-600 hover:bg-cream-50"
                } border`}
                title="Pan"
              >
                <Move size={18} className="mx-auto rotate-45" />
              </button>
              <button
                onClick={() => {
                  setMode("route_test");
                  clearTestRoute();
                }}
                disabled={openings.length === 0}
                className={`p-3 rounded-lg transition-all ${
                  mode === "route_test"
                    ? "bg-purple-500/20 border-purple-500 text-purple-400"
                    : "bg-white border-cream-300 text-dark-green-600 hover:bg-cream-50"
                } border disabled:opacity-50`}
                title="Test Route"
              >
                <Route size={18} className="mx-auto" />
              </button>
              {/* Feature 2: Safe Point Mode */}
              <button
                onClick={() => setMode("safe_point")}
                className={`p-3 rounded-lg transition-all ${
                  mode === "safe_point"
                    ? "bg-green-500/20 border-green-500 text-green-400"
                    : "bg-white border-cream-300 text-dark-green-600 hover:bg-cream-50"
                } border`}
                title="Place Safe Point"
              >
                <Shield size={18} className="mx-auto" />
              </button>
              {/* Phase 6: Camera Mode */}
              <button
                onClick={() => setMode("camera")}
                className={`p-3 rounded-lg transition-all ${
                  mode === "camera"
                    ? "bg-red-500/20 border-red-500 text-red-400"
                    : "bg-white border-cream-300 text-dark-green-600 hover:bg-cream-50"
                } border`}
                title="Place Camera"
              >
                <Video size={18} className="mx-auto" />
              </button>
              {/* Feature 3: Corridor Mode */}
              <button
                onClick={() => {
                  setMode("draw");
                  setDefaultRoomType("corridor");
                }}
                className={`p-3 rounded-lg transition-all ${
                  mode === "draw" && defaultRoomType === "corridor"
                    ? "bg-blue-500/20 border-blue-500 text-blue-400"
                    : "bg-white border-cream-300 text-dark-green-600 hover:bg-cream-50"
                } border`}
                title="Draw Corridor"
              >
                <Navigation size={18} className="mx-auto" />
              </button>
            </div>
          </div>

          {/* Opening Type Selector */}
          {mode === "door" && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-dark-green-500 uppercase tracking-wider">
                Opening Type
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(OPENING_TYPES).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setCurrentOpeningType(key)}
                    className={`p-2 rounded-lg text-xs transition-all ${
                      currentOpeningType === key
                        ? "border-2"
                        : "border border-cream-300"
                    }`}
                    style={{
                      backgroundColor:
                        currentOpeningType === key
                          ? `${val.color}30`
                          : "rgb(30,41,59)",
                      borderColor:
                        currentOpeningType === key ? val.color : undefined,
                      color: currentOpeningType === key ? val.color : undefined,
                    }}
                  >
                    {val.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Zoom Controls */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-dark-green-500 uppercase tracking-wider">
              View
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleZoom(-0.25)}
                className="p-2 bg-white rounded-lg hover:bg-cream-100"
              >
                <ZoomOut size={16} />
              </button>
              <span className="flex-1 text-center text-sm text-dark-green-600">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => handleZoom(0.25)}
                className="p-2 bg-white rounded-lg hover:bg-cream-100"
              >
                <ZoomIn size={16} />
              </button>
              <button
                onClick={resetView}
                className="p-2 bg-white rounded-lg hover:bg-cream-100"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          {/* Levels */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-dark-green-500 uppercase tracking-wider">
                Levels
              </h3>
              <button
                onClick={addLevel}
                className="p-1 hover:bg-cream-100 rounded"
              >
                <Plus size={14} className="text-dark-green-500" />
              </button>
            </div>
            <div className="space-y-1">
              {levels.map((level) => (
                <div
                  key={level}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    currentLevel === level
                      ? "bg-orange-500/20 border border-orange-500/50"
                      : "bg-white border border-transparent hover:bg-cream-100"
                  }`}
                  onClick={() => setCurrentLevel(level)}
                >
                  <div className="flex items-center gap-2">
                    <Layers
                      size={14}
                      className={
                        currentLevel === level
                          ? "text-dark-green-500"
                          : "text-dark-green-500"
                      }
                    />
                    <span className="text-sm">Level {level}</span>
                    <span className="text-xs text-dark-green-500">
                      ({rooms.filter((r) => r.level === level).length} rooms)
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLevelVisibility(level);
                    }}
                    className="p-1 hover:bg-cream-200 rounded"
                  >
                    {showLevels[level] ? (
                      <Eye size={14} />
                    ) : (
                      <EyeOff size={14} className="text-dark-green-500" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Current Drawing */}
          {currentPoints.length > 0 && (
            <div className="space-y-2 p-3 bg-dark-green-500/10 rounded-lg border border-dark-green-500/30">
              <h3 className="text-xs font-semibold text-dark-green-500 uppercase">
                Drawing {defaultRoomType === "corridor" ? "Corridor" : "Room"}
              </h3>
              <p className="text-xs text-dark-green-600">
                {currentPoints.length} points
              </p>
              {/* Feature 4: Point-level Undo/Redo buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleUndoPoint}
                  disabled={currentPoints.length === 0}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-cream-100 rounded text-xs font-medium hover:bg-cream-200 disabled:opacity-50"
                  title="Undo last point (Ctrl+Z)"
                >
                  <Undo2 size={12} /> Undo Point
                </button>
                <button
                  onClick={handleRedoPoint}
                  disabled={pointHistoryIndex >= pointHistory.length - 1}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-cream-100 rounded text-xs font-medium hover:bg-cream-200 disabled:opacity-50"
                  title="Redo point (Ctrl+Shift+Z)"
                >
                  <Redo2 size={12} /> Redo Point
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={completePolygon}
                  disabled={currentPoints.length < 3}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 rounded text-xs font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  <Check size={14} /> Complete
                </button>
                <button
                  onClick={cancelDrawing}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-cream-100 rounded text-xs font-medium hover:bg-cream-200"
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Opening Drawing */}
          {openingStart && (
            <div className="space-y-2 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
              <h3 className="text-xs font-semibold text-green-400 uppercase">
                Drawing {OPENING_TYPES[currentOpeningType].label}
              </h3>
              <p className="text-xs text-dark-green-600">Click to place end point</p>
              <button
                onClick={() => setOpeningStart(null)}
                className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-cream-100 rounded text-xs font-medium hover:bg-cream-200"
              >
                <X size={14} /> Cancel
              </button>
            </div>
          )}

          {/* Route Testing */}
          {mode === "route_test" && (
            <div className="space-y-2 p-3 bg-purple-500/10 rounded-lg border border-purple-500/30">
              <h3 className="text-xs font-semibold text-purple-400 uppercase">
                Route Testing
              </h3>
              <p className="text-xs text-dark-green-600">
                {!routeStart
                  ? "Click a room to set START"
                  : !routeEnd
                  ? "Click a room to set END"
                  : "Route calculated"}
              </p>
              {testRoute && (
                <div className="text-xs space-y-1">
                  {testRoute.error ? (
                    <p className="text-red-400">{testRoute.error}</p>
                  ) : (
                    <>
                      <p className="text-green-400">
                        Distance: {testRoute.distance.toFixed(2)}m
                      </p>
                      <p className="text-dark-green-600">
                        Via: {testRoute.path.length} nodes
                      </p>
                    </>
                  )}
                </div>
              )}
              <button
                onClick={clearTestRoute}
                className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-cream-100 rounded text-xs font-medium hover:bg-cream-200"
              >
                <RotateCcw size={14} /> Reset
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="mt-auto p-3 bg-white/50 rounded-lg text-xs text-dark-green-500 space-y-1">
            <p>
              <strong className="text-dark-green-600">Rooms:</strong> {rooms.length}
            </p>
            <p>
              <strong className="text-dark-green-600">Openings:</strong>{" "}
              {openings.length}
            </p>
            <p>
              <strong className="text-dark-green-600">Total Area:</strong>{" "}
              {rooms.reduce((sum, r) => sum + r.area_sqm, 0).toFixed(1)} m²
            </p>
          </div>
        </aside>

        {/* Main Canvas */}
        <main
          ref={containerRef}
          className="flex-1 overflow-hidden bg-cream-200 relative"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {!image ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-24 h-24 mx-auto bg-white rounded-2xl flex items-center justify-center">
                  <Upload size={40} className="text-dark-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-dark-green-600">
                    No Floor Plan Uploaded
                  </h2>
                  <p className="text-sm text-dark-green-400">
                    Upload an image to start digitizing
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-gradient-to-r from-dark-green-500 to-dark-green-600 rounded-lg text-sm font-medium hover:from-dark-green-600 hover:to-dark-green-700"
                >
                  Upload Floor Plan
                </button>
              </div>
            </div>
          ) : (
            <svg
              ref={canvasRef}
              className="w-full h-full"
              style={{
                cursor:
                  mode === "pan" || isPanning
                    ? "grabbing"
                    : mode === "calibrate"
                    ? "crosshair"
                    : mode === "draw"
                    ? "crosshair"
                    : mode === "door"
                    ? "crosshair"
                    : "pointer",
              }}
              onClick={handleCanvasClick}
            >
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* Floor plan image */}
                <image
                  href={image}
                  x="0"
                  y="0"
                  width={imageSize.width}
                  height={imageSize.height}
                  style={{ opacity: 0.8 }}
                />

                {/* Calibration line */}
                {calibrationLine?.start && (
                  <>
                    <line
                      x1={calibrationLine.start.x}
                      y1={calibrationLine.start.y}
                      x2={calibrationLine.end?.x || calibrationLine.start.x}
                      y2={calibrationLine.end?.y || calibrationLine.start.y}
                      stroke="#facc15"
                      strokeWidth={3}
                      strokeDasharray={calibrationLine.end ? "0" : "5,5"}
                    />
                    <circle
                      cx={calibrationLine.start.x}
                      cy={calibrationLine.start.y}
                      r={8 / zoom}
                      fill="#facc15"
                      stroke="#000"
                      strokeWidth={2 / zoom}
                    />
                    {calibrationLine.end && (
                      <circle
                        cx={calibrationLine.end.x}
                        cy={calibrationLine.end.y}
                        r={8 / zoom}
                        fill="#facc15"
                        stroke="#000"
                        strokeWidth={2 / zoom}
                      />
                    )}
                  </>
                )}

                {/* Rooms */}
                {rooms
                  .filter((r) => showLevels[r.level])
                  .map((room) => (
                    <g key={room.id}>
                      <path
                        d={getPolygonPath(room.points)}
                        fill={
                          ROOM_TYPES[room.room_type]?.bg ||
                          "rgba(150,150,150,0.3)"
                        }
                        stroke={
                          selectedRoom === room.id
                            ? "#f97316"
                            : routeStart === room.id
                            ? "#a855f7"
                            : routeEnd === room.id
                            ? "#22c55e"
                            : ROOM_TYPES[room.room_type]?.color || "#999"
                        }
                        strokeWidth={
                          selectedRoom === room.id ||
                          routeStart === room.id ||
                          routeEnd === room.id
                            ? 3
                            : 2
                        }
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (mode === "select") setSelectedRoom(room.id);
                        }}
                      />
                      {/* Room label */}
                      <text
                        x={room.centroid.x}
                        y={room.centroid.y - 8 / zoom}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={12 / zoom}
                        fontWeight="bold"
                        style={{
                          pointerEvents: "none",
                          textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                        }}
                      >
                        {room.name}
                      </text>
                      <text
                        x={room.centroid.x}
                        y={room.centroid.y + 8 / zoom}
                        textAnchor="middle"
                        fill="#94a3b8"
                        fontSize={10 / zoom}
                        style={{ pointerEvents: "none" }}
                      >
                        {room.area_sqm.toFixed(1)} m²
                      </text>
                      {/* Centroid marker */}
                      <circle
                        cx={room.centroid.x}
                        cy={room.centroid.y}
                        r={4 / zoom}
                        fill={ROOM_TYPES[room.room_type]?.color}
                        stroke="#fff"
                        strokeWidth={1 / zoom}
                      />
                    </g>
                  ))}

                {/* Openings */}
                {openings
                  .filter((op) => showLevels[op.level])
                  .map((op) => {
                    const midX = (op.start.x + op.end.x) / 2;
                    const midY = (op.start.y + op.end.y) / 2;
                    return (
                      <g key={op.id}>
                        <line
                          x1={op.start.x}
                          y1={op.start.y}
                          x2={op.end.x}
                          y2={op.end.y}
                          stroke={
                            selectedOpening === op.id
                              ? "#fff"
                              : OPENING_TYPES[op.type]?.color
                          }
                          strokeWidth={selectedOpening === op.id ? 6 : 4}
                          strokeLinecap="round"
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (mode === "select") {
                              setSelectedOpening(op.id);
                              setSelectedRoom(null);
                            }
                          }}
                        />
                        {/* Opening icon */}
                        <circle
                          cx={midX}
                          cy={midY}
                          r={10 / zoom}
                          fill={OPENING_TYPES[op.type]?.color}
                          stroke="#fff"
                          strokeWidth={2 / zoom}
                        />
                        {op.type === "emergency_exit" && (
                          <text
                            x={midX}
                            y={midY + 4 / zoom}
                            textAnchor="middle"
                            fill="#fff"
                            fontSize={12 / zoom}
                            style={{ pointerEvents: "none" }}
                          >
                            !
                          </text>
                        )}
                      </g>
                    );
                  })}

                {/* Safe Points (Feature 2) */}
                {safePoints
                  .filter((sp) => showLevels[sp.level])
                  .map((sp) => (
                    <g key={sp.id}>
                      {/* Outer glow ring */}
                      <circle
                        cx={sp.position.x}
                        cy={sp.position.y}
                        r={24 / zoom}
                        fill="none"
                        stroke="rgba(34, 197, 94, 0.3)"
                        strokeWidth={4 / zoom}
                      />
                      {/* Main safe point circle */}
                      <circle
                        cx={sp.position.x}
                        cy={sp.position.y}
                        r={18 / zoom}
                        fill="rgba(34, 197, 94, 0.2)"
                        stroke="#22c55e"
                        strokeWidth={
                          selectedSafePoint === sp.id ? 3 / zoom : 2 / zoom
                        }
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (mode === "select") {
                            setSelectedSafePoint(sp.id);
                            setSelectedRoom(null);
                            setSelectedOpening(null);
                          }
                        }}
                      />
                      {/* Shield icon in center */}
                      <text
                        x={sp.position.x}
                        y={sp.position.y + 5 / zoom}
                        textAnchor="middle"
                        fill="#22c55e"
                        fontSize={16 / zoom}
                        style={{ pointerEvents: "none" }}
                      >
                        ⛨
                      </text>
                      {/* Label below */}
                      <text
                        x={sp.position.x}
                        y={sp.position.y + 35 / zoom}
                        textAnchor="middle"
                        fill="#22c55e"
                        fontSize={11 / zoom}
                        fontWeight="bold"
                        style={{ pointerEvents: "none" }}
                      >
                        {sp.name}
                      </text>
                      {/* Capacity indicator */}
                      <text
                        x={sp.position.x}
                        y={sp.position.y + 48 / zoom}
                        textAnchor="middle"
                        fill="#86efac"
                        fontSize={9 / zoom}
                        style={{ pointerEvents: "none" }}
                      >
                        Cap: {sp.capacity}
                      </text>
                    </g>
                  ))}

                {/* Phase 6: Cameras */}
                {cameras
                  .filter((cam) => showLevels[cam.level])
                  .map((cam) => (
                    <g key={cam.id}>
                      {/* Camera field of view cone */}
                      <path
                        d={`M ${cam.position.x} ${cam.position.y}
                            L ${cam.position.x + Math.cos((cam.rotation - 30) * Math.PI / 180) * 40 / zoom} ${cam.position.y + Math.sin((cam.rotation - 30) * Math.PI / 180) * 40 / zoom}
                            A ${40 / zoom} ${40 / zoom} 0 0 1 ${cam.position.x + Math.cos((cam.rotation + 30) * Math.PI / 180) * 40 / zoom} ${cam.position.y + Math.sin((cam.rotation + 30) * Math.PI / 180) * 40 / zoom}
                            Z`}
                        fill={cam.is_fire_detection_enabled ? "rgba(239, 68, 68, 0.15)" : "rgba(156, 163, 175, 0.15)"}
                        stroke={cam.is_fire_detection_enabled ? "#ef4444" : "#9ca3af"}
                        strokeWidth={1 / zoom}
                        strokeDasharray={cam.is_fire_detection_enabled ? "none" : "3,3"}
                      />
                      {/* Camera body */}
                      <rect
                        x={cam.position.x - 12 / zoom}
                        y={cam.position.y - 8 / zoom}
                        width={24 / zoom}
                        height={16 / zoom}
                        rx={3 / zoom}
                        fill={cam.is_fire_detection_enabled ? "#dc2626" : "#6b7280"}
                        stroke={selectedCamera === cam.id ? "#fff" : "none"}
                        strokeWidth={2 / zoom}
                        className="cursor-pointer"
                        transform={`rotate(${cam.rotation}, ${cam.position.x}, ${cam.position.y})`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (mode === "select") {
                            setSelectedCamera(cam.id);
                            setSelectedRoom(null);
                            setSelectedOpening(null);
                            setSelectedSafePoint(null);
                          }
                        }}
                      />
                      {/* Camera lens */}
                      <circle
                        cx={cam.position.x + 8 / zoom}
                        cy={cam.position.y}
                        r={4 / zoom}
                        fill="#1f2937"
                        stroke="#374151"
                        strokeWidth={1 / zoom}
                        style={{ pointerEvents: "none" }}
                        transform={`rotate(${cam.rotation}, ${cam.position.x}, ${cam.position.y})`}
                      />
                      {/* Camera ID label */}
                      <text
                        x={cam.position.x}
                        y={cam.position.y + 25 / zoom}
                        textAnchor="middle"
                        fill={cam.is_fire_detection_enabled ? "#ef4444" : "#6b7280"}
                        fontSize={10 / zoom}
                        fontWeight="bold"
                        style={{ pointerEvents: "none" }}
                      >
                        {cam.camera_id}
                      </text>
                      {/* Fire detection indicator */}
                      {cam.is_fire_detection_enabled && (
                        <circle
                          cx={cam.position.x + 10 / zoom}
                          cy={cam.position.y - 10 / zoom}
                          r={4 / zoom}
                          fill="#22c55e"
                          stroke="#fff"
                          strokeWidth={1 / zoom}
                        />
                      )}
                    </g>
                  ))}

                {/* Current drawing points */}
                {currentPoints.length > 0 && (
                  <g>
                    <path
                      d={currentPoints
                        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                        .join(" ")}
                      fill="none"
                      stroke="#f97316"
                      strokeWidth={2}
                      strokeDasharray="5,5"
                    />
                    {currentPoints.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={6 / zoom}
                        fill="#f97316"
                        stroke="#fff"
                        strokeWidth={2 / zoom}
                      />
                    ))}
                  </g>
                )}

                {/* Opening start point */}
                {openingStart && (
                  <circle
                    cx={openingStart.x}
                    cy={openingStart.y}
                    r={8 / zoom}
                    fill={OPENING_TYPES[currentOpeningType]?.color}
                    stroke="#fff"
                    strokeWidth={2 / zoom}
                  />
                )}

                {/* Test route visualization */}
                {testRoute?.path?.length > 1 && (
                  <g>
                    {testRoute.nodes.slice(0, -1).map((node, i) => {
                      const nextNode = testRoute.nodes[i + 1];
                      if (!node || !nextNode) return null;
                      const startPt = node.centroid || { x: node.x, y: node.y };
                      const endPt = nextNode.centroid || {
                        x: nextNode.x,
                        y: nextNode.y,
                      };
                      return (
                        <line
                          key={i}
                          x1={startPt.x}
                          y1={startPt.y}
                          x2={endPt.x}
                          y2={endPt.y}
                          stroke="#a855f7"
                          strokeWidth={4}
                          strokeDasharray="10,5"
                          markerEnd="url(#arrowhead)"
                        />
                      );
                    })}
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                      >
                        <polygon points="0 0, 10 3.5, 0 7" fill="#a855f7" />
                      </marker>
                    </defs>
                  </g>
                )}
              </g>
            </svg>
          )}

          {/* Scale bar */}
          {image && scaleCalibrated && (
            <div className="absolute bottom-4 left-4 bg-cream-50/90 px-3 py-2 rounded-lg border border-cream-300">
              <div className="flex items-center gap-2">
                <div className="w-24 h-1 bg-white relative">
                  <div className="absolute -left-0.5 -top-1 w-0.5 h-3 bg-white" />
                  <div className="absolute -right-0.5 -top-1 w-0.5 h-3 bg-white" />
                </div>
                <span className="text-xs text-dark-green-700">
                  {((24 / pixelsPerMeter) * zoom).toFixed(1)}m
                </span>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <aside className="w-72 bg-cream-50/50 border-l border-cream-200 p-4 overflow-y-auto">
          {showPreview ? (
            // Map Preview
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-dark-green-500 uppercase tracking-wider">
                  Map Preview
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-1 hover:bg-cream-100 rounded"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="bg-white rounded-lg overflow-hidden aspect-square relative">
                {/* Simple SVG preview of the GeoJSON */}
                <svg
                  viewBox={`0 0 ${imageSize.width || 100} ${
                    imageSize.height || 100
                  }`}
                  className="w-full h-full"
                >
                  <rect width="100%" height="100%" fill="#1e293b" />
                  {rooms
                    .filter((r) => showLevels[r.level])
                    .map((room) => (
                      <path
                        key={room.id}
                        d={getPolygonPath(room.points)}
                        fill={ROOM_TYPES[room.room_type]?.bg}
                        stroke={ROOM_TYPES[room.room_type]?.color}
                        strokeWidth={2}
                      />
                    ))}
                  {openings
                    .filter((op) => showLevels[op.level])
                    .map((op) => (
                      <line
                        key={op.id}
                        x1={op.start.x}
                        y1={op.start.y}
                        x2={op.end.x}
                        y2={op.end.y}
                        stroke={OPENING_TYPES[op.type]?.color}
                        strokeWidth={4}
                      />
                    ))}
                </svg>

                {/* Overlay info */}
                <div className="absolute bottom-2 left-2 right-2 bg-cream-50/80 rounded p-2 text-xs">
                  <p className="text-dark-green-600">
                    Center: {buildingLocation.lat.toFixed(4)},{" "}
                    {buildingLocation.lng.toFixed(4)}
                  </p>
                  <p className="text-dark-green-600">
                    Scale: {pixelsPerMeter.toFixed(1)} px/m
                  </p>
                </div>
              </div>

              {/* Routing Graph Stats */}
              <div className="p-3 bg-white rounded-lg space-y-2">
                <h4 className="text-xs font-semibold text-dark-green-600">
                  Routing Graph
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-cream-100/50 rounded p-2">
                    <p className="text-dark-green-500">Nodes</p>
                    <p className="text-lg font-bold text-dark-green-500">
                      {buildRoutingGraph.nodes.length}
                    </p>
                  </div>
                  <div className="bg-cream-100/50 rounded p-2">
                    <p className="text-dark-green-500">Edges</p>
                    <p className="text-lg font-bold text-green-400">
                      {buildRoutingGraph.edges.length}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-dark-green-500">
                  <p>
                    Exit points:{" "}
                    {buildRoutingGraph.nodes.filter((n) => n.is_exit).length}
                  </p>
                </div>
              </div>

              {/* GeoJSON Preview */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-dark-green-600">
                  Sample GeoJSON Output
                </h4>
                <pre className="bg-white rounded p-2 text-xs text-dark-green-600 overflow-auto max-h-48">
                  {JSON.stringify(
                    {
                      type: "Feature",
                      properties: {
                        name: rooms[0]?.name || "Room 1",
                        room_type: rooms[0]?.room_type || "common",
                        area_sqm: rooms[0]?.area_sqm?.toFixed(2) || "0.00",
                      },
                      geometry: {
                        type: "Polygon",
                        coordinates: rooms[0]?.points
                          ? [
                              [
                                ...rooms[0].points.slice(0, 3).map((p) => {
                                  const geo = pixelToGeo(p.x, p.y);
                                  return [
                                    parseFloat(geo.lng.toFixed(6)),
                                    parseFloat(geo.lat.toFixed(6)),
                                  ];
                                }),
                                "...",
                              ],
                            ]
                          : [],
                      },
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>
          ) : (
            // Room/Opening/Safe Point/Camera Properties
            <>
              <h3 className="text-xs font-semibold text-dark-green-500 uppercase tracking-wider mb-4">
                {selectedCamera
                  ? "Camera Properties"
                  : selectedSafePoint
                  ? "Safe Point Properties"
                  : selectedOpening
                  ? "Opening Properties"
                  : "Room Properties"}
              </h3>

              {selectedCamera ? (
                // Camera properties (Phase 6)
                (() => {
                  const camera = cameras.find(
                    (cam) => cam.id === selectedCamera
                  );
                  if (!camera) return null;
                  return (
                    <div className="space-y-4">
                      <div className="p-3 bg-white rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Video size={16} className="text-red-500" />
                            <span className="font-medium text-red-400">
                              {camera.name}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteCamera(camera.id)}
                            className="p-1 hover:bg-red-500/20 rounded text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div>
                          <label className="text-xs text-dark-green-500 block mb-1">
                            Camera Name
                          </label>
                          <input
                            type="text"
                            value={camera.name}
                            onChange={(e) =>
                              updateCamera(camera.id, {
                                name: e.target.value,
                              })
                            }
                            className="w-full bg-cream-100 border border-cream-300 rounded px-2 py-1.5 text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-dark-green-500 block mb-1">
                            Camera ID (for fire-detect)
                          </label>
                          <input
                            type="text"
                            value={camera.camera_id}
                            onChange={(e) =>
                              updateCamera(camera.id, {
                                camera_id: e.target.value,
                              })
                            }
                            className="w-full bg-cream-100 border border-cream-300 rounded px-2 py-1.5 text-sm font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-dark-green-500 block mb-1">
                            RTSP URL
                          </label>
                          <input
                            type="text"
                            value={camera.rtsp_url}
                            placeholder="rtsp://192.168.1.100:8080/stream"
                            onChange={(e) =>
                              updateCamera(camera.id, {
                                rtsp_url: e.target.value,
                              })
                            }
                            className="w-full bg-cream-100 border border-cream-300 rounded px-2 py-1.5 text-sm font-mono text-xs"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-dark-green-500 block mb-1">
                            Rotation (degrees)
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="360"
                            value={camera.rotation}
                            onChange={(e) =>
                              updateCamera(camera.id, {
                                rotation: parseInt(e.target.value),
                              })
                            }
                            className="w-full"
                          />
                          <div className="text-xs text-center text-dark-green-500">
                            {camera.rotation}°
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-dark-green-500 block mb-1">
                            Linked Room
                          </label>
                          <select
                            value={camera.linked_room_id || ""}
                            onChange={(e) =>
                              updateCamera(camera.id, {
                                linked_room_id: e.target.value || undefined,
                              })
                            }
                            className="w-full bg-cream-100 border border-cream-300 rounded px-2 py-1.5 text-sm"
                          >
                            <option value="">No linked room</option>
                            {rooms
                              .filter((r) => r.level === camera.level)
                              .map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-xs text-dark-green-500">
                            Fire Detection Enabled
                          </label>
                          <button
                            onClick={() =>
                              updateCamera(camera.id, {
                                is_fire_detection_enabled: !camera.is_fire_detection_enabled,
                              })
                            }
                            className={`w-10 h-5 rounded-full transition-colors ${
                              camera.is_fire_detection_enabled
                                ? "bg-green-500"
                                : "bg-gray-300"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                                camera.is_fire_detection_enabled
                                  ? "translate-x-5"
                                  : "translate-x-0.5"
                              }`}
                            />
                          </button>
                        </div>

                        <div className="text-xs text-dark-green-500 space-y-1">
                          <p>Level: {camera.level}</p>
                          <p>
                            Position: ({camera.position.x.toFixed(0)},{" "}
                            {camera.position.y.toFixed(0)})
                          </p>
                        </div>

                        <div className={`p-2 border rounded text-xs ${
                          camera.is_fire_detection_enabled
                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                            : "bg-gray-500/10 border-gray-500/30 text-gray-500"
                        }`}>
                          <Video size={12} className="inline mr-1" />
                          {camera.is_fire_detection_enabled
                            ? "Fire detection active - alerts will be sent to ignis-BE"
                            : "Fire detection disabled"}
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : selectedSafePoint ? (
                // Safe Point properties (Feature 2)
                (() => {
                  const safePoint = safePoints.find(
                    (sp) => sp.id === selectedSafePoint
                  );
                  if (!safePoint) return null;
                  return (
                    <div className="space-y-4">
                      <div className="p-3 bg-white rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: "#22c55e" }}
                            />
                            <span className="font-medium text-green-400">
                              {safePoint.name}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteSafePoint(safePoint.id)}
                            className="p-1 hover:bg-red-500/20 rounded text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div>
                          <label className="text-xs text-dark-green-500 block mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            value={safePoint.name}
                            onChange={(e) =>
                              updateSafePoint(safePoint.id, {
                                name: e.target.value,
                              })
                            }
                            className="w-full bg-cream-100 border border-cream-300 rounded px-2 py-1.5 text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-dark-green-500 block mb-1">
                            Capacity (people)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={safePoint.capacity}
                            onChange={(e) =>
                              updateSafePoint(safePoint.id, {
                                capacity: parseInt(e.target.value) || 1,
                              })
                            }
                            className="w-full bg-cream-100 border border-cream-300 rounded px-2 py-1.5 text-sm"
                          />
                        </div>

                        <div className="text-xs text-dark-green-500 space-y-1">
                          <p>Level: {safePoint.level}</p>
                          <p>
                            Position: ({safePoint.position.x.toFixed(0)},{" "}
                            {safePoint.position.y.toFixed(0)})
                          </p>
                        </div>

                        <div className="p-2 bg-green-500/10 border border-green-500/30 rounded text-xs text-green-400">
                          <Shield size={12} className="inline mr-1" />
                          Assembly/muster point for evacuations
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : selectedOpening ? (
                // Opening properties
                (() => {
                  const opening = openings.find(
                    (op) => op.id === selectedOpening
                  );
                  if (!opening) return null;
                  return (
                    <div className="space-y-4">
                      <div className="p-3 bg-white rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{
                                backgroundColor:
                                  OPENING_TYPES[opening.type]?.color,
                              }}
                            />
                            <span className="font-medium">
                              {OPENING_TYPES[opening.type]?.label}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteOpening(opening.id)}
                            className="p-1 hover:bg-red-500/20 rounded text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div>
                          <label className="text-xs text-dark-green-500 block mb-1">
                            Type
                          </label>
                          <select
                            value={opening.type}
                            onChange={(e) =>
                              updateOpening(opening.id, {
                                type: e.target.value,
                              })
                            }
                            className="w-full bg-cream-100 border border-cream-300 rounded px-2 py-1.5 text-sm"
                          >
                            {Object.entries(OPENING_TYPES).map(([key, val]) => (
                              <option key={key} value={key}>
                                {val.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs text-dark-green-500 block mb-1">
                            Width (meters)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={opening.width}
                            onChange={(e) =>
                              updateOpening(opening.id, {
                                width: parseFloat(e.target.value),
                              })
                            }
                            className="w-full bg-cream-100 border border-cream-300 rounded px-2 py-1.5 text-sm"
                          />
                        </div>

                        <div className="text-xs text-dark-green-500">
                          <p>Connects: {opening.connects.length} rooms</p>
                          <p>Level: {opening.level}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : selectedRoom ? (
                // Room properties
                (() => {
                  const room = rooms.find((r) => r.id === selectedRoom);
                  if (!room) return null;
                  return (
                    <div className="space-y-4">
                      <div className="p-3 bg-white rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{
                                backgroundColor:
                                  ROOM_TYPES[room.room_type]?.color,
                              }}
                            />
                            {editingRoom === room.id ? (
                              <input
                                type="text"
                                value={room.name}
                                onChange={(e) =>
                                  updateRoom(room.id, { name: e.target.value })
                                }
                                onBlur={() => setEditingRoom(null)}
                                onKeyDown={(e) =>
                                  e.key === "Enter" && setEditingRoom(null)
                                }
                                className="bg-cream-100 px-2 py-1 rounded text-sm w-32"
                                autoFocus
                              />
                            ) : (
                              <span className="font-medium">{room.name}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditingRoom(room.id)}
                              className="p-1 hover:bg-cream-200 rounded"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => deleteRoom(room.id)}
                              className="p-1 hover:bg-red-500/20 rounded text-red-400"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-dark-green-500 block mb-1">
                            Room Type
                          </label>
                          <select
                            value={room.room_type}
                            onChange={(e) =>
                              updateRoom(room.id, { room_type: e.target.value })
                            }
                            className="w-full bg-cream-100 border border-cream-300 rounded px-2 py-1.5 text-sm"
                          >
                            {Object.entries(ROOM_TYPES).map(([key, val]) => (
                              <option key={key} value={key}>
                                {val.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-cream-100/50 rounded p-2">
                            <p className="text-dark-green-500">Area</p>
                            <p className="font-bold">
                              {room.area_sqm.toFixed(2)} m²
                            </p>
                          </div>
                          <div className="bg-cream-100/50 rounded p-2">
                            <p className="text-dark-green-500">Points</p>
                            <p className="font-bold">{room.points.length}</p>
                          </div>
                        </div>

                        <div className="text-xs text-dark-green-500">
                          <p>Level: {room.level}</p>
                          <p>
                            Centroid: ({room.centroid.x.toFixed(0)},{" "}
                            {room.centroid.y.toFixed(0)})
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                // Room list
                <div className="space-y-2">
                  {rooms.filter((r) => r.level === currentLevel).length ===
                  0 ? (
                    <div className="text-center py-8 text-dark-green-400 text-sm">
                      No rooms on Level {currentLevel}.<br />
                      {scaleCalibrated
                        ? "Start drawing to add rooms."
                        : "Calibrate scale first."}
                    </div>
                  ) : (
                    rooms
                      .filter((r) => r.level === currentLevel)
                      .map((room) => (
                        <div
                          key={room.id}
                          className="p-3 bg-white/50 rounded-lg border border-cream-300 hover:bg-white cursor-pointer transition-all"
                          onClick={() => setSelectedRoom(room.id)}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor:
                                  ROOM_TYPES[room.room_type]?.color,
                              }}
                            />
                            <span className="text-sm font-medium">
                              {room.name}
                            </span>
                            <span className="text-xs text-dark-green-500 ml-auto">
                              {room.area_sqm.toFixed(1)} m²
                            </span>
                          </div>
                        </div>
                      ))
                  )}

                  {/* Openings list */}
                  {openings.filter((op) => op.level === currentLevel).length >
                    0 && (
                    <>
                      <h4 className="text-xs font-semibold text-dark-green-500 uppercase tracking-wider mt-4 mb-2">
                        Openings
                      </h4>
                      {openings
                        .filter((op) => op.level === currentLevel)
                        .map((op) => (
                          <div
                            key={op.id}
                            className="p-2 bg-white/50 rounded-lg border border-cream-300 hover:bg-white cursor-pointer transition-all flex items-center gap-2"
                            onClick={() => {
                              setSelectedOpening(op.id);
                              setSelectedRoom(null);
                            }}
                          >
                            <div
                              className="w-3 h-3 rounded"
                              style={{
                                backgroundColor: OPENING_TYPES[op.type]?.color,
                              }}
                            />
                            <span className="text-xs">
                              {OPENING_TYPES[op.type]?.label}
                            </span>
                            <span className="text-xs text-dark-green-500 ml-auto">
                              {op.connects.length} rooms
                            </span>
                          </div>
                        ))}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </aside>
      </div>

      {/* Calibration Modal */}
      {showCalibrationModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-cream-50 rounded-xl p-6 w-96 border border-cream-300">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Ruler className="text-yellow-400" size={20} />
              Calibrate Scale
            </h2>
            <p className="text-sm text-dark-green-600 mb-4">
              Enter the real-world distance (in meters) between the two points
              you marked.
            </p>
            <div className="space-y-4">
              <div className="p-3 bg-white rounded-lg text-sm">
                <p className="text-dark-green-500">Line length in pixels:</p>
                <p className="text-lg font-bold text-yellow-400">
                  {calibrationLine?.start && calibrationLine?.end
                    ? pixelDistance(
                        calibrationLine.start,
                        calibrationLine.end
                      ).toFixed(1)
                    : 0}{" "}
                  px
                </p>
              </div>
              <div>
                <label className="text-xs text-dark-green-500 block mb-1">
                  Real Distance (meters)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={calibrationDistance}
                  onChange={(e) => setCalibrationDistance(e.target.value)}
                  placeholder="e.g., 5.0"
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2"
                  autoFocus
                />
              </div>
              {calibrationDistance && (
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30 text-sm">
                  <p className="text-green-400">Calculated scale:</p>
                  <p className="text-lg font-bold text-green-400">
                    {(
                      pixelDistance(
                        calibrationLine.start,
                        calibrationLine.end
                      ) / parseFloat(calibrationDistance)
                    ).toFixed(2)}{" "}
                    pixels/meter
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCalibrationModal(false);
                  setCalibrationLine(null);
                }}
                className="flex-1 px-4 py-2 bg-cream-100 rounded-lg hover:bg-cream-200"
              >
                Cancel
              </button>
              <button
                onClick={completeCalibration}
                disabled={
                  !calibrationDistance || parseFloat(calibrationDistance) <= 0
                }
                className="flex-1 px-4 py-2 bg-gradient-to-r from-dark-green-500 to-dark-green-600 rounded-lg hover:from-dark-green-600 hover:to-dark-green-700 disabled:opacity-50"
              >
                Calibrate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-cream-50 rounded-xl p-6 w-96 border border-cream-300">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="text-dark-green-500" size={20} />
              Building Location
            </h2>
            <p className="text-sm text-dark-green-600 mb-4">
              Set the center coordinates of your building for accurate GeoJSON
              output.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-dark-green-500 block mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={buildingLocation.lat}
                  onChange={(e) =>
                    setBuildingLocation({
                      ...buildingLocation,
                      lat: parseFloat(e.target.value),
                    })
                  }
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="text-xs text-dark-green-500 block mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={buildingLocation.lng}
                  onChange={(e) =>
                    setBuildingLocation({
                      ...buildingLocation,
                      lng: parseFloat(e.target.value),
                    })
                  }
                  className="w-full bg-white border border-cream-300 rounded px-3 py-2"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLocationModal(false)}
                className="flex-1 px-4 py-2 bg-cream-100 rounded-lg hover:bg-cream-200"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowLocationModal(false)}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-dark-green-500 to-dark-green-600 rounded-lg hover:from-dark-green-600 hover:to-dark-green-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
