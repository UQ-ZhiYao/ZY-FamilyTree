"""Regenerates the phone-app pages (App*.dc.html) from the website pages.

Run after editing Login / Circle / Tree / Photos / Profile / Admin:
    python3 tools/make_app_pages.py
The app pages are the same screens with the app name "Zenith Yield", app icons and install
prompt, links that stay inside the app, and the PWA service worker.
"""
import re
import os
P=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))+'/'
def rep(s,a,b,n=1):
    assert s.count(a)==n,(a[:70],s.count(a)); return s.replace(a,b)
HEAD="""<link rel="manifest" href="./manifest.webmanifest">
<meta name="theme-color" content="#0B1532">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Zenith Yield">
<meta name="application-name" content="Zenith Yield">
<link rel="apple-touch-icon" href="./icons/zy-apple-touch-180.png">
<link rel="icon" type="image/png" sizes="192x192" href="./icons/zy-icon-192.png">
"""
PWA="""  _zyPWA() {
    try { if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('./sw.js').catch(() => {}); } catch (e) {}
  }
"""
TITLES={'Login':'Zenith Yield','Circle':'Zenith Yield · 家族图谱','Tree':'Zenith Yield · 族谱树','Photos':'Zenith Yield · 照片','Profile':'Zenith Yield · 我的','Admin':'Zenith Yield · 管理'}
for n in ['Login','Circle','Tree','Photos','Profile','Admin']:
    s=open(P+n+'.dc.html',encoding='utf-8').read()
    s=re.sub(r'<title>[^<]*</title>','<title>%s</title>'%TITLES[n],s,count=1)
    s=rep(s,'<helmet>\n','<helmet>\n'+HEAD)
    # brand: app name, links home to the family map
    m=re.search(r'(<a href=")Main\.dc\.html(" style="display: flex; align-items: center; gap: 10px; text-decoration: none;[^>]*>\n<span[^\n]*</span>\n<span style="font-size: 18px; font-weight: 700">)\{\{L\.k\d+\}\}(</span>)',s)
    assert m,n
    s=s[:m.start()]+m.group(1)+('AppLogin.dc.html' if n=='Login' else 'AppCircle.dc.html')+m.group(2).replace('font-size: 18px','font-size: 17px; letter-spacing: -.2px')+'Zenith Yield'+m.group(3)+s[m.end():]
    for a in ['Circle','Tree','Photos','Profile','Admin','Login']:
        s=s.replace('href="%s.dc.html"'%a,'href="App%s.dc.html"'%a)
    s=s.replace('href="Main.dc.html"','href="AppLogin.dc.html"')
    s=rep(s,'class Component extends DCLogic {\n','class Component extends DCLogic {\n'+PWA)
    i=s.index('  componentDidMount() {\n'); s=s[:i]+s[i:].replace('    this._loadTheme();\n','    this._loadTheme();\n    this._zyPWA();\n',1)
    if n=='Login':
        s=s.replace('min-height: 100vh;','min-height: 100vh; min-height: 100dvh;',1)
        s=re.sub(r'<a href="AppLogin\.dc\.html" style="font-size: 14px; color: var\(--z15\); text-decoration: none">\{\{L\.k\d+\}\}</a>\n','',s)
        assert '{{L.k3}}' not in s.split('</header>')[0]
        s=rep(s,'<main style="position: relative; z-index: 1; flex: 1; display: flex; align-items: center; justify-content: center; padding: 24px 24px 72px">',
 '<main style="position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 12px 16px calc(32px + env(safe-area-inset-bottom))">\n'
 '<sc-if value="{{instShow}}" hint-placeholder-val="{{true}}">\n'
 '<div class="glass rise" role="region" aria-label="{{instTitle}}" style="width: 100%; max-width: 420px; box-sizing: border-box; border-radius: 16px; padding: 12px 10px 12px 12px; display: flex; align-items: center; gap: 12px">'
 '<img src="./icons/zy-icon-192.png" alt="" width="44" height="44" style="width: 44px; height: 44px; flex: none; border-radius: 11px">'
 '<span style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px"><b style="font-size: 14px; color: var(--z2)">{{instTitle}}</b><span style="font-size: 12px; line-height: 1.5; color: var(--z15)">{{instDesc}}</span></span>'
 '<sc-if value="{{instCan}}" hint-placeholder-val="{{false}}"><button type="button" class="cta" onClick="{{instGo}}" style="height: 36px; flex: none; padding: 0 14px; border: none; border-radius: 9px; background: var(--z21); color: var(--z8); font: inherit; font-size: 13px; font-weight: 600; cursor: pointer">{{instBtn}}</button></sc-if>'
 '<button type="button" onClick="{{instNo}}" aria-label="{{instLater}}" title="{{instLater}}" style="width: 32px; height: 32px; flex: none; border: none; border-radius: 8px; background: transparent; color: var(--z15); font: inherit; font-size: 20px; line-height: 1; cursor: pointer">×</button>'
 '</div>\n</sc-if>')
        s=rep(s,"""    this._loadTheme();
    this._zyPWA();
""","""    this._loadTheme();
    this._zyPWA();
    try { if (window.localStorage.getItem('zy-install-hide') === '1') this.setState({ instHide: true }); } catch (e) {}
    try {
      window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); this._bip = e; this.setState({ bip: 1 }); });
      window.addEventListener('appinstalled', () => { this._bip = null; this.setState({ instHide: true }); });
    } catch (e) {}
""")
        s=rep(s,"""    return Object.assign(zyLogin, {
      stars: stars, rings: rings,""","""    const enI = this.state.lang === 'en';
    let standalone = false;
    let ios = false;
    try { standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent || ''); } catch (e) {}
    const can = !!this._bip;
    return Object.assign(zyLogin, {
      instShow: !this.state.instHide && !standalone, instCan: can,
      instTitle: enI ? 'Install Zenith Yield' : '安装 Zenith Yield',
      instDesc: can ? (enI ? 'Add it to your home screen and open it full screen, like any app.' : '加到主屏幕，像普通 App 一样全屏打开。')
        : (ios ? (enI ? 'In Safari, tap Share, then “Add to Home Screen”.' : '在 Safari 点“分享”，再选“添加到主屏幕”。')
          : (enI ? 'Open the browser menu and choose “Install app” or “Add to Home screen”.' : '在浏览器菜单中选择“安装应用”或“添加到主屏幕”。')),
      instBtn: enI ? 'Install' : '安装', instLater: enI ? 'Not now' : '以后再说',
      instGo: () => { const ev = this._bip; if (!ev) return; try { ev.prompt(); ev.userChoice.then(() => { this._bip = null; this.setState({ instHide: true }); }).catch(() => {}); } catch (e) {} },
      instNo: () => { try { window.localStorage.setItem('zy-install-hide', '1'); } catch (e) {} this.setState({ instHide: true }); },
      stars: stars, rings: rings,""")
    if n in ('Tree','Photos','Profile','Admin'):
        s=re.sub(r'min-height: 1\d\d\dpx',"min-height: 100vh",s,count=1)
    open(P+'App'+n+'.dc.html','w',encoding='utf-8').write(s)
print('App pages regenerated')
