#!/usr/bin/env node
/**
 * seed-knowledge-base.js
 * ─────────────────────────────────────────────────────────────
 * Reads all JSONL chunk files from /chunks and upserts them
 * into the Supabase `knowledge_base` table.
 *
 * Usage:
 *   node scripts/seed-knowledge-base.js
 *
 * Requires in .env:
 *   VITE_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...   ← from Supabase Dashboard → Settings → API
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import dotenv from 'dotenv';

// Load .env
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHUNKS_DIR = path.join(__dirname, '..', 'chunks');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Missing env vars.');
  console.error('   VITE_SUPABASE_URL:          ' + (SUPABASE_URL ? '✅ set' : '❌ missing'));
  console.error('   SUPABASE_SERVICE_ROLE_KEY:  ' + (SERVICE_ROLE_KEY ? '✅ set' : '❌ missing'));
  console.error('\n   Add SUPABASE_SERVICE_ROLE_KEY to your .env file.');
  console.error('   Find it at: Supabase Dashboard → Project Settings → API → service_role');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/**
 * Parse a JSONL file and return an array of objects.
 */
async function parseJsonl(filePath) {
  const rows = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      rows.push(JSON.parse(trimmed));
    } catch (e) {
      console.warn(`  ⚠️  Skipping unparseable line in ${path.basename(filePath)}`);
    }
  }
  return rows;
}

/**
 * Map a raw JSONL chunk object to the knowledge_base schema.
 */
function mapChunk(chunk) {
  return {
    document_title: chunk.document_title ?? null,
    chunk_number: chunk.chunk_number ?? null,
    section: chunk.section ?? null,
    category: chunk.category ?? null,
    source: chunk.source ?? null,
    source_url: chunk.source_url ?? null,
    content: chunk.content ?? '',
    page_start: chunk.page_start ?? null,
    page_end: chunk.page_end ?? null,
    original_source_file: chunk.metadata?.original_source_file ?? null,
  };
}

async function main() {
  console.log('🚀  UdyamAI — Knowledge Base Seeder');
  console.log('====================================');
  console.log(`📁  Chunks directory: ${CHUNKS_DIR}\n`);

  // List all JSONL files
  const files = fs.readdirSync(CHUNKS_DIR).filter((f) => f.endsWith('.jsonl'));
  if (files.length === 0) {
    console.error('❌  No JSONL files found in /chunks directory.');
    process.exit(1);
  }

  console.log(`📄  Found ${files.length} JSONL file(s):\n`);
  files.forEach((f) => console.log(`   • ${f}`));
  console.log('');

  let totalInserted = 0;
  let totalSkipped = 0;

  for (const file of files) {
    const filePath = path.join(CHUNKS_DIR, file);
    console.log(`⏳  Processing: ${file}`);

    const chunks = await parseJsonl(filePath);
    console.log(`   Parsed ${chunks.length} chunk(s)`);

    if (chunks.length === 0) continue;

    const rows = chunks.map(mapChunk);

    // Insert in batches of 50 to avoid payload limits
    const BATCH_SIZE = 50;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error, count } = await supabase
        .from('knowledge_base')
        .insert(batch, { count: 'exact' });

      if (error) {
        console.error(`   ❌  Insert error for batch starting at row ${i}:`, error.message);
        totalSkipped += batch.length;
      } else {
        totalInserted += batch.length;
        process.stdout.write(`   ✅  Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} rows)\n`);
      }
    }
    console.log('');
  }

  console.log('====================================');
  console.log(`✅  Done!  Inserted: ${totalInserted}  |  Skipped: ${totalSkipped}`);
  console.log('\n📊  Verify in Supabase Dashboard → Table Editor → knowledge_base');
}

main().catch((err) => {
  console.error('💥  Fatal error:', err);
  process.exit(1);
});
