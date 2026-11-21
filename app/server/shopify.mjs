/** OAuth token exchange and read-only catalog calls. No browser ever receives tokens. */
import {validShop} from './auth.mjs';
export const SHOPIFY_API_VERSION='2026-10';
export async function exchangeOfflineToken({shop,idToken,apiKey,secret,fetchImpl=fetch}){
 if(!validShop(shop)||!idToken||!apiKey||!secret)throw Error('Invalid token exchange');
 const body=new URLSearchParams({
  client_id:apiKey,client_secret:secret,
  grant_type:'urn:ietf:params:oauth:grant-type:token-exchange',
  subject_token:idToken,subject_token_type:'urn:ietf:params:oauth:token-type:id_token',
  requested_token_type:'urn:shopify:params:oauth:token-type:offline-access-token',
  expiring:'0'
 });
 let response;
 try{response=await fetchImpl(`https://${shop}/admin/oauth/access_token`,{method:'POST',redirect:'error',signal:AbortSignal.timeout(9000),headers:{'content-type':'application/x-www-form-urlencoded'},body});}
 catch{const e=Error('Token exchange unavailable');e.status=502;throw e;}
 if(response.status===400||response.status===401){const e=Error('Session expired');e.status=401;throw e;}
 if(!response.ok){const e=Error('Shopify token exchange failed');e.status=502;throw e;}
 const data=await response.json();
 if(typeof data.access_token!=='string'||data.access_token.length<8||data.access_token.length>5000)throw Error('Invalid Shopify token response');
 return {accessToken:data.access_token,scope:String(data.scope||''),refreshToken:data.refresh_token||null,expiresAt:Number.isSafeInteger(data.expires_in)?Date.now()+data.expires_in*1000:null};
}
export async function getCatalog({shop,token,fetchImpl=fetch}){
 if(!validShop(shop)||typeof token!=='string'||token.length<8)throw Error('Invalid store connection');
 let response;
 try{response=await fetchImpl(`https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`,{method:'POST',redirect:'error',signal:AbortSignal.timeout(9000),headers:{'x-shopify-access-token':token,'content-type':'application/json'},body:JSON.stringify({query:'query StoreCanvasCatalog { products(first: 12) { nodes { id title handle status featuredImage { url altText } } } }'})});}
 catch{const e=Error('Catalog temporarily unavailable');e.status=502;throw e;}
 if(response.status===401||response.status===403){const e=Error('Shopify connection needs authorization');e.status=401;throw e;}
 if(!response.ok){const e=Error('Catalog unavailable');e.status=502;throw e;}
 const payload=await response.json();
 if(payload.errors?.length){const e=Error('Shopify rejected catalog query');e.status=502;throw e;}
 const products=payload.data?.products?.nodes;
 if(!Array.isArray(products)){const e=Error('Invalid Shopify catalog response');e.status=502;throw e;}
 return products.map(p=>({id:String(p.id||'').slice(0,100),title:String(p.title||'').slice(0,250),handle:String(p.handle||'').slice(0,250),status:String(p.status||'').slice(0,20),image:p.featuredImage?.url||null}));
}
