# Vyb App: Native Updates Guide (APK & Versions)

This guide covers **In-App Native updates**. Use this when you need to change the physical "shell" of the app (the APK).

## 1. What is a Native Update?
A native update is required when you change the underlying "engine" of the app. Users will see a popup asking them to download a new APK file.

### Use this for:
- [x] Adding a new library (e.g., Camera, Bluetooth, Map).
- [x] Changing the App Icon or App Name in `app.json`.
- [x] Upgrading Expo or React Native versions.
- [x] Any change where an [OTA Update](file:///home/pc/Desktop/vyb/OTA_UPDATES.md) is not enough.

---

## 2. The Golden Rule of Versioning
In `app.json`, you must manage two numbers:

1.  **`version`**: What the user sees (e.g., `1.0.9`).
2.  **`versionCode`**: What the machine sees (e.g., `11`).
    *   **CRITICAL**: The `versionCode` **MUST ALWAYS GO UP**. If your last APK was `10`, the new one must be `11`.

---

## 3. How to Release a New Native Version

### Step 1: Update `app.json`
Increase both `version` and `versionCode`.

### Step 2: Build the APK
You can build using your preferred command:

### "Java Version Error" (Required Java 17, using 11)
If you see an error about Java 11 vs 17, run your build command with the Java 17 path like this:
```bash
JAVA_HOME=/usr/lib/jvm/java-1.17.0-openjdk-amd64 ./gradlew :app:assembleRelease
```

### "Build failing in Cloud"

**Cloud Build (EAS Servers):**
```bash
# Your most used command:
npx eas-cli build --platform android --profile production
```

**Local Build (Your Computer - Faster for simple fixes):**
```bash
npm run build:android:apk
```

> [!NOTE]
> If you see an error about `ANDROID_HOME` or your `android/` folder looks old, run this first:
> `npx expo prebuild --platform android`

### Step 3: Tell the World (Manual Method)

If you built the APK on your computer, follow these steps to share it:

1.  **Go to GitHub**: Open your project's repository in your browser.
2.  **Navigate to Releases**: On the right-side menu, click **"Releases"** (or "Create a new release").
3.  **Draft a New Release**: Click the **"Draft a new release"** button.
4.  **Tag it**: Choose a tag like `v1.0.9`. It should match your `app.json` version.
5.  **Write a Title**: Example: `Release v1.0.9`.
6.  **UPLOAD THE APK**: Scroll down to the bottom to the box with a dashed border that says **"Attach binaries by dropping them here..."**. 
    *   > [!IMPORTANT]
    *   > Do **NOT** drop the APK into the "Describe this release" text box. That box only likes images. You **MUST** drop it in the "Assets" box at the very bottom.
7.  **Publish**: Click **"Publish release"**.
8.  **Refresh Backend**: Finally, tell the server to look for this new file:
    ```bash
    curl -X POST https://campusconnect-api-nx9k.onrender.com/api/update/refresh
    ```

---

## 4. Testing Your Native Update (Verification)

Follow these steps to prove the update popup works:

### Step 1: Check your current version
Open your app on your phone. Look for the version number if displayed, or remember what you installed. Let's assume you have **v1.0.8 (Code 10)**.

### Step 2: "Fake" a new version in `app.json`
Change your `app.json` to be higher:
```json
"version": "1.0.9",
"android": {
  "versionCode": 11
}
```

### Step 3: Build the "New" APK
Run your build command:
`npx eas-cli build --platform android --profile production`

### Step 4: Upload to GitHub
Create a new **Release** on your GitHub repository and upload this new `.apk` file.

### Step 5: Refresh the Signal
Run the command to tell the server there is a new version:
`curl -X POST https://campusconnect-api-nx9k.onrender.com/api/update/refresh`

### Step 6: Verify on Phone
1. Close the app on your phone completely.
2. Open it again.
3. **Success**: You should see a "New Update Available (v1.0.9)" popup! 

---
---

## 7. Support for Private Repositories

If your GitHub repository is **Private**, the backend needs a "Key" to see your releases. 

### Step 1: Generate a GitHub Token
1. Go to your GitHub **Settings** -> **Developer settings** -> **Personal access tokens** -> **Tokens (classic)**.
2. Click **Generate new token (classic)**.
3. Note: `Vyb Backend Update Key`.
4. Expiration: No expiration (recommended for servers).
5. **Scopes**: Check the box for `repo` (Full control of private repositories).
6. Click **Generate token** and **COPY IT** immediately.

### Step 2: Add to Render (Cloud)
1. Go to your [Render Dashboard](https://dashboard.render.com).
2. Select your **API Service** (Backend).
3. Click **Environment**.
4. Click **Add Environment Variable**.
   - Key: `GITHUB_TOKEN`
   - Value: (Paste your token here)
5. Click **Save Changes**. The backend will restart automatically.

---

## 5. Robotic Building & Automation (GitHub Actions)

You have a "Robot" worker in your project that can handle everything automatically when you save code to GitHub.

### How to set it up (One-Time Only):
To let GitHub talk to Expo, you must add your secret key:
1.  Go to your GitHub Repo -> **Settings** -> **Secrets and variables** -> **Actions**.
2.  Click **"New repository secret"**.
3.  Name: `EXPO_TOKEN`.
4.  Value: (Your Expo access token from expo.dev).

### How to Trigger the Automation:
The robot is smart. It only starts a Native Build when it sees "Native Changes":
- **Trigger**: Simply `git push` any change to `app.json`, `eas.json`, or anything in the `android/` folder.
- **Action**: Check the **"Actions"** tab on GitHub to see the robot working.
- **Result**: Once finished (about 10 mins), the robot will **AUTOMATICALLY** create a GitHub Release and attach the APK for you.

### The "Loop" Workflow (Best Practice):
1. Change your code.
2. **Increase version** in `app.json`.
3. `git add .`
4. `git commit -m "Bump version to v1.0.9"`
5. `git push origin main`
6. Wait 10 mins... **Boom!** Your users get the "New Update" popup on their phones.

---

## 6. Comparison: Native vs. OTA
| Feature | Native Update (APK) | OTA Update (JS/Assets) |
| :--- | :--- | :--- |
| **User Experience** | Download + Install | Instant Refresh |
| **When to use?** | Native changes, Version bump | Text fixes, UI styles |
| **Automation** | `build-android.yml` | `ota-update.yml` |
| **Guide** | [NATIVE_UPDATES.md](file:///home/pc/Desktop/vyb/NATIVE_UPDATES.md) | [OTA_UPDATES.md](file:///home/pc/Desktop/vyb/OTA_UPDATES.md) |
