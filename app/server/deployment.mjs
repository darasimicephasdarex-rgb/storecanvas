/** Startup guard for the single-instance encrypted-file deployment mode.
 * A filesystem volume is required in production; never silently use ephemeral storage.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {parseStorageKey} from './store.mjs';

export function resolveDeploymentConfig(env=process.env){
 const production=env.NODE_ENV==='production';
 const key=parseStorageKey(env.STORECANVAS_STORAGE_KEY);
 const apiKey=env.SHOPIFY_API_KEY,secret=env.SHOPIFY_API_SECRET;
 if(!apiKey||!secret||apiKey==='APP_CLIENT_ID_FROM_DEV_DASHBOARD'||secret==='APP_CLIENT_SECRET_FROM_DEV_DASHBOARD')throw Error('Shopify API credentials are required');
 const mount=env.RAILWAY_VOLUME_MOUNT_PATH;
 if(production&&(!mount||!path.isAbsolute(mount)))throw Error('Production requires an attached Railway persistent volume');
 const dataDir=env.STORECANVAS_DATA_DIR||(production?path.join(mount,'storecanvas'):'./.storecanvas-data');
 const directory=path.resolve(dataDir);
 if(production){
  const relative=path.relative(path.resolve(mount),directory);
  if(relative===''||relative.startsWith('..')||path.isAbsolute(relative))throw Error('STORECANVAS_DATA_DIR must be inside the persistent volume');
 }
 const rawPort=env.PORT||'8787';const port=Number(rawPort);
 if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid port');
 const host=env.HOST||(production?'0.0.0.0':'127.0.0.1');
 if(production&&host!=='0.0.0.0')throw Error('Production HOST must be 0.0.0.0 for Railway networking');
 return {production,key,apiKey,secret,directory,port,host};
}

export async function verifyPersistentDirectory(directory){
 await fs.mkdir(directory,{recursive:true,mode:0o700});
 const file=path.join(directory,'.storecanvas-health-'+randomBytes(12).toString('hex'));
 try{await fs.writeFile(file,'write-and-read-check',{flag:'wx',mode:0o600});
  if((await fs.readFile(file,'utf8'))!=='write-and-read-check')throw Error('Storage readback failed');
 }finally{await fs.rm(file,{force:true}).catch(()=>{});}
}
