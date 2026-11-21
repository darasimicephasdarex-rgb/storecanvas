/** Minimal protected draft API. Requires Shopify App Bridge ID token for EVERY project request.
 * Not yet a hosted/public Shopify app: merchant installation and token exchange are separate work.
 */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {EncryptedTokenVault} from './token-vault.mjs';
import {exchangeOfflineToken,getCatalog} from './shopify.mjs';
import {verifyShopifyIdToken,verifyWebhookHmac,validShop} from './auth.mjs';
import {EncryptedDraftStore,parseStorageKey} from './store.mjs';
const MAX_REQUEST=2_050_000;
const moduleDir=path.dirname(fileURLToPath(import.meta.url));
const editorRoot=path.resolve(moduleDir,'../../editor');
const publicRoot=path.resolve(moduleDir,'../public');
const CSP_EMBEDDED="default-src 'self'; script-src 'self' https://cdn.shopify.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; frame-ancestors https://admin.shopify.com https://*.myshopify.com; base-uri 'self'; form-action 'self'";
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml'};
const escapedHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function serveAsset(res,file,{apiKey,embedded=false}={}){
 try{
  let content=await fs.readFile(file);
  if(file.endsWith('.html')){
   let html=content.toString('utf8');
   const header=`<meta name="shopify-api-key" content="${escapedHtml(apiKey)}"><script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>`;
   html=html.replace('</head>',header+'</head>').replaceAll('__SHOPIFY_API_KEY__',escapedHtml(apiKey));
   if(embedded){html=html.replace('<head>','<head><base href="/app/editor/">').replace('</body>','<script src="/app/editor/cloud.js"></script></body>');}
   content=Buffer.from(html,'utf8');
  }
  res.writeHead(200,{'content-type':MIME[path.extname(file)]||'application/octet-stream','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','content-security-policy':CSP_EMBEDDED});res.end(content);
 }catch(e){return result(res,e.code==='ENOENT'?404:500,{error:'Asset unavailable'});}
}
const assetMap={
 '/app/':path.join(publicRoot,'index.html'),'/app':path.join(publicRoot,'index.html'),
 '/app/assets/dashboard.js':path.join(publicRoot,'dashboard.js'),'/app/assets/dashboard.css':path.join(publicRoot,'dashboard.css'),
 '/app/editor/':path.join(editorRoot,'index.html'),
 '/app/editor/app.js':path.join(editorRoot,'app.js'),'/app/editor/runtime.js':path.join(editorRoot,'runtime.js'),
 '/app/editor/exporter.js':path.join(editorRoot,'exporter.js'),'/app/editor/styles.css':path.join(editorRoot,'styles.css'),
 '/app/editor/cloud.js':path.join(publicRoot,'cloud.js'),
 ...Object.fromEntries(['plant','fern','architecture','detail'].map(n=>[`/app/editor/assets/${n}.svg`,path.join(editorRoot,'assets',n+'.svg')]))
};

const security={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; frame-ancestors 'none'"};
function result(res,status,body,headers={}){res.writeHead(status,{...security,...headers});res.end(JSON.stringify(body));}
async function readRaw(req,max=MAX_REQUEST){let length=0,parts=[];for await(const part of req){length+=part.length;if(length>max){const e=Error('Payload too large');e.status=413;throw e;}parts.push(part);}return Buffer.concat(parts);}
function doc(raw){let data;try{data=JSON.parse(raw.toString('utf8'));}catch{const e=Error('Invalid JSON');e.status=400;throw e;}return data;}
export function createRequestHandler({store,vault=null,apiKey,secret,exchange=exchangeOfflineToken,catalog=getCatalog}){
 if(!store||!apiKey||!secret)throw Error('Missing app configuration');
 return async(req,res)=>{
  try{
   const url=new URL(req.url||'/', 'http://localhost');
   if(url.pathname==='/healthz'&&req.method==='GET')return result(res,200,{ok:true});
   if(assetMap[url.pathname]){
    if(req.method!=='GET')return result(res,405,{error:'Method not allowed'});
    return serveAsset(res,assetMap[url.pathname],{apiKey,embedded:url.pathname==='/app/editor/'});
   }

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
    if(topic==='app/uninstalled'||topic==='shop/redact'){await store.removeShop(shop);if(vault)await vault.remove(shop);}
    else if(!['customers/data_request','customers/redact'].includes(topic))return result(res,404,{error:'Unsupported topic'});
    return result(res,200,{ok:true});
   }
   if(!url.pathname.startsWith('/api/'))return result(res,404,{error:'Not found'});
   const bearer=req.headers.authorization||'',match=/^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.exec(bearer);
   if(!match)return result(res,401,{error:'Unauthorized'},{'x-shopify-retry-invalid-session-request':'1'});
   let shop;
   try{shop=verifyShopifyIdToken(match[1],{apiKey,secret}).shop;}catch{return result(res,401,{error:'Unauthorized'},{'x-shopify-retry-invalid-session-request':'1'});}
   if(url.pathname==='/api/app/status'&&req.method==='GET'){
    const installed=vault?await vault.load(shop):null;
    return result(res,200,{shop,connected:!!installed,scope:installed?.scope||''});
   }
   if(url.pathname==='/api/install/exchange'&&req.method==='POST'){
    if(!vault)return result(res,503,{error:'Token vault not configured'});
    const record=await exchange({shop,idToken:match[1],apiKey,secret});
    await vault.save(shop,record);
    return result(res,200,{shop,connected:true,scope:record.scope});
   }
   if(url.pathname==='/api/catalog'&&req.method==='GET'){
    const token=vault?await vault.load(shop):null;
    if(!token)return result(res,409,{error:'Connect the Shopify app first'});
    if(token.expiresAt&&token.expiresAt<Date.now())return result(res,401,{error:'Shopify access token expired; reconnect app'});
    return result(res,200,{products:await catalog({shop,token:token.accessToken})});
   }
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
 const storageKey=parseStorageKey(key);
 const store=new EncryptedDraftStore({directory,key:storageKey});
 const vault=new EncryptedTokenVault({directory,key:storageKey});
 return http.createServer(createRequestHandler({store,vault,apiKey,secret}));
}
