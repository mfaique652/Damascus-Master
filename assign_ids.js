// assign_ids.js
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'data', 'db.json');

function getHeartIdPrefix(category) {
  const map = {
    'hunting-knives': 'hn',
    'pocket-knives': 'pn',
    'swords': 'sw',
    'axes': 'ax',
    'rings': 'ri',
    'others': 'ot',
    'kitchen-knives': 'kn',
  };
  // Add some aliases
  map['pocket-knife'] = 'pn';
  map['pocketknife'] = 'pn';
  map['pocket'] = 'pn';
  map['kitchenknife'] = 'kn';
  map['huntingknife'] = 'hn';

  return map[category.toLowerCase()] || 'ot';
}

function main() {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const products = db.products || [];
  
  const categoryCounters = {};

  products.forEach(product => {
    const category = product.category || 'others';
    const lowerCategory = category.toLowerCase();

    if (!categoryCounters[lowerCategory]) {
      categoryCounters[lowerCategory] = 0;
    }
    categoryCounters[lowerCategory]++;
    
    const prefix = getHeartIdPrefix(lowerCategory);
    const newId = prefix + categoryCounters[lowerCategory];
    
    if (!product.details) {
      product.details = {};
    }
    product.details.displayId = newId;
  });

  db.products = products;
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log('Assigned new heart IDs to all products in db.json');
}

if (require.main === module) {
  main();
}
