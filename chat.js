/* ===== ফেজ ৫: লগইন + চ্যাট (Supabase Auth + Realtime) ===== */

let sb = null, me = null, chan = null, authLoaded = false;
const names = {};                                   // id -> ইউজারনেম (ক্যাশ)
const sbReady = () => typeof SUPABASE_URL !== 'undefined' && !SUPABASE_URL.startsWith('PASTE');
const $c = id => document.getElementById(id);
const nameOf = id => names[id] || 'অজানা';
const inChat = () => location.hash.startsWith('#/chat');

function setUser(u) { me = u || null; USER_ID = me ? me.id : null; }   // USER_ID দিয়ে প্রতিজনের প্রগ্রেস আলাদা সেভ হয়

if (sbReady()) {
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);   // শুধু public anon key, গোপন কী নয়
  sb.auth.getSession().then(({ data }) => { authLoaded = true; setUser(data.session && data.session.user); if (inChat()) chatPage(); });
  sb.auth.onAuthStateChange((ev, s) => {
    const id = s && s.user ? s.user.id : null;
    if (id !== (me && me.id)) { setUser(s && s.user); if (inChat()) chatPage(); }   // ইউজার বদলালেই শুধু আবার আঁকি
  });
}

function chatLeave() { if (chan && sb) { sb.removeChannel(chan); chan = null; } }   // অন্য পেজে গেলে রিয়েলটাইম বন্ধ

async function loadNames(ids) {
  const miss = [...new Set(ids)].filter(i => i && !names[i]);
  if (!miss.length) return;
  const { data } = await sb.from('profiles').select('id,username').in('id', miss);
  (data || []).forEach(p => (names[p.id] = p.username));
}

/* ---------- রাউটিং: #/chat , #/chat/dm/<userId> , #/chat/g/<groupId> ---------- */
function chatPage() {
  chatLeave();
  const el = $c('app');
  if (!sbReady()) {
    el.innerHTML = `<div class="card"><h1>চ্যাট</h1><p><code>config.js</code>-এ <code>SUPABASE_URL</code> ও <code>SUPABASE_ANON_KEY</code> বসানো হয়নি। সেটআপ গাইড (SETUP-bn.md) দেখুন।</p></div>`;
    return;
  }
  if (!authLoaded) { el.innerHTML = '<p>লোড হচ্ছে...</p>'; return; }
  if (!me) return authView();
  const [, , kind, id] = location.hash.split('/');
  if (kind === 'dm' && id) return convoView({ peer: id });
  if (kind === 'g' && id) return convoView({ gid: id });
  inboxView();
}

/* ---------- লগইন / সাইন-আপ ---------- */
function authView(signup = false) {
  $c('app').innerHTML = `<h1>${signup ? 'নতুন অ্যাকাউন্ট' : 'লগইন'}</h1>
    <form class="card" id="af">
      ${signup ? '<p><label>ইউজারনেম<br><input id="un" required minlength="2" maxlength="30" autocomplete="username"></label></p>' : ''}
      <p><label>ইমেইল<br><input id="em" type="email" required autocomplete="email"></label></p>
      <p><label>পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)<br><input id="pw" type="password" required minlength="6" autocomplete="${signup ? 'new-password' : 'current-password'}"></label></p>
      <button>${signup ? 'অ্যাকাউন্ট খুলুন' : 'ঢুকুন'}</button>
      <button type="button" class="ghost" id="tg">${signup ? 'আগে থেকেই অ্যাকাউন্ট আছে' : 'নতুন অ্যাকাউন্ট খুলুন'}</button>
      <p id="am" class="no" aria-live="polite"></p></form>`;
  $c('tg').onclick = () => authView(!signup);
  $c('af').onsubmit = async e => {
    e.preventDefault();
    const email = $c('em').value.trim(), password = $c('pw').value;
    $c('am').textContent = 'অপেক্ষা করুন...';
    const r = signup
      ? await sb.auth.signUp({ email, password, options: { data: { username: $c('un').value.trim() } } })
      : await sb.auth.signInWithPassword({ email, password });
    if (r.error) $c('am').textContent = r.error.message;
    else if (signup && !r.data.session) $c('am').textContent = 'ইমেইলে একটি যাচাই-লিংক পাঠানো হয়েছে। লিংকে ক্লিক করে তারপর লগইন করুন।';
    // সফল হলে onAuthStateChange নিজেই পেজ বদলে দেয়
  };
}

