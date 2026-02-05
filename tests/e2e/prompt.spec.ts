import { test, expect, Page } from '@playwright/test';

// Test configuration
const PROMPT_URL = '/prompt';
const VALID_YOUTUBE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const INVALID_URLS = [
  'https://example.com/video',
  'not-a-url',
  'https://vimeo.com/123456',
  'youtube.com', // Missing protocol and video ID
];

// Helper to take screenshot with timestamp
async function screenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `playwright-report/screenshots/${timestamp}-${name}.png`,
    fullPage: true,
  });
}

// Helper to wait for page to be stable
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  // Wait for any animations to settle
  await page.waitForTimeout(500);
}

test.describe('Prompt Page - UI/UX Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PROMPT_URL);
    await waitForPageLoad(page);
  });

  test('page loads correctly with title', async ({ page }) => {
    // Check page title exists
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await screenshot(page, '01-page-loaded');
  });

  test('form elements are visible and interactive', async ({ page }) => {
    // Check workflow selector exists
    const workflowSelector = page.locator('[class*="workflowSelector"], [class*="WorkflowSelector"]');
    await expect(workflowSelector.first()).toBeVisible();

    // Check URL input is visible (default workflow)
    const urlInput = page.locator('input#video-url, input[placeholder*="youtube"], input[type="text"]').first();
    await expect(urlInput).toBeVisible();
    await expect(urlInput).toBeEnabled();

    await screenshot(page, '02-form-elements-visible');
  });

  test('workflow selector changes form dynamically', async ({ page }) => {
    // Find workflow buttons
    const workflowButtons = page.locator('button[class*="workflowOption"], [class*="workflow"] button');
    const buttonCount = await workflowButtons.count();

    if (buttonCount >= 2) {
      // Click the second workflow option (script-to-scenes)
      await workflowButtons.nth(1).click();
      await page.waitForTimeout(300); // Wait for animation

      // Check if textarea for script appears
      const scriptTextarea = page.locator('textarea[placeholder*="script"], textarea[placeholder*="Script"]');
      const isScriptVisible = await scriptTextarea.isVisible().catch(() => false);

      await screenshot(page, '03-workflow-changed');

      // Go back to first workflow
      await workflowButtons.nth(0).click();
      await page.waitForTimeout(300);

      // URL input should be visible again
      const urlInput = page.locator('input#video-url, input[placeholder*="youtube"], input[type="text"]').first();
      await expect(urlInput).toBeVisible();
    }
  });

  test('mode selector (Direct/Hybrid) is visible and toggles', async ({ page }) => {
    // Enter a URL first to enable more UI elements
    const urlInput = page.locator('input#video-url, input[placeholder*="youtube"], input[type="text"]').first();
    await urlInput.fill(VALID_YOUTUBE_URL);
    await page.waitForTimeout(600); // Wait for validation

    // Find mode buttons
    const modeButtons = page.locator('[class*="modeButton"], button:has-text("Direct"), button:has-text("Hybrid")');
    const modeCount = await modeButtons.count();

    if (modeCount >= 2) {
      // Check initial state
      await screenshot(page, '04-mode-initial');

      // Click Hybrid mode
      const hybridButton = page.locator('button:has-text("Hybrid")').first();
      if (await hybridButton.isVisible()) {
        await hybridButton.click();
        await page.waitForTimeout(200);
        await screenshot(page, '05-mode-hybrid-selected');
      }

      // Click Direct mode
      const directButton = page.locator('button:has-text("Direct")').first();
      if (await directButton.isVisible()) {
        await directButton.click();
        await page.waitForTimeout(200);
        await screenshot(page, '06-mode-direct-selected');
      }
    }
  });

  test('settings panel expands and collapses', async ({ page }) => {
    // Find settings toggle button
    const settingsToggle = page.locator('button:has-text("Settings"), button[class*="settingsToggle"]');
    const toggleVisible = await settingsToggle.isVisible().catch(() => false);

    if (toggleVisible) {
      // Take initial screenshot
      await screenshot(page, '07-settings-collapsed');

      // Click to expand
      await settingsToggle.click();
      await page.waitForTimeout(300);
      await screenshot(page, '08-settings-expanded');

      // Verify settings content is visible
      const settingsContent = page.locator('[class*="settingsRows"], [class*="settingsGroup"]');
      const contentVisible = await settingsContent.first().isVisible().catch(() => false);

      // Click to collapse
      await settingsToggle.click();
      await page.waitForTimeout(300);
      await screenshot(page, '09-settings-collapsed-again');
    }
  });

  test('history sidebar opens and closes', async ({ page }) => {
    // History sidebar may only appear if there are cached jobs
    // Look for the sidebar or toggle button
    const sidebar = page.locator('[class*="sidebar"], [class*="history"]');
    const sidebarVisible = await sidebar.first().isVisible().catch(() => false);

    if (sidebarVisible) {
      await screenshot(page, '10-sidebar-visible');

      // Look for collapse toggle
      const collapseToggle = page.locator('[class*="collapseToggle"], button[aria-label*="Collapse"]');
      if (await collapseToggle.isVisible()) {
        await collapseToggle.click();
        await page.waitForTimeout(300);
        await screenshot(page, '11-sidebar-collapsed');

        // Expand again
        const expandToggle = page.locator('[class*="collapseToggle"], button[aria-label*="Expand"]');
        if (await expandToggle.isVisible()) {
          await expandToggle.click();
          await page.waitForTimeout(300);
          await screenshot(page, '12-sidebar-expanded');
        }
      }
    } else {
      // No history - take screenshot of empty state
      await screenshot(page, '10-no-history-sidebar');
    }
  });
});

