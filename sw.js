// সাধারণ সার্ভিস ওয়ার্কার: আগে নেট থেকে আনে (তাই লেসন এডিট করলেই নতুন দেখায়), নেট না থাকলে সেভ করা কপি দেখায়।
const CACHE = 'codeclass-v1';   // বড় পরিবর্তনের পর v2, v3... করুন
const FILES = ['./', 'index.html', 'style.css', 'app.js', 'lessons.json', 'config.js', 'attendance.js', 'chat.js', 'imagepdf.js', 'manifest.json', 'icon.svg'];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request))
  );
});
