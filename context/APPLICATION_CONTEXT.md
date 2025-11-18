# Ignis Application Context & Architecture

**Last Updated:** November 8, 2025  
**Version:** 2.0.0  
**Status:** All features implemented and functional ✅

## Overview

Ignis is a comprehensive fire safety and building management system designed to protect residents and manage emergency responses efficiently. The application serves three distinct user roles with specialized dashboards and features.

---

## User Roles & Access Control

### 1. **Building Authority (Admin)**
- **Role ID:** `building_authority`
- **Primary Functions:**
  - Full CRUD operations for Residents
  - Full CRUD operations for Fire Sensors
  - Full CRUD operations for Buildings
  - View all alerts and system status
  - Access emergency response interface
- **Dashboard Route:** `/admin`

### 2. **Resident (User)**
- **Role ID:** `resident`
- **Primary Functions:**
  - View apartment information
  - Receive alerts and notifications
  - View fire safety status
  - Access emergency response interface
- **Dashboard Route:** `/resident`

### 3. **Firefighter (Emergency Responder)**
- **Role ID:** `firefighter`
- **Primary Functions:**
  - View all active fire locations
  - Monitor real-time fire spread
  - Access building layouts and occupant locations
  - Coordinate emergency response
  - Access emergency response interface
- **Dashboard Route:** `/firefighter`

---

## Application Structure

### Implementation Status
**Current Version:** All pages implemented and functional ✅
- ✅ Login page with auto-login by role selection
- ✅ Signup page with role-based registration
- ✅ Admin dashboard with statistics and quick access
- ✅ Admin CRUD pages (residents, sensors, buildings)
- ✅ Resident dashboard with apartment info and alerts
- ✅ Resident sub-pages (apartment details, alerts)
- ✅ Firefighter dashboard with active fire incidents
- ✅ Firefighter sub-pages (fire incident management)
- ✅ Emergency response page with interactive map and AI agent
- ✅ Role-based navigation with logout functionality
- 🔄 Reusable components library (optional enhancement)

### Authentication Flow
1. User lands on `/login` page
2. Selects role by clicking on role card (Building Authority, Resident, or Firefighter)
3. System automatically logs in with predefined credentials (no password input required)
4. System validates and redirects to role-specific dashboard
5. AuthContext maintains session state
6. Navigation header shows role-specific menu items
7. User can logout from navigation menu

### Page Structure

```
/                   → Home (redirects to login or role dashboard) ✅
/login              → Authentication page (auto-login by role selection) ✅
/signup             → Registration page (multi-role) ✅
/admin              → Building Authority Dashboard ✅
  /admin/residents  → Resident Management (CRUD) ✅
  /admin/sensors    → Sensor Management (CRUD) ✅
  /admin/buildings  → Building Management (CRUD) ✅
/resident           → Resident Dashboard ✅
  /resident/apartment → Apartment Details ✅
  /resident/alerts  → Alerts & Notifications ✅
/firefighter        → Firefighter Dashboard ✅
  /firefighter/fires → Active Fire Locations ✅
/emergency          → Emergency Response Page (All Roles) ✅
```

**Navigation Structure (Role-Based):**
- **Admin:** Dashboard, Residents, Sensors, Buildings, Emergency, Logout
- **Resident:** Dashboard, Apartment, Alerts, Emergency, Logout
- **Firefighter:** Dashboard, Active Fires, Emergency, Logout

---

## Core Features

### Emergency Response Page (`/emergency`) ✅
**Available to:** All authenticated users  
**Status:** Fully implemented with interactive features

**Components:**
1. **Building Map Viewer**
   - Interactive floor plan visualization (500px height)
   - Floor selector (buttons 1-5)
   - 4x4 grid layout representing building structure
   - Real-time fire location markers (red flame icons with pulsing animation)
   - Occupant location markers (color-coded by status)
     - Green: Safe
     - Yellow: Evacuating
     - Red: Needs Help
   - Room labels for fire locations
   - Statistics panel (active fires, evacuating, safe counts)

2. **AI Agent Interface**
   - Floating chat button (bottom-right corner, 16x16 size)
   - Expandable chat window (400px width, 500px height)
   - Predefined emergency messages (5 messages)
   - Smooth expand/collapse animations
   - Emergency status updates

