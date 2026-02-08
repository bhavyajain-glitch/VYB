---
description: How to manage OTA and In-App updates
---

# Update Management Workflow

This workflow describes the process for deploying Over-The-Air (OTA) updates and managing in-app update prompts.

## 1. Prerequisites
- Ensure `eas-cli` is installed: `npm install -g eas-cli`
- Remote project must be initialized: `eas project:init` (already done for this project)

## 2. OTA Updates (JavaScript/Asset changes)
Use this for bug fixes or small features that don't involve native code changes (modified `ios/` or `android/` directories).

### Step 2.1: Publish an Update
// turbo
1. Run the update command:
   ```bash
   eas update --branch [branch-name] --message "[description]"
   ```
   *Example: `eas update --branch production --message "Fix login bug"`*

### Step 2.2: Verify the Update
1. Check update status:
   ```bash
   eas update:list
   ```

## 3. In-App Updates (Native changes)
Use this for updates requiring a new binary (e.g., adding a new native library).

### Step 3.1: Increment Version
1. Update `version` and `versionCode` in `app.json`.

### Step 3.2: Build and Submit
// turbo
1. Build the app:
   ```bash
   eas build --platform android --profile production
   ```
2. Submit to store:
   ```bash
   eas submit --platform android --profile production
   ```

## 4. Developing with Updates
When adding new update logic to the app:
1. Use `expo-updates` API to check for updates.
2. Show a `Modal` or `Alert` to the user when `Updates.checkForUpdateAsync()` returns `isAvailable: true`.
3. Call `Updates.fetchUpdateAsync()` and `Updates.reloadAsync()` to apply.
