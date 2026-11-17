/* ===== কোড ক্লাস — ফেজ ১: অ্যাপ শেল, লেসন, লাইভ এডিটর, টাস্ক ===== */

// শিক্ষকের জন্য: true করলে সব ট্র্যাক ও লেসন খোলা থাকবে (টেস্ট করার সময় কাজে লাগে)
const UNLOCK_ALL = false;

const KEY = 'codeclass_progress_v1';           // localStorage-এ প্রগ্রেস সেভ হয় এই নামে
const app = document.getElementById('app');
let DATA, cm;

/* ---------- প্রগ্রেস (ফেজ ২-এ প্রোফাইলের সাথে যুক্ত হবে) ---------- */
// ফেজ ৫-এ লগইন যোগ হলে USER_ID বসবে, তখন প্রতিটি ইউজারের প্রগ্রেস আলাদা সেভ হবে
let USER_ID = null;
const storeKey = () => (USER_ID ? KEY + '_' + USER_ID : KEY);
const prog = () => JSON.parse(localStorage.getItem(storeKey()) || '{}');
const isDone = id => !!prog()[id];
function markDone(id) { const p = prog(); p[id] = Date.now(); localStorage.setItem(storeKey(), JSON.stringify(p)); }

// ===== প্রোফাইল সেটিং (ডেমো) =====
// প্রোফাইল কার্ডের শুরুর সংখ্যা। সত্যিকারের সম্পন্ন টাস্ক এর সাথে যোগ হয়।
// শুধু আসল প্রগ্রেস দেখাতে চাইলে তিনটিই 0 করুন।
const DEMO = { name: 'Demo Profile', title: 'Student Developer', track: 'Frontend Development', html: 8, css: 6, js: 3 };
const PER_LEVEL = 6;   // প্রতি ৬টি চ্যালেঞ্জে ১ লেভেল (১৭টিতে Level 3)
const lessonsOf = t => DATA.lessons.filter(l => l.track === t);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// আগের ট্র্যাকের সব লেসন শেষ হলে পরের ট্র্যাক খোলে
function trackOpen(ti) {
  if (UNLOCK_ALL || ti === 0) return true;
  return lessonsOf(DATA.tracks[ti - 1].id).every(l => isDone(l.id));
}
// আগের লেসন শেষ হলে পরের লেসন খোলে
function lessonOpen(l) {
  const ti = DATA.tracks.findIndex(t => t.id === l.track);
  if (!trackOpen(ti)) return false;
  const list = lessonsOf(l.track), i = list.indexOf(l);
  return UNLOCK_ALL || i === 0 || isDone(list[i - 1].id);
}

/* ---------- শুরু ---------- */
async function init() {
  try {
    DATA = await (await fetch('lessons.json')).json();
  } catch (e) {
    app.innerHTML = `<div class="card"><h2>lessons.json লোড হয়নি</h2>
      <p>index.html সরাসরি ডাবল-ক্লিক করে না খুলে VS Code-এর <b>Live Server</b> দিয়ে চালান, অথবা GitHub Pages/Netlify-তে আপলোড করুন।</p></div>`;
    return;
  }
  addEventListener('hashchange', route);
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js');
  route();
}

/* ---------- রাউটার: #/ , #/track/html , #/lesson/html-1 , #/profile ... ---------- */
function route() {
  const [, page, arg] = location.hash.split('/');
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('on', a.dataset.p === (page || 'home') || (a.dataset.p === 'home' && ['track', 'lesson'].includes(page))));
  if (cm) { cm = null; }
  if (typeof chatLeave === 'function') chatLeave();   // চ্যাট ছেড়ে গেলে রিয়েলটাইম বন্ধ
  if (page === 'track') trackPage(arg);
  else if (page === 'lesson') lessonPage(arg);
  else if (page === 'profile') profilePage();
  else if (page === 'attendance') attendancePage();
  else if (page === 'pdf') imagePdfPage();
  else if (page === 'chat') chatPage();
  else home();
  scrollTo(0, 0);
}

const STUBS = { profile: ['প্রোফাইল', 2], attendance: ['হাজিরা', 3], pdf: ['ছবি থেকে PDF', 4], chat: ['লগইন ও চ্যাট', 5] };
function stub(p) {
  app.innerHTML = `<div class="card"><h1>${STUBS[p][0]}</h1><p>এই অংশ ফেজ ${STUBS[p][1]}-এ তৈরি হবে। শীঘ্রই আসছে!</p></div>`;
}

