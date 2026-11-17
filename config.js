/* ===== কনফিগ ফাইল: এখানেই সব সেটিং বসান ===== */

// ১) Google Apps Script ডিপ্লয় করার পর পাওয়া "Web app URL" এখানে পেস্ট করুন
const ATTENDANCE_URL = 'PASTE_APPS_SCRIPT_WEB_APP_URL_HERE';

// ২) ক্লাসের রোল তালিকা — নতুন ছাত্র যোগ করতে একটি লাইন কপি করে রোল ও নাম বদলান
//    (কমা দিতে ভুলবেন না, নামে ডাবল কোট " ব্যবহার করবেন না)
const ROLL_LIST = [
  { roll: 1, name: 'আব্দুল্লাহ' },
  { roll: 2, name: 'ফাতেমা' },
  { roll: 3, name: 'রাকিব' },
  { roll: 4, name: 'সুমাইয়া' },
  { roll: 5, name: 'তানভীর' }
];

// ৩) Supabase-এর কী (Project Settings > API থেকে) (শুধু anon/public key, কখনো service_role key নয়)
const SUPABASE_URL = 'PASTE_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'PASTE_SUPABASE_ANON_KEY';