/* ---------- ইনবক্স: মেসেজ + গ্রুপ ---------- */
async function inboxView() {
  const el = $c('app');
  el.innerHTML = `<h1>চ্যাট</h1><p><span id="hi"></span> <button class="ghost" id="lo">লগআউট</button></p>
    <section class="card"><h2>মেসেজ</h2>
      <form id="nf" class="send"><input id="nu" required placeholder="ইউজারনেম লিখে নতুন মেসেজ শুরু করুন"><button>খুঁজুন</button></form>
      <p id="nm" class="no"></p><div id="dml">লোড হচ্ছে...</div></section>
    <section class="card"><h2>গ্রুপ স্টাডি রুম</h2>
      <form id="gf" class="send"><input id="gn" required minlength="2" maxlength="60" placeholder="নতুন গ্রুপের নাম"><button>তৈরি করুন</button></form>
      <form id="jf" class="send"><input id="jc" required maxlength="6" placeholder="গ্রুপের ৬ অক্ষরের কোড"><button class="ghost">যোগ দিন</button></form>
      <p id="gm" class="no"></p><div id="gl">লোড হচ্ছে...</div></section>`;
  $c('lo').onclick = () => sb.auth.signOut();

  // নতুন মেসেজ: ইউজারনেম দিয়ে খোঁজা
  $c('nf').onsubmit = async e => {
    e.preventDefault();
    const { data } = await sb.from('profiles').select('id').eq('username', $c('nu').value.trim()).maybeSingle();
    if (!data) $c('nm').textContent = 'এই নামে কাউকে পাওয়া যায়নি।';
    else if (data.id === me.id) $c('nm').textContent = 'নিজেকে মেসেজ পাঠানো যাবে না।';
    else location.hash = '#/chat/dm/' + data.id;
  };
  // গ্রুপ তৈরি / যোগ দেওয়া (SQL-এর ফাংশন)
  const grp = (fn, args) => async e => {
    e.preventDefault();
    const { data, error } = await sb.rpc(fn, args());
    if (error) $c('gm').textContent = error.message; else location.hash = '#/chat/g/' + data.id;
  };
  $c('gf').onsubmit = grp('create_group', () => ({ gname: $c('gn').value }));
  $c('jf').onsubmit = grp('join_group', () => ({ code: $c('jc').value }));

  await loadNames([me.id]);
  $c('hi').textContent = 'হ্যালো, ' + nameOf(me.id) + '!';

  // আমার আলাপগুলো: সাম্প্রতিক মেসেজ থেকে বের করা
  const { data: ms } = await sb.from('messages').select('sender_id,recipient_id').not('recipient_id', 'is', null)
    .order('created_at', { ascending: false }).limit(200);
  const peers = [];
  (ms || []).forEach(m => { const p = m.sender_id === me.id ? m.recipient_id : m.sender_id; if (!peers.includes(p)) peers.push(p); });
  await loadNames(peers);
  $c('dml').innerHTML = peers.length ? `<div class="list">${peers.map(p => `<a href="#/chat/dm/${p}">${esc(nameOf(p))}</a>`).join('')}</div>`
    : '<p class="mute">এখনো কোনো মেসেজ নেই।</p>';

  const { data: gm } = await sb.from('group_members').select('groups(id,name,join_code)').eq('user_id', me.id);
  const gs = (gm || []).map(x => x.groups).filter(Boolean);
  $c('gl').innerHTML = gs.length ? `<div class="list">${gs.map(g => `<a href="#/chat/g/${g.id}"><span>${esc(g.name)}</span><small class="mute">কোড: ${g.join_code}</small></a>`).join('')}</div>`
    : '<p class="mute">এখনো কোনো গ্রুপে নেই।</p>';
}

