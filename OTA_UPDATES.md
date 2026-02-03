# Vyb App: OTA Updates Guide (JS & Assets)

This guide covers **Over-The-Air (OTA)** updates using `expo-updates`. 

## 1. What is an OTA Update?
An OTA update allows you to send new code and images directly to your users' phones without them needing to download a new APK from a website or the Play Store.

### Use this for:
- [x] Fixing a typo or changing text.
- [x] Changing colors, styles (CSS), or layouts.
- [x] Adding a new screen (if it only uses existing libraries).
- [x] Swapping an image or icon (like we did with the logo).

### ❌ Do NOT use this for:
- Adding a new native library (anything requiring `npx expo install ...`).
- Changing the app name, icon, or splash screen in `app.json`.
- Upgrading the version of React Native or Expo.

> [!TIP]
> If you need to make native changes, refer to the [Native Updates Guide](file:///home/pc/Desktop/vyb/NATIVE_UPDATES.md).

---

## 2. How to Push an OTA Update

### Step 1: Make your changes
Edit your React Native code (e.g., `app/(tabs)/index.tsx`) or replace an image in `assets/`.

### Step 2: Choose your Channel
- **`preview`**: Use this for testing on your own phone first.
- **`production`**: Use this when you want every live user to get the update.

### Step 3: Run the command
From the root `vyb` folder:
```bash
# Push to Testing (Preview)
eas update --branch preview --platform android --message "Testing a small change"

# Push to Live (Production)
eas update --branch production --platform android --message "Fixed a bug in the feed"
```

---

## 3. How to See the Update on Your Phone
1.  **Open the App**: Ensure your phone has internet.
2.  **Minimize the App**: Go to your phone's home screen.
3.  **Wait 10 Seconds**: `UpdateChecker` is listening for the new signal.
4.  **Re-open the App**: The "App Refresh Ready!" modal will appear. Tap **Update**.

---

## 4. Troubleshooting: Why didn't it work?

### Common Issue: Channel Mismatch
If your APK was built with the `preview` profile, it will **not** see updates sent to the `production` branch. 

### Common Issue: Runtime Version
If you changed `version` in `app.json` (e.g., 1.0.7 to 1.0.8), an app running 1.0.7 will **not** see 1.0.8 updates. They must have the same version.

### The "Clean Reset"
If you are stuck, run these:
1. `npx expo prebuild --platform android` (Syncs native code)
2. Build the APK again (`npx eas-cli build...`)
3. `eas update --branch production ...` (Sends the signal again)

---

You don't always have to run the `eas update` command manually. Your project has an automated workflow in `.github/workflows/ota-update.yml`.

### How it works:
- **Whenever you push code** to the `main` branch.
- **GitHub Actions** will automatically run the update command for you.
- **Result**: Your users get the update automatically just by you saving your work to GitHub.

---

## 6. Comparison: OTA vs. Native
| Feature | OTA Update (JS/Assets) | Native Update (APK) |
| :--- | :--- | :--- |
| **Speed** | 1 minute | 15-30 minutes |
| **User Action** | Restarts App | Downloads & Installs APK |
| **When to use?** | Bug fixes, UI tweaks | New libraries, app config |
| **Guide** | [OTA_UPDATES.md](file:///home/pc/Desktop/vyb/OTA_UPDATES.md) | [NATIVE_UPDATES.md](file:///home/pc/Desktop/vyb/NATIVE_UPDATES.md) |
