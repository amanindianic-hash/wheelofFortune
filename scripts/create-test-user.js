#!/usr/bin/env node

/**
 * Local test user creation script
 * Usage: node scripts/create-test-user.js
 *
 * This creates a test client and user for local development.
 * Email: aman.qureshi@indianic.com
 * Password: Super@123
 */

// Load .env.local if DATABASE_URL is not already set
if (!process.env.DATABASE_URL) {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && key.trim() && !key.startsWith('#')) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
}

const bcrypt = require('bcryptjs');
const { neon } = require('@neondatabase/serverless');

const PASSWORD = 'Super@123';
const EMAIL = 'aman.qureshi@indianic.com';
const FULL_NAME = 'Test User';

async function createTestUser() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not set in .env.local');
    process.exit(1);
  }

  const sql = neon(dbUrl);

  try {
    console.log('✓ Connected to database');

    // Hash the password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(PASSWORD, salt);
    console.log('✓ Password hashed');

    // Get or create test client (search by email first since it's unique)
    let clientResult = await sql`
      SELECT id FROM clients WHERE email = ${EMAIL} LIMIT 1
    `;
    let clientId;

    if (clientResult.length === 0) {
      const insertResult = await sql`
        INSERT INTO clients (name, slug, email, plan, is_active)
        VALUES (${'Test Client'}, ${'test-client'}, ${EMAIL}, ${'growth'}, ${true})
        RETURNING id
      `;
      clientId = insertResult[0].id;
      console.log(`✓ Client created: ${clientId}`);
    } else {
      clientId = clientResult[0].id;
      console.log(`✓ Client found: ${clientId}`);
    }

    // Create or update test user
    const userResult = await sql`
      INSERT INTO users (client_id, email, password_hash, full_name, role, email_verified, deleted_at)
      VALUES (${clientId}::uuid, ${EMAIL}, ${passwordHash}, ${FULL_NAME}, ${'owner'}, ${true}, NULL)
      ON CONFLICT (email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        deleted_at = NULL,
        role = 'owner'
      RETURNING id, email
    `;
    const userId = userResult[0].id;
    const email = userResult[0].email;
    console.log(`✓ User created/updated: ${userId}`);

    console.log('\n✅ Test user setup complete!');
    console.log(`\nYou can now log in with:`);
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${PASSWORD}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestUser();