/* ---------- প্রোফাইল ---------- */
function profilePage() {
  const real = {};
  DATA.tracks.forEach(t => (real[t.id] = lessonsOf(t.id).filter(l => isDone(l.id)).length));
  const n = { html: DEMO.html + real.html, css: DEMO.css + real.css, js: DEMO.js + real.js };
  const total = n.html + n.css + n.js;
  const level = Math.floor(total / PER_LEVEL) + 1, left = PER_LEVEL - (total % PER_LEVEL);

  app.innerHTML = `<h1>প্রোফাইল</h1>
    <section class="card pcard">
      <div class="phead">
        <div class="avatar" aria-hidden="true">DP</div>
        <div><h2>${DEMO.name}</h2><div>${DEMO.title}</div><div class="mute">${DEMO.track}</div></div>
        <span class="lvl">Level ${level}</span>
      </div>
      <div class="stats">
        <div><b>${n.html}</b><span>HTML Challenges</span></div>
        <div><b>${n.css}</b><span>CSS Challenges</span></div>
        <div><b>${n.js}</b><span>JavaScript Challenges</span></div>
      </div>
      <div class="bar"><i style="width:${(PER_LEVEL - left) / PER_LEVEL * 100}%"></i></div>
      <small class="mute">পরের লেভেলে যেতে আরও ${left}টি চ্যালেঞ্জ বাকি</small>
    </section>
    <p class="note">ডেমো ডেটা, বাস্তব Skill Verification নয়।</p>

    <h2>আমার আসল অগ্রগতি</h2>
    <section class="card">${DATA.tracks.map(t => {
      const tot = lessonsOf(t.id).length, d = real[t.id];
      return `<div class="row"><span>${t.title}</span><span>${d}/${tot}</span></div>
        <div class="bar"><i style="width:${tot ? d / tot * 100 : 0}%"></i></div>`;
    }).join('')}</section>
    <button class="ghost" id="reset">প্রগ্রেস মুছে ফেলুন</button>`;

  document.getElementById('reset').onclick = () => {
    if (confirm('সব সম্পন্ন টাস্ক মুছে যাবে। নিশ্চিত?')) { localStorage.removeItem(storeKey()); profilePage(); }
  };
}

/* ---------- হোম: তিনটি ট্র্যাক ---------- */
function home() {
  app.innerHTML = `<h1>স্বাগতম! চলো ওয়েবসাইট বানানো শিখি</h1>
    <p>প্রথমে HTML, তারপর CSS, শেষে JavaScript। একটি শেষ করলে পরেরটি খুলবে।</p>
    <div class="grid">${DATA.tracks.map((t, i) => {
      const ls = lessonsOf(t.id), d = ls.filter(l => isDone(l.id)).length, open = trackOpen(i);
      return `<a class="card track ${open ? '' : 'locked'}" href="#/track/${t.id}">
        <div class="big">${esc(t.icon)}</div><h2>${t.title}${open ? '' : ' 🔒'}</h2><p>${t.desc}</p>
        <div>${d}/${ls.length} লেসন সম্পন্ন</div>
        <div class="bar"><i style="width:${ls.length ? d / ls.length * 100 : 0}%"></i></div></a>`;
    }).join('')}</div>`;
}

/* ---------- ট্র্যাকের লেসন তালিকা ---------- */
function trackPage(id) {
  const ti = DATA.tracks.findIndex(t => t.id === id);
  if (ti < 0 || !trackOpen(ti)) return (location.hash = '#/');
  app.innerHTML = `<a href="#/">← হোম</a><h1>${DATA.tracks[ti].title}</h1><div class="list">${lessonsOf(id).map((l, i) => {
    const ok = isDone(l.id);
    return `<a href="#/lesson/${l.id}" class="${lessonOpen(l) ? '' : 'locked'}">
      <span class="dot ${ok ? 'ok' : ''}">${ok ? '✓' : i + 1}</span><span>${l.title}</span></a>`;
  }).join('')}</div>`;
}

