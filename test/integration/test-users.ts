#!/usr/bin/env tsx
/**
 * Test Suite: User Management Tools
 * Tests: list_users, get_user
 */

import { KandjiClient } from '../../src/utils/client.js';
import { listUsers } from '../../src/tools/list_users.js';
import { getUser } from '../../src/tools/get_user.js';
import { loadIruMcpEnv } from '../../src/utils/loadEnv.js';

loadIruMcpEnv();

async function main() {
  console.log('Testing User Management Tools');
  console.log('================================\n');

  const client = new KandjiClient({
    apiToken: process.env.KANDJI_API_TOKEN || '',
    subdomain: process.env.KANDJI_SUBDOMAIN || '',
    region: (process.env.KANDJI_REGION as 'us' | 'eu') || 'us',
  });

  // Test 1: List all users
  console.log('Test 1: List all users');
  console.log('-'.repeat(40));
  const allUsers = await listUsers(client, {});
  console.log(`Success: ${allUsers.success}`);
  console.log(`Summary: ${allUsers.summary}`);
  console.log(`Total Users: ${allUsers.metadata?.totalCount}`);
  console.log(`Cached: ${allUsers.metadata?.cached}`);
  console.log(`Duration: ${allUsers.metadata?.elapsedMs}ms\n`);

  // Test 2: List active users only
  console.log('Test 2: List active users only');
  console.log('-'.repeat(40));
  const activeUsers = await listUsers(client, { archived: false });
  console.log(`Success: ${activeUsers.success}`);
  console.log(`Summary: ${activeUsers.summary}`);
  console.log(`Total Active Users: ${activeUsers.metadata?.totalCount}\n`);

  // Test 3: Search users by email
  console.log('Test 3: Search users by email');
  console.log('-'.repeat(40));
  const searchResults = await listUsers(client, { email: 'test' });
  console.log(`Success: ${searchResults.success}`);
  console.log(`Summary: ${searchResults.summary}`);
  console.log(`Matching Users: ${searchResults.metadata?.totalCount}\n`);

  // Test 4: Get specific user details
  if (allUsers.success && allUsers.data.results.length > 0) {
    const userId = allUsers.data.results[0].id;
    const userEmail = allUsers.data.results[0].email || 'N/A';

    console.log('Test 4: Get specific user details');
    console.log('-'.repeat(40));
    console.log(`Testing with User ID: ${userId}`);
    console.log(`Email: ${userEmail}`);

    const userDetails = await getUser(client, { user_id: userId });
    console.log(`Success: ${userDetails.success}`);
    console.log(`Summary: ${userDetails.summary}`);

    if (userDetails.table) {
      console.log('\nUser Details:');
      userDetails.table.rows.forEach((row: any) => {
        console.log(`  ${row.Field}: ${row.Value}`);
      });
    }
    console.log(`Duration: ${userDetails.metadata?.elapsedMs}ms\n`);
  }

  // Test 5: Error handling - invalid user ID
  console.log('Test 5: Error handling - invalid user ID');
  console.log('-'.repeat(40));
  const invalidUser = await getUser(client, { user_id: '00000000-0000-0000-0000-000000000000' });
  console.log(`Success: ${invalidUser.success}`);
  if (!invalidUser.success && invalidUser.errors) {
    console.log(`Error Category: ${invalidUser.errors[0].category}`);
    console.log(`Error Message: ${invalidUser.errors[0].message}`);
    console.log(`Recovery Steps: ${invalidUser.errors[0].recovery.join(', ')}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log('User Management Tests Complete');
  console.log('='.repeat(50));
}

main().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
