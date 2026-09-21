export const BUILDER_THREE_RUNTIME_PATH = "/builder-runtime/sandu-three-0.169.0.min.js";

const THREE_MAIN_SPECIFIERS = new Set([
  "three",
  "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js",
  "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js",
  "https://cdn.jsdelivr.net/npm/three@0.169.0/+esm",
]);
const THREE_ADDON_SPECIFIERS = new Set([
  "three/addons/controls/OrbitControls.js",
  "three/examples/jsm/controls/OrbitControls.js",
  "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/controls/OrbitControls.js",
  "three/addons/loaders/GLTFLoader.js",
  "three/examples/jsm/loaders/GLTFLoader.js",
  "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/loaders/GLTFLoader.js",
]);

function isBundledThreeSpecifier(specifier: string): boolean {
  return THREE_MAIN_SPECIFIERS.has(specifier) || THREE_ADDON_SPECIFIERS.has(specifier);
}

function namedBindings(bindings: string): string | null {
  const inner = bindings.trim().slice(1, -1).trim();
  if (!inner) return "";
  const entries = inner.split(",").map(item => {
    const match = item.trim().match(/^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/);
    if (!match) return null;
    return match[2] ? `${match[1]}: ${match[2]}` : match[1];
  });
  return entries.includes(null) ? null : entries.join(", ");
}

function rewriteThreeImports(source: string): string {
  const withoutImportMaps = source.replace(
    /<script\b[^>]*\btype=["']importmap["'][^>]*>[\s\S]*?<\/script\s*>/gi,
    "",
  );
  const withoutRuntimeTags = withoutImportMaps.replace(
    /<script\b([^>]*?)\bsrc=["']([^"']+)["']([^>]*)>\s*<\/script\s*>/gi,
    (tag, _before: string, specifier: string) => isBundledThreeSpecifier(specifier) ? "" : tag,
  );
  return withoutRuntimeTags.replace(
    /\bimport\s+(\*\s+as\s+[A-Za-z_$][\w$]*|\{[^}]*\})\s+from\s+(["'])([^"'\r\n]+)\2\s*;?/g,
    (statement, bindings: string, _quote: string, specifier: string) => {
      if (!isBundledThreeSpecifier(specifier)) return statement;
      const namespace = bindings.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)$/);
      if (namespace) return `const ${namespace[1]} = globalThis.THREE;`;
      const normalized = namedBindings(bindings);
      return normalized === null ? statement : `const { ${normalized} } = globalThis.THREE;`;
    },
  );
}

