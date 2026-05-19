#!/usr/bin/env node

/**
 * Firebase Data Import Script
 * 
 * Imports ideas from localStorage export (ideas-backup.json) to Firestore
 * 
 * Usage:
 *   1. Export data from browser console: exportData(getIdeas())
 *   2. Save as ideas-backup.json
 *   3. Run: firebase emulator:exec firebase-import.js
 *   
 * Or for production:
 *   firebase functions:shell
 *   > const imported = require('./firebase-import.js');
 *   > imported.importIdeas();
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function importIdeas() {
  try {
    // Read backup file
    const backupPath = path.join(__dirname, 'ideas-backup.json');
    if (!fs.existsSync(backupPath)) {
      console.error('❌ ideas-backup.json not found. Export data from browser first.');
      console.error('   See FIREBASE_SETUP.md Phase 5.1 for instructions.');
      process.exit(1);
    }

    const fileContent = fs.readFileSync(backupPath, 'utf8');
    const data = JSON.parse(fileContent);

    if (!data.ideas || !Array.isArray(data.ideas)) {
      console.error('❌ Invalid backup format. Expected { ideas: [...] }');
      process.exit(1);
    }

    console.log(`📦 Importing ${data.ideas.length} ideas to Firestore...`);

    let imported = 0;
    let skipped = 0;

    for (const idea of data.ideas) {
      try {
        // Validate required fields
        if (!idea.id || !idea.title || !idea.text) {
          console.warn(`⚠️  Skipping idea ${idea.id}: missing required fields`);
          skipped++;
          continue;
        }

        // Prepare document data
        const docData = {
          id: idea.id,
          title: idea.title,
          text: idea.text,
          category: idea.category || 'governance',
          author: idea.author || 'Anonymous',
          anonymous: idea.anonymous !== false,
          feasibility: idea.feasibility || 50,
          votes: idea.votes || 0,
          status: idea.status || 'submitted',
          flagged: idea.flagged || false,
          createdAt: idea.submittedAt ? new Date(idea.submittedAt) : new Date(),
          updatedAt: new Date(),
        };

        // Write to Firestore
        await db.collection('ideas').doc(idea.id).set(docData);
        imported++;

        // Progress indicator
        if (imported % 10 === 0) {
          console.log(`  ✓ ${imported} ideas imported...`);
        }
      } catch (err) {
        console.error(`❌ Error importing idea ${idea.id}:`, err.message);
        skipped++;
      }
    }

    console.log(`\n✅ Import complete!`);
    console.log(`   Imported: ${imported}`);
    console.log(`   Skipped:  ${skipped}`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. Verify data in Firestore console`);
    console.log(`   2. Enable security rules (see firestore-rules.txt)`);
    console.log(`   3. Test ideas.html and submit.html with new ideas`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Import failed:', err.message);
    process.exit(1);
  }
}

// Export for direct usage
module.exports = { importIdeas };

// Run if called directly
if (require.main === module) {
  importIdeas();
}
