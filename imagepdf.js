/* ===== ফেজ ৪: ছবি থেকে PDF (পুরোটা ব্রাউজারেই চলে, কিছু আপলোড হয় না) ===== */

const imgItems = [];            // বাছাই করা ছবিগুলো: { name, url, img }
const PDF_MARGIN = 10;          // মিলিমিটার: A4 পেজের চারপাশে ফাঁকা জায়গা
const MAX_SIDE = 2000;          // বড় ছবি এর চেয়ে ছোট করা হয় (ফোনের মেমরি বাঁচাতে)

function imagePdfPage() {
  const $ = id => document.getElementById(id);
  document.getElementById('app').innerHTML = `<h1>ছবি থেকে PDF</h1><section class="card">
    <p>এক বা একাধিক ছবি বাছুন, ক্রম ঠিক করুন, তারপর একটি PDF নামান। সব কাজ আপনার ফোনেই হয়, ছবি কোথাও আপলোড হয় না।</p>
    <p><button id="bg">গ্যালারি থেকে বাছুন</button> <button id="bc" class="ghost">ক্যামেরায় তুলুন</button></p>
    <input type="file" id="gal" accept="image/*" multiple hidden>
    <input type="file" id="cam" accept="image/*" capture="environment" hidden>
    <div id="msg" class="no" aria-live="polite"></div><div id="il"></div>
    <p><label><input type="checkbox" id="auto" checked> চওড়া ছবির জন্য পেজ আড়াআড়ি (landscape) করুন</label></p>
    <p><button id="mk">PDF বানান ও ডাউনলোড</button> <button id="clr" class="ghost">সব মুছুন</button></p></section>`;

  function draw() {
    $('il').innerHTML = imgItems.length ? imgItems.map((it, i) => `<div class="att-row">
      <img class="thumb" src="${it.url}" alt="ছবি ${i + 1}"><span class="nm">${i + 1}. ${esc(it.name)}</span>
      <button class="tg" data-i="${i}" data-a="up" aria-label="উপরে তুলুন" ${i === 0 ? 'disabled' : ''}>↑</button>
      <button class="tg" data-i="${i}" data-a="down" aria-label="নিচে নামান" ${i === imgItems.length - 1 ? 'disabled' : ''}>↓</button>
      <button class="tg" data-i="${i}" data-a="del" aria-label="মুছুন">✕</button></div>`).join('')
      : '<p class="mute">এখনো কোনো ছবি বাছা হয়নি।</p>';
    $('mk').disabled = !imgItems.length;
  }

  $('il').onclick = e => {
    const b = e.target.closest('button[data-a]'); if (!b) return;
    const i = +b.dataset.i, a = b.dataset.a;
    if (a === 'del') URL.revokeObjectURL(imgItems.splice(i, 1)[0].url);
    else { const j = a === 'up' ? i - 1 : i + 1; [imgItems[i], imgItems[j]] = [imgItems[j], imgItems[i]]; }
    draw();
  };

  async function addFiles(files) {
    const bad = [];
    for (const f of files) {
      if (!f.type.startsWith('image/')) { bad.push(f.name); continue; }
      const url = URL.createObjectURL(f), img = new Image();
      img.src = url;
      try { await img.decode(); imgItems.push({ name: f.name, url, img }); }
      catch (e) { URL.revokeObjectURL(url); bad.push(f.name); }
    }
    $('msg').textContent = bad.length ? 'এই ফাইল পড়া যায়নি (JPG/PNG/WebP চলবে): ' + bad.join(', ') : '';
    draw();
  }
  for (const [btn, inp] of [['bg', 'gal'], ['bc', 'cam']]) {
    $(btn).onclick = () => $(inp).click();
    $(inp).onchange = async e => { await addFiles([...e.target.files]); e.target.value = ''; };  // একই ছবি আবার বাছা যাবে
  }
  $('clr').onclick = () => { imgItems.forEach(it => URL.revokeObjectURL(it.url)); imgItems.length = 0; $('msg').textContent = ''; draw(); };

  $('mk').onclick = async () => {
    $('mk').disabled = true;
    try {
      const pdf = await buildPdf($('auto').checked, (n, t) => ($('msg').textContent = `তৈরি হচ্ছে... ${n}/${t}`));
      pdf.save(`images-${todayStr()}.pdf`);
      $('msg').textContent = '';
    } catch (e) { $('msg').textContent = 'PDF বানানো যায়নি। কম ছবি দিয়ে আবার চেষ্টা করুন।'; }
    $('mk').disabled = false;
  };
  draw();
}

/* প্রতিটি ছবি এক A4 পেজে, মার্জিন রেখে, অনুপাত ঠিক রেখে মাঝখানে বসে */
async function buildPdf(autoRotate, onProgress) {
  const { jsPDF } = window.jspdf;
  let pdf;
  for (let i = 0; i < imgItems.length; i++) {
    const img = imgItems[i].img, w = img.naturalWidth, h = img.naturalHeight;
    const land = autoRotate && w > h, orient = land ? 'l' : 'p';
    const PW = land ? 297 : 210, PH = land ? 210 : 297;
    if (i === 0) pdf = new jsPDF({ orientation: orient, unit: 'mm', format: 'a4' });
    else pdf.addPage('a4', orient);

    // বড় ছবি ছোট করে সাদা ব্যাকগ্রাউন্ডে JPEG বানাই (PNG-র স্বচ্ছ অংশ কালো হওয়া ঠেকাতে)
    const k = Math.min(1, MAX_SIDE / Math.max(w, h));
    const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(img, 0, 0, c.width, c.height);

    const fit = Math.min((PW - 2 * PDF_MARGIN) / w, (PH - 2 * PDF_MARGIN) / h), dw = w * fit, dh = h * fit;
    pdf.addImage(c.toDataURL('image/jpeg', 0.85), 'JPEG', (PW - dw) / 2, (PH - dh) / 2, dw, dh);
    onProgress(i + 1, imgItems.length);
    await new Promise(r => setTimeout(r));      // স্ক্রিন আপডেট হওয়ার সুযোগ দিই
  }
  return pdf;
}
