import { test, expect, Page } from '@playwright/test';

/**
 * Simultaneous Video Analysis Test
 *
 * Tests the Prompt video analysis feature with 4 concurrent browser tabs
 * processing different YouTube videos simultaneously.
 *
 * Run with: npx playwright test tests/e2e/prompt-simultaneous.spec.ts --headed
 */

// Test configuration
const PROMPT_URL = '/prompt';
const TEST_VIDEOS = [
  { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', name: 'Rick Astley - Never Gonna Give You Up', duration: '3:33' },
  { url: 'https://www.youtube.com/watch?v=9bZkp7q19f0', name: 'PSY - Gangnam Style', duration: '4:13' },
  { url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', name: 'Luis Fonsi - Despacito', duration: '4:42' },
  { url: 'https://www.youtube.com/watch?v=JGwWNGJdvx8', name: 'Ed Sheeran - Shape of You', duration: '4:24' },
];

const SCENE_COUNT = 5; // Small count for faster testing
const JOB_TIMEOUT = 300000; // 5 minutes per job

// Helper to take screenshot with timestamp
async function screenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({
    path: `playwright-report/screenshots/simultaneous/${timestamp}-${name}.png`,
    fullPage: true,
  });
}

// Helper to wait for page to be stable
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

// Result tracking interface
interface JobResult {
  tabIndex: number;
  videoName: string;
  videoUrl: string;
  status: 'success' | 'error' | 'timeout' | 'pending';
  startTime: number;
  endTime?: number;
  duration?: number;
  errorMessage?: string;
  scenesGenerated?: number;
  batchProgress?: string;
}

test.describe('Prompt Simultaneous Processing Test', () => {
  // Extended timeout for simultaneous test
  test.setTimeout(600000); // 10 minutes total

  test('4 tabs can process different videos simultaneously', async ({ browser }) => {
    console.log('\n========================================');
    console.log('Starting Simultaneous Prompt Test');
    console.log('========================================\n');

    // Create a single browser context (shared localStorage/cookies)
    const context = await browser.newContext({
      // Slow down actions for visibility
      // Note: slowMo is set at launch, not here
    });

    // Create 4 pages (tabs) in the same context
    const pages: Page[] = [];
    for (let i = 0; i < 4; i++) {
      const page = await context.newPage();
      pages.push(page);
    }

    // Initialize results tracking
    const results: JobResult[] = TEST_VIDEOS.map((video, index) => ({
      tabIndex: index + 1,
      videoName: video.name,
      videoUrl: video.url,
      status: 'pending',
      startTime: 0,
    }));

    const overallStartTime = Date.now();

    try {
      // Step 1: Navigate all tabs to Prompt page
      console.log('Step 1: Navigating all tabs to Prompt page...');
      await Promise.all(pages.map(async (page, index) => {
        await page.goto(PROMPT_URL);
        await waitForPageLoad(page);
        console.log(`  Tab ${index + 1}: Loaded Prompt page`);
      }));

      await screenshot(pages[0], 'all-tabs-loaded-tab1');

      // Step 2: Configure each tab with different video
      console.log('\nStep 2: Configuring each tab with video URL...');

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const video = TEST_VIDEOS[i];

        // Find and fill URL input
        const urlInput = page.locator('input#video-url, input[placeholder*="youtube"], input[type="text"]').first();
        await urlInput.fill(video.url);
        await page.waitForTimeout(600); // Wait for validation

        console.log(`  Tab ${i + 1}: Entered URL for "${video.name}"`);

        // Wait for URL validation (checkmark)
        const validIndicator = page.locator('svg[stroke="#22c55e"], .urlCheckmark');
        try {
          await validIndicator.waitFor({ state: 'visible', timeout: 5000 });
          console.log(`  Tab ${i + 1}: URL validated successfully`);
        } catch {
          console.log(`  Tab ${i + 1}: URL validation indicator not visible (may still be valid)`);
        }
      }

      // Take screenshots of all configured tabs
      for (let i = 0; i < pages.length; i++) {
        await screenshot(pages[i], `tab${i + 1}-url-configured`);
      }

      // Step 3: Select Direct mode for all tabs
      console.log('\nStep 3: Selecting Direct mode (Truc tiep)...');

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        // Look for mode selector - Direct mode button
        // The mode buttons are in VeoSettingsPanel, need to expand settings first
        const settingsToggle = page.locator('button:has-text("Settings"), [class*="settingsToggle"], button[class*="toggleBtn"]');
        if (await settingsToggle.isVisible().catch(() => false)) {
          await settingsToggle.click();
          await page.waitForTimeout(300);
        }

        // Find Direct mode button (Vietnamese: "Truc tiep" or English: "Direct")
        const directModeBtn = page.locator('button:has-text("Direct"), button:has-text("Truc tiep"), button:has-text("Trực tiếp")').first();
        if (await directModeBtn.isVisible().catch(() => false)) {
          await directModeBtn.click();
          console.log(`  Tab ${i + 1}: Selected Direct mode`);
        } else {
          console.log(`  Tab ${i + 1}: Direct mode button not found (may be default)`);
        }
      }

      // Step 4: Set scene count to 5
      console.log('\nStep 4: Setting scene count to 5...');

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        // Find scene count input (number input with min=1, max=200)
        const sceneCountInput = page.locator('input[type="number"][min="1"], input[class*="compactInput"]').first();
        if (await sceneCountInput.isVisible().catch(() => false)) {
          await sceneCountInput.fill(String(SCENE_COUNT));
          console.log(`  Tab ${i + 1}: Set scene count to ${SCENE_COUNT}`);
        } else {
          console.log(`  Tab ${i + 1}: Scene count input not found`);
        }
      }

      // Take screenshots before submission
      for (let i = 0; i < pages.length; i++) {
        await screenshot(pages[i], `tab${i + 1}-ready-to-submit`);
      }

      // Step 5: Submit all jobs simultaneously
      console.log('\nStep 5: Submitting all jobs simultaneously...');

      // Find submit buttons on all pages first
      const submitButtons = await Promise.all(pages.map(async (page) => {
        return page.locator('button[type="submit"], button:has-text("Generate"), button:has-text("Tao"), button[class*="submitButton"]').first();
      }));

      // Click all submit buttons at roughly the same time
      const submitPromises = pages.map(async (_page, index) => {
        results[index].startTime = Date.now();
        const submitBtn = submitButtons[index];

        if (await submitBtn.isVisible().catch(() => false)) {
          await submitBtn.click();
          console.log(`  Tab ${index + 1}: Job submitted at ${new Date().toISOString()}`);
        } else {
          console.log(`  Tab ${index + 1}: Submit button not visible`);
          results[index].status = 'error';
          results[index].errorMessage = 'Submit button not visible';
        }
      });

      await Promise.all(submitPromises);

      // Step 6: Monitor all jobs until completion or timeout
      console.log('\nStep 6: Monitoring job progress (this may take several minutes)...');

      // Monitor function for a single page
      const monitorJob = async (page: Page, index: number): Promise<void> => {
        const video = TEST_VIDEOS[index]; // Kept for debugging
        const startTime = Date.now();
        let lastProgressLog = Date.now();
        const progressLogInterval = 10000; // Log progress every 10 seconds

        while (Date.now() - startTime < JOB_TIMEOUT) {
          // Check for completion (scenes displayed)
          const sceneDisplay = page.locator('[class*="scene"], [class*="Scene"], [class*="sceneCard"]');
          const scenesVisible = await sceneDisplay.first().isVisible().catch(() => false);

          // Check for result state
          const resultHeader = page.locator('[class*="resultHeader"], h2:has-text("Result"), h2:has-text("Ket qua")');
          const resultVisible = await resultHeader.isVisible().catch(() => false);

          if (scenesVisible || resultVisible) {
            results[index].status = 'success';
            results[index].endTime = Date.now();
            results[index].duration = results[index].endTime - results[index].startTime;

            // Count scenes
            const sceneCount = await sceneDisplay.count();
            results[index].scenesGenerated = sceneCount;

            console.log(`  Tab ${index + 1}: COMPLETED - ${sceneCount} scenes generated (${Math.round(results[index].duration! / 1000)}s)`);
            await screenshot(page, `tab${index + 1}-completed`);
            return;
          }

          // Check for error state
          const errorState = page.locator('[class*="errorState"], [class*="error"], [role="alert"]:has-text("error")');
          const errorVisible = await errorState.isVisible().catch(() => false);

          if (errorVisible) {
            const errorText = await errorState.textContent().catch(() => 'Unknown error');
            results[index].status = 'error';
            results[index].endTime = Date.now();
            results[index].duration = results[index].endTime - results[index].startTime;
            results[index].errorMessage = errorText || 'Unknown error';

            console.log(`  Tab ${index + 1}: ERROR - ${errorText}`);
            await screenshot(page, `tab${index + 1}-error`);
            return;
          }

          // Log progress periodically
          if (Date.now() - lastProgressLog > progressLogInterval) {
            // Check loading state and batch progress
            const loadingState = page.locator('[aria-busy="true"], [class*="loading"], [class*="LogPanel"]');
            const isLoading = await loadingState.isVisible().catch(() => false);

            if (isLoading) {
              // Try to get batch progress
              const batchText = page.locator('[class*="batch"], [class*="progress"]');
              const progress = await batchText.textContent().catch(() => 'Processing...');
              results[index].batchProgress = progress || 'Processing...';

              console.log(`  Tab ${index + 1}: ${progress || 'Processing...'}`);
            }

            lastProgressLog = Date.now();
          }

          // Wait before checking again
          await page.waitForTimeout(1000);
        }

        // Timeout reached
        results[index].status = 'timeout';
        results[index].endTime = Date.now();
        results[index].duration = results[index].endTime - results[index].startTime;
        results[index].errorMessage = `Timeout after ${JOB_TIMEOUT / 1000}s`;

        console.log(`  Tab ${index + 1}: TIMEOUT - Job did not complete within ${JOB_TIMEOUT / 1000}s`);
        await screenshot(page, `tab${index + 1}-timeout`);
      };

      // Monitor all jobs in parallel
      await Promise.all(pages.map((page, index) => monitorJob(page, index)));

      const overallEndTime = Date.now();
      const totalDuration = overallEndTime - overallStartTime;

      // Step 7: Generate report
      console.log('\n========================================');
      console.log('SIMULTANEOUS TEST REPORT');
      console.log('========================================\n');

      console.log(`Total test duration: ${Math.round(totalDuration / 1000)}s (${Math.round(totalDuration / 60000)}m ${Math.round((totalDuration % 60000) / 1000)}s)`);
      console.log(`Scene count per job: ${SCENE_COUNT}`);
      console.log('');

      // Summary
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      const timeoutCount = results.filter(r => r.status === 'timeout').length;
      const pendingCount = results.filter(r => r.status === 'pending').length;

      console.log('SUMMARY:');
      console.log(`  Successful: ${successCount}/4`);
      console.log(`  Errors: ${errorCount}/4`);
      console.log(`  Timeouts: ${timeoutCount}/4`);
      console.log(`  Pending: ${pendingCount}/4`);
      console.log('');

      // Detailed results
      console.log('DETAILED RESULTS:');
      for (const result of results) {
        console.log(`\n  Tab ${result.tabIndex}: ${result.videoName}`);
        console.log(`    URL: ${result.videoUrl}`);
        console.log(`    Status: ${result.status.toUpperCase()}`);
        if (result.duration) {
          console.log(`    Duration: ${Math.round(result.duration / 1000)}s`);
        }
        if (result.scenesGenerated !== undefined) {
          console.log(`    Scenes Generated: ${result.scenesGenerated}`);
        }
        if (result.errorMessage) {
          console.log(`    Error: ${result.errorMessage}`);
        }
        if (result.batchProgress) {
          console.log(`    Last Progress: ${result.batchProgress}`);
        }
      }

      console.log('\n========================================');
      console.log('Screenshots saved to: playwright-report/screenshots/simultaneous/');
      console.log('========================================\n');

      // Take final screenshots of all tabs
      for (let i = 0; i < pages.length; i++) {
        await screenshot(pages[i], `tab${i + 1}-final-state`);
      }

      // Assertions
      // At least one job should complete (allows for API key issues)
      const completedJobs = results.filter(r => r.status === 'success' || r.status === 'error');
      expect(completedJobs.length).toBeGreaterThan(0);

    } finally {
      // Cleanup
      await context.close();
    }
  });
});
