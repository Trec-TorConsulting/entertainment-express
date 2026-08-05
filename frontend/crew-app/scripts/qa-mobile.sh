#!/usr/bin/env bash
# Crew mobile QA harness (phase-4 task 6.5).
# Automates what we can without attached hardware; prints a device checklist.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== Crew App QA =="
echo "SDK targets: Expo 50 / RN 0.73 → iOS 14+ and Android 10+ (API 29)"
echo

echo "[1/3] TypeScript"
npm run type-check

echo "[2/3] Jest smoke"
npm test -- --ci --forceExit

echo "[3/3] Asset sanity"
for f in assets/icon.png assets/splash.png assets/adaptive-icon.png \
         assets/notification-icon.png assets/notification-sound.wav; do
  test -s "$f" || { echo "Missing/empty $f"; exit 1; }
done
echo "  assets ok"

cat <<'EOF'

Manual device matrix (run locally):
  iOS Simulator (14+):   npm run ios
  Android Emulator 10+:  npm run android
  Physical device:       npx expo start --tunnel  (scan QR with Expo Go / dev client)

Smoke flows on each platform:
  - Cold launch → login → shifts list (no redbox)
  - Accept offer → check-in (GPS prompt) → check-out
  - Run sheet view offline → foreground sync
  - Push deep link entertainment-express://shift/<id>

EOF

echo "✅ Automated crew QA passed"
