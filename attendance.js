/* ===== ফেজ ৩: হাজিরা (ক্যাপ্টেন) — Google Sheets + PDF/CSV ===== */

const PIN_KEY = 'cc_captain_pin';                 // PIN শুধু এই ট্যাব খোলা থাকা পর্যন্ত মনে থাকে
const getPin = () => sessionStorage.getItem(PIN_KEY) || '';
const todayStr = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const bn = s => (s === 'Present' ? 'উপস্থিত' : 'অনুপস্থিত');

// Apps Script-এর সাথে কথা বলার ফাংশন (POST-এ text/plain দিলে CORS সমস্যা হয় না)
async function api(params, body) {
  const pin = getPin();
  const res = body
    ? await fetch(ATTENDANCE_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ pin, ...body }) })
    : await fetch(ATTENDANCE_URL + '?' + new URLSearchParams({ pin, ...params }));
  return res.json();
}

function attendancePage() {
  if (ATTENDANCE_URL.startsWith('PASTE')) {
    document.getElementById('app').innerHTML = `<div class="card"><h1>হাজিরা</h1>
      <p><code>config.js</code> ফাইলে <code>ATTENDANCE_URL</code> বসানো হয়নি। সেটআপ গাইড অনুযায়ী Apps Script-এর URL পেস্ট করুন।</p></div>`;
    return;
  }
  getPin() ? captainView() : pinView();
}

function pinView(msg = '') {
  const el = document.getElementById('app');
  el.innerHTML = `<h1>হাজিরা</h1><form class="card" id="pf">
    <p>শুধু ক্যাপ্টেনের জন্য। ক্যাপ্টেন PIN দিন:</p>
    <p><input id="pin" type="password" inputmode="numeric" autocomplete="off" required placeholder="PIN"></p>
    <button>ঢুকুন</button> <span class="no" id="pm">${msg}</span></form>`;
  document.getElementById('pf').onsubmit = async ev => {
    ev.preventDefault();
    sessionStorage.setItem(PIN_KEY, document.getElementById('pin').value.trim());
    document.getElementById('pm').textContent = 'যাচাই হচ্ছে...';
    try {
      const r = await api({ action: 'dates' });
      if (r.ok) captainView(); else { sessionStorage.removeItem(PIN_KEY); pinView(r.error); }
    } catch (e) { sessionStorage.removeItem(PIN_KEY); pinView('সংযোগ হয়নি। URL ও ইন্টারনেট দেখুন।'); }
  };
}

async function captainView() {
  const status = {}; ROLL_LIST.forEach(s => (status[s.roll] = 'Present'));   // শুরুতে সবাই উপস্থিত, অনুপস্থিতদের ট্যাপ করুন
  const el = document.getElementById('app');
  el.innerHTML = `<h1>হাজিরা (ক্যাপ্টেন)</h1>
    <section class="card"><label>তারিখ: <input type="date" id="d" value="${todayStr()}"></label>
      <p id="sum"></p><div id="rl"></div>
      <p><button id="save">জমা দিন</button> <span id="msg" aria-live="polite"></span></p>
      <small class="mute">একই তারিখে আবার জমা দিলে আগের হাজিরা বদলে যাবে।</small></section>
    <h2>পুরনো হাজিরা</h2>
    <section class="card"><select id="ds"><option value="">তারিখ বাছাই করুন</option></select>
      <button id="load" class="ghost">দেখুন</button><div id="view"></div></section>
    <button class="ghost" id="out">ক্যাপ্টেন মোড থেকে বের হন</button>`;
  const $ = id => document.getElementById(id);

  function draw() {
    $('rl').innerHTML = ROLL_LIST.map(s => `<div class="att-row"><span>${s.roll}</span><span class="nm">${esc(s.name)}</span>
      <button class="tg p ${status[s.roll] === 'Present' ? 'on' : ''}" data-r="${s.roll}" data-s="Present">উপস্থিত</button>
      <button class="tg a ${status[s.roll] === 'Absent' ? 'on' : ''}" data-r="${s.roll}" data-s="Absent">অনুপস্থিত</button></div>`).join('');
    const ab = Object.values(status).filter(v => v === 'Absent').length;
    $('sum').textContent = `মোট ${ROLL_LIST.length} জন · উপস্থিত ${ROLL_LIST.length - ab} · অনুপস্থিত ${ab}`;
  }
  $('rl').onclick = e => { const b = e.target.closest('button[data-r]'); if (b) { status[b.dataset.r] = b.dataset.s; draw(); } };
  draw();

  async function loadDates() {
    try {
      const r = await api({ action: 'dates' });
      if (!r.ok) { sessionStorage.removeItem(PIN_KEY); return pinView(r.error); }
      $('ds').innerHTML = '<option value="">তারিখ বাছাই করুন</option>' + r.dates.map(x => `<option>${x}</option>`).join('');
    } catch (e) { $('view').textContent = 'তারিখ আনা যায়নি।'; }
  }
  loadDates();

  $('save').onclick = async () => {
    $('msg').textContent = 'জমা হচ্ছে...';
    try {
      const records = ROLL_LIST.map(s => ({ roll: s.roll, name: s.name, status: status[s.roll] }));
      const r = await api(null, { date: $('d').value, records });
      $('msg').textContent = r.ok ? `✓ ${r.saved} জনের হাজিরা জমা হয়েছে` : '✗ ' + r.error;
      $('msg').className = r.ok ? 'ok' : 'no';
      if (r.ok) loadDates();
    } catch (e) { $('msg').textContent = '✗ জমা হয়নি, ইন্টারনেট দেখুন'; $('msg').className = 'no'; }
  };

  $('load').onclick = async () => {
    const date = $('ds').value; if (!date) return;
    $('view').textContent = 'আনা হচ্ছে...';
    try {
      const r = await api({ action: 'get', date });
      if (!r.ok) return ($('view').textContent = r.error);
      const recs = r.records;
      $('view').innerHTML = `<div class="tbl"><table><tr><th>রোল</th><th>নাম</th><th>অবস্থা</th></tr>${recs.map(x =>
        `<tr><td>${esc(String(x.roll))}</td><td>${esc(String(x.name))}</td><td class="${x.status === 'Present' ? 'ok' : 'no'}">${bn(x.status)}</td></tr>`).join('')}</table></div>
        <p><button id="pdf">PDF ডাউনলোড</button> <button id="csv" class="ghost">CSV (Excel)</button></p>`;
      $('csv').onclick = () => exportCsv(date, recs);
      $('pdf').onclick = () => exportPdf(date, recs);
    } catch (e) { $('view').textContent = 'হাজিরা আনা যায়নি।'; }
  };
  $('out').onclick = () => { sessionStorage.removeItem(PIN_KEY); pinView(); };
}

