/*
 * Zenith Yield (枝叶 · ZY FamilyTree) — data store, available to every page as window.ZY
 * ---------------------------------------------------------------------------------------
 * Two back ends with one API:
 *   cloud : Supabase (sign-in with email + password, Postgres with row-level security,
 *           Storage for photos). Turned on by filling in zy-config.js.
 *   demo  : a sample family kept only in this browser (localStorage). No account needed.
 *
 * Every family has a family key (ZYF-…), every surname line a clan key (ZYC-…) and every
 * person a member key (ZYM-…). In the cloud these are created by the database and never change.
 */
(function () {
  'use strict';
  if (window.ZY) return;
  var SEED = {"schema":1,"family":{"name":"示例家族"},"people":{"me":{"id":"me","name":"Yao","nameEn":"Yao","surname":"吴","sex":"m","birth":"1998","father":"father","mother":"mother","spouse":"wife"},"wife":{"id":"wife","name":"妻子","nameEn":"Wife","surname":"林","sex":"f","birth":"1999","father":"wf","mother":"wm","spouse":"me"},"wggf":{"id":"wggf","name":"妻子的曾祖父","nameEn":"Wife's great-grandpa","surname":"林","sex":"m","birth":"1912","father":null,"mother":null,"spouse":"wggm"},"wggm":{"id":"wggm","name":"妻子的曾祖母","nameEn":"Wife's great-grandma","surname":"","sex":"f","birth":"1914","father":null,"mother":null,"spouse":"wggf"},"wgf":{"id":"wgf","name":"妻子的爷爷","nameEn":"Wife's grandpa","surname":"林","sex":"m","birth":"1940","father":"wggf","mother":"wggm","spouse":"wgm"},"wgm":{"id":"wgm","name":"妻子的奶奶","nameEn":"Wife's grandma","surname":"","sex":"f","birth":"1942","father":null,"mother":null,"spouse":"wgf"},"wmgf":{"id":"wmgf","name":"妻子的外公","nameEn":"Wife's grandpa","surname":"张","sex":"m","birth":"1943","father":null,"mother":null,"spouse":"wmgm"},"wmgm":{"id":"wmgm","name":"妻子的外婆","nameEn":"Wife's grandma","surname":"","sex":"f","birth":"1945","father":null,"mother":null,"spouse":"wmgf"},"wf":{"id":"wf","name":"岳父","nameEn":"Father-in-law","surname":"林","sex":"m","birth":"1969","father":"wgf","mother":"wgm","spouse":"wm"},"wm":{"id":"wm","name":"岳母","nameEn":"Mother-in-law","surname":"张","sex":"f","birth":"1971","father":"wmgf","mother":"wmgm","spouse":"wf"},"wu":{"id":"wu","name":"妻子的伯父","nameEn":"Wife's uncle","surname":"林","sex":"m","birth":"1965","father":"wgf","mother":"wgm","spouse":"wuw"},"wuw":{"id":"wuw","name":"妻子的伯母","nameEn":"Wife's aunt","surname":"","sex":"f","birth":"1967","father":null,"mother":null,"spouse":"wu"},"wmu":{"id":"wmu","name":"妻子的舅舅","nameEn":"Wife's uncle","surname":"张","sex":"m","birth":"1974","father":"wmgf","mother":"wmgm","spouse":null},"wb":{"id":"wb","name":"大舅子","nameEn":"Brother-in-law","surname":"林","sex":"m","birth":"1996","father":"wf","mother":"wm","spouse":"wbw"},"wbw":{"id":"wbw","name":"舅嫂","nameEn":"Sister-in-law","surname":"","sex":"f","birth":"1997","father":null,"mother":null,"spouse":"wb"},"wsis":{"id":"wsis","name":"小姨子","nameEn":"Sister-in-law","surname":"林","sex":"f","birth":"2003","father":"wf","mother":"wm","spouse":"wsish"},"wsish":{"id":"wsish","name":"连襟","nameEn":"Brother-in-law","surname":"","sex":"m","birth":"2002","father":null,"mother":null,"spouse":"wsis"},"wc":{"id":"wc","name":"妻子的堂姐","nameEn":"Wife's cousin","surname":"林","sex":"f","birth":"1994","father":"wu","mother":"wuw","spouse":null},"wbk":{"id":"wbk","name":"妻子的侄子","nameEn":"Wife's nephew","surname":"林","sex":"m","birth":"2023","father":"wb","mother":"wbw","spouse":null},"wsisk":{"id":"wsisk","name":"妻子的外甥女","nameEn":"Wife's niece","surname":"","sex":"f","birth":"2025","father":"wsish","mother":"wsis","spouse":null},"gggf":{"id":"gggf","name":"高祖父","nameEn":"Great-great-grandpa","surname":"吴","sex":"m","birth":"1880","father":null,"mother":null,"spouse":"gggm"},"gggm":{"id":"gggm","name":"高祖母","nameEn":"Great-great-grandma","surname":"","sex":"f","birth":"1882","father":null,"mother":null,"spouse":"gggf"},"ggf":{"id":"ggf","name":"曾祖父","nameEn":"Great-grandpa","surname":"吴","sex":"m","birth":"1905","father":"gggf","mother":"gggm","spouse":"ggm"},"ggm":{"id":"ggm","name":"曾祖母","nameEn":"Great-grandma","surname":"","sex":"f","birth":"1907","father":null,"mother":null,"spouse":"ggf"},"mgggf":{"id":"mgggf","name":"外高祖父","nameEn":"Great-great-grandpa","surname":"陈","sex":"m","birth":"1885","father":null,"mother":null,"spouse":"mgggm"},"mgggm":{"id":"mgggm","name":"外高祖母","nameEn":"Great-great-grandma","surname":"","sex":"f","birth":"1887","father":null,"mother":null,"spouse":"mgggf"},"mggf":{"id":"mggf","name":"外曾祖父","nameEn":"Great-grandpa","surname":"陈","sex":"m","birth":"1910","father":"mgggf","mother":"mgggm","spouse":"mggm"},"mggm":{"id":"mggm","name":"外曾祖母","nameEn":"Great-grandma","surname":"","sex":"f","birth":"1912","father":null,"mother":null,"spouse":"mggf"},"grandpa":{"id":"grandpa","name":"爷爷","nameEn":"Grandpa","surname":"吴","sex":"m","birth":"1935","father":"ggf","mother":"ggm","spouse":"grandma"},"grandma":{"id":"grandma","name":"奶奶","nameEn":"Grandma","surname":"","sex":"f","birth":"1937","father":null,"mother":null,"spouse":"grandpa"},"gu1":{"id":"gu1","name":"伯公","nameEn":"Great-uncle","surname":"吴","sex":"m","birth":"1930","father":"ggf","mother":"ggm","spouse":"gu1w"},"gu1w":{"id":"gu1w","name":"伯婆","nameEn":"Great-aunt","surname":"","sex":"f","birth":"1932","father":null,"mother":null,"spouse":"gu1"},"gu2":{"id":"gu2","name":"叔公","nameEn":"Great-uncle","surname":"吴","sex":"m","birth":"1940","father":"ggf","mother":"ggm","spouse":"gu2w"},"gu2w":{"id":"gu2w","name":"叔婆","nameEn":"Great-aunt","surname":"","sex":"f","birth":"1942","father":null,"mother":null,"spouse":"gu2"},"ga1":{"id":"ga1","name":"姑婆","nameEn":"Great-aunt","surname":"吴","sex":"f","birth":"1942","father":"ggf","mother":"ggm","spouse":"ga1h"},"ga1h":{"id":"ga1h","name":"姑公","nameEn":"Great-uncle","surname":"","sex":"m","birth":"1940","father":null,"mother":null,"spouse":"ga1"},"mgrandpa":{"id":"mgrandpa","name":"外公","nameEn":"Grandpa","surname":"陈","sex":"m","birth":"1938","father":"mggf","mother":"mggm","spouse":"mgrandma"},"mgrandma":{"id":"mgrandma","name":"外婆","nameEn":"Grandma","surname":"","sex":"f","birth":"1940","father":null,"mother":null,"spouse":"mgrandpa"},"u1":{"id":"u1","name":"大伯","nameEn":"Eldest uncle","surname":"吴","sex":"m","birth":"1957","father":"grandpa","mother":"grandma","spouse":"u1w"},"u1w":{"id":"u1w","name":"大伯母","nameEn":"Eldest aunt","surname":"","sex":"f","birth":"1958","father":null,"mother":null,"spouse":"u1"},"a1":{"id":"a1","name":"大姑","nameEn":"Eldest aunt","surname":"吴","sex":"f","birth":"1959","father":"grandpa","mother":"grandma","spouse":"a1h"},"a1h":{"id":"a1h","name":"大姑丈","nameEn":"Eldest uncle","surname":"","sex":"m","birth":"1957","father":null,"mother":null,"spouse":"a1"},"u2":{"id":"u2","name":"二伯","nameEn":"2nd uncle","surname":"吴","sex":"m","birth":"1961","father":"grandpa","mother":"grandma","spouse":"u2w"},"u2w":{"id":"u2w","name":"二伯母","nameEn":"2nd aunt","surname":"","sex":"f","birth":"1962","father":null,"mother":null,"spouse":"u2"},"father":{"id":"father","name":"父亲","nameEn":"Father","surname":"吴","sex":"m","birth":"1965","father":"grandpa","mother":"grandma","spouse":"mother"},"mother":{"id":"mother","name":"母亲","nameEn":"Mother","surname":"陈","sex":"f","birth":"1968","father":"mgrandpa","mother":"mgrandma","spouse":"father"},"u3":{"id":"u3","name":"三叔","nameEn":"3rd uncle","surname":"吴","sex":"m","birth":"1967","father":"grandpa","mother":"grandma","spouse":"u3w"},"u3w":{"id":"u3w","name":"三婶","nameEn":"3rd aunt","surname":"","sex":"f","birth":"1969","father":null,"mother":null,"spouse":"u3"},"a2":{"id":"a2","name":"二姑","nameEn":"2nd aunt","surname":"吴","sex":"f","birth":"1969","father":"grandpa","mother":"grandma","spouse":"a2h"},"a2h":{"id":"a2h","name":"二姑丈","nameEn":"2nd uncle","surname":"","sex":"m","birth":"1967","father":null,"mother":null,"spouse":"a2"},"u4":{"id":"u4","name":"四叔","nameEn":"4th uncle","surname":"吴","sex":"m","birth":"1971","father":"grandpa","mother":"grandma","spouse":"u4w"},"u4w":{"id":"u4w","name":"四婶","nameEn":"4th aunt","surname":"","sex":"f","birth":"1972","father":null,"mother":null,"spouse":"u4"},"a3":{"id":"a3","name":"小姑","nameEn":"Youngest aunt","surname":"吴","sex":"f","birth":"1973","father":"grandpa","mother":"grandma","spouse":"a3h"},"a3h":{"id":"a3h","name":"小姑丈","nameEn":"Youngest uncle","surname":"","sex":"m","birth":"1971","father":null,"mother":null,"spouse":"a3"},"u5":{"id":"u5","name":"小叔","nameEn":"Youngest uncle","surname":"吴","sex":"m","birth":"1976","father":"grandpa","mother":"grandma","spouse":"u5w"},"u5w":{"id":"u5w","name":"小婶","nameEn":"Youngest aunt","surname":"","sex":"f","birth":"1978","father":null,"mother":null,"spouse":"u5"},"f1":{"id":"f1","name":"堂伯","nameEn":"Uncle","surname":"吴","sex":"m","birth":"1955","father":"gu1","mother":"gu1w","spouse":"f1w"},"f1w":{"id":"f1w","name":"堂伯母","nameEn":"Aunt","surname":"","sex":"f","birth":"1957","father":null,"mother":null,"spouse":"f1"},"f2":{"id":"f2","name":"堂伯","nameEn":"Uncle","surname":"吴","sex":"m","birth":"1958","father":"gu1","mother":"gu1w","spouse":null},"f3":{"id":"f3","name":"堂姑","nameEn":"Aunt","surname":"吴","sex":"f","birth":"1962","father":"gu1","mother":"gu1w","spouse":null},"f4":{"id":"f4","name":"堂叔","nameEn":"Uncle","surname":"吴","sex":"m","birth":"1966","father":"gu1","mother":"gu1w","spouse":null},"f5":{"id":"f5","name":"堂叔","nameEn":"Uncle","surname":"吴","sex":"m","birth":"1970","father":"gu1","mother":"gu1w","spouse":null},"f6":{"id":"f6","name":"堂叔","nameEn":"Uncle","surname":"吴","sex":"m","birth":"1968","father":"gu2","mother":"gu2w","spouse":"f6w"},"f6w":{"id":"f6w","name":"堂婶","nameEn":"Aunt","surname":"","sex":"f","birth":"1970","father":null,"mother":null,"spouse":"f6"},"f7":{"id":"f7","name":"堂姑","nameEn":"Aunt","surname":"吴","sex":"f","birth":"1972","father":"gu2","mother":"gu2w","spouse":null},"f8":{"id":"f8","name":"表伯","nameEn":"Uncle","surname":"","sex":"m","birth":"1963","father":"ga1h","mother":"ga1","spouse":null},"f9":{"id":"f9","name":"表姑","nameEn":"Aunt","surname":"","sex":"f","birth":"1970","father":"ga1h","mother":"ga1","spouse":null},"muncle":{"id":"muncle","name":"舅舅","nameEn":"Uncle","surname":"陈","sex":"m","birth":"1970","father":"mgrandpa","mother":"mgrandma","spouse":"muncleW"},"muncleW":{"id":"muncleW","name":"舅妈","nameEn":"Aunt","surname":"","sex":"f","birth":"1972","father":null,"mother":null,"spouse":"muncle"},"brother":{"id":"brother","name":"哥哥","nameEn":"Older brother","surname":"吴","sex":"m","birth":"1994","father":"father","mother":"mother","spouse":"brotherW"},"brotherW":{"id":"brotherW","name":"嫂子","nameEn":"Sister-in-law","surname":"","sex":"f","birth":"1995","father":null,"mother":null,"spouse":"brother"},"sisterO":{"id":"sisterO","name":"姐姐","nameEn":"Older sister","surname":"吴","sex":"f","birth":"1996","father":"father","mother":"mother","spouse":"sisterOh"},"sisterOh":{"id":"sisterOh","name":"姐夫","nameEn":"Brother-in-law","surname":"","sex":"m","birth":"1994","father":null,"mother":null,"spouse":"sisterO"},"sisterY":{"id":"sisterY","name":"妹妹","nameEn":"Younger sister","surname":"吴","sex":"f","birth":"2002","father":"father","mother":"mother","spouse":"sisterYh"},"sisterYh":{"id":"sisterYh","name":"妹夫","nameEn":"Brother-in-law","surname":"","sex":"m","birth":"2000","father":null,"mother":null,"spouse":"sisterY"},"c1":{"id":"c1","name":"堂哥","nameEn":"Cousin","surname":"吴","sex":"m","birth":"1985","father":"u1","mother":"u1w","spouse":"c1w"},"c1w":{"id":"c1w","name":"堂嫂","nameEn":"Cousin's wife","surname":"","sex":"f","birth":"1987","father":null,"mother":null,"spouse":"c1"},"c2":{"id":"c2","name":"堂姐","nameEn":"Cousin","surname":"吴","sex":"f","birth":"1988","father":"u1","mother":"u1w","spouse":null},"c3":{"id":"c3","name":"表哥","nameEn":"Cousin","surname":"","sex":"m","birth":"1990","father":"a1h","mother":"a1","spouse":null},"c4":{"id":"c4","name":"堂哥","nameEn":"Cousin","surname":"吴","sex":"m","birth":"1992","father":"u2","mother":"u2w","spouse":null},"c5":{"id":"c5","name":"堂弟","nameEn":"Cousin","surname":"吴","sex":"m","birth":"2000","father":"u3","mother":"u3w","spouse":null},"c6":{"id":"c6","name":"堂妹","nameEn":"Cousin","surname":"吴","sex":"f","birth":"2003","father":"u3","mother":"u3w","spouse":null},"c7":{"id":"c7","name":"表姐","nameEn":"Cousin","surname":"","sex":"f","birth":"1997","father":"a2h","mother":"a2","spouse":null},"c8":{"id":"c8","name":"堂弟","nameEn":"Cousin","surname":"吴","sex":"m","birth":"2004","father":"u4","mother":"u4w","spouse":null},"c9":{"id":"c9","name":"表妹","nameEn":"Cousin","surname":"","sex":"f","birth":"2005","father":"a3h","mother":"a3","spouse":null},"mc1":{"id":"mc1","name":"表妹","nameEn":"Cousin","surname":"陈","sex":"f","birth":"2001","father":"muncle","mother":"muncleW","spouse":"mc1h"},"mc1h":{"id":"mc1h","name":"表妹夫","nameEn":"Cousin's husband","surname":"","sex":"m","birth":"1999","father":null,"mother":null,"spouse":"mc1"},"s1":{"id":"s1","name":"远房堂哥","nameEn":"Distant cousin","surname":"吴","sex":"m","birth":"1982","father":"f1","mother":"f1w","spouse":null},"s2":{"id":"s2","name":"远房堂姐","nameEn":"Distant cousin","surname":"吴","sex":"f","birth":"1985","father":"f1","mother":"f1w","spouse":null},"s3":{"id":"s3","name":"远房堂弟","nameEn":"Distant cousin","surname":"吴","sex":"m","birth":"2001","father":"f6","mother":"f6w","spouse":null},"s4":{"id":"s4","name":"远房表妹","nameEn":"Distant cousin","surname":"","sex":"f","birth":"2003","father":null,"mother":"f9","spouse":null},"son":{"id":"son","name":"儿子","nameEn":"Son","surname":"吴","sex":"m","birth":"2022","father":"me","mother":"wife","spouse":null},"daughter":{"id":"daughter","name":"女儿","nameEn":"Daughter","surname":"吴","sex":"f","birth":"2024","father":"me","mother":"wife","spouse":null},"k1":{"id":"k1","name":"侄子","nameEn":"Nephew","surname":"吴","sex":"m","birth":"2018","father":"brother","mother":"brotherW","spouse":null},"k2":{"id":"k2","name":"侄女","nameEn":"Niece","surname":"吴","sex":"f","birth":"2020","father":"brother","mother":"brotherW","spouse":null},"k3":{"id":"k3","name":"外甥","nameEn":"Nephew","surname":"","sex":"m","birth":"2021","father":"sisterOh","mother":"sisterO","spouse":null},"k4":{"id":"k4","name":"外甥女","nameEn":"Niece","surname":"","sex":"f","birth":"2025","father":"sisterYh","mother":"sisterY","spouse":null},"k5":{"id":"k5","name":"堂侄","nameEn":"Cousin's son","surname":"吴","sex":"m","birth":"2010","father":"c1","mother":"c1w","spouse":null},"k6":{"id":"k6","name":"堂侄女","nameEn":"Cousin's daughter","surname":"吴","sex":"f","birth":"2013","father":"c1","mother":"c1w","spouse":null},"k7":{"id":"k7","name":"表侄","nameEn":"Cousin's son","surname":"","sex":"m","birth":"2016","father":"c3","mother":null,"spouse":null},"k8":{"id":"k8","name":"堂侄","nameEn":"Cousin's son","surname":"吴","sex":"m","birth":"2024","father":"c5","mother":null,"spouse":null},"k9":{"id":"k9","name":"表外甥","nameEn":"Cousin's son","surname":"","sex":"m","birth":"2023","father":"mc1h","mother":"mc1","spouse":null}},"photos":[{"id":"ph1","title":"春节团圆饭","album":"节日团聚","date":"2025-01-29","tags":["grandpa","father","me"],"path":""},{"id":"ph2","title":"祖屋门前","album":"老照片","date":"1975-06-01","tags":["grandpa","grandma"],"path":""},{"id":"ph3","title":"中秋赏月","album":"节日团聚","date":"2024-09-17","tags":["brother","sisterO","sisterY"],"path":""},{"id":"ph4","title":"全家出游","album":"旅行","date":"2023-12-20","tags":["father","mother","me","wife"],"path":""}],"log":[]};
  var CFG = window.ZY_CONFIG || {};
  // Accept the project URL in any common form: https://abc.supabase.co, …/rest/v1/, a trailing slash, or just the project ref.
  (function () {
    var u = String(CFG.supabaseUrl || '').trim();
    if (u && !/^https?:\/\//.test(u) && /^[a-z0-9]{10,}$/i.test(u)) u = 'https://' + u + '.supabase.co';
    u = u.replace(/\/+(rest|auth|storage|realtime)\/v1\/?.*$/i, '').replace(/\/+$/, '');
    CFG = { supabaseUrl: u, supabaseAnonKey: String(CFG.supabaseAnonKey || '').trim() };
  })();
  var K = { mode: 'zy-mode', family: 'zy-family', me: 'zy-me', demo: 'zy-demo-data', demoPh: 'zy-demo-photo:' };
  var BUCKET = 'family-media';
  var listeners = [];
  var state = { data: null, rev: 0, saving: 0, error: '', loaded: false, user: null, families: [], familyId: null, needFamily: false };
  var urlCache = {};
  var sb = null;
  var channel = null;
  var reloadTimer = null;
  var bc = null;
  try { bc = new BroadcastChannel('zy-data'); } catch (e) {}

  // ---------------------------------------------------------------- helpers
  function ls(k, v) {
    try {
      if (v === undefined) return window.localStorage.getItem(k);
      if (v === null) { window.localStorage.removeItem(k); return null; }
      window.localStorage.setItem(k, v);
    } catch (e) {}
    return null;
  }
  function clone(x) { return JSON.parse(JSON.stringify(x)); }
  function now() { return new Date().toISOString(); }
  function uuid() {
    try { if (window.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
  }
  var ALPHA = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  function code(prefix, n) {
    var out = '';
    var buf = new Uint8Array(n);
    try { crypto.getRandomValues(buf); } catch (e) { for (var j = 0; j < n; j++) buf[j] = Math.random() * 256 | 0; }
    for (var i = 0; i < n; i++) out += ALPHA.charAt(buf[i] % 32);
    return prefix + out;
  }
  function emit() { state.rev++; listeners.slice().forEach(function (f) { try { f(state.rev); } catch (e) {} }); }
  function notifyTabs() { try { if (bc) bc.postMessage({ t: 'changed' }); } catch (e) {} }
  function errMsg(e) { return (e && (e.message || e.error_description || e.msg)) || String(e); }
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
        c.toBlob(function (b) { b ? res(b) : rej(new Error('Could not read this image')); }, 'image/jpeg', quality || 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(u); rej(new Error('Not an image')); };
      img.src = u;
    });
  }
  function blobToDataURL(blob) {
    return new Promise(function (res, rej) { var r = new FileReader(); r.onload = function () { res(String(r.result)); }; r.onerror = rej; r.readAsDataURL(blob); });
  }
  var FIELDS = ['name', 'nameEn', 'surname', 'sex', 'birth', 'death', 'nationality', 'hometown', 'city', 'job', 'phone', 'email', 'bio', 'privacy', 'father', 'mother', 'spouse'];
  var COLS = { name: 'name', nameEn: 'name_en', surname: 'surname', sex: 'sex', birth: 'birth', death: 'death', nationality: 'nationality', hometown: 'hometown', city: 'city', job: 'job', phone: 'phone', email: 'email', bio: 'bio', privacy: 'privacy', father: 'father_id', mother: 'mother_id', spouse: 'spouse_id' };
  function label(p) { return p ? (p.name || p.nameEn || '') : ''; }

  // ---------------------------------------------------------------- shared data shape
  // data = { family:{id,key,name,joinCode}, people:{id:person}, clans:{id:{id,key,surname}}, photos:[...], log:[...], accounts:[...] }
  function finish(d) {
    d.family = d.family || { id: 'demo', key: '', name: '' };
    d.people = d.people || {};
    d.clans = d.clans || {};
    d.photos = d.photos || [];
    d.log = d.log || [];
    d.accounts = d.accounts || [];
    var bySur = {};
    Object.keys(d.clans).forEach(function (k) { bySur[d.clans[k].surname] = d.clans[k]; });
    Object.keys(d.people).forEach(function (id) {
      var p = d.people[id];
      p.id = id;
      var c = p.clanId && d.clans[p.clanId] ? d.clans[p.clanId] : (p.surname ? bySur[p.surname] : null);
      p.clanId = c ? c.id : null;
      p.clanKey = c ? c.key : '';
    });
    return d;
  }

  // ---------------------------------------------------------------- demo back end
  function demoFix(d) {
    d.family = d.family || {};
    if (!d.family.key) d.family.key = code('ZYF-', 6);
    d.family.id = 'demo';
    d.clans = d.clans || {};
    var bySur = {};
    Object.keys(d.clans).forEach(function (k) { bySur[d.clans[k].surname] = k; });
    Object.keys(d.people || {}).forEach(function (id) {
      var p = d.people[id];
      if (!p.key) p.key = code('ZYM-', 8);
      var s = String(p.surname || '').trim();
      p.surname = s;
      if (s && !bySur[s]) { var cid = 'c_' + code('', 8).toLowerCase(); d.clans[cid] = { id: cid, key: code('ZYC-', 6), surname: s }; bySur[s] = cid; }
      p.clanId = s ? bySur[s] : null;
      ['father', 'mother', 'spouse'].forEach(function (f) { if (p[f] && (!d.people[p[f]] || p[f] === id)) p[f] = null; });
    });
    Object.keys(d.people).forEach(function (id) {
      var p = d.people[id];
      if (p.spouse) { var q = d.people[p.spouse]; if (q.spouse && q.spouse !== id && d.people[q.spouse] && d.people[q.spouse].spouse === p.spouse) d.people[q.spouse].spouse = null; q.spouse = id; }
    });
    Object.keys(d.people).forEach(function (id) { var p = d.people[id]; if (p.spouse && d.people[p.spouse].spouse !== id) p.spouse = null; });
    (d.photos || []).forEach(function (ph) { if (!ph.key) ph.key = code('ZYP-', 8); ph.tags = (ph.tags || []).filter(function (t) { return d.people[t]; }); });
    return d;
  }
  function demoRead() {
    var d = null;
    try { var raw = ls(K.demo); d = raw ? JSON.parse(raw) : null; } catch (e) { d = null; }
    if (!d || !d.people) d = clone(SEED);
    d = demoFix(d);
    demoWrite(d);
    return d;
  }
  function demoWrite(d) {
    try { window.localStorage.setItem(K.demo, JSON.stringify(d)); } catch (e) { throw new Error('This browser has no room left for the demo family.'); }
  }
  function demoMutate(op, summary) {
    var d = demoRead();
    var r = op(d);
    demoFix(d);
    d.log = d.log || [];
    d.log.unshift({ at: now(), by: 'demo', what: summary });
    if (d.log.length > 200) d.log.length = 200;
    demoWrite(d);
    state.data = finish(d);
    return r;
  }

  // ---------------------------------------------------------------- cloud back end (Supabase)
  function cloudConfigured() { return !!(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase && window.supabase.createClient); }
  function client() {
    if (!sb && cloudConfigured()) {
      sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
      sb.auth.onAuthStateChange(function (ev, session) {
        var uid = session && session.user ? session.user.id : null;
        var was = state.user ? state.user.id : null;
        state.user = session && session.user ? { id: session.user.id, email: session.user.email || '' } : null;
        if (ev === 'PASSWORD_RECOVERY') { state.recovery = true; emit(); }
        if (uid !== was && ev !== 'INITIAL_SESSION') { state.loaded = false; load(true).catch(function () {}); }
      });
    }
    return sb;
  }
  function q(p) { return p.then(function (r) { if (r.error) throw r.error; return r.data; }); }
  function fromRow(r) {
    var p = { id: r.id, key: r.member_key, clanId: r.clan_id, userId: r.user_id, avatar: r.avatar_path || '', updatedAt: r.updated_at };
    Object.keys(COLS).forEach(function (k) { var v = r[COLS[k]]; p[k] = v === null || v === undefined ? (k === 'father' || k === 'mother' || k === 'spouse' ? null : '') : v; });
    return p;
  }
  function toRow(f) {
    var r = {};
    Object.keys(COLS).forEach(function (k) {
      if (f[k] === undefined) return;
      var v = f[k];
      if (k === 'father' || k === 'mother' || k === 'spouse') v = v ? v : null;
      else v = v === null ? '' : String(v);
      r[COLS[k]] = v;
    });
    return r;
  }
  function cloudLoad() {
    var c = client();
    return c.auth.getSession().then(function (r) {
      var s = r.data && r.data.session;
      state.user = s && s.user ? { id: s.user.id, email: s.user.email || '' } : null;
      if (!state.user) { state.families = []; state.familyId = null; return null; }
      return q(c.from('family_users').select('family_id, role, families(id, name, family_key)').eq('user_id', state.user.id)).then(function (rows) {
        state.families = (rows || []).map(function (x) { return { id: x.family_id, role: x.role, name: (x.families && x.families.name) || '', key: (x.families && x.families.family_key) || '' }; });
        var want = ls(K.family);
        var pick = state.families.filter(function (f) { return f.id === want; })[0] || state.families[0] || null;
        state.familyId = pick ? pick.id : null;
        state.needFamily = !pick;
        if (!pick) return null;
        ls(K.family, pick.id);
        var fid = pick.id;
        return Promise.all([
          q(c.from('families').select('id, family_key, name, join_code').eq('id', fid).single()),
          q(c.from('members').select('*').eq('family_id', fid)),
          q(c.from('clans').select('id, clan_key, surname').eq('family_id', fid)),
          q(c.from('photos').select('*').eq('family_id', fid).order('created_at', { ascending: false })),
          q(c.from('activity').select('at, by_name, what').eq('family_id', fid).order('at', { ascending: false }).limit(40)),
          q(c.from('family_users').select('user_id, role, email, joined_at').eq('family_id', fid))
        ]).then(function (r) {
          var d = { family: { id: r[0].id, key: r[0].family_key, name: r[0].name, joinCode: r[0].join_code }, people: {}, clans: {}, photos: [], log: [], accounts: [] };
          r[1].forEach(function (row) { d.people[row.id] = fromRow(row); });
          r[2].forEach(function (cl) { d.clans[cl.id] = { id: cl.id, key: cl.clan_key, surname: cl.surname }; });
          d.photos = r[3].map(function (ph) { return { id: ph.id, key: ph.photo_key, path: ph.path, title: ph.title, album: ph.album, date: ph.taken_on, tags: ph.tags || [], at: ph.created_at }; });
          d.log = r[4].map(function (g) { return { at: g.at, by: g.by_name, what: g.what }; });
          d.accounts = r[5].map(function (a) { return { userId: a.user_id, role: a.role, email: a.email, joined: a.joined_at }; });
          listen(fid);
          return d;
        });
      });
    });
  }
  function listen(fid) {
    if (!sb || (channel && channel.__fid === fid)) return;
    try {
      if (channel) sb.removeChannel(channel);
      channel = sb.channel('zy-family-' + fid);
      ['members', 'photos', 'families'].forEach(function (t) {
        channel.on('postgres_changes', { event: '*', schema: 'public', table: t, filter: (t === 'families' ? 'id' : 'family_id') + '=eq.' + fid }, function () {
          clearTimeout(reloadTimer);
          reloadTimer = setTimeout(function () { if (!state.saving) load(true).catch(function () {}); }, 400);
        });
      });
      channel.__fid = fid;
      channel.subscribe();
    } catch (e) {}
  }
  function myName() {
    var me = ZY.me;
    return (me && (me.name || me.nameEn)) || (state.user && state.user.email) || '';
  }
  function logAct(what) {
    if (!sb || !state.familyId) return Promise.resolve();
    return sb.from('activity').insert({ family_id: state.familyId, by_user: state.user ? state.user.id : null, by_name: myName(), what: what }).then(function () {}, function () {});
  }

  // ---------------------------------------------------------------- core
  function mode() { return cloudConfigured() && ls(K.mode) !== 'demo' && state.user ? 'cloud' : 'demo'; }
  function load(force) {
    if (state.loaded && !force) return Promise.resolve(state.data);
    if (cloudConfigured() && ls(K.mode) !== 'demo') {
      return cloudLoad().then(function (d) {
        state.loaded = true; state.error = '';
        state.data = d ? finish(d) : (state.user ? finish({ family: { id: null, key: '', name: '' } }) : finish(demoRead()));
        emit();
        return state.data;
      }).catch(function (e) {
        state.loaded = true; state.error = errMsg(e);
        if (!state.data) state.data = finish({});
        emit();
        throw e;
      });
    }
    state.data = finish(demoRead()); state.loaded = true; state.error = ''; emit();
    return Promise.resolve(state.data);
  }
  // Run a change. Demo: synchronous on the local copy. Cloud: the database call, then a fresh load.
  function run(demoOp, cloudOp, summary) {
    if (mode() !== 'cloud' && !demoOp) return Promise.resolve(null);
    if (mode() === 'cloud' && !cloudOp) return Promise.resolve(null);
    state.saving++; state.error = ''; emit();
    var p;
    if (mode() === 'cloud') {
      p = Promise.resolve().then(cloudOp).then(function (res) {
        return logAct(summary).then(function () { return load(true); }).then(function () { return res; });
      });
    } else {
      p = new Promise(function (res) { res(demoMutate(demoOp, summary)); });
    }
    return p.then(function (res) { state.saving--; emit(); notifyTabs(); return res; }, function (e) { state.saving--; state.error = errMsg(e); emit(); throw e; });
  }
  if (bc) bc.onmessage = function () { load(true).catch(function () {}); };
  window.addEventListener('storage', function (e) { if (e.key === K.demo && mode() === 'demo') load(true).catch(function () {}); });

  function meId() {
    var d = state.data;
    if (!d) return null;
    if (mode() === 'cloud') {
      var uid = state.user && state.user.id;
      var ids = Object.keys(d.people);
      for (var i = 0; i < ids.length; i++) if (uid && d.people[ids[i]].userId === uid) return ids[i];
      return null;
    }
    var m = ls(K.me);
    return m && d.people[m] ? m : (d.people.me ? 'me' : Object.keys(d.people)[0] || null);
  }
  function upload(path, blob) {
    if (mode() === 'cloud') {
      return q(sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })).then(function () { return path; });
    }
    return blobToDataURL(blob).then(function (u) {
      try { window.localStorage.setItem(K.demoPh + path, u); } catch (e) { throw new Error('Demo storage is full. Sign in to keep more photos.'); }
      return path;
    });
  }
  function removeFile(path) {
    if (!path) return Promise.resolve();
    delete urlCache[path];
    if (mode() === 'cloud') return sb.storage.from(BUCKET).remove([path]).then(function () {}, function () {});
    try { window.localStorage.removeItem(K.demoPh + path); } catch (e) {}
    return Promise.resolve();
  }
  // Works out the extra links when a new person is added "as the child / parent / spouse / sibling of" someone.
  function relFields(fields, o, newId, sexNew) {
    var extra = { self: {}, other: null };
    if (!o) return extra;
    var noSur = !String(fields.surname || '').trim();
    if (fields.rel === 'child') {
      if (o.sex === 'f') { extra.self.mother = o.id; if (o.spouse) extra.self.father = o.spouse; }
      else { extra.self.father = o.id; if (o.spouse) extra.self.mother = o.spouse; }
      var dad = extra.self.father ? ZY.person(extra.self.father) : null;
      if (noSur && dad && dad.surname) extra.self.surname = dad.surname;
    } else if (fields.rel === 'parent') {
      if (noSur && sexNew !== 'f' && o.surname) extra.self.surname = o.surname;
      var otherParent = sexNew === 'f' ? o.father : o.mother;
      extra.other = { id: o.id, field: sexNew === 'f' ? 'mother' : 'father', value: newId };
      if (otherParent && !fields.spouse) { var op = ZY.person(otherParent); if (op && !op.spouse) extra.self.spouse = otherParent; }
    } else if (fields.rel === 'spouse') {
      extra.self.spouse = o.id;
    } else if (fields.rel === 'sibling') {
      extra.self.father = o.father || null; extra.self.mother = o.mother || null;
      if (noSur && o.surname) extra.self.surname = o.surname;
    }
    return extra;
  }

  var ZY = {
    version: '2.0.0',
    get cloud() { return cloudConfigured(); },
    get data() { return state.data; },
    get rev() { return state.rev; },
    get mode() { return mode(); },
    get user() { return state.user; },
    get signedIn() { return mode() === 'cloud' ? !!state.user : ls(K.mode) === 'demo'; },
    get needFamily() { return mode() === 'cloud' && !!state.user && state.needFamily; },
    get families() { return state.families.slice(); },
    get familyId() { return mode() === 'cloud' ? state.familyId : 'demo'; },
    get isAdmin() { if (mode() !== 'cloud') return true; var f = state.families.filter(function (x) { return x.id === state.familyId; })[0]; return !!(f && f.role === 'admin'); },
    get recovery() { return !!state.recovery; },
    get meId() { return meId(); },
    get me() { var id = meId(); return id && state.data ? state.data.people[id] : null; },
    get login() { return state.user ? state.user.email : ''; },
    get saving() { return state.saving > 0; },
    get error() { return state.error; },
    get loaded() { return state.loaded; },
    seed: SEED,
    label: label,
    ready: function () { return load(false).catch(function () { return state.data; }); },
    reload: function () { return load(true); },
    subscribe: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; },
    person: function (id) { return state.data && id ? state.data.people[id] || null : null; },
    people: function () { return state.data ? Object.keys(state.data.people).map(function (k) { return state.data.people[k]; }) : []; },
    clans: function () {
      if (!state.data) return [];
      var ppl = ZY.people();
      return Object.keys(state.data.clans).map(function (k) { var c = state.data.clans[k]; return { id: c.id, key: c.key, surname: c.surname, count: ppl.filter(function (p) { return p.clanId === c.id; }).length }; })
        .filter(function (c) { return c.count > 0; }).sort(function (a, b) { return b.count - a.count; });
    },
    childrenOf: function (id) { return ZY.people().filter(function (p) { return p.father === id || p.mother === id; }); },

    // ----- accounts -----
    signUp: function (o) {
      var c = client();
      if (!c) return Promise.reject(new Error('NOT_CONFIGURED'));
      var back = window.location.href.split('#')[0].split('?')[0];
      return q(c.auth.signUp({ email: String(o.email || '').trim(), password: String(o.password || ''), options: { data: { name: o.name || '' }, emailRedirectTo: back } })).then(function (d) {
        ls(K.mode, 'cloud');
        state.loaded = false;
        return load(true).catch(function () {}).then(function () { return { needsConfirm: !(d && d.session), hasFamily: !!state.familyId }; });
      });
    },
    signIn: function (o) {
      var c = client();
      if (!c) return Promise.reject(new Error('NOT_CONFIGURED'));
      return q(c.auth.signInWithPassword({ email: String(o.email || '').trim(), password: String(o.password || '') })).then(function () {
        ls(K.mode, 'cloud');
        state.loaded = false;
        return load(true).then(function () { return { hasFamily: !!state.familyId, linked: !!meId() }; });
      });
    },
    resetPassword: function (email) {
      var c = client();
      if (!c) return Promise.reject(new Error('NOT_CONFIGURED'));
      return q(c.auth.resetPasswordForEmail(String(email || '').trim(), { redirectTo: window.location.href.split('#')[0].split('?')[0] }));
    },
    updatePassword: function (pw) {
      var c = client();
      return q(c.auth.updateUser({ password: pw })).then(function () { state.recovery = false; emit(); });
    },
    signOut: function () {
      var c = client();
      Object.keys(urlCache).forEach(function (k) { delete urlCache[k]; });
      state.loaded = false; state.data = null; state.families = []; state.familyId = null;
      if (channel && sb) { try { sb.removeChannel(channel); } catch (e) {} channel = null; }
      ls(K.mode, null); ls(K.family, null);
      return (c ? c.auth.signOut().catch(function () {}) : Promise.resolve()).then(function () { state.user = null; return load(true); });
    },
    startDemo: function () { ls(K.mode, 'demo'); state.loaded = false; return load(true); },
    useCloud: function () { ls(K.mode, 'cloud'); state.loaded = false; return load(true); },
    resetDemo: function () {
      try { Object.keys(window.localStorage).forEach(function (k) { if (k.indexOf(K.demoPh) === 0) window.localStorage.removeItem(k); }); } catch (e) {}
      ls(K.demo, null); ls(K.me, null); state.loaded = false; return load(true);
    },

    // ----- family spaces -----
    createFamily: function (o) {
      return q(client().rpc('zy_create_family', { p_name: o.familyName || '', p_me: { name: o.name || '', nameEn: o.nameEn || '', surname: o.surname || '', sex: o.sex === 'f' ? 'f' : 'm' } })).then(function (fid) {
        ls(K.family, fid); ls(K.mode, 'cloud'); state.loaded = false; return load(true).then(function () { return fid; });
      });
    },
    joinFamily: function (joinCode) {
      return q(client().rpc('zy_join_family', { p_code: String(joinCode || '').trim().toUpperCase() })).then(function (fid) {
        ls(K.family, fid); ls(K.mode, 'cloud'); state.loaded = false; return load(true).then(function () { return { familyId: fid, linked: !!meId() }; });
      });
    },
    switchFamily: function (fid) { ls(K.family, fid); state.loaded = false; Object.keys(urlCache).forEach(function (k) { delete urlCache[k]; }); return load(true); },
    newJoinCode: function () { return run(null, function () { return q(sb.rpc('zy_new_join_code', { p_family: state.familyId })); }, 'New join code'); },
    setRole: function (userId, role) { return run(null, function () { return q(sb.rpc('zy_set_role', { p_family: state.familyId, p_user: userId, p_role: role })); }, 'Change account role'); },
    removeAccount: function (userId) { return run(null, function () { return q(sb.from('family_users').delete().eq('family_id', state.familyId).eq('user_id', userId)); }, 'Remove an account'); },
    joinLink: function () {
      var c = state.data && state.data.family && state.data.family.joinCode;
      if (!c) return '';
      var base = window.location.href.split('#')[0].split('?')[0].replace(/[^/]*$/, '');
      return base + (/\/App[A-Z]\w*\.dc\.html/.test(window.location.pathname) ? 'AppLogin.dc.html' : 'Login.dc.html') + '?join=' + c;
    },
    setFamilyName: function (name) {
      return run(function (d) { d.family.name = name; }, function () { return q(sb.from('families').update({ name: name }).eq('id', state.familyId)); }, 'Rename family');
    },

    // ----- people -----
    savePerson: function (fields) {
      var isNew = !fields.id || !ZY.person(fields.id);
      var nm = fields.name || fields.nameEn || '';
      var o = isNew && fields.rel && fields.of ? ZY.person(fields.of) : null;
      if (mode() === 'cloud') {
        return run(null, function () {
          if (!isNew) return q(sb.from('members').update(toRow(fields)).eq('id', fields.id)).then(function () { return fields.id; });
          var nid = uuid();
          var ex = relFields(fields, o, nid, fields.sex);
          var row = toRow(Object.assign({}, fields, ex.self));
          row.id = nid; row.family_id = state.familyId;
          return q(sb.from('members').insert(row)).then(function () {
            if (!ex.other) return nid;
            var upd = {}; upd[COLS[ex.other.field]] = nid;
            return q(sb.from('members').update(upd).eq('id', ex.other.id)).then(function () { return nid; });
          });
        }, (isNew ? 'Add ' : 'Update ') + nm);
      }
      return run(function (d) {
        var id = isNew ? 'p_' + code('', 10).toLowerCase() : fields.id;
        var p = d.people[id] || { id: id, createdAt: now() };
        FIELDS.forEach(function (k) { if (fields[k] !== undefined) p[k] = (k === 'father' || k === 'mother' || k === 'spouse') ? (fields[k] || null) : fields[k]; });
        p.updatedAt = now();
        d.people[id] = p;
        if (isNew && o) {
          var ex = relFields(fields, d.people[o.id], id, p.sex);
          Object.keys(ex.self).forEach(function (k) { p[k] = ex.self[k]; });
          if (ex.other && d.people[ex.other.id]) d.people[ex.other.id][ex.other.field] = id;
        }
        return id;
      }, null, (isNew ? 'Add ' : 'Update ') + nm);
    },
    deletePerson: function (id) {
      var p = ZY.person(id);
      var av = p && p.avatar;
      return run(function (d) {
        delete d.people[id];
        Object.keys(d.people).forEach(function (k) { var x = d.people[k]; ['father', 'mother', 'spouse'].forEach(function (f) { if (x[f] === id) x[f] = null; }); });
        (d.photos || []).forEach(function (ph) { ph.tags = (ph.tags || []).filter(function (t) { return t !== id; }); });
      }, function () { return q(sb.from('members').delete().eq('id', id)); }, 'Remove ' + (label(p) || id)).then(function (r) { if (av) removeFile(av); return r; });
    },
    linkMe: function (id) {
      if (mode() !== 'cloud') { ls(K.me, id); emit(); return Promise.resolve(id); }
      return run(null, function () { return q(sb.rpc('zy_link_me', { p_member: id })); }, 'Linked account to ' + (label(ZY.person(id)) || id));
    },

    // ----- photos and avatars -----
    addPhoto: function (file, meta) {
      meta = meta || {};
      var fid = ZY.familyId;
      var id = mode() === 'cloud' ? uuid() : 'ph_' + code('', 10).toLowerCase();
      return resize(file, 1600, 0.82).then(function (blob) {
        return upload(fid + '/photos/' + id + '.jpg', blob).then(function (path) {
          return run(function (d) {
            d.photos = d.photos || [];
            d.photos.unshift({ id: id, path: path, title: meta.title || '', album: meta.album || '', date: meta.date || now().slice(0, 10), tags: meta.tags || [], at: now() });
            return id;
          }, function () {
            return q(sb.from('photos').insert({ id: id, family_id: fid, path: path, title: meta.title || '', album: meta.album || '', taken_on: meta.date || now().slice(0, 10), tags: meta.tags || [], uploaded_by: state.user.id })).then(function () { return id; });
          }, 'Add photo ' + (meta.title || ''));
        });
      });
    },
    updatePhoto: function (id, f) {
      return run(function (d) { d.photos.forEach(function (ph) { if (ph.id === id) ['title', 'album', 'date', 'tags'].forEach(function (k) { if (f[k] !== undefined) ph[k] = f[k]; }); }); },
        function () { var u = {}; if (f.title !== undefined) u.title = f.title; if (f.album !== undefined) u.album = f.album; if (f.date !== undefined) u.taken_on = f.date; if (f.tags !== undefined) u.tags = f.tags; return q(sb.from('photos').update(u).eq('id', id)); },
        'Edit photo ' + (f.title || ''));
    },
    deletePhoto: function (id) {
      var ph = ((state.data && state.data.photos) || []).filter(function (x) { return x.id === id; })[0];
      return run(function (d) { d.photos = d.photos.filter(function (x) { return x.id !== id; }); }, function () { return q(sb.from('photos').delete().eq('id', id)); }, 'Delete photo ' + ((ph && ph.title) || ''))
        .then(function (r) { if (ph && ph.path) removeFile(ph.path); return r; });
    },
    setAvatar: function (personId, file) {
      var old = (ZY.person(personId) || {}).avatar;
      return resize(file, 512, 0.86).then(function (blob) {
        return upload(ZY.familyId + '/avatars/' + personId + '-' + Date.now().toString(36) + '.jpg', blob).then(function (path) {
          return run(function (d) { if (d.people[personId]) d.people[personId].avatar = path; },
            function () { return q(sb.from('members').update({ avatar_path: path }).eq('id', personId)); }, 'New photo for ' + (label(ZY.person(personId)) || ''))
            .then(function () { if (old && old !== path) removeFile(old); return path; });
        });
      });
    },
    clearAvatar: function (personId) {
      var old = (ZY.person(personId) || {}).avatar;
      return run(function (d) { if (d.people[personId]) d.people[personId].avatar = ''; }, function () { return q(sb.from('members').update({ avatar_path: '' }).eq('id', personId)); }, 'Remove photo')
        .then(function () { if (old) removeFile(old); });
    },
    // A URL for <img src>. Cloud photos are private: this asks Supabase for a link that works for one hour.
    imageURL: function (path) {
      if (!path) return Promise.resolve('');
      var hit = urlCache[path];
      if (hit && hit.until > Date.now()) return hit.p;
      var p;
      if (mode() === 'cloud') p = q(sb.storage.from(BUCKET).createSignedUrl(path, 3600)).then(function (r) { return (r && r.signedUrl) || ''; });
      else p = Promise.resolve(ls(K.demoPh + path) || '');
      p = p.catch(function () { delete urlCache[path]; return ''; });
      urlCache[path] = { p: p, until: Date.now() + 50 * 60 * 1000 };
      return p;
    },

    // ----- backup -----
    exportJSON: function () {
      var d = state.data || {};
      return JSON.stringify({ schema: 2, family: { key: d.family && d.family.key, name: d.family && d.family.name }, clans: d.clans, people: d.people, photos: d.photos, exportedAt: now() }, null, 1);
    },
    importJSON: function (text) {
      var src = JSON.parse(text);
      if (!src || typeof src.people !== 'object') return Promise.reject(new Error('This is not a Zenith Yield backup file.'));
      var list = Object.keys(src.people).map(function (k) { var p = src.people[k]; p.id = p.id || k; return p; });
      if (mode() !== 'cloud') {
        return run(function (d) { d.people = {}; list.forEach(function (p) { d.people[p.id] = p; }); d.family.name = (src.family && src.family.name) || d.family.name; d.clans = src.clans || {}; d.photos = (src.photos || []).filter(function (x) { return !x.path || true; }); }, null, 'Restore backup');
      }
      // Cloud: copy everyone in as new people (new member keys), then rebuild their links.
      return run(null, function () {
        var map = {};
        list.forEach(function (p) { map[p.id] = uuid(); });
        var rows = list.map(function (p) { var r = toRow(Object.assign({}, p, { father: null, mother: null, spouse: null })); r.id = map[p.id]; r.family_id = state.familyId; return r; });
        return q(sb.from('members').insert(rows)).then(function () {
          var jobs = list.filter(function (p) { return p.father || p.mother || p.spouse; }).map(function (p) {
            return q(sb.from('members').update({ father_id: map[p.father] || null, mother_id: map[p.mother] || null, spouse_id: map[p.spouse] || null }).eq('id', map[p.id]));
          });
          return Promise.all(jobs);
        });
      }, 'Restore backup (' + list.length + ' people)');
    }
  };
  window.ZY = ZY;
  load(false).catch(function () {});
})();