3. **Legend & Info**
   - Fire marker explanation
   - Occupant status color coding
   - Interactive tooltips

**Data Structure:**
```typescript
interface FireLocation {
  id: string;
  floor: number;
  room: string;
  intensity: 'low' | 'medium' | 'high';
  timestamp: Date;
  coordinates: { x: number; y: number };
}

interface OccupantLocation {
  id: string;
  name: string;
  floor: number;
  room: string;
  status: 'safe' | 'evacuating' | 'needs_help';
  coordinates: { x: number; y: number };
}
```

### Building Authority Dashboard (`/admin`) ✅
**Status:** Main dashboard implemented with statistics and quick access buttons

**Current Features:**
- 4 statistics cards with animated counts:
  - Total Residents: 5
  - Active Sensors: 5
  - Buildings: 3
  - Active Alerts: 3
- 3 quick access buttons:
  - Manage Residents (links to /admin/residents)
  - Manage Sensors (links to /admin/sensors)
  - Manage Buildings (links to /admin/buildings)
- Role-based access control
- Animated entrance with framer-motion

### Building Authority CRUD Pages ✅

**Resident Management (`/admin/residents`):**
- Full CRUD operations with modal forms
- Search functionality by name, email, or apartment
- Table view with sortable columns
- Status indicators (active/inactive)
- Fields: name, email, phone, apartment number, floor, building, emergency contact, status
- Real-time add, edit, delete operations
```typescript
interface Resident {
  id: string;
  name: string;
  email: string;
  phone: string;
  apartmentNumber: string;
  floor: number;
  building: string;
  emergencyContact: string;
  moveInDate: Date;
  status: 'active' | 'inactive';
}
```

**Sensor Management (`/admin/sensors`):**
- Full CRUD operations with modal forms
- Search functionality by location, type, or building
- Table view with sensor icons
- Battery level indicators with progress bars
- Status badges (active/inactive/maintenance)
- Fields: type (smoke/heat/co2/sprinkler), location, floor, building, battery level, sensitivity, status
- Real-time monitoring capabilities
```typescript
interface Sensor {
  id: string;
  type: 'smoke' | 'heat' | 'co2' | 'sprinkler';
  location: string;
  floor: number;
  building: string;
  status: 'active' | 'inactive' | 'maintenance';
  lastChecked: Date;
  batteryLevel?: number;
  sensitivity: 'low' | 'medium' | 'high';
}
```

**Building Management (`/admin/buildings`):**
- Full CRUD operations with modal forms
- Search functionality by name or address
- Card-based grid view
- Status indicators (operational/maintenance/emergency)
- Fields: name, address, floors, apartments, sensors, residents, emergency exits, status
- Last inspection date tracking
- Visual statistics for each building
```typescript
interface Building {
  id: string;
  name: string;
  address: string;
  floors: number;
  apartments: number;
  sensors: number;
  residents: number;
  emergencyExits: number;
  lastInspection: Date;
  status: 'operational' | 'maintenance' | 'emergency';
}
```

### Resident Dashboard (`/resident`) ✅
**Status:** Main dashboard implemented with apartment info and alerts

**Current Features:**
- Apartment information card:
  - Apartment number (A-101)
  - Floor (Floor 1)
  - Building (Tower A)
  - Safety score (95%)
  - Last inspection date
  - Active sensors count (3)
- Recent alerts section:
  - Unread alerts count
  - Alert cards with priority-based colors:
    - Critical: Red
    - High: Orange
    - Medium: Yellow
    - Low: Blue
  - Timestamp for each alert
- Emergency button (links to /emergency)
- Role-based access control

### Resident Sub-Pages ✅

**Apartment Details (`/resident/apartment`):**
- Complete apartment information display
- Safety score visualization with progress bar
- Active sensors count and status
- Location information (building, floor, unit)
- Individual sensor status cards with battery levels
- Safety systems monitoring:
  - Smoke detector status
  - Heat sensor status
  - CO2 monitor status
- Maintenance schedule with inspection dates
- Emergency information section:
  - Fire evacuation routes
  - Emergency contact numbers
  - Quick access to emergency map

