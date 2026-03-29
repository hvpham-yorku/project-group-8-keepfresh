import { test, expect } from '@playwright/test';

// KeepFresh UI tests
// These are written as straight-forward end-to-end checks

test.describe('KeepFresh UI smoke tests', () => {
  test('home page content and navigation to login/signup', async ({ page }) => {
    // Start at the home page and verify the main brand copy is visible.
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'KeepFresh' })).toBeVisible();

    // The homepage has login/signup.
    await expect(page.getByRole('link', { name: 'Go to Login' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go to Sign Up' })).toBeVisible();

    // Clicking login works, and the login heading shows.
    await page.getByRole('link', { name: 'Go to Login' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'KeepFresh Login' })).toBeVisible();

    // Go back home and click signup.
    await page.goto('/');
    await page.getByRole('link', { name: 'Go to Sign Up' }).click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByRole('heading', { name: 'KeepFresh Sign Up' })).toBeVisible();
  });

  test('login form validation shows message for short username/password', async ({ page }) => {
    await page.goto('/login');

    // Short values shouldnt be allowed
    await page.getByLabel('Username').fill('ab');
    await page.getByRole('textbox', { name: 'Password' }).fill('12');
    await page.getByRole('button', { name: 'Log In' }).click();

    await expect(page.getByText('Username must be at least 3 characters')).toBeVisible();
  });

  test('signup form validation shows errors for missing email', async ({ page }) => {
    await page.goto('/signup');

    // Email is required, so empty should show validation text.
    await page.getByLabel('Username').fill('abc');
    await page.getByLabel('Email').fill('');
    await page.getByRole('textbox', { name: 'Password' }).fill('abc');
    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page.getByText('Email is required')).toBeVisible();
  });

  test('login password visibility toggle works', async ({ page }) => {
    // Ensure the eye icon toggles password visibility so user can verify input.
    await page.goto('/login');
    const passwordInput = page.getByRole('textbox', { name: 'Password' });
    const toggleButton = page.getByRole('button', { name: 'Show password' });

    await passwordInput.fill('abc');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await toggleButton.click();
    await expect(page.getByRole('button', { name: 'Hide password' })).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('signup password visibility toggle works', async ({ page }) => {
    await page.goto('/signup');

    const passwordInput = page.getByRole('textbox', { name: 'Password' });
    const toggleButton = page.getByRole('button', { name: 'Show password' });

    await passwordInput.fill('abc');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    await toggleButton.click();
    await expect(page.getByRole('button', { name: 'Hide password' })).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('login shows network error when login API fails to connect', async ({ page }) => {
    // Force a network failure only for the API POST /login request (not the page navigation).
    await page.route('**/login', (route) => {
      if (route.request().method() === 'POST') {
        route.abort();
      } else {
        route.continue();
      }
    });

    await page.goto('/login');
    await page.getByLabel('Username').fill('abc');
    await page.getByRole('textbox', { name: 'Password' }).fill('abc');
    await page.getByRole('button', { name: 'Log In' }).click();

    await expect(page.getByText('Network error')).toBeVisible();
  });

  test('signup shows error when server returns 500', async ({ page }) => {
    //backend 500 to ensure failure message path is covered.
    await page.route('**/signup', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({ status: 500, body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } });
      } else {
        route.continue();
      }
    });

    await page.goto('/signup');
    await page.getByLabel('Username').fill('abcd');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('abc');
    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page.getByText('Sign up failed')).toBeVisible();
  });

  test('userhome redirects to login when no user token exists', async ({ page }) => {
    // Access control expectation: userhome should require login.
    await page.goto('/userhome');
    await expect(page).toHaveURL(/\/login$/);
  });
});
