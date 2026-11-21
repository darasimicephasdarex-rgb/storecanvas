/** Minimal protected draft API. Requires Shopify App Bridge ID token for EVERY project request.
 * Not yet a hosted/public Shopify app: merchant installation and token exchange are separate work.
 */
import http from 'node:http';
import {verifyShopifyIdToken,verifyWebhookHmac,validShop} from './auth.mjs';
import {EncryptedDraftStore,parseStorageKey} from './store.mjs';
const MAX_REQUEST=2_050_000;
const security={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; frame-ancestors 'none'"};
function result(res,status,body,headers={}){res.writeHead(status,{...security,...headers});res.end(JSON.stringify(body));}
async function readRaw(req,max=MAX_REQUEST){let length=0,parts=[];for await(const part of req){length+=part.length;if(length>max){const e=Error('Payload too large');e.status=413;throw e;}parts.push(part);}return Buffer.concat(parts);}
function doc(raw){let data;try{data=JSON.parse(raw.toString('utf8'));}catch{const e=Error('Invalid JSON');e.status=400;throw e;}return data;}
export function createRequestHandler({store,apiKey,secret}){
 if(!store||!apiKey||!secret)throw Error('Missing app configuration');
 return async(req,res)=>{
  try{
   const url=new URL(req.url||'/', 'http://localhost');
   if(url.pathname==='/healthz'&&req.method==='GET')return result(res,200,{ok:true});
   if(url.pathname==='/webhooks/shopify'){
    if(req.method!=='POST')return result(res,405,{error:'Method not allowed'});
    const raw=await readRaw(req,524288),signature=req.headers['x-shopify-hmac-sha256'];
    if(!verifyWebhookHmac(raw,signature,secret))return result(res,401,{error:'Unauthorized'});
    const shop=req.headers['x-shopify-shop-domain'],topic=req.headers['x-shopify-topic'];
    if(!validShop(shop))return result(res,400,{error:'Invalid shop'});
    // The HMAC signs the BODY, not request headers. Never erase a shop from the
    // unsigned X-Shopify-Shop-Domain header alone: reject cross-shop substitution.
    let payload;try{payload=JSON.parse(raw.toString('utf8'));}catch{return result(res,400,{error:'Invalid JSON'});}
    if(!payload||typeof payload!=='object'||Array.isArray(payload))return result(res,400,{error:'Invalid webhook'});
    const domains=[payload.shop_domain,payload.myshopify_domain].filter(v=>v!==undefined&&v!==null);
    if(!domains.length||domains.some(v=>!validShop(v)||v!==shop))return result(res,401,{error:'Shop identity mismatch'});
    if(topic==='app/uninstalled'||topic==='shop/redact')await store.removeShop(shop);
    else if(!['customers/data_request','customers/redact'].includes(topic))return result(res,404,{error:'Unsupported topic'});
    return result(res,200,{ok:true});
   }
   if(!url.pathname.startsWith('/api/projects'))return result(res,404,{error:'Not found'});
   const bearer=req.headers.authorization||'',match=/^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.exec(bearer);
   if(!match)return result(res,401,{error:'Unauthorized'},{'x-shopify-retry-invalid-session-request':'1'});
   let shop;
   try{shop=verifyShopifyIdToken(match[1],{apiKey,secret}).shop;}catch{return result(res,401,{error:'Unauthorized'},{'x-shopify-retry-invalid-session-request':'1'});}
   const pathMatch=/^\/api\/projects(?:\/([0-9a-f-]{36}))?$/.exec(url.pathname);
   if(!pathMatch)return result(res,404,{error:'Not found'});
   const id=pathMatch[1];
   if(!id){
    if(req.method==='GET')return result(res,200,{projects:await store.list(shop)});
    if(req.method==='POST'){const input=doc(await readRaw(req));const created=await store.create(shop,input.document);return result(res,201,created,{'etag':'"'+created.revision+'"'});}
   }else{
    if(req.method==='GET'){const item=await store.get(shop,id);return item?result(res,200,item,{'etag':'"'+item.revision+'"'}):result(res,404,{error:'Not found'});}
    if(req.method==='PUT'){
     const revision=/^"([1-9][0-9]*)"$/.exec(req.headers['if-match']||'');
     if(!revision)return result(res,428,{error:'If-Match revision required'});
     const input=doc(await readRaw(req));const updated=await store.update(shop,id,input.document,Number(revision[1]));
     if(!updated)return result(res,404,{error:'Not found'});
     if(updated.conflict)return result(res,409,{error:'Revision conflict',revision:updated.currentRevision});
     return result(res,200,updated,{'etag':'"'+updated.revision+'"'});
    }
    if(req.method==='DELETE'){const deleted=await store.remove(shop,id);return deleted?result(res,200,{deleted:true}):result(res,404,{error:'Not found'});}
   }
   return result(res,405,{error:'Method not allowed'},{allow:id?'GET, PUT, DELETE':'GET, POST'});
  }catch(e){const status=e.status|| (e.message?.startsWith('Project ')||e.message?.startsWith('Invalid ')||e.message?.startsWith('Too many ')||e.message?.startsWith('Duplicate ')||e.message?.startsWith('Unsupported ')||e.message?.includes('nesting')?400:500);
   if(status===500)console.error('StoreCanvas API failure (details withheld from client)');
   return result(res,status,{error:status===500?'Internal server error':e.message});}
 };
}
export function createAppServer({directory=process.env.STORECANVAS_DATA_DIR||'./.storecanvas-data',key=process.env.STORECANVAS_STORAGE_KEY,apiKey=process.env.SHOPIFY_API_KEY,secret=process.env.SHOPIFY_API_SECRET}={}){
 const store=new EncryptedDraftStore({directory,key:parseStorageKey(key)});
 return http.createServer(createRequestHandler({store,apiKey,secret}));
}
