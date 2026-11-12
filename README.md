# NEXUS 911 — Unified Multi-Agency Emergency Incident Management & Dispatch System

[![React](https://img.shields.io/badge/React-19.0.0-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_Auth-ffca28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Leaflet](https://img.shields.io/badge/GIS-Leaflet_%26_OSM-199900?logo=leaflet&logoColor=white)](https://leafletjs.com/)

**NEXUS 911** is an all-in-one, real-time emergency dispatch and incident management web platform engineered to bridge the gap between residents and primary first-responder agencies: the **Philippine National Police (PNP)**, the **Bureau of Fire Protection (BFP)**, and the **Municipal Disaster Risk Reduction and Management Office (MDRRMO)**.

---

## 🌟 Key Features

### 🏢 Multi-Agency Command Desks
- **Central 911 Operations Command**: Comprehensive provincial and municipal oversight across all active emergencies, dispatch triage, cross-agency statistics, and joint command controls.
- **PNP Police Command Console**: Targeted monitoring and tactical dispatch for criminal offenses, armed threats, public altercations, and neighborhood security.
- **BFP Fire Protection Console**: Dedicated fire dispatch console with alarm classification (1st Alarm to General Alarm), structural/electrical incident monitoring, and hazmat response.
- **MDRRMO Rescue Console**: Specialized console for medical emergencies, vehicular accidents, typhoons, landslides, flooding, and disaster relief coordination.

### 👥 Resident Citizen Portal
- **Rapid Emergency Incident Filing**:
  - Color-coded categorization: **Red** (Critical Emergencies), **Orange** (Accidents & Medical), **Yellow** (Crimes), **Green** (Public Safety), **Blue** (Cyber/Online Scams), and **Gray** (Others).
  - Photo evidence attachment via direct file upload or live camera capture.
  - Interactive pin-drop map with automatic reverse geocoding and Oriental Mindoro barangay selection.
- **Live Incident Tracking**: "My Incident Reports" view with real-time status progression badges (`Pending Verification` → `Accepted / Dispatched` → `Ongoing` → `Resolved` / `Rejected`).
- **One-Click Hotlines**: Instant modal displaying verified hotline numbers for local PNP, BFP, MDRRMO, Red Cross, and Coast Guard units.
- **Notification Drawer**: Real-time notifications that directly navigate and open the full incident dossier when clicked.
- **Mobile-First UX**: Dedicated bottom navigation bar on mobile screens for effortless 1-tap reporting, tracking, and map inspection.

### 🗺️ GIS Incident Mapping & Heatmaps
- Interactive full-screen geospatial map powered by **Leaflet** with multiple layer options (OpenStreetMap, Esri Satellite, CartoDB Dark Matter).
- Color-coded incident markers, clustered density markers, and high-risk thermal heatmaps.
- Detailed popup previews with one-click transition to full incident dossiers.

### 🚨 Real-Time Dispatch Audio Siren
- Integrated **Web Audio API** emergency siren synthesizer that triggers continuous audible alerts when a high-priority **Red Critical Incident** is filed.
- Dismissible and silenceable directly from the command console header or map dossier.

### 🤝 Inter-Agency Mutual Aid & Coordination
- Standardized cross-agency assistance request system allowing commanders to dispatch mutual aid (e.g., BFP requesting PNP perimeter isolation, MDRRMO requesting PNP traffic control).
- Top-level emergency mutual aid access across all agency views.

### 🛡️ Audited Action History & Safe Archive
- **Immutable Audit Trail**: Every status change, unit dispatch, and note is permanently recorded with timestamps, officer name, and agency origin.
- **Mandatory Rejection Archiving**: Incidents rejected as false alarms or duplicates require a documented reason and are moved to a dedicated Archive view.
- **Accidental Archive Restoration**: Features a one-click restore action inside the dossier modal to safely recover mistakenly archived incidents back to the active triage queue.
- **Resolved Incident Safeguards**: Prevents accidental rejection or duplicate assistance requests once an incident has reached the `Resolved` state.

### 🚐 Customizable Fleet & Resource Rosters
- Editable resource management for PNP Patrol Cars, BFP Fire Engines & Water Tankers, and MDRRMO Ambulances.
- Custom dispatch schedules, driver/crew assignments, unit radio callsigns, and duty contact numbers.

### 🌐 Bilingual Localization
- Complete native language toggle supporting **English** and **Filipino (Tagalog)** across resident reporting forms, command consoles, and notification updates.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Mapping & GIS** | [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/) |
| **Realtime Database & Auth** | [Google Firebase / Cloud Firestore](https://firebase.google.com/) |
| **Audio Engine** | Native HTML5 Web Audio API Siren Generator |
| **Linting & Code Quality** | TypeScript Strict Mode (`tsc --noEmit`) |

---

## 📂 Project Structure

```text
Nexus/
├── public/
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── agency/
│   │   │   │   ├── BfpDashboardView.tsx      # BFP Fire Command View & fleet
│   │   │   │   ├── CentralDashboardView.tsx  # Central 911 Operations Command View
│   │   │   │   ├── MdrrmoDashboardView.tsx  # MDRRMO Rescue Command View & fleet
│   │   │   │   ├── PnpDashboardView.tsx     # PNP Police Command View & fleet
│   │   │   │   └── ResourceEditModal.tsx    # Modal to edit fleet & duty rosters
│   │   │   ├── AdminDashboard.tsx           # Command console container & routing
│   │   │   ├── AgencyProfileModal.tsx       # Agency credentials & officer profile
│   │   │   ├── AnalyticsView.tsx            # Incident statistics & response analytics
│   │   │   ├── InterAgencyCoordination.tsx  # Cross-agency mutual aid requests
│   │   │   ├── RejectedReportsArchive.tsx   # Archived incidents & restore view
│   │   │   ├── ReportDetailModal.tsx        # Comprehensive Incident Dossier
│   │   │   ├── ReportTable.tsx              # Sortable, filterable active queue
│   │   │   └── RequestAssistanceModal.tsx   # Dispatch mutual aid modal
│   │   ├── auth/
│   │   │   ├── AgencyAuthModal.tsx          # Agency officer badge sign-in
│   │   │   └── ResidentAuthModal.tsx        # Citizen registration & sign-in
│   │   ├── landing/
│   │   │   └── LandingPage.tsx              # Public welcoming and portal selector
│   │   ├── map/
│   │   │   └── IncidentMapView.tsx          # Leaflet GIS map with heatmaps
│   │   ├── navigation/
│   │   │   └── MobileBottomNav.tsx          # Mobile bottom navigation bar
│   │   ├── resident/
│   │   │   ├── QuickHotlinesModal.tsx       # Emergency contact hotlines
│   │   │   ├── ResidentPortal.tsx           # Incident filing and tracking view
│   │   │   ├── TermsAndConditionsModal.tsx  # Legal disclaimers & 911 policies
│   │   │   └── UserProfileModal.tsx         # Resident profile & address info
│   │   ├── EmergencyAlertBanner.tsx         # Live emergency broadcast banner
│   │   └── Navbar.tsx                       # Adaptive header with notification drawer
│   ├── constants/
│   │   ├── incidentData.ts                  # Incident taxonomy, categories & priority colors
│   │   ├── orientalMindoroData.ts           # Municipalities & barangay directory
│   │   └── translations.ts                  # Bilingual dictionary (EN / FIL)
│   ├── context/
│   │   └── NexusContext.tsx                 # Central state machine & Firestore realtime sync
│   ├── lib/
│   │   └── firebase.ts                      # Firebase SDK configuration & service initialization
│   ├── services/
│   │   └── soundService.ts                  # Web Audio API emergency siren service
│   ├── types/
│   │   └── index.ts                         # Core TypeScript interfaces & types
│   ├── utils/
│   │   └── imageUtils.ts                    # Evidence image optimization & compression
│   ├── App.tsx                              # Application root component
│   ├── index.css                            # Tailwind stylesheet & custom animations
│   └── main.tsx                             # Application entry point
├── .env.example                             # Environment variable template
├── index.html                               # HTML template
├── package.json                             # Dependencies and scripts
├── tsconfig.json                            # TypeScript compiler settings
└── vite.config.ts                           # Vite configuration
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- A [Firebase](https://firebase.google.com/) project with Cloud Firestore and Authentication enabled.

### 1. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/jamestabangay5-creator/Nexus.git
cd Nexus
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory based on `.env.example`:
```bash
cp .env.example .env
```

Populate the `.env` file with your Firebase project credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Development Server
Start the local Vite development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) (or the port specified in terminal output) in your web browser.

### 4. Code Quality & Type Check
Verify that there are zero TypeScript compiler warnings or errors:
```bash
npm run lint
```

### 5. Production Build
Compile and bundle the project for production deployment:
```bash
npm run build
```
The optimized output will be generated in the `dist/` directory, ready to be hosted on **Vercel**, **Netlify**, or **Firebase Hosting**.

---

## 🔒 Security & Data Privacy
- **Client & Field Evidence**: Citizen reports, GPS coordinates, and photos are encrypted in transit and securely synced to Firestore.
- **Audit Compliance**: Status modifications, unit deployments, and incident rejections are bound to the specific administrator account and agency scope.
- **Data Protection**: Personal contact numbers and sensitive reporter identifiers are protected and accessible only to authorized command officers.

---

## 📄 License
This project is developed for emergency management operations and public safety coordination. All rights reserved.

