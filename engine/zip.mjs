/** Small deterministic ZIP store writer (no compression, no external packages). */
const te=new TextEncoder();const buf=x=>x instanceof Uint8Array?x:te.encode(String(x));
function crc32(bytes){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}return(crc^0xffffffff)>>>0;}
export function themeZip(files){if(!(files instanceof Map)||files.size===0)throw Error('No ZIP files');if(files.size>500)throw Error('Too many ZIP files');
 const chunks=[],central=[];let offset=0,count=0;const view=(a)=>new DataView(a.buffer,a.byteOffset,a.byteLength);
 for(const [name,value] of files){if(typeof name!=='string'||!/^(assets|layout|sections|templates|config|locales)\/[a-z0-9_.\/-]+$/i.test(name)||name.includes('..'))throw Error('Invalid ZIP entry path');
 const nameBytes=te.encode(name),data=buf(value);if(data.length>6_000_000)throw Error('ZIP file too large');const crc=crc32(data);
 const local=new Uint8Array(30+nameBytes.length),l=view(local);l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x0800,true);l.setUint32(14,crc,true);l.setUint32(18,data.length,true);l.setUint32(22,data.length,true);l.setUint16(26,nameBytes.length,true);local.set(nameBytes,30);
 const dir=new Uint8Array(46+nameBytes.length),d=view(dir);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x0800,true);d.setUint32(16,crc,true);d.setUint32(20,data.length,true);d.setUint32(24,data.length,true);d.setUint16(28,nameBytes.length,true);d.setUint32(42,offset,true);dir.set(nameBytes,46);
 chunks.push(local,data);central.push(dir);offset+=local.length+data.length;count++;
 }
 const size=central.reduce((n,b)=>n+b.length,0);const end=new Uint8Array(22),e=view(end);e.setUint32(0,0x06054b50,true);e.setUint16(8,count,true);e.setUint16(10,count,true);e.setUint32(12,size,true);e.setUint32(16,offset,true);
 return new Blob([...chunks,...central,end],{type:'application/zip'});
}
