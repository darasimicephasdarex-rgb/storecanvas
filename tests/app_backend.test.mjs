import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHmac,randomBytes} from 'node:crypto';
import {verifyShopifyIdToken,verifyWebhookHmac,validShop} from '../app/server/auth.mjs';
import {EncryptedDraftStore,parseStorageKey} from '../app/server/store.mjs';
import {createRequestHandler} from '../app/server/http.mjs';
import http from 'node:http';
const apiKey='test-api-id',secret='test-secret-'+randomBytes(18).toString('hex');
const shopA='alpha-test.myshopify.com',shopB='bravo-test.myshopify.com';
const fixture=JSON.parse(await fs.readFile(new URL('./fixtures/project.json',import.meta.url),'utf8'));
function sign(shop=shopA,override={}){
 const now=Math.floor(Date.now()/1000);
 const claims={iss:`https://${shop}/admin`,dest:`https://${shop}`,aud:apiKey,iat:now,nbf:now-1,exp:now+59,sub:'merchant-1',...override};
 const encoded=[{alg:'HS256',typ:'JWT'},claims].map(x=>Buffer.from(JSON.stringify(x)).toString('base64url'));
 return encoded.join('.')+'.'+createHmac('sha256',secret).update(encoded.join('.')).digest('base64url');
}
function hook(body){return createHmac('sha256',secret).update(body).digest('base64');}
test('ID-token signature, audience, destination, time, and issuance are verified',()=>{
 assert.equal(verifyShopifyIdToken(sign(),{apiKey,secret}).shop,shopA);
 assert.equal(verifyShopifyIdToken(sign(shopB),{apiKey,secret}).shop,shopB);
 assert.throws(()=>verifyShopifyIdToken(sign().slice(0,-2)+'aa',{apiKey,secret}),/Unauthorized/);
 assert.throws(()=>verifyShopifyIdToken(sign(shopA,{aud:'other'}),{apiKey,secret}),/Unauthorized/);
 assert.throws(()=>verifyShopifyIdToken(sign(shopA,{dest:`https://${shopB}`}),{apiKey,secret}),/Unauthorized/);
 assert.throws(()=>verifyShopifyIdToken(sign(shopA,{exp:1}),{apiKey,secret}),/Unauthorized/);
 assert.throws(()=>verifyShopifyIdToken(sign(shopA,{nbf:Math.floor(Date.now()/1000)+120}),{apiKey,secret}),/Unauthorized/);
 assert.throws(()=>verifyShopifyIdToken(sign(shopA,{iat:1}),{apiKey,secret}),/Unauthorized/);
 assert.equal(validShop('evil.myshopify.com.attacker.test'),false);
 assert.equal(validShop('good.myshopify.com'),true);
});
test('webhook signature authenticates raw bytes only',()=>{
 const raw=Buffer.from('{"shop_id":123}');const mac=hook(raw);
 assert.equal(verifyWebhookHmac(raw,mac,secret),true);
 assert.equal(verifyWebhookHmac(Buffer.from('{"shop_id":124}'),mac,secret),false);
 assert.equal(verifyWebhookHmac(raw,'bad',secret),false);
});
test('encrypted drafts have tenant isolation, revision conflict and authenticated ciphertext',async(t)=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'sc-drafts-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const key=randomBytes(32);const store=new EncryptedDraftStore({directory:dir,key});
 const project=await store.create(shopA,fixture);
 assert.equal(project.revision,1);assert.equal(project.document.sections.length,3);
 assert.equal(await store.get(shopB,project.id),null);
 assert.equal((await store.list(shopA)).length,1);assert.deepEqual(await store.list(shopB),[]);
 const raw=(await fs.readdir(dir,{recursive:true})).find(x=>x.endsWith('.sc.enc'));
 assert.ok(raw);
 const filePath=path.join(dir,raw);const bytes=await fs.readFile(filePath,'utf8');
 assert.doesNotMatch(bytes,/Botanical story|sc-slideshow|sections|Shop now/);
 const wrong=await store.update(shopA,project.id,fixture,3);assert.equal(wrong.conflict,true);
 const fresh=await store.update(shopA,project.id,fixture,1);assert.equal(fresh.revision,2);
 assert.equal(await store.get(shopA,project.id).then(v=>v.revision),2);
 const swapped=JSON.parse(await fs.readFile(filePath,'utf8'));swapped.tag='AA'+swapped.tag.slice(2);
 await fs.writeFile(filePath,JSON.stringify(swapped));await assert.rejects(()=>store.get(shopA,project.id));
 await store.removeShop(shopA);assert.deepEqual(await store.list(shopA),[]);
 assert.throws(()=>parseStorageKey('weak'),/32 bytes/);
 assert.throws(()=>parseStorageKey('!'.repeat(44)),/32 bytes/);
});
test('HTTP routes authenticate per request, enforce shop separation and erasure webhooks',async(t)=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'sc-api-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const store=new EncryptedDraftStore({directory:dir,key:randomBytes(32)});
 const server=http.createServer(createRequestHandler({store,apiKey,secret}));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const endpoint=`http://127.0.0.1:${server.address().port}`;
 const request=(route,{method='GET',token=sign(),body,headers={}}={})=>fetch(endpoint+route,{method,headers:{...(token?{authorization:'Bearer '+token}:{}),...(body?{'content-type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined});
 let r=await request('/healthz',{token:''});assert.equal(r.status,200);
 r=await request('/api/projects',{token:''});assert.equal(r.status,401);
 r=await request('/api/projects',{token:sign(shopA,{aud:'imposter'})});assert.equal(r.status,401);
 r=await request('/api/projects?shop='+shopB,{method:'POST',body:{document:fixture}});assert.equal(r.status,201);
 const created=await r.json();assert.equal(created.revision,1);assert.match(created.id,/^[a-f0-9-]{36}$/);
 r=await request('/api/projects',{token:sign(shopB)});assert.deepEqual(await r.json(),{projects:[]});
 r=await request('/api/projects/'+created.id,{token:sign(shopB)});assert.equal(r.status,404);
 r=await request('/api/projects/'+created.id,{method:'PUT',body:{document:fixture}});assert.equal(r.status,428);
 r=await request('/api/projects/'+created.id,{method:'PUT',body:{document:fixture},headers:{'If-Match':'"99"'}});assert.equal(r.status,409);
 r=await request('/api/projects/'+created.id,{method:'PUT',body:{document:fixture},headers:{'If-Match':'"1"'}});assert.equal(r.status,200);assert.equal((await r.json()).revision,2);
 r=await request('/api/projects/'+created.id);assert.equal(r.status,200);assert.equal(r.headers.get('etag'),'"2"');
 r=await request('/api/projects',{method:'POST',body:{document:{sections:[]}}});assert.equal(r.status,400);
 const raw=Buffer.from(JSON.stringify({shop_id:123,shop_domain:shopA,topic:'app/uninstalled'}));
 r=await fetch(endpoint+'/webhooks/shopify',{method:'POST',headers:{'x-shopify-shop-domain':shopA,'x-shopify-topic':'app/uninstalled','x-shopify-hmac-sha256':'bad'},body:raw});assert.equal(r.status,401);
 r=await fetch(endpoint+'/webhooks/shopify',{method:'POST',headers:{'x-shopify-shop-domain':shopB,'x-shopify-topic':'app/uninstalled','x-shopify-hmac-sha256':hook(raw)},body:raw});assert.equal(r.status,401);
 r=await fetch(endpoint+'/webhooks/shopify',{method:'POST',headers:{'x-shopify-shop-domain':shopA,'x-shopify-topic':'app/uninstalled','x-shopify-hmac-sha256':hook(raw)},body:raw});assert.equal(r.status,200);
 r=await request('/api/projects');assert.deepEqual(await r.json(),{projects:[]});
});

test('simultaneous draft writes and shop erasure are ordered per tenant',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'sc-erasure-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const store=new EncryptedDraftStore({directory:dir,key:randomBytes(32)});
 const initial=await store.create(shopA,fixture);
 await Promise.all([store.create(shopA,fixture),store.update(shopA,initial.id,fixture,1),store.removeShop(shopA)]);
 assert.deepEqual(await store.list(shopA),[]);
 const another=await store.create(shopB,fixture);
 assert.ok(await store.get(shopB,another.id));
});
