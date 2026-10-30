/*
 * ZY FamilyTree page runtime.
 * Runs the *.dc.html pages on any static host (GitHub Pages) with no build step and no dependencies.
 * A page is: <x-dc> template (with <helmet> for <head> content) + <script type="text/x-dc"> class Component.
 * Template features: {{a.b}} holes, <sc-for list as>, <sc-if value>, onX="{{fn}}" events, ref="{{fn}}".
 */
(function () {
  'use strict';
  var hide = document.createElement('style');
  hide.textContent = 'x-dc{display:none!important}';
  (document.head || document.documentElement).appendChild(hide);

  var SVG = 'http://www.w3.org/2000/svg';
  var VOID = { area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1, link: 1, meta: 1, source: 1, track: 1, wbr: 1 };
  var RAW = { style: 1, script: 1, textarea: 1 };
  var EVT = { onDoubleClick: 'dblclick' };
  var ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', copy: '©', middot: '·', times: '×', hellip: '…', mdash: '—', ndash: '–' };

  function decode(s) {
    if (s.indexOf('&') < 0) return s;
    return s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, function (m, e) {
      if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
      return ENT[e] !== undefined ? ENT[e] : m;
    });
  }

  // ---------- template parser (kept tolerant: tables, svg, void tags) ----------
  function parse(src) {
    var root = { tag: '#root', attrs: [], kids: [] };
    var stack = [root];
    var i = 0;
    var n = src.length;
    function top() { return stack[stack.length - 1]; }
    while (i < n) {
      if (src.charCodeAt(i) === 60) { // '<'
        if (src.substr(i, 4) === '<!--') { var c = src.indexOf('-->', i + 4); i = c < 0 ? n : c + 3; continue; }
        if (src[i + 1] === '/') {
          var j = src.indexOf('>', i);
          var name = src.slice(i + 2, j).trim().toLowerCase();
          for (var k = stack.length - 1; k > 0; k--) if (stack[k].tag.toLowerCase() === name) { stack.length = k; break; }
          i = j + 1;
          continue;
        }
        if (/[a-zA-Z]/.test(src[i + 1] || '')) {
          var m = /^<([a-zA-Z][\w:-]*)/.exec(src.slice(i, i + 64));
          var tag = m[1];
          i += m[0].length;
          var attrs = [];
          var self = false;
          for (;;) {
            while (i < n && /\s/.test(src[i])) i++;
            if (src[i] === '>') { i++; break; }
            if (src[i] === '/' && src[i + 1] === '>') { i += 2; self = true; break; }
            if (i >= n) break;
            var am = /^[^\s=>\/]+/.exec(src.slice(i, i + 200));
            if (!am) { i++; continue; }
            var an = am[0];
            i += an.length;
            while (i < n && /\s/.test(src[i])) i++;
            var av = '';
            if (src[i] === '=') {
              i++;
              while (i < n && /\s/.test(src[i])) i++;
              var q = src[i];
              if (q === '"' || q === "'") { var e = src.indexOf(q, i + 1); av = src.slice(i + 1, e); i = e + 1; }
              else { var um = /^[^\s>]+/.exec(src.slice(i)); av = um ? um[0] : ''; i += av.length; }
            }
            attrs.push([an, decode(av)]);
          }
          var node = { tag: tag, attrs: attrs, kids: [] };
          top().kids.push(node);
          var low = tag.toLowerCase();
          if (RAW[low] && !self) {
            var end = src.toLowerCase().indexOf('</' + low, i);
            if (end < 0) end = n;
            node.kids.push(src.slice(i, end));
            i = src.indexOf('>', end) + 1 || n;
          } else if (!self && !VOID[low]) stack.push(node);
          continue;
        }
      }
      var t = src.indexOf('<', i + 1);
      if (t < 0) t = n;
      top().kids.push(decode(src.slice(i, t)));
      i = t;
    }
    return root;
  }

  // ---------- compile template tree to a render function ----------
  var HOLE = /\{\{\s*([\w$.]+)\s*\}\}/g;
  function lookup(path, scopes) {
    var parts = path.split('.');
    var v;
    var found = false;
    for (var s = scopes.length - 1; s >= 0; s--) {
      var sc = scopes[s];
      if (sc && Object.prototype.hasOwnProperty.call(sc, parts[0])) { v = sc[parts[0]]; found = true; break; }
    }
    if (!found) return undefined;
    for (var k = 1; k < parts.length; k++) { if (v === null || v === undefined) return undefined; v = v[parts[k]]; }
    return v;
  }
  function value(str) {
    HOLE.lastIndex = 0;
    var m = /^\{\{\s*([\w$.]+)\s*\}\}$/.exec(str);
    if (m) { var p = m[1]; return function (sc) { return lookup(p, sc); }; }
    if (str.indexOf('{{') < 0) return function () { return str; };
    var parts = str.split(HOLE);
    return function (sc) {
      var out = '';
      for (var k = 0; k < parts.length; k++) {
        if (k % 2) { var v = lookup(parts[k], sc); out += v === undefined || v === null ? '' : v; } else out += parts[k];
      }
      return out;
    };
  }
  function attr(node, name) { for (var k = 0; k < node.attrs.length; k++) if (node.attrs[k][0] === name) return node.attrs[k][1]; return null; }
  function compileKids(kids, svg) {
    var fns = kids.map(function (k) { return compile(k, svg); }).filter(Boolean);
    return function (sc, out) { for (var k = 0; k < fns.length; k++) fns[k](sc, out); };
  }
  function compile(node, svg) {
    if (typeof node === 'string') {
      var f = value(node);
      return function (sc, out) { var v = f(sc); out.push(v === undefined || v === null ? '' : String(v)); };
    }
    var low = node.tag.toLowerCase();
    if (low === 'helmet') return null;
    if (low === 'sc-for') {
      var list = value(attr(node, 'list') || '');
      var as = attr(node, 'as') || 'item';
      var body = compileKids(node.kids, svg);
      return function (sc, out) {
        var arr = list(sc) || [];
        for (var k = 0; k < arr.length; k++) { var o = {}; o[as] = arr[k]; o.$index = k; sc.push(o); body(sc, out); sc.pop(); }
      };
    }
    if (low === 'sc-if') {
      var cond = value(attr(node, 'value') || '');
      var b2 = compileKids(node.kids, svg);
      return function (sc, out) { if (cond(sc)) b2(sc, out); };
    }
    var isSvg = svg || low === 'svg';
    var props = node.attrs.filter(function (a) { return a[0].indexOf('hint-') !== 0; }).map(function (a) { return [a[0], value(a[1])]; });
    var kidsFn = compileKids(node.kids, isSvg && low !== 'foreignobject');
    var raw = RAW[low] ? node.kids.join('') : null;
    return function (sc, out) {
      var p = {};
      for (var k = 0; k < props.length; k++) p[props[k][0]] = props[k][1](sc);
      var kids = [];
      if (raw === null) kidsFn(sc, kids);
      out.push({ tag: node.tag, svg: isSvg, props: p, kids: kids, raw: raw });
    };
  }

  // ---------- DOM patching ----------
  function setProp(el, name, v, old) {
    if (/^on[A-Z]/.test(name)) {
      var ev = EVT[name] || name.slice(2).toLowerCase();
      if (!el.__h) el.__h = {};
      if (!el.__h[ev]) el.addEventListener(ev, function (e) { var h = el.__h[ev]; if (typeof h === 'function') return h(e); }, ev === 'wheel' || ev === 'touchmove' ? { passive: true } : false);
      el.__h[ev] = v;
      return;
    }
    if (name === 'ref') { if (typeof v === 'function' && v !== old) v(el); return; }
    if (v === undefined || v === null || v === false) { el.removeAttribute(name); return; }
    if (v === true) v = '';
    el.setAttribute(name, String(v));
    if (name === 'value' && 'value' in el && el.value !== String(v) && document.activeElement !== el) el.value = String(v);
    if (name === 'checked' && 'checked' in el) el.checked = true;
    if (name === 'selected' && 'selected' in el) el.selected = true;
  }
  function create(v) {
    var el = v.svg ? document.createElementNS(SVG, v.tag) : document.createElement(v.tag);
    el.__p = {};
    update(el, v);
    return el;
  }
  function update(el, v) {
    var old = el.__p || {};
    var k;
    for (k in old) if (!(k in v.props) && !/^on[A-Z]/.test(k) && k !== 'ref') { el.removeAttribute(k); if (k === 'checked' && 'checked' in el) el.checked = false; }
    for (k in v.props) if (old[k] !== v.props[k] || !(k in old)) setProp(el, k, v.props[k], old[k]);
    el.__p = v.props;
    if (v.raw !== null) {
      if (el.textContent !== v.raw && !('value' in v.props)) el.textContent = v.raw;
      if ('value' in v.props && el.value !== String(v.props.value == null ? '' : v.props.value) && document.activeElement !== el) el.value = String(v.props.value == null ? '' : v.props.value);
      return;
    }
    patch(el, v.kids);
    if (el.localName === 'select' && 'value' in v.props && el.value !== String(v.props.value == null ? '' : v.props.value)) el.value = String(v.props.value == null ? '' : v.props.value);
  }
  function same(node, v) {
    if (typeof v === 'string') return node.nodeType === 3;
    return node.nodeType === 1 && node.__p && node.localName === v.tag.toLowerCase() && (node.namespaceURI === SVG) === v.svg;
  }
  function patch(parent, list) {
    var nodes = parent.childNodes;
    for (var k = 0; k < list.length; k++) {
      var v = list[k];
      var cur = nodes[k];
      if (cur && same(cur, v)) {
        if (typeof v === 'string') { if (cur.data !== v) cur.data = v; } else update(cur, v);
        continue;
      }
      var fresh = typeof v === 'string' ? document.createTextNode(v) : create(v);
      if (cur) parent.replaceChild(fresh, cur); else parent.appendChild(fresh);
    }
    while (nodes.length > list.length) parent.removeChild(parent.lastChild);
  }

  // ---------- component base ----------
  function DCLogic(props) { this.props = props || {}; this.state = this.state || {}; }
  DCLogic.prototype.setState = function (part, cb) {
    var p = typeof part === 'function' ? part(this.state, this.props) : part;
    this.state = Object.assign({}, this.state || {}, p || {});
    (this.__cbs || (this.__cbs = [])).push(cb);
    if (this.__render) this.__render();
  };
  DCLogic.prototype.renderVals = function () { return {}; };

  function mount(src) {
    var a = src.indexOf('<x-dc>');
    var b = src.lastIndexOf('</x-dc>');
    if (a < 0 || b < 0) return;
    var tpl = src.slice(a + 6, b);
    var hm = /<helmet>([\s\S]*?)<\/helmet>/i.exec(tpl);
    if (hm) {
      var t = document.createElement('template');
      t.innerHTML = hm[1];
      Array.prototype.forEach.call(t.content.childNodes, function (nd) { if (nd.nodeType === 1) document.head.appendChild(nd.cloneNode(true)); });
      tpl = tpl.replace(hm[0], '');
    }
    var sm = /<script[^>]*type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/i.exec(src);
    var Comp = DCLogic;
    if (sm) {
      try { Comp = new Function('DCLogic', sm[1] + '\n;return Component;')(DCLogic); } catch (e) { console.error('[zy] page script failed', e); }
    }
    var render = compileKids(parse(tpl).kids, false);
    var host = document.createElement('div');
    host.id = 'zy-app';
    var xdc = document.querySelector('x-dc');
    if (xdc) xdc.parentNode.insertBefore(host, xdc); else document.body.appendChild(host);
    if (xdc) xdc.parentNode.removeChild(xdc);
    var inst;
    try { inst = new Comp({}); } catch (e) { console.error('[zy] constructor failed', e); return; }
    var queued = false;
    var mounted = false;
    function draw() {
      queued = false;
      var cbs = inst.__cbs || [];
      inst.__cbs = [];
      try {
        var vals = inst.renderVals() || {};
        var out = [];
        render([vals], out);
        patch(host, out);
      } catch (e) { console.error('[zy] render failed', e); }
      cbs.forEach(function (cb) { if (typeof cb === 'function') try { cb(); } catch (e) { console.error(e); } });
    }
    inst.__render = function () { if (!queued) { queued = true; Promise.resolve().then(draw); } };
    draw();
    mounted = true;
    if (inst.componentDidMount) try { inst.componentDidMount(); } catch (e) { console.error('[zy] mount failed', e); }
    window.addEventListener('pagehide', function () { if (mounted && inst.componentWillUnmount) try { inst.componentWillUnmount(); } catch (e) {} });
    window.__zyPage = inst;
  }

  function start() {
    var inline = document.documentElement.outerHTML;
    var url = location.href.split('#')[0];
    fetch(url, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.text() : inline; }).catch(function () { return inline; }).then(mount);
  }
  window.DCLogic = DCLogic;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