**Alerts & Notifications (`/resident/alerts`):**
- Complete alerts history
- Statistics cards: total alerts, unread count, critical count
- Search functionality
- Filter by: all, unread, high priority, critical
- Alert cards with:
  - Type-based icons
  - Priority color coding (critical/high/medium/low)
  - Timestamp
  - Read/unread status
  - Mark as read functionality
- Mark all as read feature
- Real-time alert updates

**Features:**
- Apartment overview card
- Recent alerts list
- Safety status indicators
- Emergency contact information
- Quick access to emergency page

**Data Structure:**
```typescript
interface ApartmentInfo {
  number: string;
  floor: number;
  building: string;
  sensors: number;
  lastInspection: Date;
  safetyScore: number;
}

interface Alert {
  id: string;
  type: 'fire' | 'smoke' | 'maintenance' | 'info';
  message: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
}
```

### Firefighter Dashboard (`/firefighter`) ✅
**Status:** Main dashboard implemented with active fire incident monitoring

**Current Features:**
- Large incident counter display
  - Shows total active fire incidents
  - Animated number with scale effect
- Fire incident cards:
  - Building name and address
  - Intensity badge (color-coded):
    - Critical: Red
    - Severe: Orange
    - Moderate: Yellow
    - Minor: Green
  - Affected floors list
  - Occupant statistics:
    - Total affected
    - Evacuated count
  - Start time
  - Action buttons:
    - View Details (links to emergency page)
    - Update Status
- Status-based filtering
- Role-based access control

### Firefighter Sub-Pages ✅

**Fire Incident Management (`/firefighter/fires`):**
- Complete fire incident tracking system
- Statistics dashboard:
  - Total incidents count
  - Active fires count
  - Contained fires count
  - Extinguished fires count
- Filter by status (all/active/contained/extinguished)
- Detailed incident cards showing:
  - Building name and address
  - Intensity level with color coding (critical/severe/moderate/minor)
  - Status badge (active/contained/extinguished)
  - Time since incident started
  - Affected floors list
  - Occupants affected vs evacuated
- Action buttons:
  - View on emergency map
  - Update status (active → contained → extinguished)
  - Status progression workflow
- Real-time incident updates
- Empty state for no incidents

**Features:**
- Active fires map view
- Fire intensity indicators
- Building layout quick access
- Occupant count per floor
- Emergency route planning

**Data Structure:**
```typescript
interface FireIncident {
  id: string;
  building: string;
  address: string;
  floors: number[];
  intensity: 'minor' | 'moderate' | 'severe' | 'critical';
  startTime: Date;
  occupantsAffected: number;
  occupantsEvacuated: number;
  status: 'active' | 'contained' | 'extinguished';
}
```

---

## Theme & Design System

### Color Palette
```css
Cream Tones (Backgrounds):
  - cream-50: #fefdf9  (Lightest)
  - cream-100: #fdf8f0
  - cream-200: #faf0e0
  - cream-300: #f5e6c8
  - cream-400: #efd6a3
  - cream-500: #e6c078

Dark Green (Primary):
  - dark-green-50: #f0f9f0
  - dark-green-500: #2d6b2d (Primary buttons)
  - dark-green-600: #1e4a1e (Hover states)
  - dark-green-700: #153a15 (Text)
  - dark-green-800: #0d2b0d (Headers)
  - dark-green-900: #051c05 (Darkest)

Semantic Colors:
  - Success: dark-green-500
  - Warning: #f59e0b (amber)
  - Error: #ef4444 (red)
  - Info: #3b82f6 (blue)
```

### Component Guidelines
- Use `framer-motion` for all animations
- Implement `cream-gradient` for page backgrounds
- Use `green-gradient` for primary action buttons
- Keep animations subtle (scale: 1.02 on hover)
- Maintain consistent spacing (Tailwind spacing scale)

---

## Performance Optimization

### Next.js 15 Features Used
1. **Turbopack:** Enabled for faster builds
2. **Server Components:** Default for static content
3. **Client Components:** Only for interactive features
4. **Route Handlers:** For API endpoints
5. **Metadata API:** For SEO optimization

### Best Practices
- Use `'use client'` directive only when necessary
- Implement dynamic imports for heavy components
- Optimize images with Next.js Image component
- Use React.memo for expensive renders
- Implement proper loading states
- Cache API responses where appropriate

---

## State Management

### AuthContext (`context/AuthContext.tsx`)
```typescript
interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  signup: (data: SignupData) => Promise<void>;
  isAuthenticated: boolean;
}
```

