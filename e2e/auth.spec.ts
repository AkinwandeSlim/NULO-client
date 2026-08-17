import { test, expect, type Page, type TestInfo } from '@playwright/test'

/**
 * E2E: Email/password sign-in for the tenant and landlord demo accounts.
 *
 * Google OAuth is intentionally NOT exercised here — Google actively blocks
 * automated logins (CAPTCHAs / "unusual activity" walls). Both demo accounts
 * have passwords (see docs/guides/LOGIN_ACCESS.md), so these tests use the
 * regular email/password form on /signin and never touch Google.
 *
 * Run with the dev server up on http://localhost:3000:
 *   pnpm test:e2e:headed -- e2e/auth.spec.ts   (visible browser window)
 *   pnpm test:e2e -- e2e/auth.spec.ts          (headless)
 *
 * Watch it slowly (optional): in PowerShell
 *   $env:SLOWMO=600; pnpm test:e2e:headed -- e2e/auth.spec.ts
 *
 * Credentials come from env vars (E2E_TENANT_EMAIL / E2E_TENANT_PASSWORD /
 * E2E_LANDLORD_EMAIL / E2E_LANDLORD_PASSWORD), falling back to the
 * documented demo accounts so the test runs out of the box.
 */

const TENANT_EMAIL = process.env.E2E_TENANT_EMAIL ?? 'mediaslim0705@gmail.com'
const TENANT_PASSWORD = process.env.E2E_TENANT_PASSWORD ?? 'nombahackathon2026'
const LANDLORD_EMAIL = process.env.E2E_LANDLORD_EMAIL ?? 'raphawellnessoptimization@gmail.com'
const LANDLORD_PASSWORD = process.env.E2E_LANDLORD_PASSWORD ?? 'nombahackathon2026'

/**
 * Same screenshot helper as guest.spec.ts: attach to the HTML report AND
 * save to disk under test-results/screenshots/ so the images survive even
 * when the test passes (Playwright cleans per-test artifact folders on
 * success; disk copies stay always inspectable).
 */
async function snap(page: Page, testInfo: TestInfo, name: string) {
  const shot = await page.screenshot({ fullPage: false })
  await testInfo.attach(name, { body: shot, contentType: 'image/png' })
  const fs = await import('node:fs')
  const path = await import('node:path')
  const dir = path.join(testInfo.project.outputDir, 'screenshots')
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, `${name}.png`), shot)
}

/**
 * Fill the /signin email/password form and submit it, then wait until the
 * app navigates away from /signin. The final destination differs per role
 * and per account state (verified vs not, onboarding complete vs not), so
 * callers assert the destination themselves.
 */
async function performSignIn(
  page: Page,
  testInfo: TestInfo,
  email: string,
  password: string,
  label: string,
) {
  await test.step(`1. Open /signin (${label})`, async () => {
    await page.goto('/signin', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('#email'), 'Email field should be visible').toBeVisible({ timeout: 30_000 })
    await snap(page, testInfo, `${label}-01-signin-form`)
    console.log(`✓ Sign-in form loaded for ${label}`)
  })

  await test.step(`2. Enter credentials (${label})`, async () => {
    await page.fill('#email', email)
    await page.fill('#password', password)
    await snap(page, testInfo, `${label}-02-credentials-filled`)
    console.log(`✓ Credentials entered for ${label} (${email})`)
  })

  await test.step(`3. Submit and wait for redirect (${label})`, async () => {
    // The form's only type="submit" button is "Sign In" (the Google button
    // is type="button"), so this selector is unambiguous.
    await page.locator('button[type="submit"]').click()
    try {
      await page.waitForURL((url) => !url.pathname.startsWith('/signin'), { timeout: 45_000 })
    } catch {
      // Still on /signin after 45s → credentials rejected or an error shown.
      // Capture exactly what the page says so the failure is self-explanatory.
      await snap(page, testInfo, `${label}-03-signin-failed`)
      const bodyText = (await page.locator('body').textContent()) ?? ''
      throw new Error(
        `${label} sign-in did not leave /signin within 45s. Page text (first 300 chars): ${bodyText.substring(0, 300)}`,
      )
    }
    await page.waitForLoadState('networkidle').catch(() => { /* app may keep polling */ })
    await snap(page, testInfo, `${label}-03-after-login`)
    console.log(`✓ ${label} signed in, landed on: ${page.url()}`)
  })
}

