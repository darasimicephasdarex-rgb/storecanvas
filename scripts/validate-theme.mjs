/** Deterministic local structure checks. Does not substitute for official Shopify Theme Check. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function auditTheme(rootDir,manifestPath){
 const fail=[];const requireFile=relative=>{
   const target=path.join(rootDir,relative);
   if(!fs.existsSync(target)){fail.push(`Missing ${relative}`);return null}
   return fs.readFileSync(target,'utf8');
 };
 const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 for(const [relative,info] of Object.entries(manifest.files)){
   if(!/^(?:layout|templates|sections|snippets|assets|config|locales)\/[a-zA-Z0-9._/-]+$/.test(relative)||relative.includes('..')){fail.push(`Illegal path ${relative}`);continue}
   const name=path.join(rootDir,relative);
   if(!fs.existsSync(name)){fail.push(`Manifest file missing ${relative}`);continue}
   const bytes=fs.readFileSync(name),hash=crypto.createHash('sha256').update(bytes).digest('hex');
   if(hash!==info.sha256||bytes.length!==info.bytes)fail.push(`File altered ${relative}`);
 }
 requireFile('layout/theme.liquid');
 const locales=['locales/en.default.json','locales/es.json'];
 const catalogs=new Map();
 for(const lang of locales){try{catalogs.set(lang,JSON.parse(requireFile(lang)||'INVALID'))}catch(error){fail.push('Invalid locale '+lang+': '+error.message)}}
 for(const [relative] of Object.entries(manifest.files))if(relative.endsWith('.liquid')){
  const source=requireFile(relative);if(!source)continue;
  for(const match of source.matchAll(/['"]storecanvas\.([a-z_]+\.[a-z_]+)['"]\s*\|\s*t\b/g)){
   for(const [locale,translations] of catalogs){const [group,key]=match[1].split('.');if(typeof translations?.storecanvas?.[group]?.[key]!=='string')fail.push('Missing translation '+match[1]+' in '+locale)}
  }
 }

 for(const [dir,name] of [['config','settings_schema.json'],['locales','en.default.json']]){
   try{JSON.parse(requireFile(`${dir}/${name}`)||'INVALID')}catch(e){fail.push(`Invalid JSON ${dir}/${name}: ${e.message}`)}
 }
 const assetNames=Object.keys(manifest.files).filter(s=>s.startsWith('assets/'));
 for(const [relative] of Object.entries(manifest.files)){
   if(relative.startsWith('sections/')&&relative.endsWith('.liquid')){
     const source=requireFile(relative);
     if(source===null)continue;
     const match=source.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/g);
     if(!match||match.length!==1){fail.push(`Exactly one schema required: ${relative}`);continue}
     try{
       const body=match[0].replace(/^\{%\s*schema\s*%\}/,'').replace(/\{%\s*endschema\s*%\}$/,'');
       const schema=JSON.parse(body);if(!schema.name)fail.push(`Unnamed section ${relative}`);
       const ids=(schema.settings||[]).map(s=>s.id).filter(Boolean);
       if(new Set(ids).size!==ids.length)fail.push(`Duplicate setting ID in ${relative}`);
     }catch(e){fail.push(`Invalid section schema ${relative}: ${e.message}`)}
   }
   if(relative.startsWith('templates/')&&relative.endsWith('.json')){
     try{
       const tpl=JSON.parse(requireFile(relative));
       if(!Array.isArray(tpl.order)||!tpl.sections)throw Error('Missing sections or order');
       for(const key of tpl.order){
         const section=tpl.sections[key];if(!section)throw Error(`Missing ordered section ${key}`);
         if(!manifest.files[`sections/${section.type}.liquid`])throw Error(`Unknown section type ${section.type}`);
       }
     }catch(e){fail.push(`Invalid template ${relative}: ${e.message}`)}
   }
   if(relative.endsWith('.liquid')){
     const src=requireFile(relative);if(src===null)continue;
     for(const match of src.matchAll(/\{\{\s*['"]([^'"]+)['"]\s*\|\s*asset_url\s*\}\}/g)){
       if(!assetNames.includes(`assets/${match[1]}`))fail.push(`Missing static asset ${match[1]} in ${relative}`);
     }
   }
 }
 return fail;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const problems=auditTheme(path.join(root,'dist/shopify-theme'),path.join(root,'dist/manifest.json'));
 if(problems.length){problems.forEach(s=>console.error('ERROR '+s));process.exit(1)}
 console.log('StoreCanvas structural audit: passed');
}
