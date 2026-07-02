# Playwright Chromium QA Agent

## Commands
```bash
npm ci
npx playwright install --with-deps chromium
npm run build
npm run test:e2e
```

## Required captures
- 1440 x 1100 desktop homepage
- 390 x 844 mobile homepage
- dashboard route
- intake form route
- approval route
- scoreboard route
- PWA manifest check

## Receipt
Each run writes:
- playwright-report/results.json
- screenshots on failure
- trace on failure
- QA score receipt