/* ---------- লেসন পেজ ---------- */
function lessonPage(id) {
  const l = DATA.lessons.find(x => x.id === id);
  if (!l || !lessonOpen(l)) return (location.hash = '#/');
  const list = lessonsOf(l.track), i = list.indexOf(l), next = list[i + 1], prev = list[i - 1];
  const buf = { try: l.example, task: l.task.starter || '' };   // দুই ট্যাবের কোড আলাদা জমা থাকে
  let mode = 'try';

  app.innerHTML = `<a href="#/track/${l.track}">← লেসন তালিকা</a><h1>${l.title}</h1>
    <section class="card">${l.explain.map(p => `<p>${p}</p>`).join('')}</section>
    <h2>উদাহরণ</h2><pre><code>${esc(l.example)}</code></pre>
    <h2>নিজে করে দেখো</h2>
    <div class="seg"><button id="m-try" class="on">চেষ্টা করি</button><button id="m-task">টাস্ক</button></div>
    <div class="lab"><textarea id="code"></textarea><iframe id="prev" sandbox="allow-scripts" title="লাইভ প্রিভিউ"></iframe></div>
    <section class="card task"><h2>টাস্ক</h2><p>${l.task.text}</p>
      <details open><summary>লক্ষ্য ডিজাইন (এমনটা বানাতে হবে)</summary>
        <iframe class="small" sandbox="allow-scripts" title="লক্ষ্য ডিজাইন" srcdoc="${l.task.target.replace(/"/g, '&quot;')}"></iframe></details>
      <p><button id="check">চেক করুন</button></p><ul class="res" id="res" aria-live="polite"></ul></section>
    <div class="pager">${prev ? `<a class="btn ghost" href="#/lesson/${prev.id}">← আগের</a>` : '<span></span>'}
      ${next ? `<a class="btn ghost" id="next" href="#/lesson/${next.id}">পরের →</a>` : `<a class="btn ghost" href="#/track/${l.track}">শেষ ✓</a>`}</div>`;

  // CodeMirror এডিটর + লাইভ প্রিভিউ
  const prev$ = document.getElementById('prev');
  cm = CodeMirror.fromTextArea(document.getElementById('code'), { mode: 'htmlmixed', lineNumbers: true, lineWrapping: true, value: buf.try });
  cm.setValue(buf.try);
  let t;
  const render = () => (prev$.srcdoc = cm.getValue());
  cm.on('change', () => { clearTimeout(t); t = setTimeout(render, 300); });
  render();

  function setMode(m) {
    buf[mode] = cm.getValue(); mode = m; cm.setValue(buf[m]);
    document.getElementById('m-try').classList.toggle('on', m === 'try');
    document.getElementById('m-task').classList.toggle('on', m === 'task');
  }
  document.getElementById('m-try').onclick = () => setMode('try');
  document.getElementById('m-task').onclick = () => setMode('task');

  document.getElementById('check').onclick = () => {
    if (mode === 'try') setMode('task');            // চেক সবসময় টাস্ক ট্যাবের কোড দিয়ে হয়
    const results = runChecks(cm.getValue(), l.task.checks);
    const pass = results.every(r => r.ok);
    document.getElementById('res').innerHTML = results.map(r => `<li class="${r.ok ? 'ok' : 'no'}">${r.ok ? '✓' : '✗'} ${r.msg}</li>`).join('') +
      (pass ? '<li class="ok"><b>🎉 সাবাশ! টাস্ক সম্পন্ন হয়েছে।</b></li>' : '<li>আবার চেষ্টা করো, তুমি পারবে!</li>');
    if (pass) markDone(l.id);
  };
}

/* ---------- অটো চেক ----------
   checks-এর প্রতিটি আইটেম:
   { "sel": "h1", "min": 1, "msg": "..." }  → কোডে CSS selector মিললে পাস (min = কমপক্ষে কয়টি)
   { "re": "regex", "msg": "..." }          → কোডের টেক্সটে regex মিললে পাস */
function runChecks(code, checks) {
  const doc = new DOMParser().parseFromString(code, 'text/html');
  return checks.map(c => {
    let ok = false;
    try {
      if (c.sel) ok = doc.querySelectorAll(c.sel).length >= (c.min || 1);
      else if (c.re) ok = new RegExp(c.re, 'i').test(code);
    } catch (e) { }
    return { ok, msg: c.msg };
  });
}

init();