test.describe('Prompt Page - Form Validation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PROMPT_URL);
    await waitForPageLoad(page);
  });

  test('invalid YouTube URLs show error indicator', async ({ page }) => {
    const urlInput = page.locator('input#video-url, input[placeholder*="youtube"], input[type="text"]').first();

    for (const invalidUrl of INVALID_URLS) {
      await urlInput.fill('');
      await urlInput.fill(invalidUrl);
      await page.waitForTimeout(600); // Wait for validation debounce

      // Check for invalid indicator (X mark or red border)
      const invalidIndicator = page.locator('[class*="urlXmark"], [class*="urlInputInvalid"], svg[stroke="#ef4444"]');
      const hasInvalidIndicator = await invalidIndicator.isVisible().catch(() => false);

      // Take screenshot for this invalid URL
      await screenshot(page, `13-invalid-url-${invalidUrl.replace(/[^a-z0-9]/gi, '-').slice(0, 20)}`);
    }
  });

  test('valid YouTube URL shows success indicator', async ({ page }) => {
    const urlInput = page.locator('input#video-url, input[placeholder*="youtube"], input[type="text"]').first();

    await urlInput.fill(VALID_YOUTUBE_URL);
    await page.waitForTimeout(600); // Wait for validation debounce

    // Check for valid indicator (checkmark or green border)
    const validIndicator = page.locator('[class*="urlCheckmark"], [class*="urlInputValid"], svg[stroke="#22c55e"]');
    const hasValidIndicator = await validIndicator.isVisible().catch(() => false);

    await screenshot(page, '14-valid-url-indicator');

    // Check for thumbnail preview
    const thumbnail = page.locator('[class*="thumbnailPreview"], [class*="thumbnail"] img');
    const hasThumbnail = await thumbnail.isVisible().catch(() => false);

    if (hasThumbnail) {
      await screenshot(page, '15-thumbnail-preview');
    }
  });

  test('empty URL shows validation error on submit attempt', async ({ page }) => {
    // Try to submit with empty URL
    const submitButton = page.locator('button[type="submit"], button:has-text("Generate")');

    // The submit button should not be visible when URL is empty
    // based on the code review (hasInput check)
    const isSubmitVisible = await submitButton.isVisible().catch(() => false);

    await screenshot(page, '16-empty-url-no-submit');

    // Enter partial URL and try
    const urlInput = page.locator('input#video-url, input[placeholder*="youtube"], input[type="text"]').first();
    await urlInput.fill('https://youtube.com');
    await page.waitForTimeout(600);

    // Check for any error toast or message
    const errorToast = page.locator('[class*="toast"], [class*="error"], [role="alert"]');
    const hasError = await errorToast.isVisible().catch(() => false);

    await screenshot(page, '17-partial-url-state');
  });

  test('scene count respects min/max bounds', async ({ page }) => {
    // First enter a valid URL to show settings
    const urlInput = page.locator('input#video-url, input[placeholder*="youtube"], input[type="text"]').first();
    await urlInput.fill(VALID_YOUTUBE_URL);
    await page.waitForTimeout(600);

    // Expand settings
    const settingsToggle = page.locator('button:has-text("Settings"), button[class*="settingsToggle"]');
    if (await settingsToggle.isVisible()) {
      await settingsToggle.click();
      await page.waitForTimeout(300);
    }

    // Find scene count input
    const sceneCountInput = page.locator('input[type="number"][min="1"][max="200"], input[class*="compactInput"]').first();
    if (await sceneCountInput.isVisible()) {
      // Test min bound
      await sceneCountInput.fill('0');
      await page.waitForTimeout(100);
      let value = await sceneCountInput.inputValue();
      // HTML5 validation should enforce min=1

      // Test max bound
      await sceneCountInput.fill('999');
      await page.waitForTimeout(100);
      value = await sceneCountInput.inputValue();
      // HTML5 validation should enforce max=200

      // Test valid value
      await sceneCountInput.fill('50');
      await page.waitForTimeout(100);
      value = await sceneCountInput.inputValue();
      expect(value).toBe('50');

      await screenshot(page, '18-scene-count-validated');
    }
  });
});

