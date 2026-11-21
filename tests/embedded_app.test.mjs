import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {randomBytes,createHmac} from 'node:crypto';
import {EncryptedTokenVault} from '../app/server/token-vault.mjs';
import {EncryptedDraftStore} from '../app/server/store.mjs';
import {exchangeOfflineToken,getCatalog} from '../app/server/shopify.mjs';
import {createRequestHandler} from '../app/server/http.mjs';
const apiKey='embedded-client-test',secret='test-secret-'+randomBytes(16).toString('hex');
const shopA='northwest-test.myshopify.com',shopB='southeast-test.myshopify.com';
const fixture=JSON.parse(await fs.readFile(new URL('./fixtures/project.json',import.meta.url),'utf8'));
function sign(shop=shopA){const now=Math.floor(Date.now()/1000);const claims={iss:`https://${shop}/admin`,dest:`https://${shop}`,aud:apiKey,iat:now,nbf:now,exp:now+60,sub:'merchant'};const parts=[{alg:'HS256',typ:'JWT'},claims].map(v=>Buffer.from(JSON.stringify(v)).toString('base64url'));return parts.join('.')+'.'+createHmac('sha256',secret).update(parts.join('.')).digest('base64url');}
test('OAuth exchange verifies Shopify endpoint, correct grant and never returns browser secrets',async()=>{
 let url,params;
 const data=await exchangeOfflineToken({shop:shopA,idToken:'authenticated-id-token',apiKey,secret,fetchImpl:async(uri,opts)=>{
  url=uri;params=new URLSearchParams(opts.body);assert.equal(opts.redirect,'error');assert.equal(opts.method,'POST');
  return {ok:true,json:async()=>({access_token:'a-secret-mock-admin-access-token',scope:'read_products'})};
 }});
 assert.equal(url,`https://${shopA}/admin/oauth/access_token`);
 assert.equal(params.get('requested_token_type'),'urn:shopify:params:oauth:token-type:offline-access-token');
 assert.equal(params.get('grant_type'),'urn:ietf:params:oauth:grant-type:token-exchange');
 assert.equal(data.scope,'read_products');assert.equal(data.accessToken,'a-secret-mock-admin-access-token');
 await assert.rejects(()=>exchangeOfflineToken({shop:'evil.com',idToken:'a',apiKey,secret}));
});
test('invalid or expired Shopify token exchange is rejected',async()=>{
 const args={shop:shopA,idToken:'id',apiKey,secret};
 await assert.rejects(()=>exchangeOfflineToken({...args,fetchImpl:async()=>({status:400,ok:false})}),e=>e.status===401);
 await assert.rejects(()=>exchangeOfflineToken({...args,fetchImpl:async()=>({status:500,ok:false})}),e=>e.status===502);
 await assert.rejects(()=>exchangeOfflineToken({...args,fetchImpl:async()=>({status:200,ok:true,json:async()=>({access_token:''})})}),/Invalid Shopify token/);
});
test('catalog is read-only and GraphQL failures fail closed',async()=>{
 let request;
 const p=await getCatalog({shop:shopA,token:'secret-access-token',fetchImpl:async(url,opts)=>{request={url,opts};return {ok:true,json:async()=>({data:{products:{nodes:[{id:'gid://shopify/Product/1',handle:'hat',title:'Hat',status:'ACTIVE'}]}}})};}});
 assert.equal(p[0].title,'Hat');assert.equal(request.url,`https://${shopA}/admin/api/2026-10/graphql.json`);
 assert.equal(request.opts.redirect,'error');assert.equal(request.opts.headers['x-shopify-access-token'],'secret-access-token');
 assert.ok(!JSON.stringify(p).includes('secret-access-token'));
 await assert.rejects(()=>getCatalog({shop:shopA,token:'secret-access-token',fetchImpl:async()=>({ok:true,json:async()=>({errors:[{message:'failed'}]})})}),e=>e.status===502);
});
test('per-shop OAuth token vault encrypts and prevents cross-shop retrieval',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'sc-oauth-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const vault=new EncryptedTokenVault({directory:dir,key:randomBytes(32)}),token='shpat_PRIVATE_TEST_TOKEN_12345';
 await vault.save(shopA,{accessToken:token,scope:'read_products'});
 assert.equal((await vault.load(shopA)).accessToken,token);assert.equal(await vault.load(shopB),null);
 const names=await fs.readdir(path.join(dir,'oauth'));
 assert.doesNotMatch(await fs.readFile(path.join(dir,'oauth',names[0]),'utf8'),/shpat_PRIVATE_TEST_TOKEN|read_products/);
 await vault.remove(shopA);assert.equal(await vault.load(shopA),null);
});
test('embedded dashboard, authenticated draft/catalog and uninstall erasure work',async t=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'sc-app-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));
 const key=randomBytes(32),store=new EncryptedDraftStore({directory:dir,key}),vault=new EncryptedTokenVault({directory:dir,key});
 const server=http.createServer(createRequestHandler({store,vault,apiKey,secret,
  exchange:async()=>({accessToken:'fake-server-admin-token',scope:'read_products'}),
  catalog:async({shop,token})=>{assert.equal(token,'fake-server-admin-token');return [{title:shop,handle:'test'}];}}));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const url=`http://127.0.0.1:${server.address().port}`;
 const req=(route,{method='GET',shop=shopA,auth=true,body}={})=>fetch(url+route,{method,headers:{...(auth?{authorization:'Bearer '+sign(shop)}:{}),...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 let response=await req('/app/');assert.equal(response.status,200);
 let html=await response.text();assert.match(html,/shopify-api-key/);assert.match(html,/app-bridge.js/);assert.doesNotMatch(html,/test-secret-/);
 response=await req('/app/editor/');assert.equal(response.status,200);html=await response.text();assert.match(html,/cloud.js/);assert.match(html,/<base href="\/app\/editor\/">/);
 response=await req('/api/app/status',{auth:false});assert.equal(response.status,401);
 response=await req('/api/catalog');assert.equal(response.status,409);
 response=await req('/api/install/exchange',{method:'POST',auth:false});assert.equal(response.status,401);
 response=await req('/api/install/exchange',{method:'POST'});assert.equal(response.status,200);assert.doesNotMatch(await response.text(),/fake-server-admin-token/);
 response=await req('/api/app/status',{shop:shopB});assert.equal((await response.json()).connected,false);
 response=await req('/api/catalog');assert.equal(response.status,200);assert.equal((await response.json()).products[0].title,shopA);
 response=await req('/api/projects',{method:'POST',body:{document:fixture}});assert.equal(response.status,201);
 const saved=await response.json();response=await req(`/api/projects/${saved.id}`,{shop:shopB});assert.equal(response.status,404);
 const raw=Buffer.from(JSON.stringify({shop_domain:shopA,myshopify_domain:shopA}));
 const mac=createHmac('sha256',secret).update(raw).digest('base64');
 response=await fetch(url+'/webhooks/shopify',{method:'POST',headers:{'x-shopify-hmac-sha256':mac,'x-shopify-shop-domain':shopA,'x-shopify-topic':'app/uninstalled'},body:raw});assert.equal(response.status,200);
 response=await req('/api/app/status');assert.equal((await response.json()).connected,false);
 response=await req('/api/projects');assert.deepEqual(await response.json(),{projects:[]});
});
