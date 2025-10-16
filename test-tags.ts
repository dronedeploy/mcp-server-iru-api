#!/usr/bin/env tsx
/**
 * Test Suite: Tags Management Tool
 * Tests: get_tags
 */

import { KandjiClient } from './src/utils/client.js';
import { getTags } from './src/tools/get_tags.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('Testing Tags Management Tool');
  console.log('==============================\n');

  const client = new KandjiClient({
    apiToken: process.env.KANDJI_API_TOKEN || '',
    subdomain: process.env.KANDJI_SUBDOMAIN || '',
    region: (process.env.KANDJI_REGION as 'us' | 'eu') || 'us',
  });

  // Test 1: Get all tags
  console.log('Test 1: Get all tags');
  console.log('-'.repeat(40));
  const allTags = await getTags(client, {});
  console.log(`Success: ${allTags.success}`);
  console.log(`Summary: ${allTags.summary}`);
  console.log(`Total Tags: ${allTags.metadata?.totalCount}`);
  console.log(`Cached: ${allTags.metadata?.cached}`);
  console.log(`Duration: ${allTags.metadata?.elapsedMs}ms`);

  if (allTags.table && allTags.table.rows.length > 0) {
    console.log('\nAll Tags:');
    allTags.table.rows.forEach((row: any, idx: number) => {
      console.log(`  ${idx + 1}. ${row.Name} (ID: ${row.ID})`);
    });
  }
  console.log();

  // Test 2: Search for specific tag
  console.log('Test 2: Search for specific tag');
  console.log('-'.repeat(40));
  const searchResults = await getTags(client, { search: 'test' });
  console.log(`Success: ${searchResults.success}`);
  console.log(`Summary: ${searchResults.summary}`);
  console.log(`Matching Tags: ${searchResults.metadata?.totalCount}`);
  console.log(`Duration: ${searchResults.metadata?.elapsedMs}ms\n`);

  // Test 3: Cache performance test
  console.log('Test 3: Cache performance test (second call)');
  console.log('-'.repeat(40));
  const cachedTags = await getTags(client, {});
  console.log(`Success: ${cachedTags.success}`);
  console.log(`Cached: ${cachedTags.metadata?.cached}`);
  console.log(`Duration: ${cachedTags.metadata?.elapsedMs}ms`);
  console.log(`Performance: ${cachedTags.metadata?.cached ? 'CACHE HIT' : 'CACHE MISS'}\n`);

  // Test 4: Search with different term
  console.log('Test 4: Search with different term');
  console.log('-'.repeat(40));
  const searchResults2 = await getTags(client, { search: 'production' });
  console.log(`Success: ${searchResults2.success}`);
  console.log(`Summary: ${searchResults2.summary}`);
  console.log(`Matching Tags: ${searchResults2.metadata?.totalCount}`);
  console.log(`Duration: ${searchResults2.metadata?.elapsedMs}ms\n`);

  // Test 5: Empty search (should return all)
  console.log('Test 5: Empty search string');
  console.log('-'.repeat(40));
  const emptySearch = await getTags(client, { search: '' });
  console.log(`Success: ${emptySearch.success}`);
  console.log(`Summary: ${emptySearch.summary}`);
  console.log(`Total Tags: ${emptySearch.metadata?.totalCount}`);
  console.log(`Same as "all tags": ${emptySearch.metadata?.totalCount === allTags.metadata?.totalCount ? 'Yes' : 'No'}\n`);

  console.log('='.repeat(50));
  console.log('Tags Management Tests Complete');
  console.log('='.repeat(50));
}

main().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
