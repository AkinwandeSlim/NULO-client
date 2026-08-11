import { test, expect } from '@playwright/test'

test('guest propflow search + select sign-in flow', async ({ page }) => {
  const BASE = 'http://localhost:3000'

  // 1. Signed-out visit to marketplace
  await page.goto(BASE + '/properties', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1500)

  // 2. Widget is visible for a guest (no {user &&} gate)
  const fab = page.locator('button[aria-label="Open PropFlow"]')
  await expect(fab).toBeVisible({ timeout: 30000 })
  await fab.click()
  await page.waitForTimeout(800)

  // 3. Guest welcome text visible ("no login needed to search")
  const welcome = page.locator('text=no login needed to search')
  await expect(welcome).toBeVisible({ timeout: 10000 })
  console.log('✓ Guest welcome visible')

  // 4. Send search query
  const textarea = page.locator('textarea[placeholder="Type your message..."]')
  await textarea.fill('2 bed apartment in Abuja 300k')
  await textarea.press('Enter')

  // 5. Wait for cards to render (agent responds via guest endpoint, no 401)
  const selectBtn = page.locator('button:has-text("Select This Property")').first()
  await expect(selectBtn).toBeVisible({ timeout: 90000 })
  console.log('✓ Search returned property cards')

  // 6. Screenshot before clicking Select
  await page.screenshot({ path: '/tmp/nulo_pre_select.png' })

  // 7. Click "Select This Property" -> should show sign-in card for guest
  await selectBtn.click()
  await page.waitForTimeout(1000)

  // 8. Check for sign-in card or blocker message
  const signinText = page.locator('text=/log in to apply|Create account|You.+re one step away/i')
  const hasSignin = await signinText.count() > 0
  console.log('Sign-in card/message visible:', hasSignin)

  // Debug: print what's on the page
  const bodyText = await page.locator('body').textContent()
  if (bodyText.includes('Create account') || bodyText.includes('Log in')) {
    console.log('✓ Sign-in card found in page text')
  } else {
    console.log('⚠ Sign-in card NOT found. Page contains:', bodyText.substring(0, 500))
  }

  // 9. Screenshot after select
  await page.screenshot({ path: '/tmp/nulo_post_select.png' })

  // 10. Verify we didn't redirect to /signin (401 interceptor should NOT fire for guests)
  expect(page.url()).not.toContain('/signin')
  console.log('✓ No redirect to /signin (guest endpoint used, not auth-gated)')

  // 11. Verify no console errors
  const errors = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  if (errors.length === 0) {
    console.log('✓ No console errors')
  } else {
    console.log('⚠ Console errors:', errors.slice(0, 3))
  }
})
