import { expect, type Page, type TestInfo } from '@playwright/test'

/**
 * Shared E2E helpers for Nulo Africa Playwright tests.
 *
 * Credentials come from env vars (set them in client/.env.e2e, which is
 * gitignored — see .env.e2e.example). Google OAuth is never exercised —
 * all authentication uses the email/password form on /signin.
 */

// ─── Credentials ─────────────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.e2e.example to .env.e2e, fill in the demo ` +
        `account credentials, then re-run (Playwright loads .env.e2e via ` +
        `playwright.config.ts).`
    )
  }
  return value
}

export const TENANT_EMAIL = requireEnv('E2E_TENANT_EMAIL')
export const TENANT_PASSWORD = requireEnv('E2E_TENANT_PASSWORD')
export const LANDLORD_EMAIL = requireEnv('E2E_LANDLORD_EMAIL')
export const LANDLORD_PASSWORD = requireEnv('E2E_LANDLORD_PASSWORD')

// ─── Screenshot helper ───────────────────────────────────────────────────────

/**
 * Take a screenshot, attach it to the HTML report, AND save it to disk under
 * test-results/screenshots/ so the images survive even when the test passes
 * (Playwright cleans per-test artifact folders on success).
 */
export async function snap(page: Page, testInfo: TestInfo, name: string) {
  const shot = await page.screenshot({ fullPage: false })
  await testInfo.attach(name, { body: shot, contentType: 'image/png' })
  const fs = await import('node:fs')
  const path = await import('node:path')
  const dir = path.join(testInfo.project.outputDir, 'screenshots')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, `${name}.png`), shot)
}

// ─── Browser error collection ────────────────────────────────────────────────

/**
 * Attach console-error and page-error listeners to the page. Returns arrays
 * that accumulate messages for later assertion.
 */
export function collectBrowserErrors(page: Page) {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => pageErrors.push(err.message))
  return { consoleErrors, pageErrors }
}

// ─── Sign-in helper ──────────────────────────────────────────────────────────

/**
 * Fill the /signin email/password form and submit it, then wait until the app
 * navigates away from /signin. Returns the final URL so callers can assert the
 * destination themselves.
 */
export async function signIn(
  page: Page,
  email: string,
  password: string,
): Promise<string> {
  await page.goto('/signin', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('#email'), 'Email field should be visible').toBeVisible({ timeout: 30_000 })
  await page.fill('#email', email)
  await page.fill('#password', password)
  // The form's only type="submit" button is "Sign In" (the Google button is
  // type="button"), so this selector is unambiguous.
  await page.locator('button[type="submit"]').click()
  await page.waitForURL((url) => !url.pathname.startsWith('/signin'), { timeout: 45_000 })
  return page.url()
}

/**
 * Sign in as the demo tenant and wait for an authenticated destination.
 * Returns the final URL.
 */
export async function signInAsTenant(page: Page): Promise<string> {
  return signIn(page, TENANT_EMAIL, TENANT_PASSWORD)
}

/**
 * Sign in as the demo landlord and wait for an authenticated destination.
 * Returns the final URL.
 */
export async function signInAsLandlord(page: Page): Promise<string> {
  return signIn(page, LANDLORD_EMAIL, LANDLORD_PASSWORD)
}

// ─── Test file fixtures (for Trust Passport document uploads) ────────────────

/** Minimal 1×1 red-pixel PNG (67 bytes). Valid image for upload inputs. */
export const TEST_PNG: { name: string; mimeType: string; buffer: Buffer } = {
  name: 'e2e-identity.png',
  mimeType: 'image/png',
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  ),
}

/** Minimal valid single-page PDF (for income evidence upload). */
export const TEST_PDF: { name: string; mimeType: string; buffer: Buffer } = {
  name: 'e2e-income.pdf',
  mimeType: 'application/pdf',
  buffer: Buffer.from(
    '%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
    '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
    '3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\n' +
    'xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n' +
    '0000000058 00000 n \n0000000115 00000 n \n' +
    'trailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF',
  ),
}
