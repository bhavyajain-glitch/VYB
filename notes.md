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

## 3. Development Basics

### Creating a New Screen
This project uses **Expo Router**. To add a new page:
1. Create a new `.tsx` file in the `app/` directory (e.g., `app/settings.tsx`).
2. The route name will be the filename (`/settings`).
3. For nested routes, use folders (e.g., `app/user/[id].tsx` handles `/user/123`).

### Working with Components
Reusable UI elements (Buttons, Modals, Cards) should be placed in `components/`.
- Use **NativeWind** for styling: `className="bg-blue-500 p-4"`.
- Use **Lucide React Native** for icons.

### Connecting to the API
Always use the `authAPI` service located in `app/services/api.ts`.
- Example: `const res = await authAPI.getMe();`
- This ensures tokens and base URLs are handled automatically.

---

## 4. Project Structure
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

## 5. Getting Started

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

## 6. Configuration (.env)
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

## 7. Key Architectural Decisions

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

## 8. Major Features & Logic

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

## 9. Advanced Topics

### Database Relationships
- This project uses **Mongoose**.
- `Post` model has a `user` field of type `ObjectId` referencing the `User` model.
- Use `.populate('user')` during queries to fetch user details along with posts.

### Backend Middleware
- **Auth Middleware**: `backend/middleware/authMiddleware.js` contains the `protect` function.
- Add `protect` to any route that requires a logged-in user.
- It attaches the current user object to `req.user`.

### Image Optimization
- When uploading to Cloudinary, we use transformations:
  ```javascript
  { width: 800, height: 1067, crop: 'limit' }
  ```
  This ensures images aren't over-the-top in resolution but look great on mobile.

---

## 10. Troubleshooting
- **Metro Crash**: If you see `toReversed is not a function`, ensure the polyfill in `metro.config.js` is present.
- **MongoDB Error**: Ensure `MONGO_URI` is correctly set in `backend/.env`. The server will log "✅ MongoDB Connected Successfully" on success.
- **Network Error (Android)**: If using an emulator, the API URL must be `http://10.0.2.2:5000`. This is handled automatically in `api.ts`.

---

## 11. Building & Deployment

### Frontend (Web)
To build the project for web hosting (e.g., Vercel, Netlify):
```bash
npx expo export --platform web
```
This generates a `dist/` folder containing the static production bundle.

### Frontend (Android/iOS)
We use **EAS (Expo Application Services)** for building native binaries.

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```
2. **Login to Expo**:
   ```bash
   eas login
   ```
3. **Configure Project**:
   ```bash
   eas build:configure
   ```
4. **Build for Android (Production APK)**:
   ```bash
   ANDROID_HOME=$HOME/Android/Sdk JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 eas build --platform android --profile production --local
   ```
   *This command uses your local hardware and Android SDK to build the APK.*

5. **Local Debug Build**:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   *The debug APK will be at `android/app/build/outputs/apk/debug/app-debug.apk`.*
   ```bash
   eas build --platform android --profile production
   ```
5. **Build for iOS**:
   ```bash
   eas build --platform ios --profile production
   ```

### Backend Deployment
The backend is designed to be deployed on platforms like **Render**, **Heroku**, or **DigitalOcean**.

1. **Environment Variables**: Ensure all variables in `.env` are set in your platform's dashboard.
2. **Start Script**: The platform should run `npm start` (which executes `node server.js`).
3. **Database**: Use a managed MongoDB service like **MongoDB Atlas**.
4. **Production API URL**: Once the backend is deployed, update `PRODUCTION_API_URL` in `app/services/api.ts` and set `USE_LOCAL_API = false`.

---

## 12. Local Native Builds (Advanced)

If you prefer to build the app on your own machine instead of using EAS Cloud, or if you need to modify native code:

### 1. Prebuild (Generate Native Projects)
This command generates the `android/` and `ios/` directories:
```bash
npx expo prebuild
```
*Note: This "ejects" you from the managed workflow to the bare workflow, but you can still use Expo tools.*

### 2. Android Build (Gradle)
To build and run the Android app locally using Gradle:
1. **Prerequisites**: Ensure you have **Android Studio**, **JDK 17**, and the **Android SDK** installed and configured (set `ANDROID_HOME`).
2. **Run Command**:
   ```bash
   npx expo run:android
   ```
   **What this does**:
   - It invokes the **Gradle** build system inside the `android/` folder.
   - Compiles the Java/Kotlin code.
   - Bundles the JavaScript.
   - Installs the `.apk` onto your connected device or emulator.

### Why use Gradle/Local Builds?
- **No Queues**: Faster than waiting for free-tier cloud builders.
- **Native Customization**: You can edit `android/app/build.gradle` to add specific dependencies or configurations that Expo Config Plugins don't cover.
- **Debugging**: You can open the `android/` folder in Android Studio to use the native debugger.

---

## 13. iOS Sharing & Distribution

Sharing iOS apps is stricter than Android (where you can just share an `.apk` file). Apple requires apps to be "signed" for specific devices or distributed through official channels.

### 1. Internal Distribution (Ad Hoc)
To share an app with your team or friends without the App Store:
1. **Register Devices**: You must add the **UDID** (Unique Device Identifier) of every iPhone/iPad you want to install the app on to your Apple Developer Account.
2. **Build with EAS**:
   ```bash
   eas build --platform ios --profile preview
   ```
   *Note: This profile uses "internal" distribution method.*
3. **Install**: Users can install the resulting build via a link provided by Expo, but **ONLY** if their device UDID was registered *before* the build.

### 2. TestFlight (Recommended)
The easiest way to share with external testers:
1. **Build for Store**:
   ```bash
   eas build --platform ios --profile production
   ```
2. **Upload**: Transporter app (macOS) or automated upload to App Store Connect.
3. **Invite Testers**: Add their email addresses in TestFlight. They get an email invite and can install via the TestFlight app.
   - **No UDID required**.
   - **Expires after 90 days**.

### 3. Simulator Build
If you just want to test on a Mac Simulator:
```bash
eas build --platform ios --profile development-simulator
```
Sharing this file (`.app`) only works if the other person has a Mac and a Simulator; it **cannot** be installed on a physical iPhone.

---

## 14. Troubleshooting Local Builds

### Error: "Failed to resolve the Android SDK path"
This means you do not have the **Android SDK** installed, or `ANDROID_HOME` is not set.

**Solution 1: Install Android Studio (Recommended)**
1. Download and install [Android Studio](https://developer.android.com/studio).
2. Open it and go to **Settings > Languages & Frameworks > Android SDK**.
3. Copy the "Android SDK Location" path.
4. Add it to your shell profile (e.g., `~/.bashrc` or `~/.zshrc`):
   ```bash
   export ANDROID_HOME=/path/to/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

