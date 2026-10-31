# Zenith Yield · 枝叶

A family tree website and installable phone app. Each family gets its own private space with:

- a star chart of how everyone is related, with titles like 堂哥, 表姐, 伯公 and 岳母 worked out automatically
- a classic family tree
- profiles and photos
- a members page where **anyone in the family can add, edit and delete relatives**

The site is in Chinese and English, with light and dark themes.

一个家族图谱网站兼手机 App。每个家族都有自己的私密空间：关系星图（称谓自动推算）、族谱树、个人资料、照片，以及「家人管理」，**家族里每个人都可以添加、修改、删除家人**。支持中文 / English、深色 / 浅色主题。

---

## How it is built

| Part | Where it runs |
|---|---|
| Website and phone app (this repository) | **GitHub Pages**, free static hosting, no build step |
| Sign‑in (email + password) | **Supabase Auth** |
| People, relationships, surname lines, photo list, change log | **Supabase Postgres**, protected by row‑level security |
| Photos and profile pictures | **Supabase Storage**, private bucket `family-media` |

Without Supabase settings, the site still runs with a **demo family** that is stored only in the visitor's browser.

### Unique keys

| Thing | Key | Example |
|---|---|---|
| Family space | `family_key` | `ZYF-7K3Q9M` |
| Surname line (宗族), one per surname per family | `clan_key` | `ZYC-R8TW2D` |
| Each person | `member_key` | `ZYM-4HXN8Q2P` |
| Each photo | `photo_key` | `ZYP-9WJ3K2TA` |

The database creates the keys, they are unique, and they never change, even if a name or surname is edited.
Each key also has an internal UUID primary key. People are grouped into their surname line automatically from the **surname** field.
The keys appear on the Profile and Family members pages and in the star chart's person panel.

## 1. Create the Supabase project (about 5 minutes)

1. Sign up at <https://supabase.com> and create a **new project**. The free plan is enough.
2. Open **SQL Editor → New query**, paste the whole of [`supabase/schema.sql`](supabase/schema.sql) and press **Run**.
   This creates the following, and is safe to run again later:
   - the tables, keys, triggers and row‑level security rules
   - the private photo bucket and its access rules
   - live updates
3. Go to **Authentication → URL Configuration** and set **Site URL** to your GitHub Pages address, for example `https://<user>.github.io/ZY-FamilyTree/`.
   Under **Redirect URLs**, add `https://<user>.github.io/ZY-FamilyTree/*`.
4. Optional: in **Authentication → Providers → Email**, leave "Confirm email" on (recommended) or turn it off for quicker testing.
5. Open **Project Settings → API**. Copy the **Project URL** and the **anon public** key into [`zy-config.js`](zy-config.js):

```js
window.ZY_CONFIG = {
  supabaseUrl: 'https://xxxxxxxx.supabase.co',
  supabaseAnonKey: 'eyJhbGciOi…'
};
```

The anon key is designed to be public. Family data stays private because every table and the photo bucket only allow
signed‑in members of that family. **Never** put the `service_role` key in this repository.

## 2. Publish on GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings → Pages → Build and deployment**. Choose **Deploy from a branch**, branch `main`, folder `/ (root)`.
3. The site is live at `https://<user>.github.io/<repository>/` after about a minute. The phone app starts at `…/AppLogin.dc.html`.

## 3. Start your family

1. Open the site, choose **注册 / Sign up**, and enter your name, email and a password of at least 8 characters.
   If email confirmation is on, open the link in the email first.
2. On **加入你的家族 / Join your family**, fill in **新建家族空间 / Start a new family space** with a family name, your surname and your gender.
   You become the family's admin and its first person.
3. Add relatives on **家人管理 / Family members**. You only need to link **parents** and a **spouse**. Siblings, uncles, cousins, in‑laws and every title are derived.
   A new child, father or sibling takes the right surname automatically.

## 4. Invite family members

1. On **家人管理 → 邀请家人 / Invite family**, press **复制邀请链接 / Copy invite link**, or read out the 8‑character **invite code**.
2. Your relative opens the link, signs up and presses **加入家族 / Join family**.
3. The first time, they pick **这是我 / This is me** from the list, or add themselves first. The star chart then centres on them.

Every member can add, edit and delete people and photos. Admins can also:

- make another member an admin
- remove an account
- change the invite code, which makes the old code stop working

One account can belong to several families and switch between them on the Family members page.

## 5. Install the phone app (PWA)

The app is called **Zenith Yield** on the home screen and uses the site's logo. Open `AppLogin.dc.html` on the phone:

- **Android / Chrome**: tap **安装 / Install** on the banner, or browser menu → Install app.
- **iPhone / iPad (Safari)**: Share → **Add to Home Screen**.

The app opens full‑screen with a bottom tab bar. The service worker caches the app's own files and never caches family data.

## Database overview (`supabase/schema.sql`)

| Table | What it holds |
|---|---|
| `families` | name, `family_key`, `join_code` |
| `family_users` | which accounts belong to which family (`admin` / `member`) |
| `clans` | one row per surname per family, with `clan_key` |
| `members` | every person, with `member_key`, `clan_id`, `father_id`, `mother_id`, `spouse_id`, profile fields, `avatar_path`, and `user_id` when linked to an account |
| `photos` | `photo_key`, storage path, title, album, date, tagged member ids |
| `activity` | change log |

Rules the database enforces:

- You can only see or change families you belong to.
- Keys and invite codes cannot be edited directly.
- Spouse links are always two‑way.
- Deleting a person clears their links and photo tags.
- One account can be linked to only one person per family.

Site functions (RPC): `zy_create_family`, `zy_join_family`, `zy_link_me`, `zy_new_join_code`, `zy_set_role`.

**家人管理 → 备份与恢复 / Backup & restore** downloads all people as JSON, or restores them from a backup. Photo files are not included.

## Privacy notes

- Everyone who joins a family can read all of that family's data, including contact details.
  The "show contact details to" setting controls what the app displays.
- Photos are resized in the browser to at most 1600 px (profile pictures 512 px) before upload. They are served through links that expire after one hour.
- Supabase's free plan includes 500 MB of database and 1 GB of file storage.

## Development

- No build step and no framework. Each page is a `*.dc.html` file: an `<x-dc>` template (`{{holes}}`, `<sc-for>`, `<sc-if>`)
  plus a `class Component` script.
  - `support.js` renders the pages.
  - `zy-store.js` is the data layer (`window.ZY`).
  - `vendor/supabase.js` is the official `@supabase/supabase-js` 2.45.4 browser build, kept here so the app works offline.
- After editing a website page, regenerate the phone‑app copies with `python3 tools/make_app_pages.py`.
- To run locally, start `python3 -m http.server 8000` and open <http://localhost:8000/>.
  Add `http://localhost:8000/*` to Supabase's redirect URLs if you test sign‑up emails locally.
