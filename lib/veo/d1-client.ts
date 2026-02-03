/**
 * VEO Pipeline - Cloudflare D1 Client (Server-side only)
 * REST API client for D1 database operations
 */

import { gzipSync, gunzipSync } from "zlib";
import { CachedVeoJob, CachedVeoJobInfo, VeoJobStatus } from "./types";

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

interface D1Response<T> {
  success: boolean;
  result: T;
  errors: Array<{ message: string }>;
}

interface D1QueryResult {
  results: unknown[];
  success: boolean;
  meta: {
    duration: number;
    rows_read: number;
    rows_written: number;
  };
}

/**
 * Execute SQL query against D1 database via REST API
 */
async function queryD1<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const apiToken = process.env.CLOUDFLARE_D1_API_TOKEN;

  if (!accountId || !databaseId || !apiToken) {
    throw new Error("Cloudflare D1 credentials not configured");
  }

  const url = `${CLOUDFLARE_API_BASE}/accounts/${accountId}/d1/database/${databaseId}/query`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });

  if (!response.ok) {
    throw new Error(`D1 query failed: ${response.statusText}`);
  }

  const data: D1Response<D1QueryResult[]> = await response.json();

  if (!data.success) {
    throw new Error(`D1 query error: ${data.errors[0]?.message || "Unknown error"}`);
  }

  return (data.result[0]?.results || []) as T[];
}

/**
 * List all non-expired jobs
 */
export async function listJobs(): Promise<CachedVeoJobInfo[]> {
  const now = Date.now();

  const rows = await queryD1<{
    job_id: string;
    video_id: string;
    video_url: string;
    scene_count: number;
    characters_found: number;
    mode: string;
    voice: string;
    status: string;
    has_script: number;
    created_at: string;
    updated_at: number;
    expires_at: number;
    error_json: string | null;
  }>(
    `SELECT * FROM veo_jobs WHERE expires_at > ? ORDER BY updated_at DESC`,
    [now]
  );

  return rows.map((row) => ({
    jobId: row.job_id,
    videoId: row.video_id,
    videoUrl: row.video_url,
    sceneCount: row.scene_count,
    charactersFound: row.characters_found,
    mode: row.mode as "direct" | "hybrid",
    voice: row.voice,
    status: row.status as VeoJobStatus,
    hasScript: row.has_script === 1,
    createdAt: row.created_at,
    timestamp: row.updated_at,
    expiresAt: row.expires_at,
    error: row.error_json ? JSON.parse(row.error_json) : undefined,
  }));
}

/**
 * Get full job data by ID (decompressed)
 */
export async function getJob(jobId: string): Promise<CachedVeoJob | null> {
  const now = Date.now();

  const rows = await queryD1<{ data_compressed: string; expires_at: number }>(
    `SELECT veo_job_data.data_compressed, veo_jobs.expires_at
     FROM veo_job_data
     JOIN veo_jobs ON veo_job_data.job_id = veo_jobs.job_id
     WHERE veo_job_data.job_id = ? AND veo_jobs.expires_at > ?`,
    [jobId, now]
  );

  if (rows.length === 0) return null;

  // Decompress: base64 → Buffer → gunzip → JSON
  const compressed = Buffer.from(rows[0].data_compressed, "base64");
  const decompressed = gunzipSync(compressed);
  const job: CachedVeoJob = JSON.parse(decompressed.toString("utf-8"));

  return job;
}

/**
 * Insert or update job (compressed)
 */
export async function upsertJob(jobId: string, job: CachedVeoJob): Promise<void> {
  // Compress: JSON → gzip → base64
  const json = JSON.stringify(job);
  const compressed = gzipSync(Buffer.from(json, "utf-8"));
  const base64 = compressed.toString("base64");

  // Insert/update metadata table
  await queryD1(
    `INSERT OR REPLACE INTO veo_jobs (
      job_id, video_id, video_url, scene_count, characters_found, mode, voice, status,
      has_script, created_at, updated_at, expires_at, error_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      jobId,
      job.videoId,
      job.videoUrl,
      job.scenes?.length || 0,
      Object.keys(job.characterRegistry || {}).length,
      job.summary.mode,
      job.summary.voice,
      job.status,
      job.script ? 1 : 0,
      job.summary.createdAt,
      job.timestamp,
      job.expiresAt || job.timestamp + 7 * 24 * 60 * 60 * 1000, // Fallback to 7 days
      job.error ? JSON.stringify(job.error) : null,
    ]
  );

  // Insert/update data table
  await queryD1(
    `INSERT OR REPLACE INTO veo_job_data (job_id, data_compressed) VALUES (?, ?)`,
    [jobId, base64]
  );

  // Cleanup expired jobs
  await cleanupExpired();
}

/**
 * Delete job by ID
 */
export async function deleteJob(jobId: string): Promise<void> {
  await queryD1(`DELETE FROM veo_jobs WHERE job_id = ?`, [jobId]);
  // Cascade deletes veo_job_data automatically
}

/**
 * Delete all jobs
 */
export async function deleteAllJobs(): Promise<void> {
  await queryD1(`DELETE FROM veo_jobs`);
  await queryD1(`DELETE FROM veo_job_data`);
}

/**
 * Remove expired jobs (called on each write)
 */
export async function cleanupExpired(): Promise<void> {
  const now = Date.now();
  await queryD1(`DELETE FROM veo_jobs WHERE expires_at < ?`, [now]);
}
