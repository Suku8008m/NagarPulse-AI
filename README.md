# NagarPulse AI (Civic Grievance Triage System)

> An autonomous full-stack MERN civic intelligence and grievance management system powered by **Gemini 2.5 Flash**, **MongoDB 2dsphere Geospatial Indexing**, **Cloudinary**, and **React Leaflet**.

---

## 🏛️ System Architecture

```
NagarPulse AI
├── server/
│   ├── config/
│   │   ├── db.js             # Mongoose MongoDB connection
│   │   └── cloudinary.js     # Cloudinary media storage with data-URI fallback
│   ├── models/
│   │   └── Grievance.js      # GeoJSON 2dsphere schema & metadata
│   ├── controllers/
│   │   └── grievanceController.js # 50m duplicate detection ($near) + Gemini triage + resolution
│   ├── routes/
│   │   └── grievanceRoutes.js# RESTful endpoints
│   ├── services/
│   │   └── geminiService.js  # Multimodal Gemini Flash triage & Gemini Vision audit
│   ├── middleware/
│   │   └── upload.js         # Multer memory storage (images + voice notes)
│   ├── .env.example          # Environment variables template
│   └── server.js             # Express backend server entrypoint
│
└── client/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx           # Top navigation with live status badges
    │   │   ├── ReportHazard.jsx     # Tab 1: Image, GPS, Voice Note, Gemini Triage
    │   │   ├── PublicDashboard.jsx  # Tab 2: Leaflet severity pins + trackingId search
    │   │   ├── AuthorityPortal.jsx  # Tab 3: "After" photo resolution & Gemini Vision audit
    │   │   ├── AudioRecorder.jsx    # Browser Web Audio API / MediaRecorder
    │   │   └── TriageCard.jsx       # AI breakdown card (severity, department, authenticity)
    │   ├── services/
    │   │   └── api.js               # Axios HTTP client
    │   ├── App.jsx                  # Main application orchestrator
    │   ├── index.css                # Tailwind CSS + Leaflet styles
    │   └── main.jsx                 # React root
    ├── vite.config.js               # Vite config with React & Tailwind plugins
    └── package.json
```

---

## ⚡ Key Capabilities

### 1. 50-Meter Geospatial Duplicate Detection (`$near`)
- Every report checks open grievances (`Pending` or `In Progress`) within a **50-meter radius** using MongoDB's `$near` 2dsphere index.
- If an existing open grievance is found at that location, the system avoids ticket fragmentation, increments the existing ticket's `upvotes`, and alerts the citizen with the matching `trackingId`.

### 2. Multimodal AI Triage (Gemini Flash Structured JSON)
- Analyzes uploaded hazard photos, citizen voice notes (`.webm`), and descriptions simultaneously.
- Returns strict typed JSON:
  - `category`: `Roads`, `Sanitation`, `Water`, `Electrical`, `Other`
  - `severityScore`: 1 (minor) to 10 (emergency hazard)
  - `department`: Automatically mapped to the municipal division (e.g., Road Infrastructure & Bridges, Public Health & Solid Waste, Water Supply & Sewerage Board, Electricity Authority)
  - `isVerifiedAuthentic`: Anti-spam / hoax verification
  - `aiSummary`: 1-2 sentence executive summary

### 3. Gemini Vision Resolution Audit (`PATCH /api/grievances/:id/resolve`)
- When municipal contractors or authorities submit an **"After" photo**, Gemini Vision compares the original **"Before" image** against the **"After" repair image**.
- Evaluates whether the pothole, trash, broken pipe, or loose wire was genuinely remediated, outputs confidence percentage and inspection notes, and updates ticket status to **`Verified Resolved`**.

### 4. Interactive Public Dashboard & Leaflet Map
- Custom colored Leaflet severity pins (Red for 8-10, Amber for 5-7, Green for 1-4, Emerald Checkmark for Resolved).
- Real-time `trackingId` search bar.
- Category & Status filters, sorting by upvotes/severity.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v22.16)
- **MongoDB**: Local MongoDB instance running on `localhost:27017` or MongoDB Atlas URI.
- **Google Gemini API Key**: [Google AI Studio](https://aistudio.google.com/)

---

### 2. Server Setup

```bash
cd server
cp .env.example .env
```

Edit `.env` with your credentials:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/nagarpulse_ai
GEMINI_API_KEY=your_gemini_api_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start the backend:
```bash
npm run dev
```
Server runs at `http://localhost:5000`
Health check: `http://localhost:5000/api/health`

---

### 3. Client Setup

Open a new terminal:
```bash
cd client
npm run dev
```
Client runs at `http://localhost:5173`

---

## 📡 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/grievances` | Submit grievance (Multipart: `beforeImage`, `audio`, `latitude`, `longitude`, `description`). Checks 50m duplicates & performs Gemini triage. |
| `PATCH` | `/api/grievances/:id/resolve` | Upload `afterImage`, audit repair with Gemini Vision, mark as `Verified Resolved`. |
| `GET` | `/api/grievances` | Fetch grievances with query filters (`category`, `status`, `department`, `search`, `sort`). |
| `GET` | `/api/grievances/:id` | Fetch grievance details by MongoDB `_id` or `trackingId`. |
| `POST` | `/api/grievances/:id/upvote` | Upvote a grievance. |
| `GET` | `/api/grievances/stats/summary` | Dashboard statistics (total, pending, high severity, resolved). |
| `GET` | `/api/health` | Backend and Gemini API status. |