/* ---------- আলাপ: একজনের সাথে (peer) অথবা গ্রুপ (gid) ---------- */
async function convoView(c) {
  const el = $c('app');
  let title, extra = '';
  if (c.gid) {
    const { data: g } = await sb.from('groups').select('name,join_code').eq('id', c.gid).maybeSingle();
    if (!g) { el.innerHTML = '<a href="#/chat">← ফিরে যান</a><div class="card">গ্রুপটি পাওয়া যায়নি, অথবা আপনি সদস্য নন।</div>'; return; }
    title = g.name;
    extra = `<p class="mute">বন্ধুদের এই কোড দিন: <b>${g.join_code}</b> <button class="ghost" id="lv">গ্রুপ ছাড়ুন</button></p>`;
  } else { await loadNames([c.peer]); title = nameOf(c.peer); }

  el.innerHTML = `<a href="#/chat">← ফিরে যান</a><h1>${esc(title)}</h1>${extra}
    <div id="box" class="chat" aria-live="polite"></div>
    <form id="sf" class="send"><input id="txt" maxlength="2000" autocomplete="off" required placeholder="মেসেজ লিখুন..."><button>পাঠান</button></form><p id="em" class="no"></p>`;
  if (c.gid) $c('lv').onclick = async () => {
    if (!confirm('গ্রুপ ছেড়ে দেবেন?')) return;
    await sb.from('group_members').delete().eq('group_id', c.gid).eq('user_id', me.id);
    location.hash = '#/chat';
  };

  const box = $c('box'), seen = new Set();
  const belongs = m => c.gid ? m.group_id === c.gid
    : !m.group_id && ((m.sender_id === me.id && m.recipient_id === c.peer) || (m.sender_id === c.peer && m.recipient_id === me.id));
  const show = m => {                                         // নামগুলো আগে লোড করা থাকতে হবে
    if (seen.has(m.id) || !belongs(m)) return;
    seen.add(m.id);
    const mine = m.sender_id === me.id, t = new Date(m.created_at).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
    box.insertAdjacentHTML('beforeend', `<div class="msg ${mine ? 'me' : ''}"><small>${mine ? 'আমি' : esc(nameOf(m.sender_id))} · ${t}</small><div>${esc(m.body)}</div></div>`);
    box.scrollTop = box.scrollHeight;
  };

  // আগের মেসেজ
  let q = sb.from('messages').select('*').order('created_at', { ascending: false }).limit(100);
  q = c.gid ? q.eq('group_id', c.gid)
    : q.is('group_id', null).or(`and(sender_id.eq.${me.id},recipient_id.eq.${c.peer}),and(sender_id.eq.${c.peer},recipient_id.eq.${me.id})`);
  const { data: hist } = await q;
  const rows = (hist || []).reverse();
  await loadNames(rows.map(m => m.sender_id));
  rows.forEach(show);

  // নতুন মেসেজ রিয়েলটাইমে (RLS থাকায় শুধু আমার দেখার অধিকারের মেসেজই আসে)
  chan = sb.channel('chat-' + Date.now())
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
      p => loadNames([p.new.sender_id]).then(() => show(p.new)))
    .subscribe();

  $c('sf').onsubmit = async e => {
    e.preventDefault();
    const body = $c('txt').value.trim(); if (!body) return;
    $c('txt').value = ''; $c('em').textContent = '';
    const row = { sender_id: me.id, body };
    if (c.gid) row.group_id = c.gid; else row.recipient_id = c.peer;
    const { data, error } = await sb.from('messages').insert(row).select().single();
    if (error) { $c('em').textContent = 'পাঠানো যায়নি: ' + error.message; $c('txt').value = body; return; }
    await loadNames([me.id]); show(data);                      // রিয়েলটাইম দেরি করলেও নিজের মেসেজ সাথে সাথে দেখা যায়
  };
}
