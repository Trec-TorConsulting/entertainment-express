#!/usr/bin/env bash
# Trigger Expo EAS preview builds for QA (phase-4 task 7.1).
# Requires: npm i -g eas-cli && eas login && linked Expo project.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PLATFORM="${1:-all}"  # ios | android | all
PROFILE="${2:-preview}"

if ! command -v eas >/dev/null 2>&1; then
  echo "eas-cli not found. Install with: npm i -g eas-cli"
  exit 1
fi

echo "Validating eas.json + app.json…"
node -e "
const eas=require('./eas.json');
const app=require('./app.json');
if (!eas.build.preview || !eas.build.production) process.exit(1);
if (!app.expo.ios.bundleIdentifier || !app.expo.android.package) process.exit(1);
console.log('profiles:', Object.keys(eas.build).join(', '));
console.log('ios:', app.expo.ios.bundleIdentifier);
console.log('android:', app.expo.android.package);
"

echo
echo "Starting EAS build — profile=$PROFILE platform=$PLATFORM"
echo "(Internal distribution APK/IPA links appear in the Expo dashboard for QA.)"
eas build --profile "$PROFILE" --platform "$PLATFORM" --non-interactive
