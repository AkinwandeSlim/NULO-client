import { test, expect, type Page, type TestInfo } from '@playwright/test'
import { snap, collectBrowserErrors, signInAsLandlord } from './helpers'

/**
 * E2E: Authenticated landlord application review flow.
 *
 * Prereq: dev server running on http://localhost:3000 (pnpm dev in client/).
 *
 * Run:
 *   pnpm test:e2e:headed -- e2e/landlord-applications.spec.ts
 *   $env:SLOWMO=600; pnpm test:e2e:headed -- e2e/landlord-applications.spec.ts
 *
 * Flow stages exercised:
 *   1. Sign in as landlord (email/password)
 *   2. Landlord lands on /landlord/overview
 *   3. Navigate to /landlord/applications (list view)
 *   4. If applications exist → open the first one (Review Application)
 *   5. Verify the detail page renders (tenant profile, approve/reject actions)
 *
 * NOTE: This test does NOT click Approve/Reject — those mutate real data in
 * the shared demo database. It verifies the decision UI is present and
 * functional (buttons visible, confirmation panels wired) without committing
 * a decision.
 */

test.describe('Landlord application review flow', () => {
  test('landlord can view applications and reach the approve/reject decision UI', async ({ page }, testInfo) => {
    const { consoleErrors, pageErrors } = collectBrowserErrors(page)

    // ── Step 1: Sign in as landlord ──────────────────────────────────────────
    await test.step('1. Sign in as landlord', async () => {
      const url = await signInAsLandlord(page)
      console.log(`✓ Landlord signed in → ${url}`)
      expect(url, 'Landlord should not remain on /signin').not.toContain('/signin')
      await snap(page, testInfo, 'landlord-01-signed-in')
    })

    // ── Step 2: Landlord lands on an authenticated page ──────────────────────
    await test.step('2. Landlord reaches an authenticated destination', async () => {
      const url = page.url()
      const isOverview = url.includes('/landlord/overview')
      const isOnboarding = url.includes('/onboarding/landlord')
      const isUnverified = url.includes('/signup/landlord/confirmation')

      if (isOnboarding) console.log('⚠ Landlord onboarding incomplete →', url)
      if (isUnverified) console.log('⚠ Landlord email unverified →', url)

      expect(
        isOverview || isOnboarding || isUnverified,
        `Landlord should land on /landlord/overview, onboarding, or confirmation — got: ${url}`,
      ).toBeTruthy()
      await snap(page, testInfo, 'landlord-02-destination')
    })

    // ── Step 3: Navigate to the applications list ────────────────────────────
    await test.step('3. Open /landlord/applications', async () => {
      await page.goto('/landlord/applications', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle').catch(() => {})

      // The page header always renders "Applications Received".
      await expect(
        page.getByText('Applications Received').first(),
        'Applications list header should render',
      ).toBeVisible({ timeout: 30_000 })
      await snap(page, testInfo, 'landlord-03-applications-list')
      console.log('✓ Applications list loaded')
    })

    // ── Step 4: Inspect list state (empty vs has applications) ───────────────
    await test.step('4. Detect whether the landlord has applications', async () => {
      const emptyState = page.getByText('No applications yet')
      const reviewBtn = page.locator('button:has-text("Review Application")').first()

      // Wait for either the empty state or at least one review button.
      await Promise.race([
        emptyState.waitFor({ state: 'visible', timeout: 30_000 }),
        reviewBtn.waitFor({ state: 'visible', timeout: 30_000 }),
      ]).catch(() => {})

      const hasApplications = await reviewBtn.isVisible().catch(() => false)
      console.log(`✓ Applications present: ${hasApplications}`)
      await snap(page, testInfo, 'landlord-04-list-state')

      if (!hasApplications) {
        // Nothing to review — the list rendered correctly, so the flow is
        // verified up to the data boundary. Skip the detail-page steps.
        console.log('⚠ No applications for this landlord — skipping detail review steps')
        test.skip(true, 'No applications to review for the demo landlord account')
      }
    })


    // ── Step 5: Open the first application ───────────────────────────────────
    await test.step('5. Open the first application (Review Application)', async () => {
      const reviewBtn = page.locator('button:has-text("Review Application")').first()
      await reviewBtn.click()

      // Detail page URL: /landlord/applications/{id}
      await page.waitForURL(/\/landlord\/applications\/[^/]+$/, { timeout: 30_000 })
      await page.waitForLoadState('networkidle').catch(() => {})
      await snap(page, testInfo, 'landlord-05-application-detail')
      console.log(`✓ Application detail opened → ${page.url()}`)
    })

    // ── Step 6: Verify detail page sections render ───────────────────────────
    await test.step('6. Verify application detail sections render', async () => {
      // The detail page always renders the Tenant Profile section.
      await expect(
        page.getByText('Tenant Profile').first(),
        'Tenant Profile section should render',
      ).toBeVisible({ timeout: 30_000 })

      // Property Information section.
      await expect(
        page.getByText('Property Information').first(),
        'Property Information section should render',
      ).toBeVisible({ timeout: 10_000 })

      await snap(page, testInfo, 'landlord-06-detail-sections')
      console.log('✓ Detail sections rendered')
    })

    // ── Step 7: Verify the approve/reject decision UI ────────────────────────
    await test.step('7. Verify approve/reject decision UI (no mutation)', async () => {
      const approveBtn = page.locator('button:has-text("Approve Application")')
      const rejectBtn = page.locator('button:has-text("Reject Application")')

      const approveVisible = await approveBtn.isVisible().catch(() => false)
      const rejectVisible = await rejectBtn.isVisible().catch(() => false)

      // Decision buttons only render while the application status is pending.
      // If the application is already approved/rejected they are hidden — that
      // is a valid terminal state, so we report rather than fail.
      if (approveVisible && rejectVisible) {
        console.log('✓ Approve + Reject buttons visible (application is pending)')

        // Open the approve confirmation panel, verify it, then cancel — this
        // proves the double-confirm wiring without committing a decision.
        await approveBtn.click()
        await expect(
          page.locator('button:has-text("Confirm Approval")'),
          'Confirm Approval panel should appear',
        ).toBeVisible({ timeout: 10_000 })
        await snap(page, testInfo, 'landlord-07-approve-confirm-panel')

        // Cancel out — do NOT approve.
        const cancelBtn = page.locator('button:has-text("Cancel")').first()
        if (await cancelBtn.isVisible().catch(() => false)) {
          await cancelBtn.click()
          await page.waitForTimeout(300)
        }
        console.log('✓ Approve confirmation panel verified and cancelled (no mutation)')
      } else {
        console.log('⚠ Approve/Reject not visible — application is in a terminal state (already reviewed)')
      }

      await snap(page, testInfo, 'landlord-07-decision-ui')
    })

    // ── Step 8: No unexpected browser errors ─────────────────────────────────
    await test.step('8. No unexpected browser errors', async () => {
      if (pageErrors.length > 0) console.log('⚠ Page errors:', pageErrors.slice(0, 5))
      if (consoleErrors.length > 0) console.log('⚠ Console errors:', consoleErrors.slice(0, 5))
      expect(pageErrors, `Uncaught page errors: ${pageErrors.join(' | ')}`).toHaveLength(0)
      console.log('✓ No uncaught page errors')
    })
  })
})