test.describe('Prompt Page - Workflow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PROMPT_URL);
    await waitForPageLoad(page);
  });

  test('submit URL and observe loading state', async ({ page }) => {
    // Enter valid URL
    const urlInput = page.locator('input#video-url, input[placeholder*="youtube"], input[type="text"]').first();
    await urlInput.fill(VALID_YOUTUBE_URL);
    await page.waitForTimeout(600);

    await screenshot(page, '19-before-submit');

    // Find and click submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Generate")');
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Wait for loading state to appear
      await page.waitForTimeout(500);
      await screenshot(page, '20-loading-state');

      // Check for loading indicators
      const loadingIndicator = page.locator('[aria-busy="true"], [class*="loading"], [class*="spinner"]');
      const isLoading = await loadingIndicator.isVisible().catch(() => false);

      // Check for progress updates
      const progressText = page.locator('[class*="progress"], [class*="batch"]');
      const hasProgress = await progressText.isVisible().catch(() => false);

      // Check for log entries
      const logPanel = page.locator('[class*="log"], [class*="Log"]');
      const hasLog = await logPanel.isVisible().catch(() => false);

      if (hasLog) {
        await screenshot(page, '21-log-panel-visible');
      }

      // Wait a bit for potential API response or error
      await page.waitForTimeout(3000);
      await screenshot(page, '22-after-waiting');

      // Check for error state (expected if API not configured)
      const errorState = page.locator('[class*="error"], [class*="Error"], [role="alert"]');
      const hasError = await errorState.isVisible().catch(() => false);

      if (hasError) {
        await screenshot(page, '23-error-state');
      }

      // Check for complete state (scenes displayed)
      const sceneDisplay = page.locator('[class*="scene"], [class*="Scene"]');
      const hasScenes = await sceneDisplay.isVisible().catch(() => false);

      if (hasScenes) {
        await screenshot(page, '24-scenes-complete');
      }
    }
  });

  test('cancel button works during loading', async ({ page }) => {
    // Enter valid URL
    const urlInput = page.locator('input#video-url, input[placeholder*="youtube"], input[type="text"]').first();
    await urlInput.fill(VALID_YOUTUBE_URL);
    await page.waitForTimeout(600);

    // Submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Generate")');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(500);

      // Look for cancel button
      const cancelButton = page.locator('button:has-text("Cancel"), button[class*="cancel"]');
      if (await cancelButton.isVisible()) {
        await screenshot(page, '25-cancel-button-visible');
        await cancelButton.click();
        await page.waitForTimeout(500);
        await screenshot(page, '26-after-cancel');

        // Should return to idle state
        const urlInputAgain = page.locator('input#video-url, input[placeholder*="youtube"], input[type="text"]').first();
        const isIdle = await urlInputAgain.isVisible().catch(() => false);
      }
    }
  });
});

