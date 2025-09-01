// cleanup_albums.js
// Deletes album HTML files that do not correspond to a product in the database.

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'data', 'db.json');
const rootDir = __dirname;

// This sanitization logic MUST match generate_albums.js
function sanitizeFilename(name) {
  if (!name) return null;
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase() + '.html';
}

function main() {
  // 1. Get a list of all valid album filenames from the database.
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const validAlbumFiles = new Set();
  (db.products || []).forEach(product => {
    const filename = sanitizeFilename(product.title);
    if (filename) {
      validAlbumFiles.add(filename);
    }
  });

  console.log(`Found ${validAlbumFiles.size} valid products in the database.`);

  // 2. Get a list of all HTML files in the root directory.
  const filesInDir = fs.readdirSync(rootDir);
  const htmlFiles = filesInDir.filter(file => file.endsWith('.html'));

  // 3. Determine which files are orphaned albums.
  // An orphaned album is a file that looks like it was generated but is not in the valid set.
  // Heuristic: Generated files are all lowercase and contain underscores.
  const orphanedFiles = htmlFiles.filter(file => {
    const isPotentiallyGenerated = (file.toLowerCase() === file && file.includes('_'));
    return isPotentiallyGenerated && !validAlbumFiles.has(file);
  });

  // 4. Delete the orphaned files.
  if (orphanedFiles.length === 0) {
    console.log('No orphaned album files to delete. Workspace is clean.');
    return;
  }

  console.log(`Found ${orphanedFiles.length} orphaned album files to delete:`);
  orphanedFiles.forEach(file => {
    try {
      fs.unlinkSync(path.join(rootDir, file));
      console.log(`- Deleted: ${file}`);
    } catch (err) {
      console.error(`- Error deleting ${file}:`, err);
    }
  });

  console.log('\nCleanup complete.');
}

if (require.main === module) {
  main();
}