/* ---------- CSV: শুরুর BOM থাকায় Excel-এ বাংলা ঠিক দেখায় ---------- */
function exportCsv(date, recs) {
  const q = v => '"' + String(v).replace(/"/g, '""') + '"';
  const csv = '\ufeff' + ['Date,Roll,Name,Status', ...recs.map(r => [date, r.roll, r.name, r.status].map(q).join(','))].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `attendance-${date}.csv`; a.click(); URL.revokeObjectURL(a.href);
}

/* ---------- PDF: jsPDF-এর নিজস্ব ফন্টে বাংলা নেই, তাই পেজটি canvas-এ এঁকে (Hind Siliguri দিয়ে) ছবি হিসেবে PDF-এ বসানো হয় ---------- */
async function exportPdf(date, recs) {
  await document.fonts.load('28px "Hind Siliguri"');
  const { jsPDF } = window.jspdf, pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 1240, H = 1754, RH = 56, per = Math.floor((H - 340) / RH), pages = Math.max(1, Math.ceil(recs.length / per));
  const pres = recs.filter(r => r.status === 'Present').length;
  const F = '"Hind Siliguri", sans-serif';
  for (let p = 0; p < pages; p++) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.fillStyle = '#12261f';
    g.font = `700 48px ${F}`; g.fillText('কোড ক্লাস — হাজিরা তালিকা', 80, 110);
    g.font = `400 30px ${F}`; g.fillText(`তারিখ: ${date}    উপস্থিত: ${pres}    অনুপস্থিত: ${recs.length - pres}`, 80, 170);
    let y = 250; g.fillStyle = '#0a6b4b'; g.fillRect(80, y - 40, W - 160, 52);
    g.fillStyle = '#fff'; g.font = `700 28px ${F}`; g.fillText('রোল', 100, y); g.fillText('নাম', 260, y); g.fillText('অবস্থা', 900, y);
    recs.slice(p * per, (p + 1) * per).forEach((r, i) => {
      y += RH; if (i % 2) { g.fillStyle = '#eef4f0'; g.fillRect(80, y - 40, W - 160, RH); }
      g.font = `400 28px ${F}`; g.fillStyle = '#12261f'; g.fillText(String(r.roll), 100, y); g.fillText(String(r.name), 260, y);
      g.fillStyle = r.status === 'Present' ? '#0a6b4b' : '#c92a3a'; g.fillText(bn(r.status), 900, y);
    });
    g.fillStyle = '#777'; g.font = `400 22px ${F}`; g.fillText(`পৃষ্ঠা ${p + 1}/${pages}`, 80, H - 60);
    if (p) pdf.addPage();
    pdf.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297);
  }
  pdf.save(`attendance-${date}.pdf`);
}
