import { readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

(async () => {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const dbPath = join(__dirname, '..', 'data', 'db.json');

    const raw = await readFile(dbPath, 'utf8');
    const db = JSON.parse(raw);

    const ADMIN_EMAIL = 'faiqsajjad652@gmail.com';
    const ADMIN_PASSWORD = 'faiq1032';
    const ADMIN_USERNAME = 'faiqsajjad652';

    if (!Array.isArray(db.users)) {
      throw new Error('db.users is not an array');
    }

    // Prefer an existing admin, otherwise match by username or fallback to first user with admin-like username
    let user = db.users.find(u => u.role === 'admin') || db.users.find(u => (u.username || '').toLowerCase() === ADMIN_USERNAME) || db.users.find(u => (u.email || '').toLowerCase() === 'admin@example.com');

    if (!user) {
      throw new Error('No suitable user found to update as admin');
    }

    user.email = ADMIN_EMAIL;
    user.username = ADMIN_USERNAME;
    user.role = 'admin';
    user.password = await bcrypt.hash(ADMIN_PASSWORD, 10);
    user.updatedAt = new Date().toISOString();

    await writeFile(dbPath, JSON.stringify(db, null, 2), 'utf8');

    console.log('Success: updated admin user', user.id);
  } catch (err) {
    console.error('Failed to update admin credentials:', err?.message || err);
    process.exit(1);
  }
})();
