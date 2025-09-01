// This script deletes the album HTML file for a deleted product if it exists.
import fs from 'fs/promises';
import path from 'path';

const albumFile = 'Hand_Forged_Damascus_Steel_5_Pcs_Rosewood_Handle_Chef_Knife_Set.html';
const albumPath = path.join(process.cwd(), albumFile);

fs.unlink(albumPath)
  .then(() => console.log('Deleted', albumFile))
  .catch(e => console.warn('Could not delete', albumFile, e.message));
