const fs = require('fs');
const path = require('path');
// lightweight UUIDv4 generator to avoid external dependency
function uuidv4(){
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
const dbPath = path.join(__dirname, '..', 'server', 'data', 'db.json');
(async ()=>{
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const id = uuidv4();
  const admin = {
    id,
    email: 'local-admin@example.com',
    role: 'admin',
    password: '$2b$10$iqC/j.AzE1c4Y3SFqTHWXeZXubwESdzTsUGwyDPGXfQVi58nsbN.O',
    name: 'Local Admin',
    username: 'localadmin',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    logo: '',
    preferences: { compactLayout: false, orderEmails: true, marketingEmails: false, newsletter: false, twoFactorAuth: false, loginNotifications: true },
    orders: [], wishlist: [], totalSpent: 0, memberSince: new Date().getFullYear(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  };
  db.users.push(admin);
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log('Added admin', id);
})();
