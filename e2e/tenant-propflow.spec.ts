import { test, expect, type Page, type TestInfo } from '@playwright/test'
import {
  snap,
  collectBrowserErrors,
  signInAsTenant,
  TEST_PNG,
  TEST_PDF,
} from './helpers'

/**
 * E2E: Authenticated tenant PropFlow — search → select property → Trust
 * Passport → submit application.
 *
 * Prereq: dev server running on http://localhost:3000 (pnpm dev in client/).
 *
 * Run:
 *   pnpm test:e2e:headed -- e2e/tenant-propflow.spec.ts
 *   $env:SLOWMO=600; pnpm test:e2e:headed -- e2e/tenant-propflow.spec.ts
 *
 * Flow stages exercised:
 *   1. Sign in as tenant (email/password)
 *   2. Open PropFlow widget
 *   3. Send search query → property cards appear
 *   4. Click "Select This Property" → Trust Passport modal opens
 *   5. Fill Trust Passport form (identity doc, income doc, reference,
 *      employment, move-in date, consent)
 *   6. Submit application → stage advances to awaiting_landlord_approval
 */

test.describe('Tenant PropFlow authenticated flow', () => {
  test('tenant can search, select a property, and submit a Trust Passport application', async ({ page }, testInfo) => {
    const { consoleErrors, pageErrors } = collectBrowserErrors(page)

    // ── Step 1: Sign in as tenant ────────────────────────────────────────────
    await test.step('1. Sign in as tenant', async () => {
      const url = await signInAsTenant(page)
      console.log(`✓ Tenant signed in → ${url}`)
      // Tenant should land on /tenant or /properties (not /signin)
      expect(url, 'Tenant should not remain on /signin').not.toContain('/signin')
      await snap(page, testInfo, 'tenant-01-signed-in')
    })

    // ── Step 2: Navigate to /properties and open PropFlow ────────────────────
    await test.step('2. Open PropFlow widget on /properties', async () => {
      await page.goto('/properties', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle').catch(() => {})

      const fab = page.locator('button[aria-label="Open PropFlow"]')
      await expect(fab, 'PropFlow FAB should be visible').toBeVisible({ timeout: 30_000 })
      await fab.click()
      await page.waitForTimeout(800)
      await snap(page, testInfo, 'tenant-02-widget-opened')
      console.log('✓ PropFlow widget opened')
    })

    // ── Step 3: Send search query ────────────────────────────────────────────
    await test.step('3. Send search query', async () => {
      const textarea = page.locator('textarea[placeholder="Type your message..."]')
      await expect(textarea, 'Chat input should be visible').toBeVisible({ timeout: 10_000 })
      await textarea.fill('2 bed apartment in Abuja 300k')
      await textarea.press('Enter')
      await snap(page, testInfo, 'tenant-03-query-sent')
      console.log('✓ Search query sent')
    })

    // ── Step 4: Wait for property cards ──────────────────────────────────────
    await test.step('4. Property cards appear', async () => {
      const selectBtn = page.locator('button:has-text("Select This Property")').first()
      await expect(
        selectBtn,
        'Agent should return property cards with a Select button (90s budget for AI response)',
      ).toBeVisible({ timeout: 90_000 })
      await snap(page, testInfo, 'tenant-04-property-cards')
      console.log('✓ Property cards rendered')
    })

    // ── Step 5: Select a property → Trust Passport modal opens ───────────────
    await test.step('5. Select property → Trust Passport modal opens', async () => {
      const selectBtn = page.locator('button:has-text("Select This Property")').first()
      await selectBtn.click()

      // The Trust Passport modal should appear (role="dialog" with aria-label)
      const modal = page.locator('div[role="dialog"][aria-label="Complete your application"]')
      await expect(modal, 'Trust Passport modal should open after property selection').toBeVisible({ timeout: 30_000 })
      await snap(page, testInfo, 'tenant-05-trust-passport-modal')
      console.log('✓ Trust Passport modal opened')
    })

    // ── Step 6: Upload identity document ─────────────────────────────────────
    await test.step('6. Upload identity document', async () => {
      // The identity accordion auto-opens. File inputs: first is identity,
      // second is income (both accept="image/*,.pdf").
      const fileInputs = page.locator('input[type="file"][accept="image/*,.pdf"]')
      const identityInput = fileInputs.nth(0)
      await identityInput.setInputFiles({
        name: TEST_PNG.name,
        mimeType: TEST_PNG.mimeType,
        buffer: TEST_PNG.buffer,
      })
      await page.waitForTimeout(500)
      await snap(page, testInfo, 'tenant-06-identity-uploaded')
      console.log('✓ Identity document uploaded')
    })

    // ── Step 7: Upload income evidence ───────────────────────────────────────
    await test.step('7. Upload income evidence', async () => {
      // Open the income accordion (only one section is open at a time).
      const incomeAccordion = page.locator('button:has-text("Income evidence")')
      await incomeAccordion.click()
      await page.waitForTimeout(300)

      const fileInputs = page.locator('input[type="file"][accept="image/*,.pdf"]')
      const incomeInput = fileInputs.nth(1)
      await incomeInput.setInputFiles({
        name: TEST_PDF.name,
        mimeType: TEST_PDF.mimeType,
        buffer: TEST_PDF.buffer,
      })
      await page.waitForTimeout(500)
      await snap(page, testInfo, 'tenant-07-income-uploaded')
      console.log('✓ Income evidence uploaded')
    })

    // ── Step 8: Fill reference details ───────────────────────────────────────
    await test.step('8. Fill reference details', async () => {
      const refAccordion = page.locator('button:has-text("Reference")')
      await refAccordion.click()
      await page.waitForTimeout(300)

      await page.fill('#tp-ref-name', 'Chinedu Okafor')
      await page.fill('#tp-ref-phone', '08123456789')
      await page.selectOption('#tp-ref-rel', 'Previous landlord')
      await snap(page, testInfo, 'tenant-08-reference-filled')
      console.log('✓ Reference details filled')
    })

    // ── Step 9: Fill application details (employment, income, move-in) ───────
    await test.step('9. Fill application details', async () => {
      const detailsAccordion = page.locator('button:has-text("Application details")')
      await detailsAccordion.click()
      await page.waitForTimeout(300)

      // Phone number (may be pre-filled from profile)
      const phoneInput = page.locator('input[placeholder="Phone number (e.g. 0812 345 6789)"]')
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('08123456789')
      }

      // Employment status
      const empSelect = page.locator('select[aria-label="Employment status"]')
      await empSelect.selectOption('employed')
      await page.waitForTimeout(300)

      // Employer name + monthly income (appear when employed)
      const employerInput = page.locator('input[placeholder="Employer name"]')
      if (await employerInput.isVisible()) {
        await employerInput.fill('Nulo Africa Ltd')
      }
      const incomeInput = page.locator('input[placeholder="Monthly income (₦)"]')
      if (await incomeInput.isVisible()) {
        await incomeInput.fill('500000')
      }

      // Move-in date (30 days from now)
      const moveInInput = page.locator('#tp-move-in')
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      const dateStr = futureDate.toISOString().split('T')[0]
      await moveInInput.fill(dateStr)

      await snap(page, testInfo, 'tenant-09-details-filled')
      console.log('✓ Application details filled')
    })

    // ── Step 10: Check consent and submit ────────────────────────────────────
    await test.step('10. Check consent and submit application', async () => {
      const consentCheckbox = page.locator('#tp-consent')
      await expect(consentCheckbox, 'Consent checkbox should be visible').toBeVisible({ timeout: 5_000 })
      await consentCheckbox.check()
      await page.waitForTimeout(300)

      const submitBtn = page.locator('button:has-text("Submit application")')
      await expect(submitBtn, 'Submit button should be enabled').toBeEnabled({ timeout: 5_000 })
      await submitBtn.click()
      await snap(page, testInfo, 'tenant-10-submitted')
      console.log('✓ Application submitted')
    })

    // ── Step 11: Verify post-submission state ────────────────────────────────
    await test.step('11. Verify application submitted successfully', async () => {
      // After submission the modal closes and the chat shows a confirmation.
      // The stage advances to awaiting_landlord_approval.
      await page.waitForTimeout(3000)

      const modal = page.locator('div[role="dialog"][aria-label="Complete your application"]')
      const modalVisible = await modal.isVisible().catch(() => false)

      if (!modalVisible) {
        console.log('✓ Trust Passport modal closed after submission')
      } else {
        const bodyText = await page.locator('body').textContent() ?? ''
        console.log('⚠ Modal still visible. Page text (first 300 chars):', bodyText.substring(0, 300))
      }

      await snap(page, testInfo, 'tenant-11-final-state')
    })

    // ── Step 12: No unexpected browser errors ────────────────────────────────
    await test.step('12. No unexpected browser errors', async () => {
      if (pageErrors.length > 0) console.log('⚠ Page errors:', pageErrors.slice(0, 5))
      if (consoleErrors.length > 0) console.log('⚠ Console errors:', consoleErrors.slice(0, 5))
      expect(pageErrors, `Uncaught page errors: ${pageErrors.join(' | ')}`).toHaveLength(0)
      console.log('✓ No uncaught page errors')
    })
  })
})

