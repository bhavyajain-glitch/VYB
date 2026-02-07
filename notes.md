# CampusConnect - Project Notes & Documentation

This document provides a comprehensive overview of the CampusConnect project, covering everything from basic setup to advanced architectural decisions.

## 1. Project Overview
CampusConnect is a social networking platform designed for college students. It combines traditional social media features (feed, profiles, posts) with a specialized "Dating Mode" (The Vibe) and college-centric events.

## 2. Technical Stack
### Frontend
- **Framework**: [Expo](https://expo.dev/) (React Native)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **Icons**: [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native)

### Backend
- **Runtime**: Node.js (v18+ supported with polyfills)
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT (JSON Web Tokens)
- **Media Storage**: Cloudinary

---

## 3. Project Structure
The project is split into two main parts:

- **Root Directory**: Contains the Expo frontend application.
  - `app/`: Contains the screens and logic (Expo Router).
  - `components/`: Reusable UI components.
  - `utils/`: Helper functions (images, picker, etc.).
  - `metro.config.js`: Metro bundler configuration.
- **`backend/` Directory**: Contains the Express.js server.
  - `controllers/`: Business logic for API endpoints.
  - `models/`: Mongoose schemas (User, Post, Message, etc.).
  - `routes/`: API route definitions.
  - `middleware/`: Authentication and error handling.
  - `.env`: Backend environment variables (Database URI, Secrets).

---

## 4. Getting Started

### Installation
1. Install dependencies in the root:
   ```bash
   npm install
   ```
2. Install dependencies in the backend:
   ```bash
   cd backend && npm install
   ```

### Running Locally
You need two terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```
*Port: 5000*

**Terminal 2 (Frontend):**
```bash
npm start
```

---

## 5. Configuration (.env)
The backend requires a `.env` file in the `backend/` folder:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

### API Switching
In `app/services/api.ts`, look for the `USE_LOCAL_API` toggle:
- `true`: Connects to `localhost:5000` (Local Node.js server).
- `false`: Connects to the production Render API.

---

## 6. Key Architectural Decisions

### 1. Node.js Compatibility (Metro Polyfill)
**Decision**: Added `Array.prototype.toReversed` polyfill in `metro.config.js`.
**Why**: Newer versions of Expo/Metro use ES2023 methods. Since the development environment uses Node.js 18 (which doesn't support `toReversed`), the polyfill prevents the bundler from crashing.

### 2. Media Handling (Cloudinary)
**Decision**: Images are uploaded from the frontend as Base64 strings to a dedicated `upload` endpoint, which pipes them to Cloudinary.
**Why**: Keeps the database light (only storing URLs) and offloads image processing/optimization to a specialized service.

### 3. Safe Navigation Fallbacks
**Decision**: Implemented `goBack` helpers in major screens.
**Why**: On the web, reloading a page clears the navigation history. Standard `router.back()` calls would fail. The safe wrapper checks `router.canGoBack()` and uses `router.replace('/')` as a fallback.

### 4. Local API Indicator
**Decision**: A small "🔧 LOCAL" badge is visible on the profile screen when `USE_LOCAL_API` is active.
**Why**: Helps developers instantly verify which environment they are interacting with to avoid data confusion.

---

## 7. Major Features & Logic

### Authentication
Uses simulated OTP for the demo. Entering `123456` as the OTP will log you in. If the phone number is new, a user record is automatically created in MongoDB.

### Dating Mode (The Vibe)
- **Coins**: Users start with 150 coins.
- **Matching**: Switching your "Active Vibe" costs 100 coins.
- **Privacy**: Photos are blurred in the Discovery tab until a match is made.

### Feed & Posts
- Supports pagination for infinite scrolling.
- Real-time likes and comments.
- Supports image uploads via camera or gallery.

---

## 8. Troubleshooting
- **Metro Crash**: If you see `toReversed is not a function`, ensure the polyfill in `metro.config.js` is present.
- **MongoDB Error**: Ensure `MONGO_URI` is correctly set in `backend/.env`. The server will log "✅ MongoDB Connected Successfully" on success.
- **Network Error (Android)**: If using an emulator, the API URL must be `http://10.0.2.2:5000`. This is handled automatically in `api.ts`.
