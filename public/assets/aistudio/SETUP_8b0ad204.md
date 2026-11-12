# ARES OS v2.6 – আপডেট গাইড

## ১. ফাইল কোথায় বসাবেন
আপনার প্রজেক্টের একই নামের ফাইলগুলো এই ফাইল দিয়ে replace করুন:

| ফাইল | কাজ |
|---|---|
| `ares/settings.py` | auth, media (ছবি/ভিডিও) ও session সেটিং |
| `ares/urls.py` | media ফাইল সার্ভ করা |
| `core/models.py` | Profile, Media, AIAssessment, GroundCall, OverrideLog যোগ |
| `core/services.py` (**নতুন**) | ADI, AI screening, PFA reply, sensor simulation |
| `core/views.py`, `core/urls.py` | login/role/API সব |
| `core/admin.py` | ছবি, ব্যাকগ্রাউন্ড, override code আপলোড/সেট |
| `core/management/commands/seed_ares.py` (**নতুন**) | ডেমো ইউজার তৈরি |
| `core/templates/core/index.html` + `_pod.html`, `_cmo.html`, `_ground.html`, `login.html` | UI |
| `core/static/core/css/style.css`, `core/static/core/js/main.js` | এখন আর inline নয় |

## ২. চালানো
```bash
pip install -r requirements.txt
python manage.py makemigrations core
python manage.py migrate
python manage.py seed_ares
python manage.py runserver
```
> পুরোনো `migrations/0001` রেখে দিলে সমস্যা নেই, নতুন `0002` তৈরি হবে।
> ডেটা না লাগলে `db.sqlite3` ও migrations (শুধু `__init__.py` বাদে) মুছে নতুন করে শুরু করা সবচেয়ে সহজ।

Login: `http://127.0.0.1:8000/` — পাসওয়ার্ড সবার: **Ares@2026**

| ইউজার | রোল | যা দেখবে |
|---|---|---|
| `vance`, `rossi`, `tanaka` | Astronaut | POD UI (নিজের ছবি ও ব্যাকগ্রাউন্ড) |
| `stone` | CMO | CMO ড্যাশবোর্ড |
| `captain` | Flight Commander | CMO কনসোল (override-এ কমান্ডার কী) |
| `ground` | Ground Station | গ্রাউন্ড স্টেশন |

Override কোড (ডেমো): **Captain = `CAP99`**, **CMO = `CMO00`** — `/admin/` থেকে বদলে নিন।

## ৩. ছবি/ব্যাকগ্রাউন্ড ম্যানুয়ালি দেওয়া (পয়েন্ট ৫)
`python manage.py createsuperuser` → `/admin/` → **Astronaut profiles** → প্রোফাইল খুলে
`Profile picture` ও `Background image` আপলোড করুন। ছবি না দিলে initials + `theme_color`-এর রঙিন ব্যাকগ্রাউন্ড দেখাবে।
Family/Shared media দিতে **Media items**-এ `owner` ফাঁকা রেখে ফাইল দিন — সব astronaut দেখবে।

## ৪. ৯টি পয়েন্ট কোথায় হয়েছে
1. **Ground station** – `ground` রোল, `_ground.html` (কল, ক্রু টেলিমেট্রি, AI screening)
2. **আলাদা Astronaut profile** – POD হেডারে ছবি/নাম/ID; CMO-তে ক্রু কার্ডে ক্লিক করলে Profile panel
3. **Commander + CMO override** – Dual-key এখন **সার্ভারে** যাচাই হয় (hash করা), audit log, ৩ বার ভুলে ৫ মিনিট lock, চূড়ান্ত confirm
4. **Authentication** – `/login/`, session timeout ২ ঘণ্টা, রোল-ভিত্তিক API
5. **প্রোফাইল ছবি + ব্যাকগ্রাউন্ড** – লগইন করা astronaut অনুযায়ী বদলায়
6. **Media (POD)** – Media Library ট্যাব (audio/video/image আপলোড, প্লে, ডিলিট) + chat-এ Attach
7. **Ground-এ কল** – CMO UI-তে "Call Ground Support" (কারণ, রোগী, priority); ground রেসপন্স দিলে CMO দেখে
8. **Emergency section (CMO)** – প্রতিটি astronaut-এর AI-suggested অবস্থা, severity, কারণ ও করণীয়
9. **Voice guide** – উপরে VOICE GUIDE ON করলে ব্রাউজারের speech দিয়ে স্ক্রিন/অ্যালার্ম/AI উত্তর পড়ে শোনায়

## ৫. জানা দরকার
- সেন্সর ডেটা **সিমুলেটেড** (`services.simulate_reading`); আসল ডিভাইস হলে এখানে বদলান।
- AI screening একটি **নিয়ম-ভিত্তিক (rule-based) ডেমো**, ডায়াগনসিস নয়; UI-তেও সেটা লেখা আছে। পরে LLM/ML model জুড়তে চাইলে `services.run_assessment` বদলালেই হবে।
- Voice guide ব্রাউজারের Web Speech API ব্যবহার করে (Chrome/Edge সবচেয়ে ভালো); ব্রাউজার নিয়ম অনুযায়ী প্রথমে একবার বাটনে ক্লিক করতে হয়।
- Production-এ `ARES_SECRET_KEY` সেট করুন, `ARES_DEBUG=0` দিন এবং ডেমো পাসওয়ার্ড/কোড বদলান।
