#!/usr/bin/env bash
# One-time setup: generates the native android/ios folders and a matching
# package.json with the official React Native CLI (no Expo anywhere),
# then installs the extra libraries this app uses.
#
# Run from the project root:  bash scripts/bootstrap.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if [ -d "$ROOT/android" ] || [ -d "$ROOT/ios" ]; then
  echo "android/ or ios/ already exists - nothing to do." >&2
  exit 1
fi

echo "==> Generating a fresh React Native project (latest stable template)"
npx --yes @react-native-community/cli@latest init RoomCraft \
  --directory "$TMP/app" \
  --package-name com.example.roomcraft \
  --skip-install --skip-git-init

echo "==> Copying native projects and tooling files"
cp -R "$TMP/app/android" "$ROOT/android"
cp -R "$TMP/app/ios" "$ROOT/ios"
for f in Gemfile .watchmanconfig .bundle; do
  [ -e "$TMP/app/$f" ] && cp -R "$TMP/app/$f" "$ROOT/$f" || true
done

echo "==> Merging package.json (react / react-native versions come from the template)"
node - "$TMP/app/package.json" "$ROOT/package.json" <<'NODE'
const fs = require('fs');
const [tpl, out] = process.argv.slice(2);
const pkg = JSON.parse(fs.readFileSync(tpl, 'utf8'));
pkg.name = 'roomcraft';
pkg.scripts = {
  start: 'react-native start',
  android: 'react-native run-android',
  ios: 'react-native run-ios',
  typecheck: 'tsc --noEmit',
};
fs.writeFileSync(out, JSON.stringify(pkg, null, 2) + '\n');
NODE

cd "$ROOT"
echo "==> Installing app libraries"
npm install
npm install \
  @react-navigation/native @react-navigation/native-stack \
  react-native-screens react-native-safe-area-context \
  react-native-svg @react-native-async-storage/async-storage zustand
npm install --save-dev babel-plugin-module-resolver

if [ "$(uname)" = "Darwin" ]; then
  echo "==> Installing iOS pods"
  (cd ios && bundle install && bundle exec pod install)
else
  echo "==> Skipping CocoaPods (iOS builds need macOS)"
fi

echo "Done. Start Metro with 'npm start', then 'npm run android' (or 'npm run ios')."
