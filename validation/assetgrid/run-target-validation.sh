#!/usr/bin/env bash
set -euo pipefail

ROOT="${GITHUB_WORKSPACE:-$(pwd)}"
ARCHIVE=/tmp/assetgrid-validation-src.tgz
RUN=/tmp/assetgrid-run

cat "$ROOT"/validation/assetgrid/fixture.part* | base64 --decode > "$ARCHIVE"
echo '439a408ec08393b71abfc95a3d5425c0a5c49869a3c0fcec2a8ed010abc8cd5e  /tmp/assetgrid-validation-src.tgz' | sha256sum -c -
rm -rf "$RUN"
mkdir -p "$RUN"
tar -xzf "$ARCHIVE" -C "$RUN" --strip-components=1

echo 'cde4154f9bfb24151104380bda892f5435cd5fd673169dfd5a8430f71f255d1b  src/components/Layout.jsx' | (cd "$RUN" && sha256sum -c -)
echo '92daf1136bbb742a99792a4c53ca9f1392484cbb353f0c011a224f4c5482d8cf  src/pages/Home.jsx' | (cd "$RUN" && sha256sum -c -)
echo 'a8750bde11069e12d1fa1d2d4efda4a2e5da23519ed62b3cb5c4718dcdc0fd29  src/pages/Browse.jsx' | (cd "$RUN" && sha256sum -c -)

cd "$RUN"
export VITE_BASE44_APP_ID=6a828314b20a50cdd61fb765
export VITE_BASE44_APP_BASE_URL=http://127.0.0.1:4173
npm install --ignore-scripts --no-audit --no-fund
npm run build
npm run lint

# Exact checkpoint install/build/lint/typecheck are validated natively in Base44 /app.
# For the responsive browser-only leg, bypass Base44 auth and data transport inside
# this disposable mirror so the test measures the checksum-locked Layout/Home/Browse
# components and URL/ARIA behavior rather than external authentication availability.
cat > src/api/base44Client.js <<'JS'
export const base44 = {
  entities: {
    Item: {
      list: async () => [],
      filter: async () => [],
    },
  },
}
JS

cat > src/App.jsx <<'JSX'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Browse from '@/pages/Browse'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
JSX

npm run dev -- --host 127.0.0.1 --port 4173 > /tmp/assetgrid-vite.log 2>&1 &
echo $! > /tmp/assetgrid-vite.pid

for i in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:4173/ >/dev/null; then
    break
  fi
  if [ "$i" -eq 60 ]; then
    cat /tmp/assetgrid-vite.log
    exit 1
  fi
  sleep 1
done

cd "$ROOT"
node validation/assetgrid/smoke.mjs
