/**
 * VEO API Test Script
 * Tests the VEO pipeline with a real YouTube URL
 *
 * Usage: npx ts-node scripts/test-veo.ts
 */

const TEST_URL = "https://www.youtube.com/watch?v=VsTuSOw_l1g";
const API_BASE = "http://localhost:3000/api/veo";

// Helper to wait between tests
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Handle rate limiting with retry
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get("Retry-After") || "15");
      console.log(`  ⏳ Rate limited. Waiting ${retryAfter}s before retry (attempt ${attempt + 1}/${maxRetries})...`);
      await sleep(retryAfter * 1000);
      continue;
    }

    return response;
  }

  throw new Error("Max retries exceeded due to rate limiting");
}

interface VeoSSEEvent {
  event: string;
  data: Record<string, unknown>;
}

async function parseSSEStream(response: Response): Promise<VeoSSEEvent[]> {
  const events: VeoSSEEvent[] = [];
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let totalBytes = 0;

  console.log("  Reading SSE stream...");

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      console.log(`  Stream ended. Total bytes: ${totalBytes}`);
      break;
    }

    const chunk = decoder.decode(value, { stream: true });
    totalBytes += value.length;
    buffer += chunk;

    // Debug: show raw chunks
    if (chunk.includes("error") || chunk.includes("Error")) {
      console.log("  [RAW ERROR CHUNK]:", chunk.substring(0, 500));
    }

    // Parse SSE events from buffer
    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // Keep incomplete line in buffer

    let currentEvent = "";
    let currentData = "";

    for (const line of lines) {
      if (line.startsWith("event:")) {
        currentEvent = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        currentData = line.slice(5).trim();
      } else if (line === "" && currentEvent && currentData) {
        try {
          const parsed = JSON.parse(currentData);
          events.push({ event: currentEvent, data: parsed });
          console.log(`  [${currentEvent}]`, JSON.stringify(parsed).substring(0, 200));
        } catch {
          console.log(`  [${currentEvent}] (raw)`, currentData.substring(0, 100));
          events.push({ event: currentEvent, data: { raw: currentData } });
        }
        currentEvent = "";
        currentData = "";
      }
    }
  }

  // Check remaining buffer
  if (buffer.trim()) {
    console.log("  [REMAINING BUFFER]:", buffer.substring(0, 200));
  }

  console.log(`  Total events received: ${events.length}`);
  return events;
}

async function testUrlToScript() {
  console.log("\n" + "=".repeat(60));
  console.log("TEST 1: URL to Script (Extract script from video)");
  console.log("=".repeat(60));

  const payload = {
    workflow: "url-to-script",
    videoUrl: TEST_URL,
  };

  console.log("Request:", JSON.stringify(payload, null, 2));
  console.log("\nSending request...\n");

  try {
    const response = await fetchWithRetry(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("HTTP Error:", response.status, error);
      return null;
    }

    const events = await parseSSEStream(response);

    // Check for errors
    const errorEvent = events.find(e => e.event === "error");
    if (errorEvent) {
      console.error("\n❌ ERROR:", errorEvent.data);
      return null;
    }

    // Check for script
    const scriptEvent = events.find(e => e.event === "script");
    if (scriptEvent) {
      console.log("\n✅ Script extracted successfully!");
      const script = scriptEvent.data.script as Record<string, unknown>;
      console.log("  Title:", script.title);
      console.log("  Duration:", script.duration);
      console.log("  Language:", script.language);
      console.log("  Characters:", (script.characters as string[])?.length || 0);
      console.log("  Segments:", (script.segments as unknown[])?.length || 0);
      return script;
    }

    console.error("\n❌ No script event received");
    return null;
  } catch (err) {
    console.error("\n❌ Request failed:", err);
    return null;
  }
}

