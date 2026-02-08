# Google Authentication Setup Guide

I have implemented the code for Google Authentication! To make it work, you need to follow these setup steps.

## 0. Libraries Used
We are using the official standard libraries for Expo and Node.js:
- **Frontend (Mobile App)**:
  - `expo-auth-session`: The standard way to handle web-based authentication flows in Expo.
  - `expo-web-browser`: Required by auth-session to open the secure login popup.
  - `expo-crypto`: Required for secure hash generation.
- **Backend (API)**:
  - `google-auth-library`: The official Google library for Node.js used to verify ID Tokens and ensure they are authentic.

## 1. Google Cloud Console Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select your existing one.
3. Go to **APIs & Services** > **OAuth consent screen**.
   - Select **External**.
   - Fill in the required app information (App name, support email, etc.).
   - Add the scope `.../auth/userinfo.email` and `.../auth/userinfo.profile`.
4. Go to **Credentials** > **Create Credentials** > **OAuth client ID**.
   - **Android**: 
     - Package Name: `com.lohegaon.campusconnect` (Check your `app.json`)
     - SHA-1 Fingerprint: Get this from EAS using `eas credentials` or Google Play Console.
   - **iOS**:
     - Bundle ID: `com.lohegaon.campusconnect`
   - **Web (for Expo Go)**:
     - Authorized redirect URIs: Add the one from `makeRedirectUri()` in `auth.tsx` (usually `https://auth.expo.io/@lohegaon/campusconnect`).

## 2. Backend Setup (Render)
1. Go to your **Render Dashboard**.
2. Select your **Backend API Service**.
3. Go to **Environment** > **Add Environment Variable**.
   - Key: `GOOGLE_CLIENT_ID`
   - Value: (Use the **Web Client ID** you generated in step 1.4).
4. Click **Save Changes**.

## 3. Frontend Setup
1. In `app/auth.tsx`, replace the placeholders with your new Client IDs:
   - `GOOGLE_ANDROID_CLIENT_ID`
   - `GOOGLE_IOS_CLIENT_ID`
   - `GOOGLE_EXPO_CLIENT_ID` (Use the Web Client ID here for Expo Go support).

## 4. Deploy
1. Push your frontend changes:
   ```bash
   git add .
   git commit -m "Add Google Auth frontend"
   git push
   ```
2. Trigger an OTA update to update your current app:
   ```bash
   eas update --branch production --platform android --message "Add Google Authentication"
   ```

## Why two client IDs?
- **Native IDs** are used when you build the standalone APK/IPA.
- **Web/Expo ID** is used when you are testing inside the Expo Go app.

Let me know if you need help getting the SHA-1 fingerprint! 🚀
