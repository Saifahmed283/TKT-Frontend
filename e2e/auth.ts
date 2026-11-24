import { expect, type Page } from '@playwright/test'

type Credentials = { email: string; password: string }

const ENV = {
  adminEmail: 'E2E_ADMIN_EMAIL',
  adminPassword: 'E2E_ADMIN_PASSWORD',
  staffEmail: 'E2E_STAFF_EMAIL',
  staffPassword: 'E2E_STAFF_PASSWORD',
} as const

function requireEnv(names: readonly string[]): Record<string, string> {
  const missing = names.filter((name) => !process.env[name]?.trim())
  if (missing.length > 0) {
    throw new Error(`Missing required E2E environment variable(s): ${missing.join(', ')}. Set them before running Playwright tests.`)
  }
  return Object.fromEntries(names.map((name) => [name, process.env[name]!.trim()]))
}

export function getAdminCredentials(): Credentials {
  const env = requireEnv([ENV.adminEmail, ENV.adminPassword])
  return { email: env[ENV.adminEmail], password: env[ENV.adminPassword] }
}

export function getStaffCredentials(): Credentials {
  const env = requireEnv([ENV.staffEmail, ENV.staffPassword])
  return { email: env[ENV.staffEmail], password: env[ENV.staffPassword] }
}

export function getAdminEmail(): string {
  return requireEnv([ENV.adminEmail])[ENV.adminEmail]
}

export async function submitLogin(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

async function login(page: Page, credentials: Credentials, timeout: number) {
  await submitLogin(page, credentials.email, credentials.password)
  await expect(page).toHaveURL(/\/app/, { timeout })
}

export async function loginAsAdmin(page: Page, timeout = 20_000) {
  await login(page, getAdminCredentials(), timeout)
}

export async function loginAsStaff(page: Page, timeout = 20_000) {
  await login(page, getStaffCredentials(), timeout)
}
