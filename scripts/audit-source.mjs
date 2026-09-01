import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const bad=['example.com','localhost','chrome-extension://'];
const roots=['src','public','astro.config.mjs','wrangler.jsonc','package.json'];
let fail=[];
function scanFile(p){if(path.basename(p)==='audit-source.mjs')return;const t=fs.readFileSync(p,'utf8');for(const b of bad)if(t.includes(b))fail.push(`${p}: forbidden token ${b}`)}
function walk(p){const s=fs.statSync(p);if(s.isDirectory()){for(const n of fs.readdirSync(p)){const q=path.join(p,n);if(fs.statSync(q).isDirectory()||/\.(astro|mjs|ts|js|css|json|jsonc|md|txt|svg)$/.test(q))walk(q)}}else scanFile(p)}
for(const r of roots)walk(path.join(root,r));
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
for(const [k,v] of Object.entries({...pkg.dependencies,...pkg.devDependencies})){if(/[\^~*]|latest/.test(v))fail.push(`floating dependency ${k}: ${v}`)}
if(fs.existsSync(path.join(root,'pnpm-workspace.yaml')))fail.push('unexpected pnpm-workspace.yaml');
for(const img of ['dhauli-hero.jpg','dhauli-front.jpg','dhauli-detail.jpg','dhauli-buddha.jpg','dhauli-view.jpg'])if(!fs.existsSync(path.join(root,'public/images',img)))fail.push(`missing local image: ${img}`);
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('SOURCE_AUDIT: PASS');