/** Collect console + page errors, report them at the end (guest.spec.ts pattern). */
function collectBrowserErrors(page: Page) {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => pageErrors.push(err.message))
  return { consoleErrors, pageErrors }
}


test.describe('Email/password authentication', () => {
  test('tenant can sign in with email and password', async ({ page }, testInfo) => {
    const { consoleErrors, pageErrors } = collectBrowserErrors(page)

    await performSignIn(page, testInfo, TENANT_EMAIL, TENANT_PASSWORD, 'tenant')

    await test.step('4. Tenant lands on an authenticated page', async () => {
      const url = page.url()
      // Returning tenants (applications/viewings) → /tenant
      // New tenants (no activity)               → /properties
      // Unverified email                         → /signup/tenant/confirmation
      const isTenantHome = url.includes('/tenant') || url.includes('/properties')
      const isUnverified = url.includes('/signup/tenant/confirmation')

      if (isUnverified) {
        console.log('⚠ Tenant credentials accepted but email is NOT verified → /signup/tenant/confirmation')
      }
      expect(
        isTenantHome || isUnverified,
        `Tenant should land on /tenant, /properties, or the confirmation page — got: ${url}`,
      ).toBeTruthy()

      await snap(page, testInfo, 'tenant-04-final-destination')
      console.log(`✓ Tenant final destination: ${url}`)
    })

    await test.step('5. No unexpected browser errors', async () => {
      if (pageErrors.length > 0) console.log('⚠ Page errors:', pageErrors.slice(0, 5))
      if (consoleErrors.length > 0) console.log('⚠ Console errors:', consoleErrors.slice(0, 5))
      // Fail only on uncaught page exceptions; console.error noise (React dev
      // warnings, failed favicon, etc.) is reported but not fatal.
      expect(pageErrors, `Uncaught page errors: ${pageErrors.join(' | ')}`).toHaveLength(0)
      console.log('✓ No uncaught page errors')
    })
  })

  test('landlord can sign in with email and password', async ({ page }, testInfo) => {
    const { consoleErrors, pageErrors } = collectBrowserErrors(page)

    await performSignIn(page, testInfo, LANDLORD_EMAIL, LANDLORD_PASSWORD, 'landlord')

    await test.step('4. Landlord lands on an authenticated page', async () => {
      const url = page.url()
      // Onboarding complete   → /landlord/overview
      // Onboarding incomplete → /onboarding/landlord/step-N
      // Unverified email      → /signup/landlord/confirmation
      const isLandlordHome = url.includes('/landlord/overview')
      const isOnboarding = url.includes('/onboarding/landlord')
      const isUnverified = url.includes('/signup/landlord/confirmation')

      if (isOnboarding) {
        console.log('⚠ Landlord signed in but onboarding is incomplete →', url)
      }
      if (isUnverified) {
        console.log('⚠ Landlord credentials accepted but email is NOT verified → /signup/landlord/confirmation')
      }
      expect(
        isLandlordHome || isOnboarding || isUnverified,
        `Landlord should land on /landlord/overview, /onboarding/landlord/*, or the confirmation page — got: ${url}`,
      ).toBeTruthy()

      await snap(page, testInfo, 'landlord-04-final-destination')
      console.log(`✓ Landlord final destination: ${url}`)
    })

    await test.step('5. No unexpected browser errors', async () => {
      if (pageErrors.length > 0) console.log('⚠ Page errors:', pageErrors.slice(0, 5))
      if (consoleErrors.length > 0) console.log('⚠ Console errors:', consoleErrors.slice(0, 5))
      expect(pageErrors, `Uncaught page errors: ${pageErrors.join(' | ')}`).toHaveLength(0)
      console.log('✓ No uncaught page errors')
    })
  })
})
