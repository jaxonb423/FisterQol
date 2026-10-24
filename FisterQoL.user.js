// ==UserScript==
// @name         Fister QoL — Browser
// @namespace    fister-qol.local
// @version      2.3.5
// @description  Quality-of-life mod for Fister: HUD, crosshair, camera, audio, performance, clips, music, outfits, pets, custom themes, the Track Day, macOS-style, Notebook Club and Pixel Quest themes, a desktop buddy, Bad Translator and a clip editor QoL tab, all in the game's Settings.
// @match        https://fister.fun/*
// @match        https://www.fister.fun/*
// @exclude      https://fister.fun/assets/*
// @exclude      https://www.fister.fun/assets/*
// @run-at       document-start
// @sandbox      JavaScript
// @grant        GM_addElement
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @connect      raw.githubusercontent.com
// @connect      githubusercontent.com
// @connect      translate.googleapis.com
// @updateURL    https://raw.githubusercontent.com/jaxonb423/fisterqol/main/FisterQoL.user.js
// @downloadURL  https://raw.githubusercontent.com/jaxonb423/fisterqol/main/FisterQoL.user.js
// @noframes
// ==/UserScript==
(function(){
'use strict';
const window=typeof unsafeWindow!=='undefined'?unsafeWindow:globalThis;
const pageUrl=new URL(location.href);
if(pageUrl.pathname!=='/')return;
// Clear the old automatic fallback flag so an earlier failed install does not disable this update.
if(pageUrl.searchParams.get('qol')==='off'){pageUrl.searchParams.delete('qol');history.replaceState(history.state,'',pageUrl.href);}
if(window.__fisterQolBrowserLoading||window.__fisterRuntimeLoaded)return;
window.__fisterQolBrowserLoading=true;
// Bad Translator (QoL > Fun) reaches Google Translate through Tampermonkey, which the game page can't do itself.
// Only https://translate.googleapis.com is allowed through this bridge.
if(typeof GM_xmlhttpRequest==='function'&&!window.__fisterQolHttpGet){
 const qolHttpGet=(url,timeout)=>new Promise((resolve,reject)=>{let u;try{u=new URL(String(url));}catch{reject(Error('Bad URL'));return;}
  if(u.protocol!=='https:'||u.hostname!=='translate.googleapis.com'){reject(Error('Only Google Translate is allowed'));return;}
  GM_xmlhttpRequest({method:'GET',url:u.href,timeout:Math.min(60000,Number(timeout)||20000),anonymous:true,
   onload:r=>resolve({status:r.status,text:String(r.responseText||'')}),onerror:()=>resolve({status:0,text:'network error'}),ontimeout:()=>resolve({status:0,text:'timeout'})});});
 try{Object.defineProperty(window,'__fisterQolHttpGet',{value:qolHttpGet,configurable:false,writable:false});}catch{}
}
// The heavy parts (QoL runtime, JS parser, Bisty) live in a bundle on GitHub so this script stays small
// and Tampermonkey can inject it before the game starts. Downloaded once, checked against this fingerprint, then cached.
const QOL_BUNDLE={version:"2.3.5",sha256:"ca6a48bfeb186d6c87dea6d01ea8870ed038f17b877624fc5430cae803340c6c",url:"https://raw.githubusercontent.com/jaxonb423/fisterqol/main/dist/fisterqol-bundle-2.3.5-ca6a48bfeb.json"};
let RUNTIME='',IMG='';
function qolBundleDb(){return new Promise((res,rej)=>{const r=indexedDB.open('fister-qol-bundle',1);r.onupgradeneeded=()=>r.result.createObjectStore('b');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function qolBundleIdb(mode,fn){const db=await qolBundleDb();try{return await new Promise((res,rej)=>{const tx=db.transaction('b',mode),q=fn(tx.objectStore('b'));tx.oncomplete=()=>res(q&&q.result);tx.onerror=()=>rej(tx.error);});}finally{db.close();}}
function qolDownload(url){return new Promise((res,rej)=>{
 if(typeof GM_xmlhttpRequest!=='function'){fetch(url,{cache:'no-store'}).then(r=>r.ok?r.text():Promise.reject(Error('HTTP '+r.status))).then(res,rej);return;}
 GM_xmlhttpRequest({method:'GET',url,timeout:45000,headers:{'Cache-Control':'no-cache'},onload:r=>r.status>=200&&r.status<300?res(r.responseText):rej(Error('HTTP '+r.status+' from GitHub')),onerror:()=>rej(Error('network error')),ontimeout:()=>rej(Error('download timed out'))});});}
async function qolSha256(text){const d=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return Array.from(new Uint8Array(d),b=>b.toString(16).padStart(2,'0')).join('');}
let qolBundlePromise=null;
function qolBundle(){if(!qolBundlePromise)qolBundlePromise=(async()=>{
 let text=null;try{text=await qolBundleIdb('readonly',s=>s.get(QOL_BUNDLE.sha256));}catch{}
 if(typeof text!=='string'){window.__fisterQolLoadStatus='Fister QoL: downloading runtime '+QOL_BUNDLE.version+'...';
  text=await qolDownload(QOL_BUNDLE.url);
  if(await qolSha256(text)!==QOL_BUNDLE.sha256)throw Error('The FisterQoL runtime on GitHub does not match this script (fingerprint check failed). Install the script and runtime from the same release.');
  qolBundleIdb('readwrite',s=>{s.clear();return s.put(text,QOL_BUNDLE.sha256);}).catch(()=>{});}
 const b=JSON.parse(text);RUNTIME=b.runtime;IMG=b.bisty||'';
 // The parser runs as a page script: no eval, and GM_addElement gets it past the site's CSP.
 if(!window.__fisterParser){const src=b.parser+'\n;window.__fisterParser=__fisterParser;',host=document.head||document.documentElement;
  if(typeof GM_addElement==='function')GM_addElement(host,'script',{textContent:src});else{const s=document.createElement('script');s.textContent=src;host.appendChild(s);s.remove();}}
 if(!window.__fisterParser)throw Error('FisterQoL could not start its code parser.');
 return b;})();return qolBundlePromise;}
// If the runtime could not be loaded last time, play this launch without QoL and say why.
{let why=null;try{why=sessionStorage.getItem('fister-qol-skip');sessionStorage.removeItem('fister-qol-skip');}catch{}
 if(why!==null){window.__fisterQolBrowserLoading=false;const say=()=>{const box=document.createElement('div');box.id='fister-qol-notice';box.setAttribute('role','status');
   box.style.cssText='position:fixed;right:12px;bottom:12px;width:min(440px,90vw);padding:10px 12px;background:#c0c0c0;color:#111;border:2px outset #eee;font:13px Tahoma,Arial;z-index:2147483647';
   const p=document.createElement('p');p.style.margin='0 0 8px';p.textContent='FisterQoL could not load its runtime ('+why+'), so this launch is without QoL. It will try again next time you open Fister.';
   const ok=document.createElement('button');ok.textContent='OK';ok.onclick=()=>box.remove();box.append(p,ok);document.body.append(box);setTimeout(()=>box.remove(),25000);};
  if(document.body)say();else document.addEventListener('DOMContentLoaded',say,{once:true});return;}}
qolBundle().catch(()=>{});

function once(source,anchor,replacement){if(source.split(anchor).length!==2)throw Error('Unsupported client layout: '+anchor.slice(0,50));return source.replace(anchor,replacement);}
function absoluteImports(source,url){
 source=source.replace(/\bfrom\s*(["'`])(\.{1,2}\/[^"'`$]+)\1/g,(_all,quote,path)=>'from'+quote+new URL(path,url).href+quote);
 source=source.replace(/\bimport\(\s*(["'`])(\.{1,2}\/[^"'`$]+)\1\s*\)/g,(_all,quote,path)=>'import('+quote+new URL(path,url).href+quote+')');
 source=source.replace(/\bimport\s*(["'])(\.{1,2}\/[^"'$]+)\1/g,(_all,quote,path)=>'import '+quote+new URL(path,url).href+quote);
 return source.replace(/\bimport\.meta\.url\b/g,JSON.stringify(url));
}
// Decode only literal calls to the build's own string table. Tokenization keeps
// strings, regexes, comments, and shadowed property names intact.
function readableClient(source){
 const decoder=source.match(/function ([\w$]+)\(([\w$]+),[\w$]+\)\{return \2-=0,([\w$]+)\(\)\[\2\]\}/);
 if(!decoder)throw Error('Unsupported client string-table layout.');
 const tableStart=source.indexOf('function '+decoder[3]+'(){');
 const parseStart=source.indexOf('JSON.parse(`',tableStart);
 if(tableStart<0||parseStart<0)throw Error('Client string table not found.');
 const literal=window.__fisterParser.parseExpressionAt(source,parseStart+'JSON.parse('.length,{ecmaVersion:'latest'});
 // parseExpressionAt includes .replace(...); extract its template receiver.
 const template=literal.type==='CallExpression'&&literal.callee.type==='MemberExpression'?literal.callee.object:literal;
 if(template.type!=='TemplateLiteral'||template.expressions.length)throw Error('Unsupported client string table encoding.');
 const table=JSON.parse(template.quasis[0].value.cooked.replace(/[A-Za-z]/g,c=>String.fromCharCode(c.charCodeAt(0)+(c.toLowerCase()<='m'?13:-13))));
 const ast=window.__fisterParser.parse(source,{ecmaVersion:'latest',sourceType:'module',ranges:true});
 const scopes=window.__fisterParser.analyze(ast,{ecmaVersion:2022,sourceType:'module'});
 const variable=scopes.scopes.flatMap(s=>s.variables).find(v=>v.name===decoder[1]&&v.defs.some(d=>d.type==='FunctionName'&&d.node.start===source.indexOf(decoder[0])));
 if(!variable)throw Error('Cannot resolve client string decoder.');
 const edits=[];
 for(const ref of variable.references){
  const name=ref.identifier,call=source.slice(name.end,name.end+24).match(/^\((\d+)\)/);
  if(!call)continue;
  if(typeof table[Number(call[1])]!=='string')throw Error('Invalid client string-table index.');
  edits.push({start:name.start,end:name.end+call[0].length,text:JSON.stringify(table[Number(call[1])])});
 }
 edits.sort((a,b)=>a.start-b.start);
 let cursor=0;const chunks=[];for(const e of edits){chunks.push(source.slice(cursor,e.start),e.text);cursor=e.end;}chunks.push(source.slice(cursor));
 return chunks.join('');
}
function binding(source,pattern,label,group=1){
 const hits=Array.from(source.matchAll(new RegExp(pattern.source,pattern.flags.includes('g')?pattern.flags:pattern.flags+'g')));
 const values=[...new Set(hits.map(m=>m[group]))];
 if(values.length!==1)throw Error('Cannot identify native '+label+' ('+values.length+' matches).');
 return values[0];
}
function regexName(name){return name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function importBindings(source){
 return Array.from(source.matchAll(/import\{([^}]+)\}from["'`]([^"'`]+)["'`]/g)).map(m=>({path:m[2],names:Object.fromEntries(m[1].split(',').map(x=>x.trim().split(/\s+as\s+/)).map(([a,b])=>[a,b||a]))}));
}
function patchMain(raw,url){
 let source=readableClient(raw);
 // Required: without these the QoL settings tab cannot be built. Everything after them is optional:
 // when the game changes one of those spots, only that feature is switched off and the rest still loads.
 const jsx=binding(source,/function [\w$]+\(\{className:e,compact:t=!1,type:n=`button`,\.\.\.r\}\)\{return\(0,([\w$]+)\.jsx\)/,'JSX');
 const jsxPattern=regexName(jsx);
 const reactBlock=source.match(new RegExp('var ([\\w$]+)=([\\w$]+)\\(([\\w$]+)\\(\\),1\\),([\\w$]+)=([\\w$]+)\\(\\),([\\w$]+)=([\\w$]+)\\(\\),'+jsxPattern+'=([\\w$]+)\\(\\),'));
 if(!reactBlock)throw Error('Cannot identify native React modules.');
 const button=binding(source,/function ([\w$]+)\(\{className:e,compact:t=!1,type:n=`button`,\.\.\.r\}\)/,'Button');
 const group=binding(source,/function ([\w$]+)\(\{children:e,className:t,disabled:n,id:r,legend:i,style:a\}\)/,'Group');
 const checkbox=binding(source,/function [\w$]+\(\{className:e,defaultChecked:t,disabled:n,hint:r,id:i,label:a\}\)\{let o=\(0,[\w$]+\.jsx\)\(([\w$]+),/,'Checkbox');
 const imports=importBindings(source),controls=imports.find(i=>Object.values(i.names).includes(checkbox));
 if(!controls?.names.c||!controls.names.l)throw Error('Native slider/select bindings changed.');
 const panel=binding(source,/function ([\w$]+)\(\)\{return\(0,[\w$]+\.jsxs\)\(`div`,\{className:"settings-tab-content active",id:"settings-main"/,'General settings');
 const tabMatch=source.match(new RegExp('\\(0,'+jsxPattern+'\\.jsx\\)\\(([\\w$]+),\\{active:!0,dataTab:"settings-main",id:"settings-main-tab",title:"General"\\}\\)'));
 if(!tabMatch)throw Error('Native Settings tabs changed.');
 const call='(0,'+jsx+'.jsx)';
 const skipped=[];
 const opt=(label,fn)=>{try{return fn();}catch(error){skipped.push(label);return null;}};
 const optEdit=(label,fn)=>{try{const next=fn(source);if(typeof next==='string')source=next;}catch(error){skipped.push(label);}};
 const texture=opt('texture packs on blank surfaces',()=>binding(source,/import\{[^}]*\bDs as ([\w$]+)[,}]/,'Texture'));
 // The input manager is created right after the key-binding store: `bindings=f(),x=g(),input=null`.
 // Found by that shape and by f being an import, not by the bundle's one-letter export names.
 const imported=new Set(imports.flatMap(i=>Object.values(i.names)));
 const input=opt('input display',()=>{const found=new Set();
   for(const m of source.matchAll(/([\w$]+)=([\w$]+)\(\),[\w$]+=[\w$]+\(\),([\w$]+)=null/g))if(imported.has(m[2]))found.add(m[3]);
   // Newer builds have more than one store with that shape; keep the one the game fills with `new InputManager(...)`.
   if(found.size>1){const cls=source.match(/\{InputManager:([\w$]+)[,}]/)?.[1];
    const made=cls?[...source.matchAll(new RegExp('([\\w$]+)=new '+regexName(cls)+'\\(','g'))].map(m=>m[1]):[];
    const kept=[...found].filter(name=>made.some(v=>new RegExp('[,;({]'+regexName(name)+'='+regexName(v)+'[,;)]').test(source)));
    found.clear();for(const name of kept)found.add(name);}
   if(found.size!==1)throw Error('input manager');return [...found][0];});
 const pacer=opt('uncapped FPS counter',()=>binding(source,/([\w$]+)=class\{constructor\(e=0\)\{[^}]*`displayFrameMs`/,'frame pacer'));
 const scene=opt('game scene features',()=>binding(source,/([\w$]+)\.getCanvas\(\)/,'scene'));
 const sound=opt('sound features',()=>binding(source,/([\w$]+)\.getAudioStream\(\)/,'sound'));
 const quality=opt('graphics presets',()=>binding(source,/([\w$]+)\.set\(\{clipQuality:/,'quality'));
 const api=opt('game requests (using a fallback)',()=>{const m=imports.filter(i=>Object.keys(i.names).sort().join(',')==='n,r,s');if(m.length!==1)throw Error('api');return m[0].names.n;});
 const chat=opt('chat features',()=>binding(source,/new ([\w$]+)\(\{canSend:/,'chat'));
 const player=opt('player animations',()=>binding(source,/new ([\w$]+)\(a,i\.color,this\.scene,i\.username,i\.isAuthenticated,/,'player'));
 const native={CC:texture||'undefined',Jk:pacer||'undefined',Mk:checkbox,Ok:controls.names.c,Z:scene||'undefined',cP:reactBlock[4],fP:button,gP:group,jk:controls.names.l,lP:reactBlock[6],q:jsx,sP:reactBlock[1]};
 const mode=opt('clip overlays',()=>binding(source,/([\w$]+)=[\w$]+\.getItem\("fister-clip-recording-mode"\)/,'clip mode'));
 const clip=mode&&opt('clip overlays',()=>binding(source,/let n=([\w$]+),r=[\w$]+,i=\(async\(\)=>\{let e;try\{e=await [\w$]+\(\)\}/,'clip canvas'));
 optEdit('clip overlay settings',s=>once(s,'id:"clip-settings-group",legend:"Clips",children:[','id:"clip-settings-group",legend:"Clips",children:['+call+'(FisterClipOverlaySetting,{}),'));
 if(mode&&clip){
  optEdit('clip overlays',s=>once(s,'let a=e.start(n,i);','let a=e.start(fisterClipOverlays.recordingCanvas(n,'+mode+'),i);'));
  optEdit('clip overlays',s=>once(s,'e?.recording&&e.captureRenderedFrame()','e?.recording&&(e.canvas=fisterClipOverlays.recordingCanvas('+clip+','+mode+',e.activeProfile,e),e.captureRenderedFrame())'));}
 // Fight markers: let QoL hear the same combat events the game plays sounds for (parries, air kicks, punches, KOs).
 optEdit('fight markers',s=>{const i=s.indexOf('.onParrySuccess(');if(i<0)throw Error('fight');const f=s.lastIndexOf('function ',i);
  const m=s.slice(f,i).match(/^function [\w$]+\(([\w$]+),[\w$]+,[\w$]+\)\{/);if(!m||s.slice(i-m[1].length,i)!==m[1])throw Error('fight');
  return s.slice(0,f+m[0].length)+'try{fisterClipStudio.fight.watch('+m[1]+');}catch{}'+s.slice(f+m[0].length);});
 const tabs=[['qol','QoL']].map(([id,title])=>call+'('+tabMatch[1]+',{dataTab:"settings-'+id+'",id:"settings-'+id+'-tab",title:'+JSON.stringify(title)+'})');
 source=once(source,tabMatch[0],tabMatch[0]+','+tabs.join(','));
 source=once(source,call+'('+panel+',{})',["FisterQolHub",panel].map(p=>call+'('+p+',{})').join(','));
 optEdit('reward reel',s=>{const f=s.match(/\.then\(\(\{LevelRewardChoice:([\w$]+)\}\)=>/);if(!f)throw Error('reward');
  s=once(s,f[0],f[0]+'(fisterFun.attach('+f[1]+'),');const start=s.indexOf(f[0]),end=s.indexOf(').finally(',start);if(end<0)throw Error('reward end');return s.slice(0,end)+')'+s.slice(end);});
 // Official servers deliver round phases through their player-state stream.
 optEdit('round-end message',s=>{if(!/onRoundEnd:([\w$]+)=>\{/.test(s))throw Error('round');
  s=s.replace(/window\.__updateModPlayerList&&window\.__updateModPlayerList\(([\w$]+)\);/g,'fisterRoundMessage.observe($1);$&');
  s=s.replace(/onRoundEnd:([\w$]+)=>\{/g,'onRoundEnd:$1=>{fisterRoundMessage.end();');
  s=s.replace(/onMatchEnd:([\w$]+)=>\{/g,'onMatchEnd:$1=>{fisterRoundMessage.end();');
  s=s.replace(/onRoundStart:\(\)=>\{/g,'onRoundStart:()=>{fisterRoundMessage.start();');
  return s.replace(/onGameStart:(?:([\w$]+)|\(\))=>\{/g,match=>match+'fisterRoundMessage.start();');});
 for(const re of [/([\w$]+)\(c,l,\{fontWeight:"bold"\}\)/,/className="singleplayer-board-player",r\.innerHTML=([\w$]+)\(e\.username,/])
  optEdit('staff tags',s=>{const name=binding(s,re,'staff names');return s.replace(new RegExp('(?<![\\w$])'+regexName(name)+'\\(','g'),'fisterQol.staffName('+name+',');});
 // Use direct dynamic imports instead of Vite's preload graph, which can hang on obsolete or stalled files after deploys.
 // Lazily loaded windows (Clips, the store...) still bring their own stylesheet, so add those, waiting at most 4 s.
 optEdit('faster module loading',s=>{const preload=binding(s,/([\w$]+)\(\(\)=>import\(/,'module preload helper');
  if(!imports.find(i=>i.names.t===preload))throw Error('preload');s=once(s,'t as '+preload+'}','t as __fisterUnusedPreload}');return 'var '+preload+'=(factory,deps)=>{const have=new Set([...document.querySelectorAll("link[rel=stylesheet]")].map(l=>l.href));'+'const css=(Array.isArray(deps)?deps:[]).filter(d=>/\\.css(?:[?#]|$)/.test(d)).map(d=>new URL(d,location.origin+"/").href).filter(h=>!have.has(h));'+'return Promise.all(css.map(h=>new Promise(r=>{const l=document.createElement("link");l.rel="stylesheet";l.href=h;l.onload=l.onerror=()=>r();document.head.appendChild(l);setTimeout(r,4000);}))).then(()=>factory());};\n'+s;});
 const threeHome=imports.find(i=>texture&&Object.values(i.names).includes(texture))||imports[0];
 const unique=[...new Set(skipped)];
 const bridge='var __fisterNative={'+Object.entries(native).map(([key,value])=>'get '+key+'(){return '+value+';}').join(',')+',get threeUrl(){return '+JSON.stringify(threeHome?new URL(threeHome.path,url).href:'')+';}'+',get moduleUrls(){return '+JSON.stringify([...new Set(imports.map(i=>new URL(i.path,url).href))])+';}'+',get skipped(){return '+JSON.stringify(unique)+';}'+'};\n';
 const v=x=>x||'undefined';
 const boot=';initializeFisterReact95();fisterThemes.start();fisterGlobalUI.start();fisterFun.start();fisterOverlays.start();fisterQol.boot(()=>({scene:'+v(scene)+',sound:'+v(sound)+',quality:'+v(quality)+',input:'+v(input)+',api:'+v(api)+',chatClass:'+v(chat)+',playerClass:'+v(player)+'}));globalThis.__fisterQolBrowserReady=true;\n';
 window.__fisterQolSkipped=unique.filter(x=>x!=='faster module loading'&&x!=='game requests (using a fallback)');
 return absoluteImports(bridge+RUNTIME+'\n'+source+'\n'+boot,url);
}
function bootstrapInfo(raw,url){
 const source=readableClient(raw),imports=importBindings(source);
 // The runtime import carries the full game dependency graph; preview/tool
 // imports have much smaller graphs. Require a unique largest graph.
 const candidates=Array.from(source.matchAll(/import\(\s*(["'`])(\.\/[^"'`]+\.js)\1\s*\),[\w$]+\(\[([\d,]+)\]\)/g)).map(m=>({path:m[2],count:m[3].split(',').length})).sort((a,b)=>b.count-a.count);
 if(!candidates.length||candidates[0].count===candidates[1]?.count)throw Error('Cannot identify the game runtime import.');
 // These exports prepare the DOM and loading state, independent of bundle names.
 const replaceChildren=binding(source,/([\w$]+)="replaceChildren"/,'DOM replacement helper');
 const guardName=binding(source,new RegExp('\\['+regexName(replaceChildren)+'\\]\\([^)]*\\),([\\w$]+)\\('),'DOM guard');
 const bootName=binding(source,/\(([\w$]+)\(\),[\w$]+\(\(\)=>import\(/,'boot preparation');
 const guards=imports.filter(i=>i.names.n===guardName),preparations=imports.filter(i=>i.names.t===bootName);
 const guard=guards[0],prepare=preparations[0];
 if(guards.length!==1||preparations.length!==1)throw Error('Cannot identify native loading helpers.');
 const filesMatch=source.match(/m\.f=\[(.*?)\]/s);
 const files=filesMatch?JSON.parse('['+filesMatch[1]+']'):[];
 const html=binding(source,/(["'`])(\/runtime-ui\.html[^"'`]*?)\1/,'runtime UI',2);
 const versions=Array.from(source.matchAll(/encodeURIComponent\("([^"\n]+)"\)/g));
 const version=versions.find(m=>/^[a-f\d]+:\d+$/.test(m[1]))?.[1];
 return {mainUrl:new URL(candidates[0].path,url).href,guardUrl:new URL(guard.path,url).href,bootUrl:new URL(prepare.path,url).href,files,htmlUrl:new URL(html+(html.includes('?')?'':'?v=')+(version?encodeURIComponent(version):''),url).href};
}

// Patched-module cache: the game's main bundle URL is content-hashed, so a patch made for it stays valid
// until the game updates. Keyed by script version + runtime size + bundle URL; only the newest entry is kept.
const QOL_CACHE_DB='fister-qol-patch-cache',QOL_CACHE_STORE='patched',QOL_CACHE_VER='2.1:'+QOL_BUNDLE.sha256.slice(0,16);
function qolCacheDb(){return new Promise((res,rej)=>{const r=indexedDB.open(QOL_CACHE_DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(QOL_CACHE_STORE);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function qolCacheGet(key){const db=await qolCacheDb();try{return await new Promise((res,rej)=>{const q=db.transaction(QOL_CACHE_STORE,'readonly').objectStore(QOL_CACHE_STORE).get(key);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}finally{db.close();}}
async function qolCachePut(key,value){const db=await qolCacheDb();try{await new Promise((res,rej)=>{const tx=db.transaction(QOL_CACHE_STORE,'readwrite'),st=tx.objectStore(QOL_CACHE_STORE);st.clear();st.put(value,key);tx.oncomplete=res;tx.onerror=()=>rej(tx.error);});}finally{db.close();}}
async function qolCacheClear(){try{const db=await qolCacheDb();try{await new Promise(res=>{const tx=db.transaction(QOL_CACHE_STORE,'readwrite');tx.objectStore(QOL_CACHE_STORE).clear();tx.oncomplete=res;tx.onerror=res;});}finally{db.close();}}catch{}}
async function getText(url){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{const r=await fetch(url,{credentials:'include',cache:'no-store',signal:controller.signal});if(!r.ok)throw Error('Could not load client ('+r.status+')');return await r.text();}finally{clearTimeout(timer);}}
// Attach to the game's lazy runtime promise. Do not stop navigation or rebuild the page.
let mainPromise;
function phase(message){
 window.__fisterQolLoadStatus=message;
 const title=document.getElementById('game-loading-title');
 if(title)title.textContent=message;
}
function stock(error){
 phase('Fister QoL: '+String(error?.message||error));
 console.error('[Fister QoL Browser]',error);
 const show=()=>{
  document.getElementById('fister-qol-load-error')?.remove();
  const box=document.createElement('div');box.id='fister-qol-load-error';
  box.style.cssText='position:fixed;left:50%;top:25%;transform:translateX(-50%);width:min(520px,85vw);padding:16px;background:#c0c0c0;color:#111;border:2px outset #eee;font:14px Tahoma,Arial;z-index:2147483647';
  const title=document.createElement('b');title.textContent=window.__fisterRuntimeLoaded?'Fister QoL compatibility notice':'Fister QoL loading error';
  const message=document.createElement('p');message.textContent=String(error?.message||error);
  const retry=document.createElement('button');retry.textContent='Reload';retry.onclick=()=>location.reload();
  const close=document.createElement('button');close.textContent='Close';close.onclick=()=>box.remove();box.append(title,message,retry,close);document.body.append(box);
 };
 if(document.body)show();else document.addEventListener('DOMContentLoaded',show,{once:true});
}
function notice(text){const show=()=>{document.getElementById('fister-qol-notice')?.remove();const box=document.createElement('div');box.id='fister-qol-notice';box.setAttribute('role','status');
 box.style.cssText='position:fixed;right:12px;bottom:12px;width:min(420px,90vw);padding:10px 12px;background:#c0c0c0;color:#111;border:2px outset #eee;font:13px Tahoma,Arial;z-index:2147483647';
 const p=document.createElement('p');p.style.margin='0 0 8px';p.textContent=text;const close=document.createElement('button');close.textContent='OK';close.onclick=()=>box.remove();box.append(p,close);document.body.append(box);setTimeout(()=>box.remove(),20000);};
 if(document.body)show();else document.addEventListener('DOMContentLoaded',show,{once:true});}
async function loadNativeRuntime(){
 if(document.readyState==='loading')await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));
 await new Promise(resolve=>requestAnimationFrame(resolve));
 try{phase('Loading Fister QoL: loading runtime...');await qolBundle();}catch(error){
  const why=String(error?.message||error);console.error('[Fister QoL] runtime bundle failed',error);phase('Fister QoL: '+why+' Restarting without QoL...');
  try{sessionStorage.setItem('fister-qol-skip',why);}catch{}setTimeout(()=>location.reload(),1200);await new Promise(()=>{});}
 phase('Loading Fister QoL: discovering game client...');
 const entry=Array.from(document.querySelectorAll('script[type=module][src]')).find(el=>new URL(el.src,location.href).pathname.startsWith('/assets/'));
 if(!entry)throw Error('The native game bootstrap was not found.');
 const entryUrl=new URL(entry.src,location.href).href;
 const entrySource=await getText(entryUrl);
 const info=bootstrapInfo(entrySource,entryUrl);
 let patched=null,fromCache=false;const cacheKey=QOL_CACHE_VER+'|'+info.mainUrl;
 try{const hit=await qolCacheGet(cacheKey);if(hit&&typeof hit.source==='string'){patched=hit.source;fromCache=true;window.__fisterQolSkipped=hit.skipped||[];}}catch{}
 if(!patched)try{patched=patchMain(await getText(info.mainUrl),info.mainUrl);qolCachePut(cacheKey,{source:patched,skipped:window.__fisterQolSkipped||[],at:Date.now()}).catch(()=>{});}
 catch(error){
  // No game module has run yet: safe to use the original module instead.
  console.warn('[Fister QoL] Compatibility check failed; starting the original game.',error);
  window.__fisterQolCompatibilityError=String(error?.message||error);
 }
 phase(patched?'Loading Fister QoL: preparing settings...':'Loading game: QoL needs a compatibility update...');
 const root=document.getElementById('runtime-ui-root');
 if(root&&root.dataset.loaded!=='1'){
  const html=await getText(info.htmlUrl);
  const template=document.createElement('template');template.innerHTML=html;
  root.replaceChildren(template.content);root.dataset.loaded='1';
 }
 window.__fisterRuntimeDomLoaded=true;
 for(const file of info.files.filter(file=>file.endsWith('.css'))){
  const href=new URL('/'+file,location.origin).href;
  if(!Array.from(document.querySelectorAll('link[href]')).some(link=>link.href===href)){
   const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.appendChild(link);
  }
 }
 phase(patched?'Loading Fister QoL: starting game...':'Starting game without incompatible QoL hooks...');
 return await new Promise((resolve,reject)=>{
  const fail=error=>{if(fromCache)qolCacheClear();clearTimeout(timer);window.removeEventListener('unhandledrejection',onRejection);reject(error instanceof Error?error:Error(String(error?.message||error)));};
  const onRejection=event=>fail(event.reason||Error('A game dependency failed during startup.'));
  const timer=setTimeout(()=>fail(Error('Game initialization timed out while loading renderer/dependencies. Reload to retry.')),45000);
  window.addEventListener('unhandledrejection',onRejection);
  window.__fisterQolMainResolve=()=>{
   clearTimeout(timer);window.removeEventListener('unhandledrejection',onRejection);
   document.getElementById('fister-qol-load-error')?.remove();
   window.__fisterRuntimeLoaded=true;phase(patched?'Fister QoL ready':'Game ready; QoL compatibility update needed');
   if(!patched)stock(Error('The game loaded normally. QoL could not match this build: '+window.__fisterQolCompatibilityError));
   else if((window.__fisterQolSkipped||[]).length)notice('FisterQoL is running, but this game update changed a few spots, so these are off until the next QoL update: '+window.__fisterQolSkipped.join(', ')+'.');
   resolve({});
  };
  const script=document.createElement('script');script.type='module';script.id='fister-qol-native-module';
  script.textContent='import {n as __qolGuard} from '+JSON.stringify(info.guardUrl)+';\n'+
   'import {t as __qolPrepareBoot} from '+JSON.stringify(info.bootUrl)+';\n'+
   '__qolPrepareBoot();__qolGuard(document.getElementById("runtime-ui-root")||document);\n'+
   (patched||'await import('+JSON.stringify(info.mainUrl)+');')+'\n;globalThis.__fisterQolMainResolve();\n';
  script.onerror=()=>fail(Error('Game module initialization failed. Check for a failed asset or renderer.')); 
  if(typeof window.__fisterQolStageModule==='function'){const moduleSource=script.textContent;script.textContent='';window.__fisterQolStageModule(moduleSource).then(url=>{script.src=url;document.head.appendChild(script);}).catch(fail);}else if(typeof GM_addElement==='function'){GM_addElement(document.head,'script',{type:'module',id:script.id,textContent:script.textContent});}else document.head.appendChild(script);
 });
}

// Bisty: FisterQoL's grumpy stand-in for Fisty on the loading screen. He gives QoL tips.
// Lives in the loader so he can appear before the game (and the rest of QoL) has loaded.
(function(){
const TIPS=["You can turn on the FPS counter in QoL > Optimization. Like your device is THAT good.", "Low graphics mode is in QoL > Optimization. Your computer has been begging me to tell you.", "Press F2 while typing in chat for emojis. Use your words. Or don't, apparently.", "Type :approve-fister: in chat. I don't approve. But you can.", "Pets follow you around in matches. Pick one from Pets in your Loadout. Someone has to keep an eye on you.", "Your whole outfit can be copied as one code. Yes. Even that outfit.", "Make your own look with the Theme creator in QoL > Customization. Go on. Show me your \"design skills\".", "Ctrl+Shift+F9 turns custom themes off. For when your masterpiece eats the menu.", "Profiles save all your settings at once. So when it all goes wrong, it's not my fault.", "You can turn down camera shake in QoL. I can't watch you get dizzy again.", "Speed lines can be hidden. You're not going THAT fast.", "QoL overlays can be recorded in your clips. Now everyone gets to see your inputs. Bold.", "The music player in QoL > Music plays your own songs. Please. Not that song again.", "Team outlines show where your teammates are. They've been wondering where you went.", "There's a search box for every setting at the bottom of the settings menu. Scrolling is so last update.", "Texture packs can reskin the maps. The maps were fine. But sure.", "Import your own animations in QoL > Animations. Fister's moves weren't good enough for you?", "Custom overlays put your own images and GIFs on screen. Because the screen wasn't busy enough.", "UI size is adjustable in QoL. Squinting is not a strategy.", "The input display shows your keys on screen. Proof that you were, in fact, pressing buttons.", "Set a message to send when a round ends. \"gg\" works. You could even mean it.", "Staff tags show who the real staff are. Changing your name colour doesn't count. Nice try.", "QoL > Fun has a slot-machine reveal for level-up rewards. It's free. Don't get ideas.", "Click a settings section's title to fold it away. A tidy menu. Imagine that.", "Choppy animations make everyone move like a flipbook. On purpose, this time.", "Reduce cosmetic effects if your screen is all sparkle and no Fister.", "The custom crosshair can be a dot, a ring, or your own GIF. It won't aim for you. I checked.", "Fister emotes like :dodgeball: and :piston: work in chat for anyone with FisterQoL. Everyone else just sees you typing colons.", "I'm Bisty. Fisty's on break. Here's your tip: Low graphics mode. You're welcome.", "You can turn me off in QoL > Fun. Not that I'd notice. Or care. At all."],KEY='fister-qol-bisty-v1';
function mode(){try{return JSON.parse(localStorage.getItem(KEY)||'{}').mode||'sometimes';}catch{return 'sometimes';}}
function tip(){let last=-1;try{last=Number(localStorage.getItem(KEY+':last'));}catch{}let i=Math.floor(Math.random()*TIPS.length);if(i===last)i=(i+1)%TIPS.length;try{localStorage.setItem(KEY+':last',String(i));}catch{}return TIPS[i];}
function style(){if(document.getElementById('fq-bisty-style'))return;const st=document.createElement('style');st.id='fq-bisty-style';st.textContent=`
.fq-bisty{position:absolute;z-index:50;pointer-events:none}
.fq-bisty>img{display:block;height:100%;width:auto;transform-origin:50% 100%;animation:fqBistyIn .5s cubic-bezier(.2,1.5,.4,1) both,fqBistyHuff 2.6s ease-in-out .7s infinite}
.fq-bisty.fixed{position:fixed;right:max(24px,env(safe-area-inset-right,0px));bottom:max(24px,env(safe-area-inset-bottom,0px));height:min(34vh,300px)}
/* BonziBuddy-style balloon: pale yellow, thin black outline, grey drop edge, skinny tail */
.fq-bisty-bubble{position:absolute;bottom:calc(100% + 18px);left:var(--fq-bx,0px);width:max-content;max-width:min(300px,calc(100vw - 24px));box-sizing:border-box;
 background:#ffffe1;color:#000;border:1px solid #000;border-radius:11px;padding:9px 12px 10px;font:15px/1.3 Arial,Helvetica,sans-serif;box-shadow:2px 2px 0 #9a9a9a;
 animation:fqBistyPop .25s ease-out .45s both;transform-origin:var(--fq-tx,30px) 100%}
.fq-bisty-bubble svg{position:absolute;top:100%;left:var(--fq-tx,30px);margin-top:-1px;overflow:visible}
@keyframes fqBistyIn{0%{transform:translateY(30%) scaleY(.6);opacity:0}100%{transform:none;opacity:1}}
@keyframes fqBistyHuff{0%,100%{transform:none}8%{transform:translateY(-3%) rotate(-3deg)}16%{transform:translateY(0) rotate(2deg)}22%{transform:none}}
@keyframes fqBistyPop{0%{transform:scale(.4);opacity:0}100%{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.fq-bisty>img,.fq-bisty-bubble{animation:none}}`;(document.head||document.documentElement).appendChild(st);}
function build(text){style();const el=document.createElement('div');el.className='fq-bisty';el.setAttribute('role','status');el.setAttribute('data-fq-no-emotes','');el.setAttribute('aria-label','Bisty says');
 const im=document.createElement('img');im.src=IMG;im.alt='Bisty';im.draggable=false;
 const bubble=document.createElement('div');bubble.className='fq-bisty-bubble';const t=document.createElement('span');t.textContent=text;
 // tail: filled wedge, outlined on its two long sides only, overlapping the balloon's edge by 1px
 bubble.innerHTML='<svg width="18" height="20" viewBox="0 0 18 20" aria-hidden="true"><path d="M1 0 L13 19 L10 0 Z" fill="#ffffe1"/><path d="M1 0 L13 19 L10 0" fill="none" stroke="#000" stroke-width="1"/><path d="M1.5 0.5 L2.5 2 L10 2 L10 0.5 Z" fill="#ffffe1"/></svg>';
 bubble.prepend(t);el.append(bubble,im);
 // keep the balloon on screen: shift it sideways and move the tail so it still points at Bisty's head
 el.fit=()=>{const ir=im.getBoundingClientRect();if(!ir.width)return;const w=bubble.offsetWidth,head=ir.left+ir.width*.42;
  let left=head-w*.28;left=Math.max(10,Math.min(innerWidth-w-12,left));const er=el.getBoundingClientRect();
  el.style.setProperty('--fq-bx',(left-er.left)+'px');el.style.setProperty('--fq-tx',Math.max(14,Math.min(w-30,head-left-12))+'px');};
 el.setText=s=>{t.textContent=s;el.fit();};
 if(im.complete&&im.naturalWidth)requestAnimationFrame(el.fit);else im.addEventListener('load',()=>requestAnimationFrame(el.fit),{once:true});
 addEventListener('resize',()=>el.isConnected&&el.fit());return el;}
const visible=e=>{if(!e||!e.isConnected)return false;const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&r.width>0&&r.height>0;};
const area=e=>{const r=e.getBoundingClientRect();return r.width*r.height;};
function find(){const title=document.getElementById('game-loading-title');if(!visible(title))return null;
 let box=title.parentElement;for(let e=title.parentElement;e&&e!==document.documentElement;e=e.parentElement){const r=e.getBoundingClientRect();if(r.width>=innerWidth*.6&&r.height>=innerHeight*.6){box=e;break;}}
 const boxArea=area(box),seen=new Set(),cands=[];
 const add=e=>{if(seen.has(e)||e.closest('.fq-bisty')||e.contains(title)||!visible(e))return;const a=area(e);if(a<1600||a>boxArea*.45)return;seen.add(e);cands.push(e);};
 box.querySelectorAll('img,canvas,svg,video,picture').forEach(add);
 let n=0;for(const e of box.querySelectorAll('div,span,i,figure,b')){if(++n>400)break;const bg=getComputedStyle(e).backgroundImage;if(bg&&bg!=='none'&&bg.includes('url('))add(e);}
 const label=e=>[e.id,typeof e.className==='string'?e.className:e.className&&e.className.baseVal,e.getAttribute('src'),e.getAttribute('alt'),getComputedStyle(e).backgroundImage].join(' ');
 const mascot=cands.find(e=>/fisty|mascot|character|loading-?(char|art|img|guy)/i.test(label(e)))||cands.sort((a,b)=>area(b)-area(a))[0]||null;
 const tipEl=[...box.querySelectorAll('[id*="tip" i],[class*="tip" i],[id*="hint" i],[class*="hint" i]')].find(e=>e!==title&&!e.closest('.fq-bisty')&&visible(e)&&e.textContent.trim().length>6&&e.children.length<4)||null;
 return {box,title,mascot,tipEl};}
let shown=null;
function place(f){const el=build(tip()),br=f.box.getBoundingClientRect();
 if(getComputedStyle(f.box).position==='static')f.box.style.position='relative';
 if(f.mascot){const r=f.mascot.getBoundingClientRect(),h=Math.max(140,Math.min(r.height,innerHeight*.45));
  el.style.left=(r.left-br.left+f.box.scrollLeft)+'px';el.style.top=(r.bottom-h-br.top+f.box.scrollTop)+'px';el.style.height=h+'px';
  f.mascot.style.visibility='hidden';}
 else{el.style.right='6%';el.style.bottom='5%';el.style.height=Math.min(innerHeight*.34,300)+'px';}
 if(f.tipEl)f.tipEl.style.visibility='hidden';
 f.box.appendChild(el);shown={el,f};
 // a new tip whenever the game reuses the loading screen
 let lastSwap=Date.now();new MutationObserver(()=>{if(Date.now()-lastSwap>4000&&visible(f.title)){lastSwap=Date.now();el.setText(tip());}}).observe(f.title,{childList:true,characterData:true,subtree:true});}
function start(){qolBundle().then(()=>{if(IMG)startNow();}).catch(()=>{});}
function startNow(){const m=mode();if(m==='off'||(m==='sometimes'&&Math.random()>=1/3))return;
 const t0=Date.now();const tick=()=>{if(shown)return;const f=find();
  if(f&&(f.mascot||Date.now()-t0>2500)){place(f);return;}
  if(Date.now()-t0<12000)setTimeout(tick,150);};tick();}
// QoL > Fun uses this to preview him and to change how often he shows up.
window.__fisterQolBisty={get mode(){return mode();},set mode(v){try{localStorage.setItem(KEY,JSON.stringify({mode:v}));}catch{}},
 preview(){if(!IMG)return;document.querySelectorAll('.fq-bisty.fixed').forEach(e=>e.remove());const el=build(tip());el.classList.add('fixed');document.body.appendChild(el);setTimeout(()=>el.remove(),9000);}};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();

// The native bootstrap only reads this promise when it starts loading the game.
// Returning it lets the game's existing loading UI and click replay remain in charge.
const qolBoot={
 get(){
  try{sessionStorage.removeItem('fister-qol-race');}catch{}
  if(!mainPromise)mainPromise=loadNativeRuntime().catch(error=>{if(!document.getElementById('fister-qol-native-module'))Object.defineProperty(window,'__fisterRuntimeBootPromise',{configurable:true,writable:true,value:undefined});stock(error);throw error;});
  return mainPromise;
 },
 set(value){if(value==null)mainPromise=undefined;else mainPromise=value;}
};
if(window.__fisterQolEarlyHook&&typeof window.__fisterQolEarlyHook.attach==='function'){
 // The early-hook script got there first and is holding the game for us.
 window.__fisterQolEarlyHook.attach(qolBoot);
}else{
 if(window.__fisterRuntimeBootPromise){
  let tries=0;try{tries=Number(sessionStorage.getItem('fister-qol-race'))||0;}catch{}
  if(tries<2){try{sessionStorage.setItem('fister-qol-race',String(tries+1));}catch{}console.warn('[Fister QoL] The game started first; reloading so QoL can hook in ('+(tries+1)+'/2).');location.reload();return;}
  try{sessionStorage.removeItem('fister-qol-race');}catch{}
  stock(Error('The game keeps starting before FisterQoL can hook in. Install the small "FisterQoL — Early hook" script that comes with FisterQoL (keep both enabled), then reload.'));
  return;
 }
 Object.defineProperty(window,'__fisterRuntimeBootPromise',{configurable:true,get:qolBoot.get,set:qolBoot.set});
}
})();