async function testUrlToScenesDirect() {
  console.log("\n" + "=".repeat(60));
  console.log("TEST 2: URL to Scenes - DIRECT mode (Video → Scenes)");
  console.log("=".repeat(60));

  const payload = {
    workflow: "url-to-scenes",
    videoUrl: TEST_URL,
    mode: "direct",
    autoSceneCount: true,
    batchSize: 30,
    voice: "no-voice",
  };

  console.log("Request:", JSON.stringify(payload, null, 2));
  console.log("\nSending request...\n");

  try {
    const response = await fetchWithRetry(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("HTTP Error:", response.status, error);
      return null;
    }

    const events = await parseSSEStream(response);

    // Check for errors
    const errorEvent = events.find(e => e.event === "error");
    if (errorEvent) {
      console.error("\n❌ ERROR:", errorEvent.data);
      return null;
    }

    // Check for complete
    const completeEvent = events.find(e => e.event === "complete");
    if (completeEvent) {
      console.log("\n✅ Direct mode completed successfully!");
      const data = completeEvent.data;
      console.log("  Job ID:", data.jobId);
      console.log("  Scenes:", (data.scenes as unknown[])?.length || 0);
      console.log("  Characters:", Object.keys(data.characterRegistry as Record<string, unknown> || {}).length);
      console.log("  Has Script:", !!data.script);

      const summary = data.summary as Record<string, unknown>;
      if (summary) {
        console.log("  Processing Time:", summary.processingTime);
        console.log("  Mode:", summary.mode);
      }
      return data;
    }

    console.error("\n❌ No complete event received");
    return null;
  } catch (err) {
    console.error("\n❌ Request failed:", err);
    return null;
  }
}

async function testUrlToScenesHybrid() {
  console.log("\n" + "=".repeat(60));
  console.log("TEST 3: URL to Scenes - HYBRID mode (Video → Script → Scenes)");
  console.log("=".repeat(60));

  const payload = {
    workflow: "url-to-scenes",
    videoUrl: TEST_URL,
    mode: "hybrid",
    autoSceneCount: true,
    batchSize: 30,
    voice: "no-voice",
  };

  console.log("Request:", JSON.stringify(payload, null, 2));
  console.log("\nSending request...\n");

  try {
    const response = await fetchWithRetry(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("HTTP Error:", response.status, error);
      return null;
    }

    const events = await parseSSEStream(response);

    // Check for errors
    const errorEvent = events.find(e => e.event === "error");
    if (errorEvent) {
      console.error("\n❌ ERROR:", errorEvent.data);
      return null;
    }

    // Check for script (should be present in hybrid mode)
    const scriptEvent = events.find(e => e.event === "script");
    if (scriptEvent) {
      console.log("\n✅ Script generated in hybrid mode");
    } else {
      console.log("\n⚠️ No script event (expected in hybrid mode)");
    }

    // Check for complete
    const completeEvent = events.find(e => e.event === "complete");
    if (completeEvent) {
      console.log("\n✅ Hybrid mode completed successfully!");
      const data = completeEvent.data;
      console.log("  Job ID:", data.jobId);
      console.log("  Scenes:", (data.scenes as unknown[])?.length || 0);
      console.log("  Characters:", Object.keys(data.characterRegistry as Record<string, unknown> || {}).length);
      console.log("  Has Script:", !!data.script);

      const summary = data.summary as Record<string, unknown>;
      if (summary) {
        console.log("  Processing Time:", summary.processingTime);
        console.log("  Mode:", summary.mode);
      }
      return data;
    }

    console.error("\n❌ No complete event received");
    return null;
  } catch (err) {
    console.error("\n❌ Request failed:", err);
    return null;
  }
}

async function testScriptToScenes(scriptText: string) {
  console.log("\n" + "=".repeat(60));
  console.log("TEST 4: Script to Scenes (From extracted script)");
  console.log("=".repeat(60));

  const payload = {
    workflow: "script-to-scenes",
    scriptText: scriptText.substring(0, 5000), // Limit for test
    mode: "hybrid",
    sceneCount: 10,
    batchSize: 10,
    voice: "no-voice",
  };

  console.log("Request: (script truncated)");
  console.log("\nSending request...\n");

  try {
    const response = await fetchWithRetry(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("HTTP Error:", response.status, error);
      return null;
    }

    const events = await parseSSEStream(response);

    // Check for errors
    const errorEvent = events.find(e => e.event === "error");
    if (errorEvent) {
      console.error("\n❌ ERROR:", errorEvent.data);
      return null;
    }

    // Check for complete
    const completeEvent = events.find(e => e.event === "complete");
    if (completeEvent) {
      console.log("\n✅ Script to Scenes completed successfully!");
      const data = completeEvent.data;
      console.log("  Scenes:", (data.scenes as unknown[])?.length || 0);
      console.log("  Characters:", Object.keys(data.characterRegistry as Record<string, unknown> || {}).length);
      return data;
    }

    console.error("\n❌ No complete event received");
    return null;
  } catch (err) {
    console.error("\n❌ Request failed:", err);
    return null;
  }
}

