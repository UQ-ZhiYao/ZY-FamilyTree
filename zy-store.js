/*
 * ZY FamilyTree data store (window.ZY)
 * -------------------------------------------------------------
 * Two back ends, same API:
 *   demo   : sample family kept in this browser (localStorage). Nothing leaves the device.
 *   github : the family's data lives in a PRIVATE GitHub repository (family.json + photos/ + avatars/).
 *            Every family member is a collaborator on that repository and signs in with a GitHub token.
 * Pages read ZY.data / ZY.meId and call ZY.savePerson / ZY.deletePerson / ZY.addPhoto ...
 * Every change is a small "operation" that is re-applied on top of the latest copy if two people
 * save at the same time, so edits from different family members never overwrite each other.
 */
(function () {
  'use strict';
  if (window.ZY) return;
  var SEED = {"schema":1,"family":{"name":"示例家族","created":"2026-10-30T00:00:00Z"},"people":{"me":{"id":"me","name":"Yao","nameEn":"Yao","surname":"吴","sex":"m","birth":"1998","father":"father","mother":"mother","spouse":"wife"},"wife":{"id":"wife","name":"妻子","nameEn":"Wife","surname":"林","sex":"f","birth":"1999","father":"wf","mother":"wm","spouse":"me"},"wggf":{"id":"wggf","name":"妻子的曾祖父","nameEn":"Wife's great-grandpa","surname":"林","sex":"m","birth":"1912","father":null,"mother":null,"spouse":"wggm"},"wggm":{"id":"wggm","name":"妻子的曾祖母","nameEn":"Wife's great-grandma","surname":"","sex":"f","birth":"1914","father":null,"mother":null,"spouse":"wggf"},"wgf":{"id":"wgf","name":"妻子的爷爷","nameEn":"Wife's grandpa","surname":"林","sex":"m","birth":"1940","father":"wggf","mother":"wggm","spouse":"wgm"},"wgm":{"id":"wgm","name":"妻子的奶奶","nameEn":"Wife's grandma","surname":"","sex":"f","birth":"1942","father":null,"mother":null,"spouse":"wgf"},"wmgf":{"id":"wmgf","name":"妻子的外公","nameEn":"Wife's grandpa","surname":"张","sex":"m","birth":"1943","father":null,"mother":null,"spouse":"wmgm"},"wmgm":{"id":"wmgm","name":"妻子的外婆","nameEn":"Wife's grandma","surname":"","sex":"f","birth":"1945","father":null,"mother":null,"spouse":"wmgf"},"wf":{"id":"wf","name":"岳父","nameEn":"Father-in-law","surname":"林","sex":"m","birth":"1969","father":"wgf","mother":"wgm","spouse":"wm"},"wm":{"id":"wm","name":"岳母","nameEn":"Mother-in-law","surname":"张","sex":"f","birth":"1971","father":"wmgf","mother":"wmgm","spouse":"wf"},"wu":{"id":"wu","name":"妻子的伯父","nameEn":"Wife's uncle","surname":"林","sex":"m","birth":"1965","father":"wgf","mother":"wgm","spouse":"wuw"},"wuw":{"id":"wuw","name":"妻子的伯母","nameEn":"Wife's aunt","surname":"","sex":"f","birth":"1967","father":null,"mother":null,"spouse":"wu"},"wmu":{"id":"wmu","name":"妻子的舅舅","nameEn":"Wife's uncle","surname":"张","sex":"m","birth":"1974","father":"wmgf","mother":"wmgm","spouse":null},"wb":{"id":"wb","name":"大舅子","nameEn":"Brother-in-law","surname":"林","sex":"m","birth":"1996","father":"wf","mother":"wm","spouse":"wbw"},"wbw":{"id":"wbw","name":"舅嫂","nameEn":"Sister-in-law","surname":"","sex":"f","birth":"1997","father":null,"mother":null,"spouse":"wb"},"wsis":{"id":"wsis","name":"小姨子","nameEn":"Sister-in-law","surname":"林","sex":"f","birth":"2003","father":"wf","mother":"wm","spouse":"wsish"},"wsish":{"id":"wsish","name":"连襟","nameEn":"Brother-in-law","surname":"","sex":"m","birth":"2002","father":null,"mother":null,"spouse":"wsis"},"wc":{"id":"wc","name":"妻子的堂姐","nameEn":"Wife's cousin","surname":"林","sex":"f","birth":"1994","father":"wu","mother":"wuw","spouse":null},"wbk":{"id":"wbk","name":"妻子的侄子","nameEn":"Wife's nephew","surname":"林","sex":"m","birth":"2023","father":"wb","mother":"wbw","spouse":null},"wsisk":{"id":"wsisk","name":"妻子的外甥女","nameEn":"Wife's niece","surname":"","sex":"f","birth":"2025","father":"wsish","mother":"wsis","spouse":null},"gggf":{"id":"gggf","name":"高祖父","nameEn":"Great-great-grandpa","surname":"吴","sex":"m","birth":"1880","father":null,"mother":null,"spouse":"gggm"},"gggm":{"id":"gggm","name":"高祖母","nameEn":"Great-great-grandma","surname":"","sex":"f","birth":"1882","father":null,"mother":null,"spouse":"gggf"},"ggf":{"id":"ggf","name":"曾祖父","nameEn":"Great-grandpa","surname":"吴","sex":"m","birth":"1905","father":"gggf","mother":"gggm","spouse":"ggm"},"ggm":{"id":"ggm","name":"曾祖母","nameEn":"Great-grandma","surname":"","sex":"f","birth":"1907","father":null,"mother":null,"spouse":"ggf"},"mgggf":{"id":"mgggf","name":"外高祖父","nameEn":"Great-great-grandpa","surname":"陈","sex":"m","birth":"1885","father":null,"mother":null,"spouse":"mgggm"},"mgggm":{"id":"mgggm","name":"外高祖母","nameEn":"Great-great-grandma","surname":"","sex":"f","birth":"1887","father":null,"mother":null,"spouse":"mgggf"},"mggf":{"id":"mggf","name":"外曾祖父","nameEn":"Great-grandpa","surname":"陈","sex":"m","birth":"1910","father":"mgggf","mother":"mgggm","spouse":"mggm"},"mggm":{"id":"mggm","name":"外曾祖母","nameEn":"Great-grandma","surname":"","sex":"f","birth":"1912","father":null,"mother":null,"spouse":"mggf"},"grandpa":{"id":"grandpa","name":"爷爷","nameEn":"Grandpa","surname":"吴","sex":"m","birth":"1935","father":"ggf","mother":"ggm","spouse":"grandma"},"grandma":{"id":"grandma","name":"奶奶","nameEn":"Grandma","surname":"","sex":"f","birth":"1937","father":null,"mother":null,"spouse":"grandpa"},"gu1":{"id":"gu1","name":"伯公","nameEn":"Great-uncle","surname":"吴","sex":"m","birth":"1930","father":"ggf","mother":"ggm","spouse":"gu1w"},"gu1w":{"id":"gu1w","name":"伯婆","nameEn":"Great-aunt","surname":"","sex":"f","birth":"1932","father":null,"mother":null,"spouse":"gu1"},"gu2":{"id":"gu2","name":"叔公","nameEn":"Great-uncle","surname":"吴","sex":"m","birth":"1940","father":"ggf","mother":"ggm","spouse":"gu2w"},"gu2w":{"id":"gu2w","name":"叔婆","nameEn":"Great-aunt","surname":"","sex":"f","birth":"1942","father":null,"mother":null,"spouse":"gu2"},"ga1":{"id":"ga1","name":"姑婆","nameEn":"Great-aunt","surname":"吴","sex":"f","birth":"1942","father":"ggf","mother":"ggm","spouse":"ga1h"},"ga1h":{"id":"ga1h","name":"姑公","nameEn":"Great-uncle","surname":"","sex":"m","birth":"1940","father":null,"mother":null,"spouse":"ga1"},"mgrandpa":{"id":"mgrandpa","name":"外公","nameEn":"Grandpa","surname":"陈","sex":"m","birth":"1938","father":"mggf","mother":"mggm","spouse":"mgrandma"},"mgrandma":{"id":"mgrandma","name":"外婆","nameEn":"Grandma","surname":"","sex":"f","birth":"1940","father":null,"mother":null,"spouse":"mgrandpa"},"u1":{"id":"u1","name":"大伯","nameEn":"Eldest uncle","surname":"吴","sex":"m","birth":"1957","father":"grandpa","mother":"grandma","spouse":"u1w"},"u1w":{"id":"u1w","name":"大伯母","nameEn":"Eldest aunt","surname":"","sex":"f","birth":"1958","father":null,"mother":null,"spouse":"u1"},"a1":{"id":"a1","name":"大姑","nameEn":"Eldest aunt","surname":"吴","sex":"f","birth":"1959","father":"grandpa","mother":"grandma","spouse":"a1h"},"a1h":{"id":"a1h","name":"大姑丈","nameEn":"Eldest uncle","surname":"","sex":"m","birth":"1957","father":null,"mother":null,"spouse":"a1"},"u2":{"id":"u2","name":"二伯","nameEn":"2nd uncle","surname":"吴","sex":"m","birth":"1961","father":"grandpa","mother":"grandma","spouse":"u2w"},"u2w":{"id":"u2w","name":"二伯母","nameEn":"2nd aunt","surname":"","sex":"f","birth":"1962","father":null,"mother":null,"spouse":"u2"},"father":{"id":"father","name":"父亲","nameEn":"Father","surname":"吴","sex":"m","birth":"1965","father":"grandpa","mother":"grandma","spouse":"mother"},"mother":{"id":"mother","name":"母亲","nameEn":"Mother","surname":"陈","sex":"f","birth":"1968","father":"mgrandpa","mother":"mgrandma","spouse":"father"},"u3":{"id":"u3","name":"三叔","nameEn":"3rd uncle","surname":"吴","sex":"m","birth":"1967","father":"grandpa","mother":"grandma","spouse":"u3w"},"u3w":{"id":"u3w","name":"三婶","nameEn":"3rd aunt","surname":"","sex":"f","birth":"1969","father":null,"mother":null,"spouse":"u3"},"a2":{"id":"a2","name":"二姑","nameEn":"2nd aunt","surname":"吴","sex":"f","birth":"1969","father":"grandpa","mother":"grandma","spouse":"a2h"},"a2h":{"id":"a2h","name":"二姑丈","nameEn":"2nd uncle","surname":"","sex":"m","birth":"1967","father":null,"mother":null,"spouse":"a2"},"u4":{"id":"u4","name":"四叔","nameEn":"4th uncle","surname":"吴","sex":"m","birth":"1971","father":"grandpa","mother":"grandma","spouse":"u4w"},"u4w":{"id":"u4w","name":"四婶","nameEn":"4th aunt","surname":"","sex":"f","birth":"1972","father":null,"mother":null,"spouse":"u4"},"a3":{"id":"a3","name":"小姑","nameEn":"Youngest aunt","surname":"吴","sex":"f","birth":"1973","father":"grandpa","mother":"grandma","spouse":"a3h"},"a3h":{"id":"a3h","name":"小姑丈","nameEn":"Youngest uncle","surname":"","sex":"m","birth":"1971","father":null,"mother":null,"spouse":"a3"},"u5":{"id":"u5","name":"小叔","nameEn":"Youngest uncle","surname":"吴","sex":"m","birth":"1976","father":"grandpa","mother":"grandma","spouse":"u5w"},"u5w":{"id":"u5w","name":"小婶","nameEn":"Youngest aunt","surname":"","sex":"f","birth":"1978","father":null,"mother":null,"spouse":"u5"},"f1":{"id":"f1","name":"堂伯","nameEn":"Uncle","surname":"吴","sex":"m","birth":"1955","father":"gu1","mother":"gu1w","spouse":"f1w"},"f1w":{"id":"f1w","name":"堂伯母","nameEn":"Aunt","surname":"","sex":"f","birth":"1957","father":null,"mother":null,"spouse":"f1"},"f2":{"id":"f2","name":"堂伯","nameEn":"Uncle","surname":"吴","sex":"m","birth":"1958","father":"gu1","mother":"gu1w","spouse":null},"f3":{"id":"f3","name":"堂姑","nameEn":"Aunt","surname":"吴","sex":"f","birth":"1962","father":"gu1","mother":"gu1w","spouse":null},"f4":{"id":"f4","name":"堂叔","nameEn":"Uncle","surname":"吴","sex":"m","birth":"1966","father":"gu1","mother":"gu1w","spouse":null},"f5":{"id":"f5","name":"堂叔","nameEn":"Uncle","surname":"吴","sex":"m","birth":"1970","father":"gu1","mother":"gu1w","spouse":null},"f6":{"id":"f6","name":"堂叔","nameEn":"Uncle","surname":"吴","sex":"m","birth":"1968","father":"gu2","mother":"gu2w","spouse":"f6w"},"f6w":{"id":"f6w","name":"堂婶","nameEn":"Aunt","surname":"","sex":"f","birth":"1970","father":null,"mother":null,"spouse":"f6"},"f7":{"id":"f7","name":"堂姑","nameEn":"Aunt","surname":"吴","sex":"f","birth":"1972","father":"gu2","mother":"gu2w","spouse":null},"f8":{"id":"f8","name":"表伯","nameEn":"Uncle","surname":"","sex":"m","birth":"1963","father":"ga1h","mother":"ga1","spouse":null},"f9":{"id":"f9","name":"表姑","nameEn":"Aunt","surname":"","sex":"f","birth":"1970","father":"ga1h","mother":"ga1","spouse":null},"muncle":{"id":"muncle","name":"舅舅","nameEn":"Uncle","surname":"陈","sex":"m","birth":"1970","father":"mgrandpa","mother":"mgrandma","spouse":"muncleW"},"muncleW":{"id":"muncleW","name":"舅妈","nameEn":"Aunt","surname":"","sex":"f","birth":"1972","father":null,"mother":null,"spouse":"muncle"},"brother":{"id":"brother","name":"哥哥","nameEn":"Older brother","surname":"吴","sex":"m","birth":"1994","father":"father","mother":"mother","spouse":"brotherW"},"brotherW":{"id":"brotherW","name":"嫂子","nameEn":"Sister-in-law","surname":"","sex":"f","birth":"1995","father":null,"mother":null,"spouse":"brother"},"sisterO":{"id":"sisterO","name":"姐姐","nameEn":"Older sister","surname":"吴","sex":"f","birth":"1996","father":"father","mother":"mother","spouse":"sisterOh"},"sisterOh":{"id":"sisterOh","name":"姐夫","nameEn":"Brother-in-law","surname":"","sex":"m","birth":"1994","father":null,"mother":null,"spouse":"sisterO"},"sisterY":{"id":"sisterY","name":"妹妹","nameEn":"Younger sister","surname":"吴","sex":"f","birth":"2002","father":"father","mother":"mother","spouse":"sisterYh"},"sisterYh":{"id":"sisterYh","name":"妹夫","nameEn":"Brother-in-law","surname":"","sex":"m","birth":"2000","father":null,"mother":null,"spouse":"sisterY"},"c1":{"id":"c1","name":"堂哥","nameEn":"Cousin","surname":"吴","sex":"m","birth":"1985","father":"u1","mother":"u1w","spouse":"c1w"},"c1w":{"id":"c1w","name":"堂嫂","nameEn":"Cousin's wife","surname":"","sex":"f","birth":"1987","father":null,"mother":null,"spouse":"c1"},"c2":{"id":"c2","name":"堂姐","nameEn":"Cousin","surname":"吴","sex":"f","birth":"1988","father":"u1","mother":"u1w","spouse":null},"c3":{"id":"c3","name":"表哥","nameEn":"Cousin","surname":"","sex":"m","birth":"1990","father":"a1h","mother":"a1","spouse":null},"c4":{"id":"c4","name":"堂哥","nameEn":"Cousin","surname":"吴","sex":"m","birth":"1992","father":"u2","mother":"u2w","spouse":null},"c5":{"id":"c5","name":"堂弟","nameEn":"Cousin","surname":"吴","sex":"m","birth":"2000","father":"u3","mother":"u3w","spouse":null},"c6":{"id":"c6","name":"堂妹","nameEn":"Cousin","surname":"吴","sex":"f","birth":"2003","father":"u3","mother":"u3w","spouse":null},"c7":{"id":"c7","name":"表姐","nameEn":"Cousin","surname":"","sex":"f","birth":"1997","father":"a2h","mother":"a2","spouse":null},"c8":{"id":"c8","name":"堂弟","nameEn":"Cousin","surname":"吴","sex":"m","birth":"2004","father":"u4","mother":"u4w","spouse":null},"c9":{"id":"c9","name":"表妹","nameEn":"Cousin","surname":"","sex":"f","birth":"2005","father":"a3h","mother":"a3","spouse":null},"mc1":{"id":"mc1","name":"表妹","nameEn":"Cousin","surname":"陈","sex":"f","birth":"2001","father":"muncle","mother":"muncleW","spouse":"mc1h"},"mc1h":{"id":"mc1h","name":"表妹夫","nameEn":"Cousin's husband","surname":"","sex":"m","birth":"1999","father":null,"mother":null,"spouse":"mc1"},"s1":{"id":"s1","name":"远房堂哥","nameEn":"Distant cousin","surname":"吴","sex":"m","birth":"1982","father":"f1","mother":"f1w","spouse":null},"s2":{"id":"s2","name":"远房堂姐","nameEn":"Distant cousin","surname":"吴","sex":"f","birth":"1985","father":"f1","mother":"f1w","spouse":null},"s3":{"id":"s3","name":"远房堂弟","nameEn":"Distant cousin","surname":"吴","sex":"m","birth":"2001","father":"f6","mother":"f6w","spouse":null},"s4":{"id":"s4","name":"远房表妹","nameEn":"Distant cousin","surname":"","sex":"f","birth":"2003","father":null,"mother":"f9","spouse":null},"son":{"id":"son","name":"儿子","nameEn":"Son","surname":"吴","sex":"m","birth":"2022","father":"me","mother":"wife","spouse":null},"daughter":{"id":"daughter","name":"女儿","nameEn":"Daughter","surname":"吴","sex":"f","birth":"2024","father":"me","mother":"wife","spouse":null},"k1":{"id":"k1","name":"侄子","nameEn":"Nephew","surname":"吴","sex":"m","birth":"2018","father":"brother","mother":"brotherW","spouse":null},"k2":{"id":"k2","name":"侄女","nameEn":"Niece","surname":"吴","sex":"f","birth":"2020","father":"brother","mother":"brotherW","spouse":null},"k3":{"id":"k3","name":"外甥","nameEn":"Nephew","surname":"","sex":"m","birth":"2021","father":"sisterOh","mother":"sisterO","spouse":null},"k4":{"id":"k4","name":"外甥女","nameEn":"Niece","surname":"","sex":"f","birth":"2025","father":"sisterYh","mother":"sisterY","spouse":null},"k5":{"id":"k5","name":"堂侄","nameEn":"Cousin's son","surname":"吴","sex":"m","birth":"2010","father":"c1","mother":"c1w","spouse":null},"k6":{"id":"k6","name":"堂侄女","nameEn":"Cousin's daughter","surname":"吴","sex":"f","birth":"2013","father":"c1","mother":"c1w","spouse":null},"k7":{"id":"k7","name":"表侄","nameEn":"Cousin's son","surname":"","sex":"m","birth":"2016","father":"c3","mother":null,"spouse":null},"k8":{"id":"k8","name":"堂侄","nameEn":"Cousin's son","surname":"吴","sex":"m","birth":"2024","father":"c5","mother":null,"spouse":null},"k9":{"id":"k9","name":"表外甥","nameEn":"Cousin's son","surname":"","sex":"m","birth":"2023","father":"mc1h","mother":"mc1","spouse":null}},"photos":[{"id":"ph1","title":"春节团圆饭","album":"节日团聚","date":"2025-01-29","tags":["grandpa","father","me"],"path":""},{"id":"ph2","title":"祖屋门前","album":"老照片","date":"1975-06-01","tags":["grandpa","grandma"],"path":""},{"id":"ph3","title":"中秋赏月","album":"节日团聚","date":"2024-09-17","tags":["brother","sisterO","sisterY"],"path":""},{"id":"ph4","title":"全家出游","album":"旅行","date":"2023-12-20","tags":["father","mother","me","wife"],"path":""}],"log":[]};
  var K = { mode: 'zy-mode', token: 'zy-gh-token', repo: 'zy-gh-repo', login: 'zy-gh-login', me: 'zy-me', demo: 'zy-demo-data', demoPh: 'zy-demo-photo:' };
  var API = 'https://api.github.com';
  var FILE = 'family.json';
  var listeners = [];
  var state = { data: null, sha: null, rev: 0, saving: 0, error: '', loaded: false };
  var urlCache = {};
  var chan = null;
  try { chan = new BroadcastChannel('zy-data'); } catch (e) {}

  // ---------- small helpers ----------
  function ls(k, v) {
    try {
      if (v === undefined) return window.localStorage.getItem(k) || window.sessionStorage.getItem(k);
      if (v === null) { window.localStorage.removeItem(k); window.sessionStorage.removeItem(k); return null; }
      window.localStorage.setItem(k, v);
    } catch (e) {}
    return null;
  }
  function ss(k, v) { try { window.sessionStorage.setItem(k, v); } catch (e) {} }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function now() { return new Date().toISOString(); }
  function uid(p) { return (p || 'p') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function emit() {
    state.rev++;
    listeners.slice().forEach(function (f) { try { f(state.rev); } catch (e) {} });
  }
  function b64encode(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  function b64decode(b64) {
    var bin = atob(String(b64 || '').replace(/\s/g, ''));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function blobToB64(blob) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(String(r.result).split(',')[1]); };
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  }
  function blobToDataURL(blob) {
    return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result)); }; r.onerror = rej; r.readAsDataURL(blob); });
  }
  // Resize an image file in the browser before saving (keeps the repository small).
  function resize(file, max, quality) {
    return new Promise(function (res, rej) {
      var img = new Image();
      var u = URL.createObjectURL(file);
      img.onload = function () {
        var s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        var w = Math.max(1, Math.round(img.naturalWidth * s));
        var h = Math.max(1, Math.round(img.naturalHeight * s));
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        var g = c.getContext('2d');
        g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
        g.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(u);
        c.toBlob(function (b) { b ? res(b) : rej(new Error('resize failed')); }, 'image/jpeg', quality || 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(u); rej(new Error('Not an image')); };
      img.src = u;
    });
  }
  function normalize(d) {
    d = d || {};
    d.schema = d.schema || 1;
    d.family = d.family || { name: '' };
    d.people = d.people || {};
    d.photos = d.photos || [];
    d.log = d.log || [];
    Object.keys(d.people).forEach(function (id) { var p = d.people[id]; p.id = id; });
    return d;
  }
  // Keep relationships consistent in both directions.
  function fixLinks(d) {
    var P = d.people;
    Object.keys(P).forEach(function (id) {
      var p = P[id];
      ['father', 'mother', 'spouse'].forEach(function (k) { if (p[k] && !P[p[k]]) p[k] = null; if (p[k] === id) p[k] = null; });
    });
    Object.keys(P).forEach(function (id) {
      var p = P[id];
      if (p.spouse) {
        var q = P[p.spouse];
        if (q.spouse && q.spouse !== id && P[q.spouse] && P[q.spouse].spouse === p.spouse) P[q.spouse].spouse = null;
        q.spouse = id;
      }
    });
    Object.keys(P).forEach(function (id) { var p = P[id]; if (p.spouse && P[p.spouse].spouse !== id) p.spouse = null; });
    return d;
  }

  // ---------- GitHub back end ----------
  function token() { return ls(K.token); }
  function repo() { return ls(K.repo); }
  function gh(path, opt) {
    opt = opt || {};
    var h = { Accept: opt.raw ? 'application/vnd.github.raw' : 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    var t = opt.token || token();
    if (t) h.Authorization = 'Bearer ' + t;
    if (opt.body !== undefined) h['Content-Type'] = 'application/json';
    return fetch(API + path, { method: opt.method || 'GET', headers: h, body: opt.body !== undefined ? JSON.stringify(opt.body) : undefined, cache: 'no-store' }).then(function (r) {
      if (r.status === 204) return null;
      if (!r.ok) {
        return r.text().then(function (txt) {
          var msg = txt;
          try { msg = JSON.parse(txt).message || txt; } catch (e) {}
          var err = new Error(msg || ('GitHub error ' + r.status));
          err.status = r.status;
          throw err;
        });
      }
      return opt.raw ? (opt.blob ? r.blob() : r.text()) : r.json();
    });
  }
  function enc(path) { return path.split('/').map(encodeURIComponent).join('/'); }
  function ghLoad() {
    return gh('/repos/' + repo() + '/contents/' + FILE).then(function (meta) {
      if (meta.content) return { data: JSON.parse(b64decode(meta.content)), sha: meta.sha };
      return gh('/repos/' + repo() + '/contents/' + FILE, { raw: true }).then(function (txt) { return { data: JSON.parse(txt), sha: meta.sha }; });
    });
  }
  function ghSave(d, sha, msg) {
    return gh('/repos/' + repo() + '/contents/' + FILE, { method: 'PUT', body: { message: msg, content: b64encode(JSON.stringify(d, null, 1)), sha: sha || undefined } })
      .then(function (r) { return r.content.sha; });
  }
  function ghPutFile(path, b64, msg) {
    return gh('/repos/' + repo() + '/contents/' + enc(path), { method: 'PUT', body: { message: msg, content: b64 } });
  }
  function ghDeleteFile(path, msg) {
    return gh('/repos/' + repo() + '/contents/' + enc(path)).then(function (m) {
      return gh('/repos/' + repo() + '/contents/' + enc(path), { method: 'DELETE', body: { message: msg, sha: m.sha } });
    }).catch(function () { return null; });
  }

  // ---------- demo back end ----------
  function demoLoad() {
    var raw = ls(K.demo);
    var d = null;
    try { d = raw ? JSON.parse(raw) : null; } catch (e) { d = null; }
    if (!d) { d = clone(SEED); try { window.localStorage.setItem(K.demo, JSON.stringify(d)); } catch (e) {} }
    return d;
  }
  function demoSave(d) {
    try { window.localStorage.setItem(K.demo, JSON.stringify(d)); } catch (e) { throw new Error('This browser is out of storage space for the demo family.'); }
  }

  // ---------- core ----------
  function mode() { var m = ls(K.mode); return m === 'github' && token() && repo() ? 'github' : 'demo'; }
  function signedIn() { var m = ls(K.mode); return m === 'github' ? !!(token() && repo()) : m === 'demo'; }
  function login() { return ls(K.login) || ''; }
  function meId() {
    var d = state.data;
    if (!d) return null;
    if (mode() === 'github') {
      var lg = login().toLowerCase();
      var ids = Object.keys(d.people);
      for (var i = 0; i < ids.length; i++) if (lg && String(d.people[ids[i]].github || '').toLowerCase() === lg) return ids[i];
      return null;
    }
    var m = ls(K.me);
    return m && d.people[m] ? m : (d.people.me ? 'me' : Object.keys(d.people)[0] || null);
  }
  function load(force) {
    if (state.loaded && !force) return Promise.resolve(state.data);
    if (mode() === 'github') {
      return ghLoad().then(function (r) {
        state.data = normalize(r.data); state.sha = r.sha; state.loaded = true; state.error = ''; emit(); return state.data;
      }).catch(function (e) {
        state.error = e.message; state.loaded = true;
        if (!state.data) state.data = normalize({});
        emit();
        throw e;
      });
    }
    state.data = normalize(demoLoad()); state.loaded = true; emit();
    return Promise.resolve(state.data);
  }
  // Apply an operation and save; on a conflict reload the latest copy and apply it again.
  function mutate(op, summary) {
    state.saving++; state.error = ''; emit();
    var who = mode() === 'github' ? login() : 'demo';
    function stamp(d) {
      var r = op(d);
      fixLinks(d);
      d.log.unshift({ at: now(), by: who, what: summary });
      if (d.log.length > 300) d.log.length = 300;
      return r;
    }
    var done = function (res) { state.saving--; emit(); notify(); return res; };
    var fail = function (e) { state.saving--; state.error = e.message || String(e); emit(); throw e; };
    if (mode() !== 'github') {
      try {
        var d = clone(state.data || demoLoad());
        var res = stamp(d);
        demoSave(d);
        state.data = normalize(d);
        return Promise.resolve(done(res));
      } catch (e) { return Promise.reject(e).catch(fail); }
    }
    var attempt = 0;
    function tryOnce(base, sha) {
      var d = clone(base);
      var res = stamp(d);
      return ghSave(d, sha, summary).then(function (newSha) {
        state.data = normalize(d); state.sha = newSha; return res;
      }).catch(function (e) {
        if ((e.status === 409 || e.status === 422) && attempt++ < 4) {
          return ghLoad().then(function (r) { return tryOnce(normalize(r.data), r.sha); });
        }
        throw e;
      });
    }
    return tryOnce(state.data, state.sha).then(done, fail);
  }
  function notify() { try { if (chan) chan.postMessage({ t: 'changed' }); } catch (e) {} }
  if (chan) chan.onmessage = function () { state.loaded = false; load(true).catch(function () {}); };
  window.addEventListener('storage', function (e) { if (e.key === K.demo && mode() === 'demo') { state.loaded = false; load(true).catch(function () {}); } });

  var FIELDS = ['name', 'nameEn', 'surname', 'sex', 'birth', 'death', 'nationality', 'hometown', 'city', 'job', 'phone', 'email', 'bio', 'privacy', 'father', 'mother', 'spouse', 'github', 'avatar'];
  function label(p) { return p ? (p.name || p.nameEn || '') : ''; }

  var ZY = {
    version: '1.0.0',
    get data() { return state.data; },
    get rev() { return state.rev; },
    get mode() { return mode(); },
    get signedIn() { return signedIn(); },
    get meId() { return meId(); },
    get me() { var id = meId(); return id && state.data ? state.data.people[id] : null; },
    get login() { return login(); },
    get repo() { return repo(); },
    get saving() { return state.saving > 0; },
    get error() { return state.error; },
    get loaded() { return state.loaded; },
    seed: SEED,
    label: label,
    ready: function () { return load(false).catch(function () { return state.data; }); },
    reload: function () { state.loaded = false; return load(true); },
    subscribe: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; },
    person: function (id) { return state.data && id ? state.data.people[id] || null : null; },
    people: function () { return state.data ? Object.keys(state.data.people).map(function (k) { return state.data.people[k]; }) : []; },
    childrenOf: function (id) { return ZY.people().filter(function (p) { return p.father === id || p.mother === id; }); },
    // ----- people -----
    savePerson: function (fields) {
      var id = fields.id || uid('p');
      var isNew = !(state.data && state.data.people[id]);
      var nm = fields.name || fields.nameEn || id;
      return mutate(function (d) {
        var p = d.people[id] || { id: id, createdAt: now() };
        FIELDS.forEach(function (k) { if (fields[k] !== undefined) p[k] = fields[k] === '' && (k === 'father' || k === 'mother' || k === 'spouse') ? null : fields[k]; });
        p.updatedAt = now();
        d.people[id] = p;
        // Optional: link a new person to an existing one in one step (rel: child / parent / spouse / sibling).
        if (isNew && fields.rel && fields.of && d.people[fields.of]) {
          var o = d.people[fields.of];
          if (fields.rel === 'child') { if (o.sex === 'f') { p.mother = o.id; if (o.spouse) p.father = o.spouse; } else { p.father = o.id; if (o.spouse) p.mother = o.spouse; } }
          if (fields.rel === 'parent') { if (p.sex === 'f') o.mother = id; else o.father = id; var other = p.sex === 'f' ? o.father : o.mother; if (other && !p.spouse && d.people[other] && !d.people[other].spouse) p.spouse = other; }
          if (fields.rel === 'spouse') { p.spouse = o.id; }
          if (fields.rel === 'sibling') { p.father = o.father || null; p.mother = o.mother || null; }
        }
        return id;
      }, (isNew ? 'Add ' : 'Update ') + nm);
    },
    deletePerson: function (id) {
      var p = ZY.person(id);
      var nm = label(p) || id;
      var av = p && p.avatar;
      return mutate(function (d) {
        delete d.people[id];
        Object.keys(d.people).forEach(function (k) { var q = d.people[k]; ['father', 'mother', 'spouse'].forEach(function (f) { if (q[f] === id) q[f] = null; }); });
        d.photos.forEach(function (ph) { ph.tags = (ph.tags || []).filter(function (t) { return t !== id; }); });
      }, 'Remove ' + nm).then(function (r) { if (av) removeFile(av); return r; });
    },
    linkMe: function (id) {
      var lg = login();
      if (mode() !== 'github') { ls(K.me, id); emit(); return Promise.resolve(id); }
      return mutate(function (d) {
        Object.keys(d.people).forEach(function (k) { if (String(d.people[k].github || '').toLowerCase() === lg.toLowerCase()) d.people[k].github = ''; });
        if (d.people[id]) d.people[id].github = lg;
      }, lg + ' is ' + (label(ZY.person(id)) || id));
    },
    setFamilyName: function (name) { return mutate(function (d) { d.family.name = name; }, 'Rename family'); },
    // ----- photos & avatars -----
    addPhoto: function (file, meta) {
      meta = meta || {};
      var id = uid('ph');
      return resize(file, 1600, 0.82).then(function (blob) {
        return storeImage('photos/' + id + '.jpg', blob, 'Upload photo').then(function (path) {
          return mutate(function (d) {
            d.photos.unshift({ id: id, path: path, title: meta.title || '', album: meta.album || '', date: meta.date || now().slice(0, 10), tags: meta.tags || [], by: mode() === 'github' ? login() : 'demo', at: now() });
            return id;
          }, 'Add photo ' + (meta.title || ''));
        });
      });
    },
    updatePhoto: function (id, fields) {
      return mutate(function (d) { d.photos.forEach(function (ph) { if (ph.id === id) Object.keys(fields).forEach(function (k) { if (k !== 'id' && k !== 'path') ph[k] = fields[k]; }); }); }, 'Edit photo');
    },
    deletePhoto: function (id) {
      var ph = (state.data.photos || []).filter(function (x) { return x.id === id; })[0];
      return mutate(function (d) { d.photos = d.photos.filter(function (x) { return x.id !== id; }); }, 'Delete photo ' + ((ph && ph.title) || ''))
        .then(function (r) { if (ph && ph.path) removeFile(ph.path); return r; });
    },
    setAvatar: function (personId, file) {
      var old = (ZY.person(personId) || {}).avatar;
      return resize(file, 512, 0.86).then(function (blob) {
        return storeImage('avatars/' + personId + '-' + Date.now().toString(36) + '.jpg', blob, 'Update avatar').then(function (path) {
          return mutate(function (d) { if (d.people[personId]) d.people[personId].avatar = path; }, 'Avatar for ' + (label(ZY.person(personId)) || personId))
            .then(function () { if (old && old !== path) removeFile(old); return path; });
        });
      });
    },
    clearAvatar: function (personId) {
      var old = (ZY.person(personId) || {}).avatar;
      return mutate(function (d) { if (d.people[personId]) d.people[personId].avatar = ''; }, 'Remove avatar').then(function () { if (old) removeFile(old); });
    },
    // Returns a URL the page can show in <img src>. Private repository images are fetched with the token.
    imageURL: function (path) {
      if (!path) return Promise.resolve('');
      if (urlCache[path]) return urlCache[path];
      var p;
      if (mode() === 'github') p = gh('/repos/' + repo() + '/contents/' + enc(path), { raw: true, blob: true }).then(function (b) { return URL.createObjectURL(b); });
      else p = Promise.resolve(ls(K.demoPh + path) || '');
      urlCache[path] = p.catch(function () { delete urlCache[path]; return ''; });
      return urlCache[path];
    },
    // ----- sign in / out -----
    startDemo: function () { ls(K.mode, 'demo'); state.loaded = false; return load(true); },
    resetDemo: function () {
      try { Object.keys(window.localStorage).forEach(function (k) { if (k.indexOf(K.demoPh) === 0) window.localStorage.removeItem(k); }); } catch (e) {}
      ls(K.demo, null); ls(K.me, null); state.loaded = false; return load(true);
    },
    signIn: function (opt) {
      var t = String(opt.token || '').trim();
      var r = String(opt.repo || '').trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/$/, '');
      if (!t || !/^[\w.-]+\/[\w.-]+$/.test(r)) return Promise.reject(new Error('BAD_INPUT'));
      return gh('/user', { token: t }).then(function (u) {
        return gh('/repos/' + r, { token: t }).then(function (info) {
          if (!info.permissions || !info.permissions.push) throw new Error('NO_WRITE');
          if (opt.remember === false) { ss(K.token, t); try { window.localStorage.removeItem(K.token); } catch (e) {} } else ls(K.token, t);
          ls(K.repo, info.full_name); ls(K.login, u.login); ls(K.mode, 'github');
          state.loaded = false; state.data = null;
          return load(true).catch(function (e) {
            if (e.status === 404) return mutate(function () {}, 'Start family space').then(function () { return state.data; });
            throw e;
          }).then(function () { return { login: u.login, linked: !!meId(), admin: !!info.permissions.admin }; });
        });
      });
    },
    // Creates a new PRIVATE repository for a family and puts the first person (you) in it.
    createFamily: function (opt) {
      var t = String(opt.token || '').trim();
      var name = String(opt.repoName || 'zy-family-data').trim();
      return gh('/user', { token: t }).then(function (u) {
        return gh('/user/repos', { token: t, method: 'POST', body: { name: name, private: true, auto_init: true, description: 'ZY FamilyTree data (private). Do not make this repository public.' } }).then(function (info) {
          ls(K.token, t); ls(K.repo, info.full_name); ls(K.login, u.login); ls(K.mode, 'github');
          var meP = { id: uid('p'), name: opt.name || u.name || u.login, nameEn: opt.nameEn || '', surname: opt.surname || '', sex: opt.sex || 'm', github: u.login, createdAt: now(), updatedAt: now() };
          var people = {}; people[meP.id] = meP;
          var d = normalize({ schema: 1, family: { name: opt.familyName || '', created: now() }, people: people, photos: [], log: [{ at: now(), by: u.login, what: 'Create family space' }] });
          return ghSave(d, null, 'Create family space').then(function (sha) {
            state.data = d; state.sha = sha; state.loaded = true; emit();
            return { login: u.login, repo: info.full_name };
          });
        });
      });
    },
    signOut: function () {
      [K.token, K.repo, K.login, K.mode].forEach(function (k) { ls(k, null); });
      Object.keys(urlCache).forEach(function (k) { urlCache[k].then(function (u) { if (u && u.indexOf('blob:') === 0) URL.revokeObjectURL(u); }); });
      urlCache = {};
      state.loaded = false; state.data = null; state.sha = null;
      return load(true);
    },
    // ----- family members on GitHub (collaborators) -----
    collaborators: function () {
      if (mode() !== 'github') return Promise.resolve({ members: [], invites: [] });
      return Promise.all([
        gh('/repos/' + repo() + '/collaborators?per_page=100').catch(function () { return []; }),
        gh('/repos/' + repo() + '/invitations?per_page=100').catch(function () { return []; })
      ]).then(function (r) {
        return { members: r[0].map(function (c) { return { login: c.login, avatar: c.avatar_url, admin: !!(c.permissions && c.permissions.admin) }; }), invites: r[1].map(function (i) { return { id: i.id, login: i.invitee && i.invitee.login }; }) };
      });
    },
    invite: function (username) {
      return gh('/repos/' + repo() + '/collaborators/' + encodeURIComponent(String(username).trim().replace(/^@/, '')), { method: 'PUT', body: { permission: 'push' } });
    },
    removeMember: function (username) { return gh('/repos/' + repo() + '/collaborators/' + encodeURIComponent(username), { method: 'DELETE' }); },
    // ----- backup -----
    exportJSON: function () { return JSON.stringify(state.data, null, 1); },
    importJSON: function (text) {
      var d = normalize(JSON.parse(text));
      if (!d.people || typeof d.people !== 'object') throw new Error('Not a ZY FamilyTree backup');
      return mutate(function (cur) { cur.family = d.family; cur.people = d.people; cur.photos = d.photos; }, 'Import backup');
    }
  };
  function storeImage(path, blob, msg) {
    if (mode() === 'github') return blobToB64(blob).then(function (b64) { return ghPutFile(path, b64, msg); }).then(function () { return path; });
    return blobToDataURL(blob).then(function (u) {
      try { window.localStorage.setItem(K.demoPh + path, u); } catch (e) { throw new Error('Demo storage is full. Sign in with GitHub to keep more photos.'); }
      return path;
    });
  }
  function removeFile(path) {
    delete urlCache[path];
    if (mode() === 'github') return ghDeleteFile(path, 'Remove ' + path);
    try { window.localStorage.removeItem(K.demoPh + path); } catch (e) {}
    return Promise.resolve();
  }
  window.ZY = ZY;
  load(false).catch(function () {});
})();
