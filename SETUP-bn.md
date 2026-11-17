# কোড ক্লাস — সেটআপ গাইড (শুরুর জন্য)

সব ধাপ ফ্রি। পুরো কাজ ৩০–৪৫ মিনিটের। ধাপগুলো ক্রমানুসারে করুন।

## ধাপ ০: কম্পিউটারে চালিয়ে দেখা
1. VS Code ইনস্টল করুন, তারপর **Live Server** এক্সটেনশন ইনস্টল করুন।
2. `code-class` ফোল্ডার VS Code-এ খুলুন, `index.html`-এ রাইট-ক্লিক → **Open with Live Server**।
3. মনে রাখুন: `index.html` ডাবল-ক্লিক করে খুললে লেসন লোড হবে না।

## ধাপ ১: Supabase প্রজেক্ট (লগইন ও চ্যাটের জন্য)
1. [supabase.com](https://supabase.com) এ গিয়ে ফ্রি অ্যাকাউন্ট খুলুন → **New project**।
2. নাম দিন `code-class`, একটি শক্ত ডাটাবেস পাসওয়ার্ড দিন (কোথাও লিখে রাখুন), এলাকা বেছে নিন (যেমন Singapore), **Create**। ২–৩ মিনিট অপেক্ষা করুন।
3. বাঁ মেনুতে **Authentication → Providers → Email**-এ গিয়ে ক্লাসের সুবিধার জন্য **Confirm email** বন্ধ করুন (নইলে প্রত্যেককে ইমেইল যাচাই করতে হবে), তারপর Save।

## ধাপ ২: SQL চালানো
1. বাঁ মেনু থেকে **SQL Editor → New query**।
2. `supabase/schema.sql` ফাইলের পুরো লেখা কপি করে পেস্ট করুন, তারপর **Run** চাপুন।
3. "Success" এলে **Table Editor**-এ `profiles`, `groups`, `group_members`, `messages` টেবিল দেখতে পাবেন।
4. ভুল হলে (যেমন দুইবার চালিয়েছেন) টেবিলগুলো মুছে আবার প্রথম থেকে চালান।

## ধাপ ৩: Supabase-এর কী config.js-এ বসানো
1. **Project Settings → API** (বা Data API / API Keys) খুলুন।
2. **Project URL** কপি করে `config.js`-এর `SUPABASE_URL`-এ পেস্ট করুন।
3. **anon public key** কপি করে `SUPABASE_ANON_KEY`-এ পেস্ট করুন (নতুন ড্যাশবোর্ডে এর নাম **Publishable key** হতে পারে)।
4. ⚠️ কখনো **service_role** (secret) কী ফ্রন্টএন্ডে বা GitHub-এ দেবেন না। anon কী প্রকাশ্য হলে সমস্যা নেই, কারণ নিরাপত্তা দেখে SQL-এর Row Level Security।

## ধাপ ৪: Google Sheet ও Apps Script (হাজিরার জন্য)
1. [sheets.google.com](https://sheets.google.com)-এ নতুন Sheet খুলুন, নাম দিন "Code Class Attendance"।
2. মেনু **Extensions → Apps Script**।
3. পুরনো কোড মুছে `apps-script/Code.gs`-এর পুরোটা পেস্ট করুন।
4. উপরের `CAPTAIN_PIN = '1234'`-এ নিজের গোপন PIN বসান। এটি শুধু ক্যাপ্টেন জানবে।
5. **Deploy → New deployment** → ধরন (গিয়ার আইকন) **Web app** → *Execute as*: **Me** → *Who has access*: **Anyone** → **Deploy**। Google অনুমতি চাইলে Allow করুন (Advanced → Go to project)।
6. যে **Web app URL** পাবেন তা `config.js`-এর `ATTENDANCE_URL`-এ পেস্ট করুন।
7. `ROLL_LIST`-এ আপনার ক্লাসের রোল ও নাম লিখুন।
8. পরে Code.gs বদলালে **Deploy → Manage deployments → Edit (পেন্সিল) → Version: New version → Deploy** করতে হবে।

## ধাপ ৫: নিজে পরীক্ষা করুন
- [ ] HTML-এর প্রথম লেসনের টাস্ক শেষ করে "চেক করুন" চাপুন, ✓ আসছে কি?
- [ ] প্রোফাইলে প্রগ্রেস বাড়ছে কি?
- [ ] হাজিরা পেজে PIN দিয়ে ঢুকে একটি হাজিরা জমা দিন, Sheet-এ সারি এসেছে কি?
- [ ] পুরনো হাজিরা থেকে PDF ও CSV নামান।
- [ ] ছবি→PDF-এ দুটি ছবি দিয়ে PDF বানান।
- [ ] দুটি আলাদা ব্রাউজারে (বা একটি ইনকগনিটো) দুজন ইউজার খুলে মেসেজ ও গ্রুপ চ্যাট পরীক্ষা করুন।

## ধাপ ৬: GitHub Pages-এ ফ্রি প্রকাশ
1. [github.com](https://github.com)-এ অ্যাকাউন্ট খুলুন → **New repository** → নাম `code-class`, **Public** → Create।
2. **uploading an existing file** লিংকে ক্লিক করুন। `code-class` ফোল্ডারের **ভেতরের সব ফাইল ও ফোল্ডার** (index.html, app.js, supabase ফোল্ডার ইত্যাদি) টেনে এনে ছাড়ুন → **Commit changes**। ফোল্ডারটি নিজে নয়, তার ভেতরের জিনিস দিন, নইলে `index.html` মূল স্তরে থাকবে না।
3. **Settings → Pages**-এ *Source*: **Deploy from a branch**, *Branch*: **main** / **(root)** → Save।
4. ১–২ মিনিট পর পেজের উপরে `https://আপনার-নাম.github.io/code-class/` লিংক দেখাবে। ফোনে খুলে ব্রাউজার মেনু থেকে **Install app / Add to Home screen** দিন।
5. বিকল্প: [app.netlify.com/drop](https://app.netlify.com/drop)-এ ফোল্ডারটি টেনে ছেড়ে দিলেই লিংক পাবেন।
6. ⚠️ Repository **Public** হলে `config.js`-এর সব লেখা সবাই দেখতে পাবে। তাই এখানে শুধু anon কী ও Apps Script URL রাখুন, আর ক্যাপ্টেন PIN শুধু Apps Script-এর ভেতরে রাখুন (config.js-এ নয়)।

## নিয়মিত কাজ (সহজ সম্পাদনা)
- **নতুন লেসন:** `lessons.json`-এ একটি `{ }` ব্লক কপি করে `id`, `title`, `explain`, `example`, `task` বদলান। কোডের ভেতরে `"` নয়, `'` ব্যবহার করুন।
- **ছাত্র যোগ/বাদ:** `config.js`-এর `ROLL_LIST` বদলান।
- **ডেমো প্রোফাইল সংখ্যা:** `app.js`-এর উপরের `DEMO`।
- সব লেসন খুলে পরীক্ষা করতে `app.js`-এ `UNLOCK_ALL = true` করুন, প্রকাশের আগে আবার `false`।
- ফাইল বদলে আপলোড করার পর পুরনো কপি দেখালে ব্রাউজার রিফ্রেশ করুন (বড় বদলে `sw.js`-এর `CACHE` নাম `v2` করুন)।

## সমস্যা হলে
| সমস্যা | কারণ ও সমাধান |
|---|---|
| "lessons.json লোড হয়নি" | ফাইল ডাবল-ক্লিকে খুলেছেন। Live Server বা GitHub Pages ব্যবহার করুন। |
| হাজিরায় "PIN ভুল" | Code.gs-এর `CAPTAIN_PIN` আর আপনি যা দিচ্ছেন মেলেনি। বদলানোর পর নতুন ভার্সন Deploy করেছেন? |
| হাজিরায় "সংযোগ হয়নি" | Web app-এর *Who has access* **Anyone** আছে কি? URL পুরোটা পেস্ট হয়েছে কি? |
| সাইন-আপে "Database error" | SQL পুরোটা চালানো হয়নি, অথবা ইউজারনেম ৩০ অক্ষরের বেশি। |
| মেসেজ লাইভ আসে না | SQL-এর শেষ লাইন (`alter publication ... add table`) চালিয়েছেন কি? রিফ্রেশ করে দেখুন। |
| অনেকদিন পর চ্যাট কাজ করে না | ফ্রি Supabase প্রজেক্ট দীর্ঘ নিষ্ক্রিয়তায় বিরতিতে (paused) যেতে পারে। Dashboard থেকে Restore করুন। |