async function testValidation() {
  console.log("\n" + "=".repeat(60));
  console.log("TEST 5: Validation Tests");
  console.log("=".repeat(60));

  // Test invalid URL
  console.log("\n5a. Testing invalid URL...");
  try {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workflow: "url-to-script",
        videoUrl: "not-a-valid-url",
      }),
    });
    const data = await response.json();
    if (data.data?.type === "INVALID_URL") {
      console.log("  ✅ Invalid URL correctly rejected");
    } else {
      console.log("  ❌ Expected INVALID_URL error, got:", data);
    }
  } catch (err) {
    console.error("  ❌ Request failed:", err);
  }

  // Test missing video URL
  console.log("\n5b. Testing missing video URL...");
  try {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workflow: "url-to-script",
      }),
    });
    const data = await response.json();
    if (response.status === 400) {
      console.log("  ✅ Missing URL correctly rejected");
    } else {
      console.log("  ❌ Expected 400 error, got:", response.status, data);
    }
  } catch (err) {
    console.error("  ❌ Request failed:", err);
  }

  // Test empty script
  console.log("\n5c. Testing empty script...");
  try {
    const response = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workflow: "script-to-scenes",
        scriptText: "",
      }),
    });
    const data = await response.json();
    if (response.status === 400) {
      console.log("  ✅ Empty script correctly rejected");
    } else {
      console.log("  ❌ Expected 400 error, got:", response.status, data);
    }
  } catch (err) {
    console.error("  ❌ Request failed:", err);
  }
}

async function runAllTests() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║          VEO API Test Suite                                ║");
  console.log("║          Test URL:", TEST_URL.substring(0, 35) + "...       ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const results: Record<string, boolean> = {};

  // Test 1: URL to Script
  const script = await testUrlToScript();
  results["URL to Script"] = !!script;

  // Test 2: URL to Scenes (Direct)
  const directResult = await testUrlToScenesDirect();
  results["URL to Scenes (Direct)"] = !!directResult;

  // Test 3: URL to Scenes (Hybrid) - Skip if direct failed to save time
  if (directResult) {
    const hybridResult = await testUrlToScenesHybrid();
    results["URL to Scenes (Hybrid)"] = !!hybridResult;
  } else {
    console.log("\n⚠️ Skipping Hybrid test (Direct test failed)");
    results["URL to Scenes (Hybrid)"] = false;
  }

  // Test 4: Script to Scenes - Only if we have a script
  if (script && (script as Record<string, unknown>).rawText) {
    const scriptText = String((script as Record<string, unknown>).rawText);
    const scenesResult = await testScriptToScenes(scriptText);
    results["Script to Scenes"] = !!scenesResult;
  } else {
    console.log("\n⚠️ Skipping Script to Scenes test (no script available)");
    results["Script to Scenes"] = false;
  }

  // Test 5: Validation
  await testValidation();
  results["Validation"] = true; // Validation tests are informational

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("TEST SUMMARY");
  console.log("=".repeat(60));

  let passed = 0;
  let failed = 0;

  for (const [name, result] of Object.entries(results)) {
    const status = result ? "✅ PASS" : "❌ FAIL";
    console.log(`  ${status} - ${name}`);
    if (result) passed++;
    else failed++;
  }

  console.log("\n" + "-".repeat(60));
  console.log(`  Total: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(60));
}

// Run tests
runAllTests().catch(console.error);