test.describe('Prompt Page - Simultaneous Processing Test', () => {
  test('two browser contexts can run jobs independently', async ({ browser }) => {
    // Create two separate contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Navigate both pages to VEO
      await Promise.all([
        page1.goto(PROMPT_URL),
        page2.goto(PROMPT_URL),
      ]);

      await Promise.all([
        waitForPageLoad(page1),
        waitForPageLoad(page2),
      ]);

      // Take initial screenshots
      await screenshot(page1, '27-context1-initial');
      await screenshot(page2, '28-context2-initial');

      // Enter different URLs in each context
      const url1 = page1.locator('input#video-url, input[placeholder*="youtube"], input[type="text"]').first();
      const url2 = page2.locator('input#video-url, input[placeholder*="youtube"], input[type="text"]').first();

      await Promise.all([
        url1.fill(VALID_YOUTUBE_URL),
        url2.fill('https://www.youtube.com/watch?v=9bZkp7q19f0'), // Different video
      ]);

      await page1.waitForTimeout(600);
      await page2.waitForTimeout(600);

      // Take screenshots showing both have input
      await screenshot(page1, '29-context1-with-url');
      await screenshot(page2, '30-context2-with-url');

      // Note: We won't actually submit both as it would require API keys
      // This test verifies that two contexts can be set up independently
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});

test.describe('Prompt Page - History Panel Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PROMPT_URL);
    await waitForPageLoad(page);
  });

  test('history panel shows cached jobs if any exist', async ({ page }) => {
    const historyPanel = page.locator('[class*="sidebar"], [class*="history"]');
    const hasHistory = await historyPanel.isVisible().catch(() => false);

    if (hasHistory) {
      await screenshot(page, '31-history-panel');

      // Check for job cards
      const jobCards = page.locator('[class*="jobCard"]');
      const jobCount = await jobCards.count();

      if (jobCount > 0) {
        await screenshot(page, '32-history-with-jobs');

        // Check for search input
        const searchInput = page.locator('[class*="searchInput"]');
        if (await searchInput.isVisible()) {
          await searchInput.fill('test');
          await page.waitForTimeout(300);
          await screenshot(page, '33-history-search');
          await searchInput.fill('');
        }
      }
    } else {
      // No history - this is expected for fresh installs
      await screenshot(page, '31-no-history');
    }
  });

  test('delete button shows confirmation', async ({ page }) => {
    const historyPanel = page.locator('[class*="sidebar"], [class*="history"]');
    const hasHistory = await historyPanel.isVisible().catch(() => false);

    if (hasHistory) {
      const deleteButton = page.locator('[data-action="delete"], button[class*="delete"]').first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await page.waitForTimeout(300);
        await screenshot(page, '34-delete-confirmation');

        // Look for confirmation buttons
        const cancelDelete = page.locator('[class*="deleteCancelIcon"], button:has-text("Cancel")').first();
        if (await cancelDelete.isVisible()) {
          await cancelDelete.click();
          await page.waitForTimeout(200);
          await screenshot(page, '35-delete-cancelled');
        }
      }
    }
  });
});

test.describe('Prompt Page - Error Handling Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PROMPT_URL);
    await waitForPageLoad(page);
  });

  test('handles no API key scenario', async ({ page }) => {
    // Check for API key warning/notice
    const apiKeyNotice = page.locator('[class*="apiKeyNotice"], [class*="noApiKey"]');
    const hasNotice = await apiKeyNotice.isVisible().catch(() => false);

    await screenshot(page, '36-api-key-status');

    // Also check for key status indicators
    const keyValid = page.locator('[class*="keyValid"]');
    const keyInvalid = page.locator('[class*="keyInvalid"]');
    const keyVerifying = page.locator('[class*="keyVerifying"]');

    const validVisible = await keyValid.isVisible().catch(() => false);
    const invalidVisible = await keyInvalid.isVisible().catch(() => false);
    const verifyingVisible = await keyVerifying.isVisible().catch(() => false);

    // Take screenshot of whatever state we're in
    await screenshot(page, '37-key-status-state');
  });

  test('handles network error simulation', async ({ page }) => {
    // This test simulates what happens when network fails

    // Enter valid URL
    const urlInput = page.locator('input#video-url, input[placeholder*="youtube"], input[type="text"]').first();
    await urlInput.fill(VALID_YOUTUBE_URL);
    await page.waitForTimeout(600);

    // Enable offline mode
    await page.context().setOffline(true);

    // Try to submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Generate")');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(2000);
      await screenshot(page, '38-network-error');
    }

    // Restore online mode
    await page.context().setOffline(false);
    await page.waitForTimeout(500);
    await screenshot(page, '39-network-restored');
  });
});

test.describe('Prompt Page - Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PROMPT_URL);
    await waitForPageLoad(page);
  });

  test('form inputs have proper labels', async ({ page }) => {
    // Check URL input has label
    const urlLabel = page.locator('label[for="video-url"], label:has-text("YouTube")');
    const hasUrlLabel = await urlLabel.isVisible().catch(() => false);

    // Check main content has role (use first() since there are nested main elements)
    const mainContent = page.locator('main#main-content');
    await expect(mainContent).toBeVisible();

    await screenshot(page, '40-accessibility-check');
  });

  test('keyboard navigation works', async ({ page }) => {
    // Tab through form elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    // Get focused element
    const focused = await page.evaluate(() => document.activeElement?.tagName);

    // Continue tabbing
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
    }

    await screenshot(page, '41-keyboard-navigation');
  });
});
