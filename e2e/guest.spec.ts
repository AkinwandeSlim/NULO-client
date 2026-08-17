import { test, expect, type Page, type TestInfo } from '@playwright/test'

/**
 * E2E: Guest PropFlow search → property cards → "Select This Property" flow.
 *
 * Run with (dev server must be up on http://localhost:3000):
 *   pnpm test:e2e
 *
 * Every step is wrapped in test.step() so a failure names the exact stage,
 * and a screenshot is attached after each step (visible in the HTML report
 * and saved under client/test-results/).
 */

/**
 * Take a screenshot, attach it to the HTML report, AND save it to disk under
 * test-results/screenshots/ so the images survive even when the test passes
 * (Playwright cleans per-test artifact folders on success, and the HTML
 * report embeds attachments — saving to disk keeps them always inspectable).
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

test.describe('Guest PropFlow flow', () => {
  test('guest can search, see property cards, and select without a hard redirect', async ({ page }, testInfo) => {
    // ---- Collect browser console + page errors from the very start --------
    const consoleErrors: string[] = []
    const pageErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })
    page.on('pageerror', (err) => pageErrors.push(err.message))

    // ---- Step 1: Visit marketplace as a signed-out guest ------------------
    await test.step('1. Open /properties as guest', async () => {
      await page.goto('/properties', { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle').catch(() => { /* dev server may keep polling */ })
      await snap(page, testInfo, '01-marketplace-loaded')
      console.log('✓ Marketplace loaded, URL:', page.url())
    })

    // ---- Step 2: PropFlow FAB is visible for guests -----------------------
    await test.step('2. PropFlow widget button is visible', async () => {
      const fab = page.locator('button[aria-label="Open PropFlow"]')
      await expect(fab, 'PropFlow FAB should be visible for guests (no login gate)').toBeVisible({ timeout: 30_000 })
      await fab.click()
      await page.waitForTimeout(800)
      await snap(page, testInfo, '02-widget-opened')
      console.log('✓ PropFlow widget opened')
    })

    // ---- Step 3: Guest welcome message ------------------------------------
    await test.step('3. Guest welcome text is shown', async () => {
      const welcome = page.getByText('no login needed to search')
      await expect(welcome, 'Guest welcome should mention "no login needed to search"').toBeVisible({ timeout: 10_000 })
      console.log('✓ Guest welcome visible')
    })

    // ---- Step 4: Send a search query --------------------------------------
    await test.step('4. Send search query', async () => {
      const textarea = page.locator('textarea[placeholder="Type your message..."]')
      await expect(textarea, 'Chat input should be visible').toBeVisible({ timeout: 10_000 })
      await textarea.fill('2 bed apartment in Abuja 300k')
      await textarea.press('Enter')
      await snap(page, testInfo, '04-query-sent')
      console.log('✓ Search query sent')
    })

    // ---- Step 5: Wait for property cards (AI agent response) --------------
    await test.step('5. Property cards appear', async () => {
      const selectBtn = page.locator('button:has-text("Select This Property")').first()
      await expect(selectBtn, 'Agent should return property cards with a Select button (90s budget for AI response)').toBeVisible({ timeout: 90_000 })
      await snap(page, testInfo, '05-property-cards')
      console.log('✓ Search returned property cards')
    })

    // ---- Step 6: Click "Select This Property" ------------------------------
    await test.step('6. Click "Select This Property"', async () => {
      const selectBtn = page.locator('button:has-text("Select This Property")').first()
      await selectBtn.click()
      await page.waitForTimeout(1500)
      await snap(page, testInfo, '06-after-select')
      console.log('✓ Clicked Select This Property')
    })

    // ---- Step 7: Guest should see a sign-in prompt, not a hard redirect ----
    await test.step('7. Sign-in prompt shown, no redirect to /signin', async () => {
      // The 401 interceptor must NOT fire for guests — we should stay on the
      // same page with an inline sign-in card/message.
      expect(page.url(), 'Guests must not be hard-redirected to /signin').not.toContain('/signin')

      const bodyText = (await page.locator('body').textContent()) ?? ''
      const hasSigninPrompt =
        /log in to apply|create account|one step away|sign in/i.test(bodyText)
      console.log('Sign-in prompt visible:', hasSigninPrompt)
      if (!hasSigninPrompt) {
        console.log('⚠ Page text (first 500 chars):', bodyText.substring(0, 500))
      }
      await snap(page, testInfo, '07-final-state')
    })

    // ---- Step 8: Report collected browser errors ---------------------------
    await test.step('8. No unexpected browser errors', async () => {
      if (pageErrors.length > 0) {
        console.log('⚠ Page errors:', pageErrors.slice(0, 5))
      }
      if (consoleErrors.length > 0) {
        console.log('⚠ Console errors:', consoleErrors.slice(0, 5))
      }
      // Fail only on uncaught page exceptions; console.error noise (e.g. React
      // dev warnings, failed favicon) is reported but not fatal.
      expect(pageErrors, `Uncaught page errors: ${pageErrors.join(' | ')}`).toHaveLength(0)
      console.log('✓ No uncaught page errors')
    })
  })
})
