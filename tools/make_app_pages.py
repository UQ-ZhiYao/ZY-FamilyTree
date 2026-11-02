"""Builds the phone-app pages (app/) from the website pages (web/).

    python3 tools/make_app_pages.py

The phone app is the same page with its own title and brand, no public home page, and a full-height layout.
Edit a page in web/ and run this to update the matching page in app/.
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(ROOT, 'web')
APP = os.path.join(ROOT, 'app')
PAGES = ['Login', 'Circle', 'Tree', 'Photos', 'Chat', 'Profile', 'Admin']
TITLES = {'Login': 'Zenith Yield', 'Circle': 'Zenith Yield · 家族图谱', 'Tree': 'Zenith Yield · 族谱树', 'Photos': 'Zenith Yield · 照片',
          'Chat': 'Zenith Yield · 聊天', 'Profile': 'Zenith Yield · 我的', 'Admin': 'Zenith Yield · 管理'}


def build(n):
    s = open(os.path.join(WEB, n + '.dc.html'), encoding='utf-8').read()
    s = re.sub(r'<title>[^<]*</title>', '<title>%s</title>' % TITLES[n], s, count=1)
    # brand: the app name, linking to the family map (or the sign-in page)
    m = re.search(r'(<a href=")Main\.dc\.html(" style="display: flex; align-items: center; gap: 10px; text-decoration: none;[^>]*>\n<span[^\n]*</span>\n<span style="font-size: 18px; font-weight: 700">)\{\{L\.k\d+\}\}(</span>)', s)
    assert m, n
    s = s[:m.start()] + m.group(1) + ('Login.dc.html' if n == 'Login' else 'Circle.dc.html') + m.group(2).replace('font-size: 18px', 'font-size: 17px; letter-spacing: -.2px') + 'Zenith Yield' + m.group(3) + s[m.end():]
    # the app has no public home page
    s = s.replace('href="Main.dc.html"', 'href="Login.dc.html"').replace('href="About.dc.html"', 'href="Login.dc.html"')
    if n == 'Login':
        s = s.replace('min-height: 100vh;', 'min-height: 100vh; min-height: 100dvh;', 1)
        s = re.sub(r'<a href="Login\.dc\.html" style="font-size: 14px; color: var\(--z15\); text-decoration: none">\{\{L\.k\d+\}\}</a>\n', '', s)
    else:
        s = re.sub(r'min-height: 1\d\d\dpx', 'min-height: 100vh', s, count=1)
    open(os.path.join(APP, n + '.dc.html'), 'w', encoding='utf-8').write(s)


if __name__ == '__main__':
    os.makedirs(APP, exist_ok=True)
    for n in PAGES:
        build(n)
    print('app pages updated:', ', '.join(PAGES))
