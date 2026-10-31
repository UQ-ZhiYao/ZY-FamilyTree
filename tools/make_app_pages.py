import re
P='/home/claude/zy/zhiye/project/'
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
TITLES={'Login':'Zenith Yield','Circle':'Zenith Yield · 家族图谱','Tree':'Zenith Yield · 族谱树','Photos':'Zenith Yield · 照片','Profile':'Zenith Yield · 我的','Admin':'Zenith Yield · 管理','Chat':'Zenith Yield · 聊天'}
for n in ['Login','Circle','Tree','Photos','Profile','Admin','Chat']:
    s=open(P+n+'.dc.html',encoding='utf-8').read()
    s=re.sub(r'<title>[^<]*</title>','<title>%s</title>'%TITLES[n],s,count=1)
    # brand: app name, links home to the family map
    m=re.search(r'(<a href=")Main\.dc\.html(" style="display: flex; align-items: center; gap: 10px; text-decoration: none;[^>]*>\n<span[^\n]*</span>\n<span style="font-size: 18px; font-weight: 700">)\{\{L\.k\d+\}\}(</span>)',s)
    assert m,n
    s=s[:m.start()]+m.group(1)+('AppLogin.dc.html' if n=='Login' else 'AppCircle.dc.html')+m.group(2).replace('font-size: 18px','font-size: 17px; letter-spacing: -.2px')+'Zenith Yield'+m.group(3)+s[m.end():]
    for a in ['Circle','Tree','Photos','Profile','Admin','Login','Chat']:
        s=s.replace('href="%s.dc.html"'%a,'href="App%s.dc.html"'%a)
    s=s.replace('href="Main.dc.html"','href="AppLogin.dc.html"')
    if n=='Login':
        s=s.replace('min-height: 100vh;','min-height: 100vh; min-height: 100dvh;',1)
        s=re.sub(r'<a href="AppLogin\.dc\.html" style="font-size: 14px; color: var\(--z15\); text-decoration: none">\{\{L\.k\d+\}\}</a>\n','',s)
        assert '{{L.k3}}' not in s.split('</header>')[0]
    if n in ('Tree','Photos','Profile','Admin','Chat'):
        s=re.sub(r'min-height: 1\d\d\dpx',"min-height: 100vh",s,count=1)
    open(P+'App'+n+'.dc.html','w',encoding='utf-8').write(s)
print('ok')
