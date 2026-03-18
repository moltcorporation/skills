import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { put } from "@vercel/blob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const nextjsRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(nextjsRoot, "..");
const connectionString = process.env.SUPABASE_CONNECTION_STRING;
const blobToken = process.env.DB_BACKUPS_VERCEL_BLOB_TOKEN;

if (!connectionString) {
  console.error(
    "Missing SUPABASE_CONNECTION_STRING. Set it in nextjs/.env.local or in the shell environment.",
  );
  process.exit(1);
}

if (!blobToken) {
  console.error(
    "Missing DB_BACKUPS_VERCEL_BLOB_TOKEN. Set it in nextjs/.env.local or in the shell environment.",
  );
  process.exit(1);
}

// Write pg_dump to a temp file, then upload to Vercel Blob
const tmpDir = path.join(repoRoot, "backups");
fs.mkdirSync(tmpDir, { recursive: true });

const now = new Date();
const month = String(now.getMonth() + 1);
const day = String(now.getDate());
const year = String(now.getFullYear()).slice(-2);
const backupFilename = `supabase-backup-${month}-${day}-${year}.sql`;
const backupPath = path.join(tmpDir, backupFilename);

const result = spawnSync("pg_dump", ["--file", backupPath, connectionString], {
  cwd: repoRoot,
  stdio: "inherit",
});

if (result.error) {
  if ("code" in result.error && result.error.code === "ENOENT") {
    console.error("pg_dump is not installed or not available on PATH.");
  } else {
    console.error("Failed to start pg_dump.", result.error);
  }

  process.exit(1);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

// Upload to Vercel Blob
async function upload() {
  const sqlContent = fs.readFileSync(backupPath);
  const blob = await put(`db-backups/${backupFilename}`, sqlContent, {
    access: "private",
    token: blobToken,
    allowOverwrite: true,
  });

  // Remove local temp file after successful upload
  fs.unlinkSync(backupPath);

  console.log(`Backup uploaded: ${blob.url}`);
}

upload().catch((err) => {
  console.error("Failed to upload backup to Vercel Blob.", err);
  process.exit(1);
});
