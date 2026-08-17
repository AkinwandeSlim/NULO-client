import { defineConfig, devices } from '@playwright/test'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Load client/.env.e2e (gitignored) into process.env so the e2e specs can
 * read demo-account credentials without hardcoding them in the repo.
 * Real env vars always win over file values.
 */
function loadE2eEnv() {
  const file = resolve(__dirname, '.env.e2e')
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!(key in process.env)) process.env[key] = value
  }
}
loadE2eEnv()

/**
 * Playwright config for Nulo Africa client E2E tests.
 *
 * Prereq: the Next.js dev server must already be running on
 * http://localhost:3000 (pnpm dev in client/). We do NOT auto-start it here
 * because the app needs Supabase env vars and a warm dev server; reusing the
 * one you already have open is faster and matches what you see in the browser.
 *
 * Artifacts (screenshots, traces, reports) land in:
 *   client/test-results/   - screenshots + traces per test run
 *   client/playwright-report/ - HTML report (npx playwright show-report)
 */
export default defineConfig({
  testDir: './e2e',
  /* Fail fast enough to iterate, generous enough for AI-agent responses. */
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  /* 'list' prints each step result clearly in the terminal. */
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:3000',
    /*
     * Slow every browser action by N ms so a human can watch headed runs
     * (type-along effect). Off by default. Enable in PowerShell with:
     *   $env:SLOWMO=600; pnpm test:e2e:headed -- e2e/auth.spec.ts
     * Note: slowMo is a browser launch option, not a top-level use option.
     */
    launchOptions: {
      slowMo: Number(process.env.SLOWMO || 0),
    },
    /* Capture a screenshot when a test fails so we can see what happened. */
    screenshot: 'only-on-failure',
    /* Record a trace on first retry for deep debugging. */
    trace: 'on-first-retry',
    /* Collect browser console/page errors automatically. */
    video: 'off',
    viewport: { width: 1440, height: 900 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  outputDir: './test-results',
})
