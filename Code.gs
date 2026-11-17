/* ===== কোড ক্লাস — হাজিরা ব্যাকএন্ড (Google Apps Script) =====
   Google Sheet-এর Extensions > Apps Script-এ এই পুরো কোড পেস্ট করুন। */

// ★ এই PIN অবশ্যই বদলান (শুধু ক্যাপ্টেন জানবে)
const CAPTAIN_PIN = '1234';
const SHEET_NAME = 'Attendance';

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['Date', 'Roll', 'Name', 'Status', 'SavedAt']);
    sh.getRange('A:E').setNumberFormat('@');   // সব টেক্সট, যাতে তারিখ বদলে না যায়
  }
  return sh;
}
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// হাজিরা সেভ: একই তারিখের পুরনো হাজিরা মুছে নতুনটা বসে (ভুল শোধরানো যায়)
function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents);
    if (String(b.pin) !== CAPTAIN_PIN) return json_({ ok: false, error: 'PIN ভুল' });
    const sh = sheet_(), date = String(b.date);
    const data = sh.getDataRange().getValues();
    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][0]) === date) sh.deleteRow(i + 1);
    }
    const now = new Date().toISOString();
    const rows = (b.records || []).map(r => [date, String(r.roll), String(r.name), String(r.status), now]);
    if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, 5).setNumberFormat('@').setValues(rows);
    return json_({ ok: true, saved: rows.length });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// পড়া: ?action=dates&pin=...  → সব তারিখের তালিকা
//       ?action=get&date=2026-11-17&pin=...  → ওই দিনের হাজিরা
function doGet(e) {
  try {
    const p = e.parameter;
    if (String(p.pin) !== CAPTAIN_PIN) return json_({ ok: false, error: 'PIN ভুল' });
    const data = sheet_().getDataRange().getValues().slice(1);
    if (p.action === 'dates') {
      const dates = [...new Set(data.map(r => String(r[0])))].sort().reverse();
      return json_({ ok: true, dates: dates });
    }
    if (p.action === 'get') {
      const records = data.filter(r => String(r[0]) === p.date)
        .map(r => ({ roll: r[1], name: r[2], status: r[3] }));
      return json_({ ok: true, date: p.date, records: records });
    }
    return json_({ ok: false, error: 'অজানা action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}
