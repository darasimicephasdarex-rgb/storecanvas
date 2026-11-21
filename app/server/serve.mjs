import {createAppServer} from './http.mjs';
const port=Number(process.env.PORT||8787),host=process.env.HOST||'127.0.0.1';
if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid port');
const server=createAppServer();
server.listen(port,host,()=>{console.log(`StoreCanvas development API listening on ${host}:${port}; protect with HTTPS before hosting`);});
