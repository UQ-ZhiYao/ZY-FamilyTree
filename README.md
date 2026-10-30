# 枝叶 · ZY FamilyTree (Zenith Yield)

A family tree website and installable phone app. Every family gets its own private space:
a star‑chart of how everyone is related, a classic tree, profiles, photos, and a members page where
**anyone in the family can add, edit and delete relatives**. Bilingual (中文 / English), light and dark themes.

一个家族图谱网站兼手机 App。每个家族都有自己的私密空间：关系星图、族谱树、个人资料、照片，以及「家人管理」——**家族里每个人都可以添加、修改、删除家人**。支持中文 / English、深色 / 浅色主题。

---

## How it works

| Part | Where it lives |
|---|---|
| Website + app code (this repository) | Public GitHub repository, served free by **GitHub Pages** |
| Each family's data (people, links, photos, avatars) | That family's own **private** GitHub repository |
| Sign‑in | Each family member's own GitHub account + a personal access token |

There is no server and no database to run. The site talks straight to the GitHub API from the browser.
Family data is never stored in this public repository, and the token never leaves the member's own browser.

```
Browser (GitHub Pages site)  ──HTTPS──>  api.github.com  ──>  private repo: your-family-data
   zy-store.js                                                 ├─ family.json   (everyone + links + photo list + change log)
                                                               ├─ photos/*.jpg  (resized in the browser before upload)
                                                               └─ avatars/*.jpg
```

Without signing in, visitors can try a **demo family** that stays in their own browser (localStorage).

## Pages

| Page | File | Phone app version |
|---|---|---|
| Home / About (public) | `Main.dc.html`, `About.dc.html` | — |
| Sign in · new family · demo | `Login.dc.html` | `AppLogin.dc.html` (the app opens here) |
| Family map (star chart, kinship titles worked out automatically) | `Circle.dc.html` | `AppCircle.dc.html` |
| Tree (ancestors on both sides, siblings, children) | `Tree.dc.html` | `AppTree.dc.html` |
| Profile: add / edit / delete a person, parents, spouse, avatar | `Profile.dc.html?id=…` | `AppProfile.dc.html` |
| Photos: upload, albums, tag people, edit, delete | `Photos.dc.html` | `AppPhotos.dc.html` |
| Family members: add, search, delete, invite accounts, backup, change log | `Admin.dc.html` | `AppAdmin.dc.html` |

## 1. Publish the site on GitHub Pages

1. Push this repository to GitHub (it can be public, because no family data is in it).
2. **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
3. After a minute the site is live at `https://<your-username>.github.io/<repository>/`.
   The phone app starts at `…/AppLogin.dc.html`.

No build step is needed. `.nojekyll` makes Pages serve the files as they are.

## 2. Start your family (the first person, usually the admin)

1. Create a GitHub token: <https://github.com/settings/tokens/new?scopes=repo&description=ZY%20FamilyTree>
   (classic token, tick **repo**). Copy it.
2. Open the site → **登入 / Sign in → 新建家族 / New family**. Paste the token, choose a repository name
   (default `zy-family-data`), and enter your name.
   This creates a **private** repository in your GitHub account with `family.json` and puts you in it.
3. Add relatives on **家人管理 / Family members**. You only need to link **parents** and a **spouse**.
   Siblings, uncles and aunts, cousins and in‑laws, and titles like 堂哥 / 表姐 / 伯公 / 岳母, are all worked out automatically.

## 3. Invite family members

1. On **家人管理 / Family members → 家族成员账号 / Family accounts**, type a relative's GitHub username and press **邀请 / Invite**.
   They become a collaborator on the private data repository.
2. They accept the invitation (in their email or at `https://github.com/<owner>/<data-repo>/invitations`),
   create their own token (step 2.1), and sign in with the repository name `owner/zy-family-data`.
3. The first time, they pick **这是我 / This is me** from the list, and the family map then centres on them.

Everyone who is a collaborator can add, edit and delete people and photos. Every change is a commit in the data repository,
so GitHub keeps the full history and anything can be restored.

### Safer tokens (recommended for larger families)

A classic `repo` token can reach all of a member's repositories. To limit it, put the data repository in a free
**GitHub organization** and have members create a **fine‑grained token** for that one repository with
*Contents: Read and write* (and *Administration: Read and write* for whoever invites people).

## 4. Install the phone app (PWA)

Open `AppLogin.dc.html` on the phone:

- **Android / Chrome**: tap **安装 / Install** on the banner (or browser menu → Install app).
- **iPhone / iPad (Safari)**: Share → **Add to Home Screen**.

The app opens full‑screen, shows a bottom tab bar, and works offline for screens already visited.
The service worker (`sw.js`) caches only the app's own files and never caches family data.

## Data format (`family.json` in the private repository)

```json
{
  "schema": 1,
  "family": { "name": "黄氏家族", "created": "2026-10-30T00:00:00Z" },
  "people": {
    "p_abc": { "id": "p_abc", "name": "黄小明", "nameEn": "Ming", "surname": "黄", "sex": "m",
               "birth": "1998-05-01", "death": "", "father": "p_dad", "mother": "p_mum", "spouse": "p_wife",
               "nationality": "", "hometown": "", "city": "", "job": "", "phone": "", "email": "", "bio": "",
               "privacy": "all", "github": "ming-huang", "avatar": "avatars/p_abc-xyz.jpg" }
  },
  "photos": [ { "id": "ph_1", "path": "photos/ph_1.jpg", "title": "", "album": "节日团聚", "date": "2025-01-29", "tags": ["p_abc"] } ],
  "log": [ { "at": "…", "by": "ming-huang", "what": "Add 黄小明" } ]
}
```

- Relationships are stored only as `father`, `mother` and `spouse` (kept two‑way automatically). Everything else is derived.
- When two people save at the same moment, `zy-store.js` reloads the latest copy and re‑applies the change, so nobody's edit is lost.
- **家人管理 → 备份与恢复 / Backup & restore** downloads or restores the whole `family.json`.

## Privacy and security notes

- Keep the data repository **private**. Anyone with access to it can read all family data, including contact details.
  The "show contact details to" setting controls the app display only.
- Tokens are stored in the member's browser (localStorage, or only for the session if "remember me" is off).
  **Sign out** on shared devices. Revoke a token at any time at <https://github.com/settings/tokens>.
- Photos are resized to at most 1600 px (avatars 512 px) before upload. A free GitHub repository comfortably holds thousands of photos,
  but GitHub recommends keeping a repository under about 1 GB.
- Because the data API is GitHub, every family member needs a (free) GitHub account.

## Known limits

- One spouse per person is shown on the star chart (remarriages can be recorded by changing the spouse link).
- The tree page shows direct ancestors up to five generations plus your siblings and children. The star chart shows everyone.

## Development

- No dependencies and no build. Each page is a `*.dc.html` file: an `<x-dc>` template (`{{holes}}`, `<sc-for>`, `<sc-if>`)
  plus a `class Component` script. `support.js` renders them in any browser, and `zy-store.js` is the data layer (`window.ZY`).
- The same page files open in the Claude design canvas, which uses its own `support.js`.
- After editing a website page, regenerate the phone‑app copies: `python3 tools/make_app_pages.py`.
- Run locally: `python3 -m http.server 8000`, then open <http://localhost:8000/>.

Translations: interface text is in each page (`t` objects and the generated `L` tables). Kinship titles are translated by rules in
`_zyTr` (for example 大伯 → "Eldest uncle", 妻子的外婆 → "Wife's grandma").
