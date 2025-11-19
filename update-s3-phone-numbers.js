#!/usr/bin/env node

/**
 * Script to update phone numbers in AWS S3 db.json and blog.json files
 * 
 * Usage: node update-s3-phone-numbers.js
 * 
 * This script:
 * 1. Connects to AWS S3 using credentials from .env.local
 * 2. Downloads latest db.json and blog.json
 * 3. Adds phone numbers to users
 * 4. Uploads updated files back to S3
 */

const fs = require('fs');
const path = require('path');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// ============================================================================
// CONFIGURATION
// ============================================================================

const S3_BUCKET = process.env.S3_BUCKET_NAME;
const S3_REGION = process.env.S3_REGION || 'us-east-1';
const DB_FILE_KEY = 'db.json';
const BLOG_FILE_KEY = 'blog.json';

// Phone numbers to add to users
const PHONE_NUMBERS = {
  1: '+14155552671',      // John Doe (USA)
  2: '+919876543210',     // Sarah Wilson (India)
  3: '+8613800138000',     // Mike Chen (China)
  4: '+917698581414'     // Vivek Satasiya(India)
};

// ============================================================================
// VALIDATION
// ============================================================================

console.log('🔍 Validating configuration...\n');

if (!S3_BUCKET) {
  console.error('❌ ERROR: S3_BUCKET_NAME not found in .env.local');
  console.error('   Please add: S3_BUCKET_NAME=your-bucket-name');
  process.exit(1);
}

if (!process.env.S3_ACCESS_KEY_ID) {
  console.error('❌ ERROR: S3_ACCESS_KEY_ID not found in .env.local');
  console.error('   Please add: S3_ACCESS_KEY_ID=your-access-key');
  process.exit(1);
}

if (!process.env.S3_SECRET_ACCESS_KEY) {
  console.error('❌ ERROR: S3_SECRET_ACCESS_KEY not found in .env.local');
  console.error('   Please add: S3_SECRET_ACCESS_KEY=your-secret-key');
  process.exit(1);
}

console.log('✅ Configuration validated');
console.log(`   Bucket: ${S3_BUCKET}`);
console.log(`   Region: ${S3_REGION}\n`);

// ============================================================================
// AWS S3 CONFIGURATION
// ============================================================================

const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Download a file from S3
 */
async function downloadFromS3(key) {
  try {
    console.log(`📥 Downloading ${key} from S3...`);
    
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key
    });

    const response = await s3Client.send(command);
    const chunks = [];
    
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    
    const content = Buffer.concat(chunks).toString('utf-8');
    const parsed = JSON.parse(content);
    
    console.log(`✅ Downloaded ${key} successfully\n`);
    return parsed;
  } catch (error) {
    console.error(`❌ Error downloading ${key}:`, error.message);
    throw error;
  }
}

/**
 * Upload a file to S3
 */
async function uploadToS3(key, data) {
  try {
    console.log(`📤 Uploading ${key} to S3...`);
    
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json'
    });

    await s3Client.send(command);
    console.log(`✅ Uploaded ${key} successfully\n`);
  } catch (error) {
    console.error(`❌ Error uploading ${key}:`, error.message);
    throw error;
  }
}

/**
 * Add phone numbers to users in database
 */
function addPhoneNumbers(db) {
  console.log('📞 Adding phone numbers to users...\n');
  
  if (!db.users || !Array.isArray(db.users)) {
    console.warn('⚠️  No users array found in database');
    return db;
  }

  let updated = 0;
  
  db.users.forEach(user => {
    if (PHONE_NUMBERS[user.id]) {
      const oldPhone = user.phoneNumber;
      user.phoneNumber = PHONE_NUMBERS[user.id];
      
      console.log(`   User ${user.id} (${user.email}):`);
      console.log(`   - Old: ${oldPhone || 'Not set'}`);
      console.log(`   - New: ${user.phoneNumber}`);
      console.log('');
      
      updated++;
    }
  });

  console.log(`✅ Updated ${updated} users with phone numbers\n`);
  return db;
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('================================================================================');
    console.log('           🎤 Voice Agent - S3 Phone Number Update Script');
    console.log('================================================================================\n');

    // Step 1: Download db.json
    console.log('STEP 1: Download db.json from S3');
    console.log('─'.repeat(80) + '\n');
    let dbData = await downloadFromS3(DB_FILE_KEY);

    // Step 2: Download blog.json
    console.log('STEP 2: Download blog.json from S3');
    console.log('─'.repeat(80) + '\n');
    let blogData = await downloadFromS3(BLOG_FILE_KEY);

    // Step 3: Add phone numbers to db.json
    console.log('STEP 3: Add phone numbers to db.json');
    console.log('─'.repeat(80) + '\n');
    dbData = addPhoneNumbers(dbData);

    // Step 4: Add phone numbers to blog.json (if it has users)
    console.log('STEP 4: Add phone numbers to blog.json');
    console.log('─'.repeat(80) + '\n');
    blogData = addPhoneNumbers(blogData);

    // Step 5: Upload updated db.json
    console.log('STEP 5: Upload updated db.json to S3');
    console.log('─'.repeat(80) + '\n');
    await uploadToS3(DB_FILE_KEY, dbData);

    // Step 6: Upload updated blog.json
    console.log('STEP 6: Upload updated blog.json to S3');
    console.log('─'.repeat(80) + '\n');
    await uploadToS3(BLOG_FILE_KEY, blogData);

    // Success!
    console.log('================================================================================');
    console.log('                        ✅ SUCCESS! All files updated');
    console.log('================================================================================\n');
    console.log('Summary:');
    console.log('  ✅ Downloaded db.json from S3');
    console.log('  ✅ Downloaded blog.json from S3');
    console.log('  ✅ Added phone numbers to users');
    console.log('  ✅ Uploaded updated db.json to S3');
    console.log('  ✅ Uploaded updated blog.json to S3\n');
    console.log('Phone numbers added:');
    console.log('  • User 1 (John Doe): +14155552671');
    console.log('  • User 2 (Sarah Wilson): +919876543210');
    console.log('  • User 3 (Mike Chen): +8613800138000\n');
    console.log('Your Voice Agent feature is now ready to use! 🎤📞\n');

  } catch (error) {
    console.error('\n================================================================================');
    console.error('                        ❌ ERROR - Update Failed');
    console.error('================================================================================\n');
    console.error('Error details:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Check that AWS credentials are correct in .env.local');
    console.error('  2. Check that S3 bucket name is correct');
    console.error('  3. Check that db.json and blog.json exist in S3');
    console.error('  4. Check that your AWS user has S3 permissions\n');
    process.exit(1);
  }
}

// ============================================================================
// RUN SCRIPT
// ============================================================================

main();