**Solution 2: Use EAS Cloud Build (No Installation Needed)**
If you don't want to install GBs of tools on your laptop, use Expo's cloud builders:
```bash
eas build --platform android --profile development
```
This builds the app on Expo's servers and gives you a link to download the APK.

### Error: "EACCES: permission denied" (npm install)
If `npm install -g eas-cli` fails with permission errors:
- **Option 1 (Quick Fix)**: Run with sudo (Linux/macOS):
  ```bash
  sudo npm install -g eas-cli
  ```
- **Option 2 (Better)**: Use `npx` to run it without installing globally:
  ```bash
  npx eas-cli build ...
  ```

---

## 15. FAQ: Can I build locally without the Android SDK?

**Short Answer: No.** 

To "build" an app (compile code into an `.apk` file) on your own computer, you **must** have the Android SDK (Compiler, Build Tools, Gradle) installed. There is no way around this for any native mobile app (React Native, Flutter, or Native Java).

**However, you have two great alternatives:**

### Option 1: Development (Testing)
If you just want to **run** the app to test your code:
1. Don't use `run:android`.
2. Instead, run `npm start`.
3. Download the **Expo Go** app on your physical Android phone from the Play Store.
4. Scan the QR code shown in your terminal.
**Result**: The app runs on your phone. No Android Studio or SDK required on your PC.

### Option 2: Production (Getting an APK)
If you need the actual `.apk` file (to share or upload) but don't want to install the SDK:
1. Use **EAS Build** (Cloud).
   ```bash
   eas build --platform android --profile production
   ```
2. Expo's powerful servers (which have the SDK installed) will compile the app for you.
3. You will receive a download link for the `.apk`.
**Result**: You get the file without installing 10GB+ of tools on your laptop.

---

## 16. EAS Local Builds

You specifically asked about "building EAS locally". Yes, there is a command for this:

```bash
eas build --platform android --local
```

**However, there is a catch:**
This command simply runs the EAS build logic **on your machine**. This means **you still need the Android SDK installed**.

- **Purpose**: It allows you to use the standard `eas.json` configuration but compile on your own hardware (e.g., to debug a build failure or save cloud credits).
- **Requirements**:
  - For Android: Android Studio & SDK.
  - For iOS: macOS computer with Xcode.
  - Docker (optional, but recommended for consistent environments).

**Summary**: `eas build --local` requires the exact same setup as `npx expo run:android`. It does not bypass the need for SDKs.
