import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const bad=['example.com','localhost','chrome-extension://'];
const roots=['src','public','astro.config.mjs','wrangler.jsonc','package.json'];
let fail=[];
function scanFile(p){if(path.basename(p)==='audit-source.mjs')return;const t=fs.readFileSync(p,'utf8');for(const b of bad)if(t.includes(b))fail.push(`${p}: forbidden token ${b}`)}
function walk(p){const s=fs.statSync(p);if(s.isDirectory()){for(const n of fs.readdirSync(p)){const q=path.join(p,n);if(fs.statSync(q).isDirectory()||/\.(astro|mjs|ts|js|css|json|jsonc|md|txt|svg|webmanifest)$/.test(q))walk(q)}}else scanFile(p)}
for(const r of roots)walk(path.join(root,r));
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
for(const [k,v] of Object.entries({...pkg.dependencies,...pkg.devDependencies})){if(/[\^~*]|latest/.test(v))fail.push(`floating dependency ${k}: ${v}`)}
if(fs.existsSync(path.join(root,'pnpm-workspace.yaml')))fail.push('unexpected pnpm-workspace.yaml');
for(const img of ['dhauli-hero.jpg','dhauli-front.jpg','dhauli-detail.jpg','dhauli-buddha.jpg','dhauli-view.jpg'])if(!fs.existsSync(path.join(root,'public/images',img)))fail.push(`missing local image: ${img}`);
/* PWA assets referenced by BaseLayout / manifest.webmanifest. */
for(const f of ['manifest.webmanifest','sw.js'])if(!fs.existsSync(path.join(root,'public',f)))fail.push(`missing PWA file: ${f}`);
for(const i of ['icon-192.png','icon-512.png','maskable-512.png'])if(!fs.existsSync(path.join(root,'public/icons',i)))fail.push(`missing PWA icon: ${i}`);
const sw=fs.readFileSync(path.join(root,'public','sw.js'),'utf8');
if(!sw.includes("self.addEventListener('fetch'"))fail.push('sw.js has no fetch handler');
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('SOURCE_AUDIT: PASS');
