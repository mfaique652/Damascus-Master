import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, 'data');
const dbFile = path.join(dataDir, 'db.json');

await mkdir(dataDir, { recursive: true });

const adapter = new JSONFile(dbFile);
export const db = new Low(adapter, { users: [], products: [], albums: [] });

// Read DB safely: if JSON is malformed, back it up and recreate a minimal DB
try {
	await db.read();
} catch (err) {
	try {
		console.error('Failed to parse db.json — backing up corrupted file and recreating default DB', err && err.message || err);
		// Create a timestamped backup of the corrupted db file
		try {
			const corrupted = fs.readFileSync(dbFile, 'utf8');
			const bakPath = dbFile + '.corrupt.' + Date.now() + '.bak';
			fs.writeFileSync(bakPath, corrupted, 'utf8');
			console.error('Backed up corrupted db to', bakPath);
		} catch (rerr) {
			console.error('Failed to backup corrupted db.json:', rerr && rerr.message || rerr);
		}

		// Recreate a safe minimal DB structure
		const safe = { users: [], products: [], albums: [], supportMessages: [], newsletters: [] };
		fs.writeFileSync(dbFile, JSON.stringify(safe, null, 2), 'utf8');
		db.data = safe;
		// Ensure write is persisted by using the adapter's write via Low
		await db.write();
		console.error('Recreated safe db.json');
	} catch (finalErr) {
		console.error('Failed to recover from corrupted db.json:', finalErr && finalErr.stack || finalErr);
		// Give db an in-memory default so server can continue running
		db.data = { users: [], products: [], albums: [], supportMessages: [], newsletters: [] };
	}
}

// Ensure db.data is initialized to a minimal structure
db.data ||= { users: [], products: [], albums: [], supportMessages: [], newsletters: [] };
await db.write();