### Future Contexts (To be implemented with backend)
- `NotificationContext`: Real-time alerts
- `EmergencyContext`: Emergency state management
- `SensorContext`: Real-time sensor data
- `MapContext`: Building map state

---

## Backend Integration Guidelines

### API Structure (Ready for implementation)
```typescript
// Authentication
POST /api/auth/login
POST /api/auth/signup
POST /api/auth/logout
GET  /api/auth/me

// Residents (Admin only)
GET    /api/residents
GET    /api/residents/:id
POST   /api/residents
PUT    /api/residents/:id
DELETE /api/residents/:id

// Sensors (Admin only)
GET    /api/sensors
GET    /api/sensors/:id
POST   /api/sensors
PUT    /api/sensors/:id
DELETE /api/sensors/:id

// Buildings (Admin only)
GET    /api/buildings
GET    /api/buildings/:id
POST   /api/buildings
PUT    /api/buildings/:id
DELETE /api/buildings/:id

// Emergency
GET /api/emergency/fires
GET /api/emergency/occupants
GET /api/emergency/map/:buildingId

// Alerts
GET /api/alerts
GET /api/alerts/:userId
POST /api/alerts/mark-read/:id
```

### Data Flow
1. Frontend components fetch data via API routes
2. API routes in `/app/api` directory
3. API routes connect to backend services
4. Real-time updates via WebSocket (future)
5. Optimistic updates for better UX

---

## Mock Data Location

All mock data is stored in: `src/lib/mockData.ts`

This allows easy replacement with real API calls:
```typescript
// Current (Mock)
import { mockResidents } from '@/lib/mockData';

// Future (API)
const residents = await fetch('/api/residents').then(r => r.json());
```

---

## Component Architecture

### Shared Components (`src/components/shared`)
- `Button.tsx`: Primary UI button
- `Header.tsx`: Navigation header
- `PageTransition.tsx`: Page transition wrapper
- `Modal.tsx`: Reusable modal
- `Table.tsx`: Data table component
- `Card.tsx`: Content card
- `Input.tsx`: Form input
- `LoadingSpinner.tsx`: Loading indicator

### Feature Components
- `Map.tsx`: Building map viewer
- `AIAgent.tsx`: Emergency AI assistant
- `CRUDTable.tsx`: Generic CRUD operations
- `AlertCard.tsx`: Alert notification card
- `SensorStatus.tsx`: Sensor status indicator
- `FireMarker.tsx`: Fire location marker
- `OccupantMarker.tsx`: Occupant location marker

---

## Testing Credentials (Mock Data)

**Note:** Auto-login is enabled. Simply click the role card on the login page to automatically log in without entering credentials.

```
Building Authority:
  Email: admin@ignis.com
  Password: admin123
  Auto-login: Click "Building Authority" card
  
Resident:
  Email: resident@ignis.com
  Password: resident123
  Auto-login: Click "Resident" card
  
Firefighter:
  Email: firefighter@ignis.com
  Password: firefighter123
  Auto-login: Click "Firefighter" card
```

---

## Future Enhancements

1. **Real-time Updates:** WebSocket integration
2. **Mobile App:** React Native version
3. **AI Features:** Predictive fire detection
4. **Analytics:** Fire pattern analysis
5. **IoT Integration:** Direct sensor connection
6. **Multi-language:** i18n support
7. **Accessibility:** WCAG 2.1 AA compliance
8. **PWA:** Offline capabilities

---

## Developer Notes

### Adding New Features
1. Update this context document
2. Create TypeScript interfaces in `types/index.ts`
3. Add mock data in `src/lib/mockData.ts`
4. Build components in appropriate directory
5. Create page in `src/app`
6. Update navigation in `Header.tsx`
7. Test with all user roles

### Code Style
- Use TypeScript strictly
- Follow Next.js 15 conventions
- Implement proper error handling
- Add loading states
- Use semantic HTML
- Keep components small and focused
- Write self-documenting code

---

## Contact & Support

For questions about this codebase, refer to:
- This context document
- TypeScript interfaces in `types/index.ts`
- Component documentation in respective files
- Next.js 15 official documentation

---

*This document should be updated whenever significant changes are made to the application structure or features.*
