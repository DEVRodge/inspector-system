import fs from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'

const screenshotDir = path.resolve(process.cwd(), 'test-artifacts/screenshots')

function screenshotPath(name: string) {
  fs.mkdirSync(screenshotDir, { recursive: true })
  return path.join(screenshotDir, name)
}

test.describe('front-end overall validation', () => {
  test('smoke + main flow: login to report page', async ({ page }) => {
    await page.goto('/login')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    await expect(page.getByText('后台登录')).toBeVisible()
    await page.screenshot({ path: screenshotPath('01-login-page.png'), fullPage: true })

    await page.getByPlaceholder('请输入账号').fill('admin')
    await page.getByPlaceholder('请输入密码').fill('123456')
    await page.getByRole('button', { name: '登录系统' }).click()

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('heading', { name: '设备巡检数字化工作台' })).toBeVisible()
    await page.screenshot({ path: screenshotPath('02-dashboard-page.png'), fullPage: true })

    await page.getByRole('menuitem', { name: '统计报表' }).click()
    await expect(page).toHaveURL(/\/reports/)
    await expect(page.getByRole('heading', { name: '统计报表' })).toBeVisible()
    await page.screenshot({ path: screenshotPath('03-report-page.png'), fullPage: true })
  })

  test('error-state: login requires username and password', async ({ page }) => {
    await page.goto('/login')
    await page.evaluate(() => localStorage.clear())
    await page.reload()

    await page.getByRole('button', { name: '登录系统' }).click()
    await expect(page.getByText('请输入账号和密码')).toBeVisible()
    await page.screenshot({ path: screenshotPath('04-login-validation-error.png'), fullPage: true })
  })
})
