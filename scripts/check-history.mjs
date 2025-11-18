#!/usr/bin/env node
/**
 * Quick sanity script to pull the most recent transfers from the relayer and print them.
 *
 * Usage:
 *   node scripts/check-history.mjs --sender 0xabc123...
 *
 * Optional flags:
 *   --relayer http://localhost:3001   Override the relayer base URL
 *   --limit 10                        Number of entries to fetch (default 6)
 */

import process from 'node:process';

const args = process.argv.slice(2);
const argMap = {};
for (let i = 0; i < args.length; i += 2) {
  const key = args[i];
  const value = args[i + 1];
  if (!key?.startsWith('--')) continue;
  argMap[key.replace('--', '')] = value;
}

const RELAYER_URL = argMap.relayer || process.env.RELAYER_URL || 'http://localhost:3001';
const sender = argMap.sender;
const limit = Number(argMap.limit || '6');

async function main() {
  const query = new URLSearchParams();
  if (sender) {
    query.set('sender', sender.toLowerCase());
  }
  if (limit) {
    query.set('limit', String(limit));
  }

  const url = `${RELAYER_URL.replace(/\/$/, '')}/transfers${query.toString() ? `?${query}` : ''}`;
  console.log(`🔍 Fetching transfers from ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Relayer responded with ${response.status}: ${text}`);
  }

  const data = await response.json();
  const transfers = data?.transfers ?? [];

  if (transfers.length === 0) {
    console.log('⚠️  No transfers returned.');
    if (sender) {
      console.log('   Make sure the sender address matches the one stored in relayer state.');
    }
    return;
  }

  console.log(`✅ Received ${transfers.length} transfers:`);
  transfers
    .slice(0, limit)
    .forEach((t, idx) => {
      console.log(
        `  ${idx + 1}. ${t.id} — sender=${t.sender} recipient=${t.recipient} amount=$${t.amountUsd} status=${t.status} updated=${t.updatedAt}`
      );
    });
}

main().catch((err) => {
  console.error('❌ Failed to fetch history:', err);
  process.exit(1);
});

