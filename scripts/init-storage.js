#!/usr/bin/env node

/**
 * Storage Initialization Script
 * 
 * This script ensures both db.json and blog.json exist with proper structure
 * for both local file system and S3 storage.
 * 
 * Usage:
 *   node scripts/init-storage.js
 *   npm run init-storage (if added to package.json)
 */

const fs = require('fs').promises;
const path = require('path');

const EMPTY_DB_STRUCTURE = {
  userDocuments: [],
  voiceSessions: [],
  users: []
};

async function initializeLocalStorage() {
  const dbPath = path.join(process.cwd(), 'db.json');
  const blogPath = path.join(process.cwd(), 'blog.json');

  try {
    // Check and create db.json if needed
    try {
      await fs.access(dbPath);
      console.log('✅ db.json already exists');
    } catch {
      await fs.writeFile(dbPath, JSON.stringify(EMPTY_DB_STRUCTURE, null, 2));
      console.log('✅ Created db.json');
    }

    // Check and create blog.json if needed
    try {
      await fs.access(blogPath);
      console.log('✅ blog.json already exists');
    } catch {
      await fs.writeFile(blogPath, JSON.stringify(EMPTY_DB_STRUCTURE, null, 2));
      console.log('✅ Created blog.json');
    }

    console.log('🎉 Local storage initialization complete!');
  } catch (error) {
    console.error('❌ Local storage initialization failed:', error.message);
    throw error;
  }
}

async function initializeS3Storage() {
  try {
    const response = await fetch('/api/storage-health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'initialize' })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ S3 storage initialized:', result.message);
    } else {
      const error = await response.json();
      console.error('❌ S3 storage initialization failed:', error.details);
    }
  } catch (error) {
    console.error('❌ S3 storage initialization failed:', error.message);
    // Don't throw - S3 might not be configured in development
  }
}

async function main() {
  console.log('🚀 Initializing storage systems...\n');

  // Always initialize local storage
  await initializeLocalStorage();

  // Try to initialize S3 if we're in a server environment
  if (process.env.NODE_ENV === 'production' || process.env.USE_S3_LOCAL === 'true') {
    console.log('\n🌐 Initializing S3 storage...');
    await initializeS3Storage();
  } else {
    console.log('\n⏭️  Skipping S3 initialization (not in production mode)');
  }

  console.log('\n✨ Storage initialization complete!');
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('\n💥 Initialization failed:', error.message);
    process.exit(1);
  });
}

module.exports = { initializeLocalStorage, initializeS3Storage };
