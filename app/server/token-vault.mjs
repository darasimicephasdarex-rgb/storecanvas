/** Encrypted local OAuth token vault for SINGLE-INSTANCE development only. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,createCipheriv,createDecipheriv,randomBytes,randomUUID,hkdfSync} from 'node:crypto';
import {validShop} from './auth.mjs';
export class EncryptedTokenVault {
 #root;#key;#locks=new Map();
 constructor({directory,key}){
  if(!directory||!Buffer.isBuffer(key)||key.length!==32)throw Error('Invalid vault configuration');
  this.#root=path.resolve(directory,'oauth');
  this.#key=Buffer.from(hkdfSync('sha256',key,Buffer.from('storecanvas-v1'),Buffer.from('oauth-tokens'),32));
 }
 #file(shop){if(!validShop(shop))throw Error('Invalid shop');return path.join(this.#root,createHash('sha256').update(shop).digest('hex')+'.enc');}
 async #lock(shop,fn){const prev=this.#locks.get(shop)||Promise.resolve();let unlock;const next=new Promise(r=>unlock=r);this.#locks.set(shop,next);await prev;try{return await fn();}finally{unlock();if(this.#locks.get(shop)===next)this.#locks.delete(shop);}}
 async save(shop,record){
  if(typeof record?.accessToken!=='string'||record.accessToken.length<8||record.accessToken.length>5000)throw Error('Invalid OAuth token');
  return this.#lock(shop,async()=>{
   await fs.mkdir(this.#root,{mode:0o700,recursive:true});
   const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',this.#key,iv);
   cipher.setAAD(Buffer.from('oauth:'+shop));
   const plaintext=JSON.stringify({accessToken:record.accessToken,scope:String(record.scope||'').slice(0,2000),expiresAt:record.expiresAt||null,refreshToken:record.refreshToken||null});
   const content=Buffer.concat([cipher.update(plaintext,'utf8'),cipher.final()]);
   const target=this.#file(shop),tmp=target+'.'+randomUUID()+'.tmp';
   try{await fs.writeFile(tmp,JSON.stringify({v:1,iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),content:content.toString('base64')}),{flag:'wx',mode:0o600});await fs.rename(tmp,target);}finally{await fs.rm(tmp,{force:true}).catch(()=>{});}
  });
 }
 async load(shop){
  let raw;try{raw=JSON.parse(await fs.readFile(this.#file(shop),'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}
  if(raw.v!==1)throw Error('Invalid token vault format');
  const decipher=createDecipheriv('aes-256-gcm',this.#key,Buffer.from(raw.iv,'base64'));
  decipher.setAAD(Buffer.from('oauth:'+shop));decipher.setAuthTag(Buffer.from(raw.tag,'base64'));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(raw.content,'base64')),decipher.final()]).toString('utf8'));
 }
 async remove(shop){return this.#lock(shop,()=>fs.rm(this.#file(shop),{force:true}));}
}
