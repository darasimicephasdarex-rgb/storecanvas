import {createAppServer} from './http.mjs';
import {resolveDeploymentConfig,verifyPersistentDirectory} from './deployment.mjs';

const config=resolveDeploymentConfig();
await verifyPersistentDirectory(config.directory);
const server=createAppServer({directory:config.directory,key:config.key.toString('hex'),apiKey:config.apiKey,secret:config.secret});
server.listen(config.port,config.host,()=>{
 console.log(`StoreCanvas app listening on ${config.host}:${config.port} (${config.production?'production single-instance':'development'} mode)`);
});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{
 server.close(error=>{if(error)console.error('Server shutdown failed');process.exit(error?1:0);});
});
