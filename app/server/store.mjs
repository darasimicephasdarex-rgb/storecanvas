/** Encrypted single-instance DEVELOPMENT draft storage; replace with managed DB before SaaS deployment. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {randomBytes, randomUUID, createCipheriv, createDecipheriv, createHash} from 'node:crypto';
import {validateProject} from '../../engine/core.mjs';
import {validShop} from './auth.mjs';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sha=value=>createHash('sha256').update(value).digest('hex');
export function parseStorageKey(raw){
 const key=typeof raw==='string'&&/^[a-f0-9]{64}$/i.test(raw)?Buffer.from(raw,'hex'):
  typeof raw==='string'&&/^[A-Za-z0-9+/]{43}=$/.test(raw)?Buffer.from(raw,'base64'):Buffer.alloc(0);
 if(key.length!==32)throw Error('STORECANVAS_STORAGE_KEY must be 32 bytes (64 hex digits or base64)');
 return key;
}
export class EncryptedDraftStore{
 #root;#key;#locks=new Map();
 constructor({directory,key}){if(!directory||!Buffer.isBuffer(key)||key.length!==32)throw Error('Missing encrypted store configuration');this.#root=path.resolve(directory);this.#key=key;}
 #dir(shop){if(!validShop(shop))throw Error('Invalid shop');return path.join(this.#root,sha(shop));}
 #file(shop,id){if(!UUID.test(id))throw Error('Invalid project ID');return path.join(this.#dir(shop),id+'.sc.enc');}
 #encrypt(shop,id,record){
  const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',this.#key,iv);
  cipher.setAAD(Buffer.from(shop+':'+id));
  const encrypted=Buffer.concat([cipher.update(JSON.stringify(record),'utf8'),cipher.final()]);
  return JSON.stringify({format:1,iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:encrypted.toString('base64')});
 }
 #decrypt(shop,id,raw){
  const value=JSON.parse(raw);if(value.format!==1)throw Error('Unknown storage format');
  const decipher=createDecipheriv('aes-256-gcm',this.#key,Buffer.from(value.iv,'base64'));
  decipher.setAAD(Buffer.from(shop+':'+id));decipher.setAuthTag(Buffer.from(value.tag,'base64'));
  const record=JSON.parse(Buffer.concat([decipher.update(Buffer.from(value.data,'base64')),decipher.final()]).toString());
  if(record.id!==id||record.shop!==shop)throw Error('Storage isolation violation');
  return record;
 }
 async #save(shop,record){const dir=this.#dir(shop);await fs.mkdir(dir,{recursive:true,mode:0o700});
  const file=this.#file(shop,record.id),tmp=file+'.'+randomUUID()+'.tmp';
  try{await fs.writeFile(tmp,this.#encrypt(shop,record.id,record),{flag:'wx',mode:0o600});await fs.rename(tmp,file);}finally{await fs.rm(tmp,{force:true}).catch(()=>{});}
 }
 async #withLock(key,fn){const prev=this.#locks.get(key)||Promise.resolve();let unlock;const next=new Promise(r=>unlock=r);this.#locks.set(key,next);await prev;
  try{return await fn();}finally{unlock();if(this.#locks.get(key)===next)this.#locks.delete(key);}
 }
 async create(shop,document){const safe=validateProject(document);return this.#withLock(shop,async()=>{const id=randomUUID(),date=new Date().toISOString();const record={id,shop,revision:1,createdAt:date,updatedAt:date,document:safe};await this.#save(shop,record);return this.#public(record);});}
 #public(record){const {shop,...rest}=record;return structuredClone(rest);}
 async get(shop,id){try{const data=await fs.readFile(this.#file(shop,id),'utf8');return this.#public(this.#decrypt(shop,id,data));}catch(e){if(e.code==='ENOENT')return null;throw e;}}
 async list(shop){const dir=this.#dir(shop);let names;try{names=await fs.readdir(dir);}catch(e){if(e.code==='ENOENT')return [];throw e;}
  const out=[];for(const file of names.filter(n=>UUID.test(n.slice(0,36))&&n.endsWith('.sc.enc')).slice(0,200)){
   const record=await this.get(shop,file.slice(0,36));if(record)out.push({id:record.id,name:record.document.name,revision:record.revision,updatedAt:record.updatedAt});}
  return out.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
 }
 async update(shop,id,document,expectedRevision){return this.#withLock(shop,async()=>{const saved=await this.get(shop,id);if(!saved)return null;if(saved.revision!==expectedRevision)return {conflict:true,currentRevision:saved.revision};
  const record={...saved,shop,revision:saved.revision+1,updatedAt:new Date().toISOString(),document:validateProject(document)};
  await this.#save(shop,record);return this.#public(record);
 });}
 async remove(shop,id){return this.#withLock(shop,async()=>{const record=await this.get(shop,id);if(!record)return false;await fs.unlink(this.#file(shop,id));return true;});}
 async removeShop(shop){return this.#withLock(shop,async()=>{await fs.rm(this.#dir(shop),{recursive:true,force:true});});}
}
