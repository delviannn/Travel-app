const CACHE='nusantara-journey-v15';
const CORE=[
  './','./index.html','./detail.html','./admin.html','./offline.html','./styles.css','./app.js','./detail.js','./admin.js','./theme.js','./theme-init.js','./manifest.webmanifest','./icon.svg','./assets/nusantara-journey-logo.svg',
  './supabase-config.js','./supabase-browser.js',
  './assets/batam-bintan.jpg','./assets/batam-city.jpg','./assets/bali.jpg',
  './assets/labuan-bajo.jpg','./assets/singapore.jpg','./assets/japan.jpg'
];

self.addEventListener('install',event=>event.waitUntil(
  caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())
));

self.addEventListener('activate',event=>event.waitUntil(
  caches.keys()
    .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
    .then(()=>self.clients.claim())
));

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||new URL(request.url).origin!==location.origin)return;

  const path=new URL(request.url).pathname;
  const refreshOnNetwork=request.mode==='navigate'||/\.(js|css|webmanifest)$/.test(path);
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    if(refreshOnNetwork){
      try{
        const response=await fetch(new Request(request,{cache:'reload'}));
        if(response.ok)await cache.put(request,response.clone());
        return response;
      }catch{return await cache.match(request)||await cache.match('./offline.html')||await cache.match('./index.html')}
    }
    const cached=await cache.match(request);
    if(cached)return cached;
    try{
      const response=await fetch(request);
      if(response.ok)await cache.put(request,response.clone());
      return response;
    }catch{return await cache.match('./index.html')}
  })());
});
