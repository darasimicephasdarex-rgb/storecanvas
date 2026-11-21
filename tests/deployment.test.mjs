import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {resolveDeploymentConfig,verifyPersistentDirectory} from '../app/server/deployment.mjs';
const base={SHOPIFY_API_KEY:'test-id',SHOPIFY_API_SECRET:'test-secret',STORECANVAS_STORAGE_KEY:randomBytes(32).toString('hex')};
test('production fails closed without attached persistent volume',()=>{
 assert.throws(()=>resolveDeploymentConfig({...base,NODE_ENV:'production'}),/persistent volume/);
 assert.throws(()=>resolveDeploymentConfig({...base,NODE_ENV:'production',RAILWAY_VOLUME_MOUNT_PATH:'relative/path'}),/persistent volume/);
});
test('production refuses ephemeral or outside mount data directories',()=>{
 const env={...base,NODE_ENV:'production',RAILWAY_VOLUME_MOUNT_PATH:'/data'};
 assert.throws(()=>resolveDeploymentConfig({...env,STORECANVAS_DATA_DIR:'/tmp/drafts'}),/inside the persistent volume/);
 assert.throws(()=>resolveDeploymentConfig({...env,STORECANVAS_DATA_DIR:'/data'}),/inside the persistent volume/);
 assert.throws(()=>resolveDeploymentConfig({...env,HOST:'127.0.0.1'}),/HOST/);
});
test('production accepts volume and binds to Railway port',()=>{
 const config=resolveDeploymentConfig({...base,NODE_ENV:'production',RAILWAY_VOLUME_MOUNT_PATH:'/data',PORT:'30123'});
 assert.equal(config.directory,'/data/storecanvas');assert.equal(config.host,'0.0.0.0');assert.equal(config.port,30123);
 assert.equal(config.key.length,32);
});
test('invalid secrets or Shopify placeholders are rejected',()=>{
 assert.throws(()=>resolveDeploymentConfig({...base,STORECANVAS_STORAGE_KEY:'00'}),/STORECANVAS_STORAGE_KEY/);
 assert.throws(()=>resolveDeploymentConfig({...base,SHOPIFY_API_KEY:'APP_CLIENT_ID_FROM_DEV_DASHBOARD'}),/Shopify API credentials/);
});
test('storage read/write readiness check verifies persistence directory',async(t)=>{
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'storecanvas-deploy-'));
 t.after(()=>fs.rm(root,{force:true,recursive:true}));
 const data=path.join(root,'persistent','storecanvas');await verifyPersistentDirectory(data);
 assert.deepEqual(await fs.readdir(data),[]);
});
