const fs = require('fs');
const glob = require('glob'); // Note: we can just use native fs or simple script

const { execSync } = require('child_process');
execSync("find src/app/api -name 'route.ts'", { encoding: 'utf-8' }).split('\n').filter(Boolean).forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/import \{ (.*?) \} from "(\.\.\/)+core\//g, 'import { $1 } from "@/core/');
  content = content.replace(/import \{ (.*?) \} from "(\.\.\/)+infrastructure\//g, 'import { $1 } from "@/infrastructure/');
  fs.writeFileSync(file, content);
});
console.log('Imports fixed.');