export function needsThreeRuntime(files: Record<string, string>): boolean {
  return Object.values(files).some(source => (
    /\bTHREE\b|\b(?:OrbitControls|GLTFLoader)\b/.test(source)
    || /(?:from\s*|src\s*=\s*)["'](?:three(?:\/|["'])|https:\/\/cdn\.jsdelivr\.net\/npm\/three@0\.169\.0\/)/.test(source)
  ));
}

/** Generated projects always run in an opaque-origin iframe, without application cookies. */
export function compilePreview(files: Record<string, string>, channel: string, threeRuntimeSource = ""): string {
  const previewFiles = threeRuntimeSource
    ? Object.fromEntries(Object.entries(files).map(([path, source]) => [path, /\.(?:html?|m?js)$/i.test(path) ? rewriteThreeImports(source) : source]))
    : files;
  let html = previewFiles["index.html"] ?? Object.entries(previewFiles).find(([path]) => path.endsWith(".html"))?.[1] ?? "";
  const normalize = (value: string): string | null => {
    const raw = value.split(/[?#]/, 1)[0].replace(/\\/g, "/");
    if (!raw || /^(?:[a-z]+:)?\/\//i.test(raw) || /^[a-z]+:/i.test(raw)) return null;
    const parts: string[] = [];
    for (const part of raw.replace(/^\/+/, "").split("/")) {
      if (!part || part === ".") continue;
      if (part === "..") {
        if (parts.length === 0) return null;
        parts.pop();
      } else parts.push(part);
    }
    return parts.join("/");
  };
  const resolve = (path: string) => {
    const normalized = normalize(path);
    return normalized ? previewFiles[normalized] : undefined;
  };
  const contentType = (path: string) => {
    const extension = path.toLowerCase().split(".").pop();
    return ({
      html: "text/html", css: "text/css", js: "text/javascript", mjs: "text/javascript",
      json: "application/json", svg: "image/svg+xml", md: "text/markdown", txt: "text/plain",
    } as Record<string, string>)[extension ?? ""] ?? "text/plain";
  };
  const dataUrl = (path: string, source: string) => `data:${contentType(path)};charset=utf-8,${encodeURIComponent(source)}`;
  const rewriteCss = (source: string) => source.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (token, _quote: string, path: string) => {
    const normalized = normalize(path);
    const local = normalized ? previewFiles[normalized] : undefined;
    return local === undefined ? token : `url("${dataUrl(normalized!, local)}")`;
  });
  html = html.replace(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/gi, (tag, path: string) => {
    const source = resolve(path); return source === undefined ? tag : `<style>${rewriteCss(source).replace(/<\/style/gi, "<\\/style")}</style>`;
  });
  html = html.replace(/<script\b([^>]*?)src=["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (tag, before: string, path: string, after: string) => {
    const source = resolve(path); return source === undefined ? tag : `<script ${before} ${after}>${source.replace(/<\/script/gi, "<\\/script")}</script>`;
  });
  html = html.replace(/\b(src|href)=["']([^"']+)["']/gi, (attribute, name: string, path: string) => {
    const normalized = normalize(path);
    const source = normalized ? previewFiles[normalized] : undefined;
    return source === undefined ? attribute : `${name}="${dataUrl(normalized!, source)}"`;
  });
  const serializedFiles = JSON.stringify(previewFiles)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  const bridge = `<script>(()=>{
    const channel=${JSON.stringify(channel)};
    const localFiles=${serializedFiles};
    const localMime=path=>({html:'text/html',css:'text/css',js:'text/javascript',mjs:'text/javascript',json:'application/json',svg:'image/svg+xml',md:'text/markdown',txt:'text/plain'})[String(path).toLowerCase().split('.').pop()]||'text/plain';
    const nativeFetch=window.fetch.bind(window);
    const localPath=value=>{
      if(typeof value!=='string'||/^(?:[a-z]+:)?\\/\\//i.test(value)||/^[a-z]+:/i.test(value))return null;
      const parts=[];for(const part of value.split(/[?#]/,1)[0].replace(/\\\\/g,'/').replace(/^\\/+/, '').split('/')){if(!part||part==='.')continue;if(part==='..'){if(!parts.length)return null;parts.pop()}else parts.push(part)}return parts.join('/');
    };
    window.fetch=(input,init)=>{
      const raw=typeof input==='string'?input:(input instanceof URL?input.href:(input instanceof Request?input.url:null));
      const path=raw&&localPath(raw);
      if(path&&Object.prototype.hasOwnProperty.call(localFiles,path))return Promise.resolve(new Response(localFiles[path],{status:200,headers:{'Content-Type':localMime(path)}}));
      if(raw&&/^(?:data|blob):/i.test(raw))return nativeFetch(input,init);
      return Promise.reject(new TypeError('Network access is disabled in Sandu preview'))
    };
    const pending=[];let port;let candidate;let connected=false;let hostSession;let connectTimer;let heartbeatTimer;let heartbeatDeadline;let heartbeatSequence=0;let lastPong=0;let bootstrapSequence=0;let connect;
    const post=(payload,transfer)=>{const message={...payload,channel};if(port)port.postMessage(message,transfer||[]);else if(pending.length<256)pending.push([message,transfer||[]])};
    const serialize=(value)=>{try{return typeof value==='string'?value:JSON.stringify(value)}catch{return String(value)}};let consoleCount=0;
    const send=(level,args)=>{if(consoleCount++<500)post({type:'sandu-console',level,message:args.map(serialize).join(' ').slice(0,3000)})};
    for(const level of ['log','warn','error']){const original=console[level];console[level]=(...args)=>{original.apply(console,args);send(level,args)}}
    addEventListener('error',event=>send('error',[event.message]));
    addEventListener('unhandledrejection',event=>send('error',[event.reason?.message||String(event.reason)]));
    for(const name of ['XMLHttpRequest','WebSocket','EventSource','RTCPeerConnection','webkitRTCPeerConnection','WebTransport']){
      try{Object.defineProperty(window,name,{value:undefined,writable:false,configurable:false})}catch{}
    }
    try{Object.defineProperty(window,'open',{value:()=>null,writable:false,configurable:false})}catch{}
    const preventNavigation=event=>{if(event.cancelable)event.preventDefault()};
    try{window.navigation?.addEventListener('navigate',preventNavigation)}catch{}
    addEventListener('click',event=>{if(event.target?.closest?.('a[href],area[href]'))preventNavigation(event)},true);
    addEventListener('auxclick',event=>{if(event.target?.closest?.('a[href],area[href]'))preventNavigation(event)},true);
    addEventListener('submit',preventNavigation,true);
    const scrubNavigation=root=>{
      const elements=[];
      if(root?.nodeType===1)elements.push(root);
      if(root?.querySelectorAll)elements.push(...root.querySelectorAll('base,meta[http-equiv],link[rel],a[href],area[href],form[action],[formaction],[target],[ping]'));
      for(const element of elements){
        const tag=element.tagName?.toLowerCase();
        if(tag==='base'||(tag==='meta'&&String(element.getAttribute('http-equiv')).toLowerCase()==='refresh')){element.remove();continue}
        if(tag==='link'&&/(?:^|\s)(?:dns-prefetch|preconnect|prefetch|prerender|modulepreload)(?:\s|$)/i.test(String(element.getAttribute('rel')))){element.remove();continue}
        if((tag==='a'||tag==='area')&&!String(element.getAttribute('href')||'').trim().startsWith('#'))element.removeAttribute('href');
        for(const attribute of ['action','formaction','target','ping'])element.removeAttribute?.(attribute);
      }
    };
    scrubNavigation(document.documentElement);
    new MutationObserver(records=>{for(const record of records){if(record.type==='attributes')scrubNavigation(record.target);for(const node of record.addedNodes)scrubNavigation(node)}}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['href','action','formaction','target','ping','rel','http-equiv','content']});
    const listeners=new Set();const assetRequests=new Map();let cameraRequest;
    const receive=data=>{
      if(!data||data.channel!==channel)return;
      if(data.type==='sandu-camera-frame'){
        for(const listener of listeners){try{listener(data.result,data)}catch(error){send('error',[error])}}
      }
      if(data.type==='sandu-camera-status'&&cameraRequest){data.ok?cameraRequest.resolve(data):cameraRequest.reject(new Error(data.message||'Camera unavailable'));cameraRequest=undefined}
      if(data.type==='sandu-pong'&&Number.isSafeInteger(data.pingId)){lastPong=Math.max(lastPong,data.pingId);clearTimeout(heartbeatDeadline);heartbeatDeadline=undefined}
      if(data.type==='sandu-asset-result'){
        const request=assetRequests.get(data.requestId);if(!request)return;assetRequests.delete(data.requestId);
        data.ok?request.resolve(data.buffer):request.reject(new Error(data.message||'Asset unavailable'));
      }
    };
    const reconnect=()=>{
      connected=false;clearTimeout(connectTimer);clearTimeout(heartbeatDeadline);clearInterval(heartbeatTimer);heartbeatDeadline=undefined;
      candidate?.close();port?.close();candidate=undefined;port=undefined;
      connect()
    };
    const beginHeartbeat=()=>{
      clearInterval(heartbeatTimer);clearTimeout(heartbeatDeadline);
      heartbeatTimer=setInterval(()=>{
        if(!connected||!port)return;
        const pingId=++heartbeatSequence;
        try{port.postMessage({type:'sandu-ping',channel,pingId})}catch{reconnect();return}
        if(!heartbeatDeadline)heartbeatDeadline=setTimeout(()=>{heartbeatDeadline=undefined;if(connected&&lastPong<pingId)reconnect()},3000)
      },2000)
    };
    connect=()=>{
      if(connected)return;
      clearTimeout(connectTimer);candidate?.close();
      const connection=new MessageChannel();const candidatePort=connection.port1;const bootstrapId=channel+':'+(++bootstrapSequence);
      candidate=candidatePort;
      candidatePort.onmessage=message=>{
        if(message.data?.type==='sandu-connected'&&message.data?.channel===channel&&message.data?.bootstrapId===bootstrapId&&typeof message.data?.hostSession==='string'){
          if(connected||candidate!==candidatePort){candidatePort.close();return}
          const shouldReplay=Boolean(hostSession&&hostSession!==message.data.hostSession);hostSession=message.data.hostSession;
          connected=true;clearTimeout(connectTimer);candidate=undefined;port=candidatePort;
          const queuedMessages=pending.splice(0);const queuedAssets=new Set();let queuedCameraStart=false;
          for(const [queued,transfer] of queuedMessages){port.postMessage(queued,transfer);if(queued.type==='sandu-asset-request')queuedAssets.add(queued.requestId);if(queued.type==='sandu-camera-start')queuedCameraStart=true}
          if(shouldReplay){
            for(const [requestId,request] of assetRequests){if(!queuedAssets.has(requestId))port.postMessage({type:'sandu-asset-request',channel,requestId,reference:request.reference})}
            if(cameraRequest&&!queuedCameraStart)port.postMessage({type:'sandu-camera-start',channel})
          }
          port.postMessage({type:'sandu-preview-ready',channel});beginHeartbeat();
          return
        }
        if(candidate===candidatePort||(connected&&port===candidatePort))receive(message.data)
      };
      candidatePort.start();parent.postMessage({type:'sandu-bootstrap',channel,bootstrapId},'*',[connection.port2]);
      connectTimer=setTimeout(()=>{if(!connected&&candidate===candidatePort)connect()},200)
    };
    connect();
    addEventListener('message',event=>{if(event.source===parent&&event.data?.type==='sandu-reconnect'&&event.data?.channel===channel)reconnect()});
    const requestAsset=reference=>new Promise((resolve,reject)=>{const requestId=(crypto.randomUUID?.()||('asset-'+Date.now()+'-'+Math.random()));const normalizedReference=String(reference);assetRequests.set(requestId,{resolve,reject,reference:normalizedReference});post({type:'sandu-asset-request',requestId,reference:normalizedReference});setTimeout(()=>{if(assetRequests.delete(requestId))reject(new Error('Asset request timed out'))},30000)});
    window.sanduCamera={
      start:()=>new Promise((resolve,reject)=>{cameraRequest={resolve,reject};post({type:'sandu-camera-start'})}),
      stop:()=>post({type:'sandu-camera-stop'}),
      onFrame:listener=>{listeners.add(listener);return()=>listeners.delete(listener)}
    };
    window.sanduAssets={
      arrayBuffer:requestAsset,
      objectUrl:async(url,mimeType='application/octet-stream')=>URL.createObjectURL(new Blob([await requestAsset(url)],{type:mimeType})),
      revoke:url=>URL.revokeObjectURL(url)
    };
    post({type:'sandu-preview-ready'});
  })();</script>`;
  const runtime = threeRuntimeSource
    ? `<script>${threeRuntimeSource.replace(/<\/script/gi, "<\\/script")}</script>`
    : "";
  const policy = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; media-src data: blob:; font-src data:; connect-src data: blob:; worker-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'; frame-src 'none'; navigate-to 'none';"><meta name="referrer" content="no-referrer"><meta name="viewport" content="width=device-width, initial-scale=1">`;
  // Always own the outer document. Regex-inserting into an untrusted <head>
  // can be bypassed with a fake tag inside a comment or script string.
  return `<!doctype html><html><head>${policy}${runtime}${bridge}</head><body>${html}</body></html>`;
}

export function isPreviewMessage(event: MessageEvent, source: Window | null | undefined, channel: string): boolean {
  return Boolean(source && event.source === source && event.data && event.data.channel === channel && typeof event.data.type === "string");
}
