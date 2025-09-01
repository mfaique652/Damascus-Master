const fs = require('fs');
const bcrypt = require('bcryptjs');

function simpleId() {
  // not a RFC uuid but fine for tests
  return 'id-' + Date.now() + '-' + Math.floor(Math.random()*100000);
}

(function(){
  const dbPath = 'server/data/db.json';
  const db = JSON.parse(fs.readFileSync(dbPath,'utf8'));
  const email = 'e2eadmin@example.com';
  const existing = (db.users||[]).find(u=>u.email===email);
  if(existing){
    console.log('exists', existing.id);
    return;
  }
  const id = simpleId();
  const hashed = bcrypt.hashSync('Secret123', 10);
  const user = {
    id,
    email,
    password: hashed,
    name: 'E2E Admin',
    username: 'e2eadmin',
    role: 'admin',
    preferences: { compactLayout:false, orderEmails:true, marketingEmails:false, newsletter:false, twoFactorAuth:false, loginNotifications:true },
    orders: [],
    wishlist: [],
    totalSpent: 0,
    memberSince: new Date().getFullYear(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.users = db.users || [];
  db.users.push(user);
  fs.writeFileSync(dbPath, JSON.stringify(db,null,2),'utf8');
  console.log('created', id);
})();
