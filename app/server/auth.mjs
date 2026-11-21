/** Shopify signed ID-token and raw webhook HMAC verification.
 * This module accepts no shop identity from user-supplied routes or request bodies.
 */
import {createHmac, timingSafeEqual} from 'node:crypto';

const SHOP = /^[a-z0-9][a-z0-9-]{0,62}\.myshopify\.com$/;
export function validShop(value){return typeof value === 'string' && SHOP.test(value) && !value.includes('--');}
function same(a,b){
 const x=Buffer.isBuffer(a)?a:Buffer.from(a??'');
 const y=Buffer.isBuffer(b)?b:Buffer.from(b??'');
 return x.length===y.length && timingSafeEqual(x,y);
}
function decodePart(part){
 if(!/^[A-Za-z0-9_-]+$/.test(part)||part.length>8192)throw Error('Malformed ID token');
 return JSON.parse(Buffer.from(part,'base64url').toString('utf8'));
}
export function verifyShopifyIdToken(token,{apiKey,secret,now=Math.floor(Date.now()/1000)}={}){
 if(typeof token!=='string'||token.length>12000||!apiKey||!secret)throw Error('Unauthorized');
 const parts=token.split('.');if(parts.length!==3)throw Error('Unauthorized');
 let header,claims;
 try{header=decodePart(parts[0]);claims=decodePart(parts[1]);}catch{throw Error('Unauthorized');}
 if(header?.alg!=='HS256'||(header.typ&&header.typ!=='JWT')||!claims||typeof claims!=='object')throw Error('Unauthorized');
 const signature=createHmac('sha256',secret).update(parts[0]+'.'+parts[1]).digest();
 let submitted;try{submitted=Buffer.from(parts[2],'base64url');}catch{throw Error('Unauthorized');}
 if(!same(signature,submitted))throw Error('Unauthorized');
 if(!((typeof claims.aud==='string'&&claims.aud===apiKey)||(Array.isArray(claims.aud)&&claims.aud.includes(apiKey))))throw Error('Unauthorized');
 if(!Number.isSafeInteger(claims.exp)||claims.exp<=now)throw Error('Unauthorized');
 if(!Number.isSafeInteger(claims.nbf)||claims.nbf>now+5)throw Error('Unauthorized');
 if(!Number.isSafeInteger(claims.iat)||claims.iat>now+5||now-claims.iat>600||claims.exp-claims.iat>600)throw Error('Unauthorized');
 let dest,issuer;
 try{dest=new URL(claims.dest);issuer=new URL(claims.iss);}catch{throw Error('Unauthorized');}
 if(dest.protocol!=='https:'||issuer.protocol!=='https:'||dest.username||dest.password||issuer.username||issuer.password||dest.port||issuer.port)throw Error('Unauthorized');
 const shop=dest.hostname.toLowerCase();
 if(!validShop(shop)||issuer.hostname.toLowerCase()!==shop||issuer.pathname!=='/admin')throw Error('Unauthorized');
 return Object.freeze({shop,subject:typeof claims.sub==='string'?claims.sub:null});
}
export function verifyWebhookHmac(rawBody,signature,secret){
 if(!secret||!Buffer.isBuffer(rawBody)||typeof signature!=='string'||!/^[A-Za-z0-9+/]{43}=$/.test(signature))return false;
 const digest=createHmac('sha256',secret).update(rawBody).digest('base64');
 return same(Buffer.from(digest,'utf8'),Buffer.from(signature,'utf8'));
}
