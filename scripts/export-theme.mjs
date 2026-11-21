/** Reproducible output of the same compiler used by the browser preview. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {compileShopifyTheme} from '../engine/theme.mjs';
import {themeZip} from '../engine/zip.mjs';

const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const outputRoot=path.join(projectRoot,'dist');
const themeRoot=path.join(outputRoot,'shopify-theme');
const fixture=path.join(projectRoot,'tests/fixtures/project.json');

export async function exportFixture(){
  const project=JSON.parse(fs.readFileSync(fixture,'utf8'));
  const files=compileShopifyTheme(project);
  // This is a fixed generated path, never a user-provided delete target.
  fs.rmSync(themeRoot,{recursive:true,force:true});
  fs.mkdirSync(themeRoot,{recursive:true});
  const manifest={format:'StoreCanvas QA manifest',version:'0.8.0',files:{}};
  for(const [relative,data] of files){
    if(!/^(?:layout|templates|sections|snippets|assets|config|locales)\/[a-zA-Z0-9._/-]+$/.test(relative)||relative.includes('..'))throw Error('Invalid generated path: '+relative);
    const out=path.resolve(themeRoot,relative);
    if(!out.startsWith(themeRoot+path.sep))throw Error('Path traversal blocked');
    const bytes=data instanceof Uint8Array?Buffer.from(data):Buffer.from(String(data),'utf8');
    fs.mkdirSync(path.dirname(out),{recursive:true});
    fs.writeFileSync(out,bytes);
    manifest.files[relative]={bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
  }
  fs.writeFileSync(path.join(outputRoot,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  const zip=new Uint8Array(await themeZip(files).arrayBuffer());
  fs.writeFileSync(path.join(outputRoot,'storecanvas-theme.zip'),zip);
  console.log(`Exported ${files.size} files and ZIP to ${path.relative(projectRoot,outputRoot)}/`);
  return {themeRoot,zipPath:path.join(outputRoot,'storecanvas-theme.zip'),manifest};
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  exportFixture().catch(err=>{console.error(err);process.exitCode=1});
}
