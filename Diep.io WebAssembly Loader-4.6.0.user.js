// ==UserScript==
// @name         Diep.io WebAssembly Loader
// @namespace    https://github.com/DDatiOSCheat/DiepWASM
// @version      4.6.0
// @description  Load custom WebAssembly builds for testing and development on diep.io. Supports remote URLs, local servers, file uploads, and GitHub releases.
// @author       tinysweet
// @match        https://diep.io/*
// @match        https://*.diep.io/*
// @run-at       document-start
// @icon         https://tinysweet.qzz.io/image/cuteee.jpg
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @connect      github.com
// @connect      api.github.com
// @connect      diep.io
// @connect      localhost
// @connect      127.0.0.1
// @require      https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/js/all.min.js
// @homepageURL  https://github.com/DDatiOSCheat/DiepWASM
// @supportURL   https://github.com/DDatiOSCheat/DiepWASM/issues
// ==/UserScript==

/*
Diep.io WebAssembly Loader

This userscript is intended for development and testing purposes.
It allows loading custom WebAssembly builds while developing or debugging
WebAssembly-based applications on diep.io.

This script does not contain or distribute modified game binaries.
Users are responsible for any external WebAssembly files they load.
*/

/*
--------------------------------------------------
 Script   : [Diep.io WebAssembly Loader]
 Author   : tinysweet
 Discord  : tinysweet_dev
 GitHub   : https://github.com/DDatiOSCheat

 Main Repo of this script : https://github.com/DDatiOSCheat/DiepWASM

 Partners : no one
--------------------------------------------------
*/

const GITHUB_OWNER      = 'DDatiOSCheat';
const GITHUB_REPO       = 'DiepWASM';
const GITHUB_API        = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;
const GITHUB_URL        = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`;
const ORIGINAL_WASM_URL = 'https://diep.io/diep.wasm';

const CFG_KEY = 'wasmtool_tiny';
let cfg = {
    mode: 'remote', remoteUrl: ORIGINAL_WASM_URL,
    localUrl: 'http://localhost:8080/diep_mod.wasm',
    enabled: true, lang: 'en',
};
try { Object.assign(cfg, JSON.parse(GM_getValue(CFG_KEY, '{}'))) } catch {}
function saveCfg() { try { GM_setValue(CFG_KEY, JSON.stringify(cfg)); } catch {} }

function isCustomMode() {
    if (!cfg.enabled) return false;
    if (cfg.mode === 'file') return !!wasmCache;
    const url = cfg.mode === 'local' ? cfg.localUrl : cfg.remoteUrl;
    return !!(url && url !== ORIGINAL_WASM_URL);
}

const I18N = {
    en: {
        brand_sub:'diep.io injector · v4.6',hook_label:'Hook',status_idle:'Idle',status_loading:'Loading…',status_ok:'Injected',status_error:'Error',
        sec_source:'WASM Source',tab_remote:'Remote',tab_local:'Local',tab_file:'File',tab_github:'GitHub',
        lbl_remote_url:'Remote URL',ph_remote:'https://example.com/mod.wasm',preset_lbl:'Presets:',preset_orig:'Original',
        lbl_local_url:'Local Server URL',ph_local:'http://localhost:8080/mod.wasm',hint_cors:'Local server must have CORS headers enabled.',
        drop_main:'Drop .wasm file here',drop_sub:'or click to browse',sec_actions:'Actions',
        btn_apply:'Apply & Inject WASM',btn_reload:'Clear Cache & Reload',btn_reset:'Reset to Default',
        hint_ctrlf5:'If WASM doesn\'t inject, press <kbd>Ctrl+F5</kbd> for a hard reload.',
        ctrlf5_clearing:'Clearing cache before hard reload…',
        sec_info:'Info',info_version:'Version',info_author:'Author',info_toggle:'Toggle',info_mode:'Mode',info_mode_val:'hooks + IDB cache',
        footer_label:'diep.io injector',footer_hint:'ESC to toggle',
        gh_title:'Mod Releases',gh_subtitle:'Pre-modded WASM builds from the official repo',gh_visit:'Visit Repo',gh_refresh:'Refresh',
        gh_loading:'Fetching releases…',gh_empty:'No WASM assets found.',gh_error:'Failed to fetch releases.',
        gh_use:'Use',gh_latest:'LATEST',gh_assets:'assets',
        toast_hook_on:'WASM hook <b>enabled</b>',toast_hook_off:'WASM hook <b>disabled</b>',
        toast_preset:'Preset: <b>Original diep.wasm</b>',toast_file_err:'Only <b>.wasm</b> files accepted!',
        toast_cache_clr:'Cache cleared — press <b>Ctrl+F5</b> to hard reload!',toast_reset:'Reset to defaults',
        toast_startup:'WASM Tool ready — press <b>ESC</b> to open',
        toast_fetching:'Fetching WASM…',toast_loaded:'WASM loaded <b>successfully</b>!',
        toast_injected:'WASM injected <b>successfully</b>!',
        toast_net_err:'Network error — cannot fetch WASM',
        toast_gh_picked:'URL set from GitHub!',toast_reloading:'Cache cleared! Press <b>Ctrl+F5</b> to reload.',
        toast_ctrlf5:'<b>Ctrl+F5</b> detected — clearing IDB cache first…',
        toast_no_inject:'Hook not fired — press <b>Ctrl+F5</b> for hard reload!',
    },
    vi: {
        brand_sub:'diep.io injector · v4.6',hook_label:'Hook',status_idle:'Chờ',status_loading:'Đang tải…',status_ok:'Đã inject',status_error:'Lỗi',
        sec_source:'Nguồn WASM',tab_remote:'Remote',tab_local:'Local',tab_file:'File',tab_github:'GitHub',
        lbl_remote_url:'URL từ xa',ph_remote:'https://example.com/mod.wasm',preset_lbl:'Preset:',preset_orig:'Bản gốc',
        lbl_local_url:'URL Server Nội Bộ',ph_local:'http://localhost:8080/mod.wasm',hint_cors:'Server nội bộ phải bật CORS headers.',
        drop_main:'Kéo thả file .wasm vào đây',drop_sub:'hoặc nhấn để chọn file',sec_actions:'Hành động',
        btn_apply:'Áp dụng & Inject WASM',btn_reload:'Xoá Cache & Tải lại',btn_reset:'Đặt lại mặc định',
        hint_ctrlf5:'Nếu WASM không inject được, nhấn <kbd>Ctrl+F5</kbd> để hard reload.',
        ctrlf5_clearing:'Đang xoá cache trước khi hard reload…',
        sec_info:'Thông tin',info_version:'Phiên bản',info_author:'Tác giả',info_toggle:'Phím tắt',info_mode:'Chế độ',info_mode_val:'hooks + IDB cache',
        footer_label:'diep.io injector',footer_hint:'ESC để mở/đóng',
        gh_title:'Bản Mod Sẵn',gh_subtitle:'Các bản WASM đã mod từ repo chính thức',gh_visit:'Xem Repo',gh_refresh:'Tải lại',
        gh_loading:'Đang lấy danh sách…',gh_empty:'Không tìm thấy file WASM.',gh_error:'Không thể tải releases.',
        gh_use:'Dùng',gh_latest:'MỚI NHẤT',gh_assets:'files',
        toast_hook_on:'Đã <b>bật</b> WASM hook',toast_hook_off:'Đã <b>tắt</b> WASM hook',
        toast_preset:'Preset: <b>diep.wasm bản gốc</b>',toast_file_err:'Chỉ chấp nhận file <b>.wasm</b>!',
        toast_cache_clr:'Đã xoá cache — nhấn <b>Ctrl+F5</b> để hard reload!',toast_reset:'Đã đặt lại mặc định',
        toast_startup:'WASM Tool sẵn sàng — nhấn <b>ESC</b> để mở',
        toast_fetching:'Đang tải WASM…',toast_loaded:'Tải WASM <b>thành công</b>!',
        toast_injected:'Inject WASM <b>thành công</b>!',
        toast_net_err:'Lỗi mạng — không thể fetch WASM',
        toast_gh_picked:'Đã chọn URL từ GitHub!',toast_reloading:'Đã xoá cache! Nhấn <b>Ctrl+F5</b> để tải lại.',
        toast_ctrlf5:'Phát hiện <b>Ctrl+F5</b> — đang xoá IDB cache trước…',
        toast_no_inject:'Hook không fire — nhấn <b>Ctrl+F5</b> để hard reload!',
    }
};
const t = k => (I18N[cfg.lang] || I18N.vi)[k] || k;

let wasmCache      = null;
let wasmPromise    = null;
let preloadPromise = null;
let sidebarOpen    = false;
let sidebarEl      = null;
let statusState    = 'idle';
let injected       = false;

const Toast = (() => {
    let queue = [], busy = false, wrap = null;
    const style = {
        info:    { color:'#ff8c00', icon:'fa-circle-info'          },
        ok:      { color:'#4caf50', icon:'fa-circle-check'         },
        error:   { color:'#f44336', icon:'fa-circle-xmark'         },
        warning: { color:'#ffb300', icon:'fa-triangle-exclamation' },
    };
    function container() {
        if (!wrap || !document.documentElement.contains(wrap)) {
            wrap = document.createElement('div');
            Object.assign(wrap.style, {
                position:'fixed',bottom:'20px',right:'20px',zIndex:'2147483647',
                display:'flex',flexDirection:'column-reverse',gap:'8px',
                alignItems:'flex-end',pointerEvents:'none',
            });
            document.documentElement.appendChild(wrap);
        }
        return wrap;
    }
    function next() {
        if (busy || !queue.length) return;
        busy = true;
        const { msg, type, dur } = queue.shift();
        const { color, icon } = style[type] || style.info;
        const el = document.createElement('div');
        el.style.cssText = `background:#17100a;border:1px solid ${color}45;border-left:3px solid ${color};border-radius:10px;padding:11px 15px;display:flex;align-items:center;gap:10px;color:#f0dfc0;font-family:'Outfit',sans-serif;font-size:13px;font-weight:500;line-height:1.45;min-width:240px;max-width:320px;box-shadow:0 8px 30px rgba(0,0,0,.65);transform:translateX(115%);opacity:0;transition:transform .38s cubic-bezier(.22,1,.36,1),opacity .28s ease;position:relative;overflow:hidden;pointer-events:none;`;
        const ico = document.createElement('i');
        ico.className = `fa-solid ${icon}`;
        ico.style.cssText = `color:${color};font-size:15px;flex-shrink:0`;
        const txt = document.createElement('span');
        txt.style.flex = '1'; txt.innerHTML = msg;
        const bar = document.createElement('div');
        bar.style.cssText = `position:absolute;bottom:0;left:0;height:2px;background:${color};opacity:.65;width:100%;transform-origin:left;animation:wt-shrink ${dur}ms linear forwards;`;
        el.append(ico, txt, bar);
        container().appendChild(el);
        requestAnimationFrame(() => { el.style.transform='translateX(0)'; el.style.opacity='1'; });
        setTimeout(() => {
            el.style.transform='translateX(115%)'; el.style.opacity='0';
            setTimeout(() => { el.remove(); busy=false; next(); }, 360);
        }, dur);
    }
    return { show(msg, type='info', dur=2000) { queue.push({msg,type,dur}); next(); } };
})();

function setStatus(state) {
    statusState = state;
    if (!sidebarEl) return;
    const dot = sidebarEl.querySelector('#wt-dot');
    const lbl = sidebarEl.querySelector('#wt-status-text');
    if (!dot || !lbl) return;
    const map = {
        idle:    {c:'#3a3028',l:t('status_idle'),   glow:false,pulse:false},
        loading: {c:'#ff8c00',l:t('status_loading'),glow:true, pulse:true },
        ok:      {c:'#4caf50',l:t('status_ok'),     glow:true, pulse:false},
        error:   {c:'#f44336',l:t('status_error'),  glow:true, pulse:false},
    };
    const s = map[state] || map.idle;
    dot.style.background = s.c;
    dot.style.boxShadow  = s.glow ? `0 0 8px ${s.c}aa` : 'none';
    dot.style.animation  = s.pulse ? 'wt-pulse 1.2s ease infinite' : 'none';
    lbl.textContent = s.l;
    lbl.style.color = s.c;
}

const IDB_NAME='WasmToolCache', IDB_STORE='wasm', IDB_VERSION=1;
function idbOpen() {
    return new Promise((res,rej) => {
        const r = indexedDB.open(IDB_NAME, IDB_VERSION);
        r.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
        r.onsuccess = e => res(e.target.result);
        r.onerror   = e => rej(e.target.error);
    });
}
async function idbGet(key) {
    try {
        const db = await idbOpen();
        return await new Promise((res,rej) => {
            const r = db.transaction(IDB_STORE,'readonly').objectStore(IDB_STORE).get(key);
            r.onsuccess = e => res(e.target.result);
            r.onerror   = e => rej(e.target.error);
        });
    } catch(e) { return null; }
}
async function idbSet(key, value) {
    try {
        const db = await idbOpen();
        await new Promise((res,rej) => {
            const r = db.transaction(IDB_STORE,'readwrite').objectStore(IDB_STORE).put(value, key);
            r.onsuccess = () => res();
            r.onerror   = e => rej(e.target.error);
        });
        console.log('[WasmTool] IDB saved:', key, `(${(value.byteLength/1024/1024).toFixed(2)} MB)`);
    } catch(e) { console.warn('[WasmTool] IDB set failed:', e); }
}
async function idbDel(key) {
    try {
        const db = await idbOpen();
        await new Promise((res,rej) => {
            const r = db.transaction(IDB_STORE,'readwrite').objectStore(IDB_STORE).delete(key);
            r.onsuccess = () => res();
            r.onerror   = e => rej(e.target.error);
        });
    } catch(e) {}
}
async function idbClearAll() {
    try {
        const db = await idbOpen();
        await new Promise((res,rej) => {
            const r = db.transaction(IDB_STORE,'readwrite').objectStore(IDB_STORE).clear();
            r.onsuccess = () => res();
            r.onerror   = e => rej(e.target.error);
        });
        console.log('[WasmTool] IDB cleared all');
    } catch(e) {}
}
function getCacheKey() {
    return `wasm_${cfg.mode==='local' ? cfg.localUrl : cfg.remoteUrl}`;
}
async function clearSiteCache() {
    try {
        if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(k => caches.delete(k)));
        }
    } catch(e) {}
}

function loadWasm() {
    if (wasmCache)   return Promise.resolve(wasmCache);
    if (wasmPromise) return wasmPromise;
    const url = cfg.mode==='local' ? cfg.localUrl : cfg.remoteUrl;
    if (!url) return Promise.reject(new Error('No URL'));
    setStatus('loading');
    wasmPromise = idbGet(getCacheKey()).then(cached => {
        if (cached) {
            console.log('[WasmTool] ✓ IDB cache hit:', getCacheKey());
            wasmCache = cached; wasmPromise = null;
            setStatus('ok');
            Toast.show('WASM loaded from <b>cache</b> ⚡', 'ok', 1800);
            return wasmCache;
        }
        console.log('[WasmTool] Cache miss — fetching:', url);
        Toast.show(t('toast_fetching'), 'info', 2000);
        return fetchWithRetry(url).then(async buf => {
            wasmCache = buf; wasmPromise = null;
            setStatus('ok');
            await idbSet(getCacheKey(), buf);
            Toast.show(t('toast_loaded'), 'ok', 2200);
            return wasmCache;
        });
    }).catch(err => {
        wasmPromise = null; setStatus('error');
        Toast.show(`${t('toast_net_err')} — ${err.message}`, 'error', 4000);
        throw err;
    });
    return wasmPromise;
}

function fetchWithRetry(url, attempt=1) {
    const MAX = 3;
    return new Promise((resolve, reject) => {
        console.log(`[WasmTool] Fetch attempt ${attempt}/${MAX}:`, url);
        GM_xmlhttpRequest({
            method:'GET', url, responseType:'arraybuffer', redirect:'follow', timeout:30000,
            headers:{'Cache-Control':'no-cache, no-store','Pragma':'no-cache','Expires':'0'},
            onload(res) {
                if (res.status>=200 && res.status<300 && res.response) { resolve(res.response); return; }
                if (res.status>=300 && res.status<400) {
                    const loc = res.responseHeaders?.match(/location:\s*(\S+)/i)?.[1];
                    if (loc && attempt<=MAX) { fetchWithRetry(loc.trim(), attempt+1).then(resolve).catch(reject); return; }
                }
                if (attempt<MAX) setTimeout(()=>fetchWithRetry(url,attempt+1).then(resolve).catch(reject), 1000*attempt);
                else reject(new Error('HTTP '+res.status));
            },
            ontimeout() {
                if (attempt<MAX) setTimeout(()=>fetchWithRetry(url,attempt+1).then(resolve).catch(reject), 1000*attempt);
                else reject(new Error('timeout'));
            },
            onerror() {
                if (attempt<MAX) setTimeout(()=>fetchWithRetry(url,attempt+1).then(resolve).catch(reject), 1000*attempt);
                else reject(new Error('network error'));
            },
        });
    });
}

function getWasm() {
    if (wasmCache)      return Promise.resolve(wasmCache);
    if (preloadPromise) return preloadPromise;
    console.warn('[WasmTool] getWasm() fallback — starting loadWasm now');
    preloadPromise = loadWasm().finally(() => { preloadPromise = null; });
    return preloadPromise;
}

if (isCustomMode() && cfg.mode !== 'file') {
    console.log('[WasmTool] Starting preload (sync assignment)...');
    preloadPromise = loadWasm().then(buf => {
        console.log('[WasmTool] Preload complete ✓', buf.byteLength);
        preloadPromise = null;
        return buf;
    }).catch(e => {
        console.warn('[WasmTool] Preload failed:', e.message);
        preloadPromise = null;
    });
}

document.addEventListener('keydown', async function(e) {
    const isHardReload = (e.ctrlKey && e.key === 'F5') ||
          (e.ctrlKey && e.shiftKey && e.key === 'r') ||
          (e.ctrlKey && e.shiftKey && e.key === 'R');
    if (!isHardReload || !isCustomMode()) return;

    console.log('[WasmTool] Ctrl+F5 detected — clearing IDB before hard reload');
    Toast.show(t('toast_ctrlf5'), 'warning', 2500);

    idbClearAll().catch(() => {});
    clearSiteCache().catch(() => {});
    wasmCache = null; wasmPromise = null; preloadPromise = null;

}, true);

(function setupInjectDetector() {
    if (!isCustomMode()) return;
    const onReady = () => {
        setTimeout(() => {
            if (injected) {
                console.log('[WasmTool] Inject confirmed ✓');
                return;
            }
            console.warn('[WasmTool] Hook not fired — V8 cache bypass detected. User should press Ctrl+F5.');
            Toast.show(t('toast_no_inject'), 'warning', 6000);
            setStatus('error');
        }, 7000);
    };
    if (document.readyState === 'complete') onReady();
    else window.addEventListener('load', onReady, { once: true });
})();

(function installHooks() {

    const _XHROpen = XMLHttpRequest.prototype.open;
    const _XHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        if (url && /\.wasm(\?|$|#)/i.test(url)) {
            console.log('[WasmTool][XHR] open:', url, '| custom:', isCustomMode());
            if (isCustomMode()) {
                this._wtIntercepted = true;
                this._wtOrigUrl = url;
            }
        }
        return _XHROpen.call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function(body) {
        if (!this._wtIntercepted) return _XHRSend.call(this, body);
        console.log('[WasmTool][XHR] send intercepted');
        const xhr = this;
        getWasm().then(buf => {
            console.log('[WasmTool][XHR] fake response, size:', buf.byteLength);
            const fakeUrl = cfg.mode==='local' ? cfg.localUrl : cfg.remoteUrl;
            Object.defineProperty(xhr,'readyState', {get:()=>4,configurable:true});
            Object.defineProperty(xhr,'status',     {get:()=>200,configurable:true});
            Object.defineProperty(xhr,'statusText', {get:()=>'OK',configurable:true});
            Object.defineProperty(xhr,'response',   {get:()=>buf,configurable:true});
            Object.defineProperty(xhr,'responseURL',{get:()=>fakeUrl,configurable:true});
            const pe = new ProgressEvent('progress',{lengthComputable:true,loaded:buf.byteLength,total:buf.byteLength});
            xhr.dispatchEvent(pe);
            if (typeof xhr.onprogress==='function') try{xhr.onprogress(pe);}catch(e){}
            [1,2,3,4].forEach(s => {
                Object.defineProperty(xhr,'readyState',{get:()=>s,configurable:true});
                if (typeof xhr.onreadystatechange==='function') try{xhr.onreadystatechange();}catch(e){}
                xhr.dispatchEvent(new Event('readystatechange'));
            });
            Object.defineProperty(xhr,'readyState',{get:()=>4,configurable:true});
            const le = new ProgressEvent('load',{lengthComputable:true,loaded:buf.byteLength,total:buf.byteLength});
            xhr.dispatchEvent(le);
            if (typeof xhr.onload==='function') try{xhr.onload(le);}catch(e){}
            const ee = new ProgressEvent('loadend',{lengthComputable:true,loaded:buf.byteLength,total:buf.byteLength});
            xhr.dispatchEvent(ee);
            if (typeof xhr.onloadend==='function') try{xhr.onloadend(ee);}catch(e){}
            injected = true;
            Toast.show(t('toast_injected'),'ok',2500);
            console.log('[WasmTool][XHR] done ✓');
        }).catch(err => {
            console.error('[WasmTool][XHR] failed:', err);
            Object.defineProperty(xhr,'readyState',{get:()=>4,configurable:true});
            Object.defineProperty(xhr,'status',    {get:()=>503,configurable:true});
            xhr.dispatchEvent(new Event('readystatechange'));
            if (typeof xhr.onreadystatechange==='function') try{xhr.onreadystatechange();}catch(e){}
            const errEv = new ProgressEvent('error');
            xhr.dispatchEvent(errEv);
            if (typeof xhr.onerror==='function') try{xhr.onerror(errEv);}catch(e){}
        });
    };

    const _fetch = window.fetch;
    window.fetch = function(input, init={}) {
        const url = typeof input==='string' ? input
        : input instanceof Request ? input.url
        : String(input);
        const isWasm = /\.wasm(\?|$|#)/i.test(url);
        if (isWasm) console.log('[WasmTool][fetch]', url, '| custom:', isCustomMode());
        if (isCustomMode() && isWasm) {
            return getWasm().then(buf => {
                console.log('[WasmTool][fetch] returning custom buf', buf.byteLength);
                injected = true;
                return new Response(new Uint8Array(buf), {
                    status:200,
                    headers:{
                        'Content-Type':'application/wasm',
                        'Cache-Control':'no-store',
                        'Content-Length':String(buf.byteLength),
                    },
                });
            });
        }
        if (cfg.enabled && isWasm) {
            if (!init || typeof init!=='object') init={};
            init.cache='no-store';
        }
        return _fetch.call(this, input, init);
    };

    const _instStream = WebAssembly.instantiateStreaming;
    WebAssembly.instantiateStreaming = function(source, imports) {
        if (!isCustomMode()) return _instStream.call(WebAssembly, source, imports);
        console.log('[WasmTool][instantiateStreaming] intercepted');
        return getWasm().then(buf => {
            console.log('[WasmTool][instantiateStreaming] custom buf', buf.byteLength);
            return _inst.call(WebAssembly, buf, imports);
        }).then(res => {
            injected = true;
            Toast.show(t('toast_injected'),'ok',2500);
            console.log('[WasmTool][instantiateStreaming] ✓');
            return res;
        });
    };

    const _compStream = WebAssembly.compileStreaming;
    WebAssembly.compileStreaming = function(source) {
        if (!isCustomMode()) return _compStream.call(WebAssembly, source);
        console.log('[WasmTool][compileStreaming] intercepted');
        return getWasm().then(buf => {
            injected = true;
            return _compile.call(WebAssembly, buf);
        });
    };

    const _inst = WebAssembly.instantiate;
    WebAssembly.instantiate = function(bufferOrModule, imports) {
        if (bufferOrModule instanceof WebAssembly.Module)
            return _inst.call(WebAssembly, bufferOrModule, imports);
        if (!isCustomMode())
            return _inst.call(WebAssembly, bufferOrModule, imports);
        console.log('[WasmTool][instantiate] intercepted');
        return getWasm().then(buf => {
            console.log('[WasmTool][instantiate] custom buf', buf.byteLength);
            return _inst.call(WebAssembly, buf, imports);
        }).then(res => {
            injected = true;
            Toast.show(t('toast_injected'),'ok',2500);
            return res;
        });
    };

    const _compile = WebAssembly.compile;
    WebAssembly.compile = function(buffer) {
        if (!isCustomMode()) return _compile.call(WebAssembly, buffer);
        console.log('[WasmTool][compile] intercepted');
        return getWasm().then(buf => {
            injected = true;
            return _compile.call(WebAssembly, buf);
        });
    };

    console.log('[WasmTool] All hooks installed ✓');
})();

function fetchGitHubReleases(callback) {
    GM_xmlhttpRequest({
        method:'GET', url:GITHUB_API,
        headers:{'Accept':'application/vnd.github+json'},
        onload(res) {
            try {
                if (res.status===200) callback(null, JSON.parse(res.responseText));
                else callback(new Error('HTTP '+res.status));
            } catch(e) { callback(e); }
        },
        onerror() { callback(new Error('network error')); }
    });
}

function renderGitHubPane(container) {
    container.innerHTML=`<div style="text-align:center;padding:28px 0;color:rgba(255,180,70,.35);font-size:12px"><i class="fa-solid fa-spinner fa-spin" style="font-size:22px;color:rgba(255,140,0,.35);display:block;margin-bottom:10px"></i><span>${t('gh_loading')}</span></div>`;
    fetchGitHubReleases((err,releases) => {
        if (err||!releases) {
            container.innerHTML=`<div style="text-align:center;padding:24px 0;color:rgba(255,80,80,.5);font-size:12px"><i class="fa-solid fa-circle-xmark" style="font-size:22px;display:block;margin-bottom:9px"></i><span>${t('gh_error')}</span><br><button id="wt-gh-retry" style="margin-top:12px;padding:6px 16px;background:rgba(255,140,0,.09);border:1px solid rgba(255,140,0,.22);border-radius:7px;color:rgba(255,170,60,.7);font-size:11px;font-family:'Outfit',sans-serif;font-weight:600;cursor:pointer"><i class="fa-solid fa-rotate-right"></i> ${t('gh_refresh')}</button></div>`;
            container.querySelector('#wt-gh-retry')?.addEventListener('click',()=>renderGitHubPane(container));
            return;
        }
        const items=releases.map((rel,idx)=>{
            const assets=(rel.assets||[]).filter(a=>a.name.endsWith('.wasm'));
            return assets.length?{rel,assets,isLatest:idx===0}:null;
        }).filter(Boolean);
        if (!items.length){
            container.innerHTML=`<div style="text-align:center;padding:28px 0;color:rgba(255,180,70,.3);font-size:12px"><i class="fa-solid fa-box-open" style="font-size:22px;display:block;margin-bottom:9px;opacity:.4"></i><span>${t('gh_empty')}</span></div>`;
            return;
        }
        container.innerHTML=items.map(({rel,assets,isLatest})=>{
            const date=new Date(rel.published_at).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'});
            return `<div class="wt-gh-card"><div class="wt-gh-card-header"><div class="wt-gh-card-left"><div class="wt-gh-card-tag"><i class="fa-solid fa-tag" style="font-size:10px"></i> ${rel.tag_name}${isLatest?`<span class="wt-gh-latest-badge">${t('gh_latest')}</span>`:''}</div><div class="wt-gh-card-name">${rel.name||rel.tag_name}</div><div class="wt-gh-card-meta"><i class="fa-regular fa-calendar" style="font-size:10px"></i> ${date} · <i class="fa-solid fa-paperclip" style="font-size:10px"></i> ${assets.length} ${t('gh_assets')}</div></div><a class="wt-gh-card-link" href="${rel.html_url}" target="_blank"><i class="fa-brands fa-github"></i></a></div>${rel.body?`<div class="wt-gh-card-body">${rel.body.slice(0,120)}${rel.body.length>120?'…':''}</div>`:''}<div class="wt-gh-assets">${assets.map(a=>`<div class="wt-gh-asset"><div class="wt-gh-asset-info"><i class="fa-solid fa-file-code wt-gh-asset-icon"></i><div><div class="wt-gh-asset-name">${a.name}</div><div class="wt-gh-asset-size">${(a.size/1024).toFixed(1)} KB · ${a.download_count} dl</div></div></div><button class="wt-gh-use-btn" data-url="${a.browser_download_url}" data-name="${a.name}"><i class="fa-solid fa-bolt"></i> ${t('gh_use')}</button></div>`).join('')}</div></div>`;
        }).join('');
        container.querySelectorAll('.wt-gh-use-btn').forEach(btn=>{
            btn.addEventListener('click',()=>{
                cfg.remoteUrl=btn.dataset.url; cfg.mode='remote';
                wasmCache=null; wasmPromise=null; preloadPromise=null;
                saveCfg();
                sidebarEl?.querySelector('#wt-remote-url') && (sidebarEl.querySelector('#wt-remote-url').value=cfg.remoteUrl);
                Toast.show(`<b>${btn.dataset.name}</b> — ${t('toast_gh_picked')}`,'ok',2200);
                btn.innerHTML=`<i class="fa-solid fa-circle-check"></i> OK`;
                setTimeout(()=>{btn.innerHTML=`<i class="fa-solid fa-bolt"></i> ${t('gh_use')}`;},2000);
            });
        });
    });
}

function injectStyles() {
    GM_addStyle(`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes wt-slide-in{from{transform:translateX(102%);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes wt-slide-out{from{transform:translateX(0);opacity:1}to{transform:translateX(102%);opacity:0}}
        @keyframes wt-tab-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes wt-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.8)}}
        @keyframes wt-shrink{from{transform:scaleX(1)}to{transform:scaleX(0)}}
        #wt-sidebar,#wt-sidebar *{box-sizing:border-box;margin:0;font-family:'Outfit',sans-serif}
        #wt-sidebar{position:fixed;top:0;right:0;width:390px;height:100vh;background:#0d0904;border-left:1px solid rgba(255,140,0,.18);z-index:2147483646;display:flex;flex-direction:column;box-shadow:-20px 0 70px rgba(0,0,0,.9);animation:wt-slide-in .42s cubic-bezier(.22,1,.36,1) forwards;overflow:hidden}
        #wt-sidebar.closing{animation:wt-slide-out .3s cubic-bezier(.55,0,1,.45) forwards}
        #wt-sidebar::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;z-index:10;background:linear-gradient(90deg,transparent 0%,#ff8c00 40%,#ff4500 70%,transparent 100%);pointer-events:none}
        #wt-body{flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:thin;scrollbar-color:rgba(255,140,0,.18) transparent}
        #wt-body::-webkit-scrollbar{width:3px}
        #wt-body::-webkit-scrollbar-thumb{background:rgba(255,140,0,.18);border-radius:2px}
        #wt-header{flex-shrink:0;padding:20px 20px 16px;background:linear-gradient(160deg,rgba(255,140,0,.08) 0%,transparent 100%);border-bottom:1px solid rgba(255,140,0,.1)}
        #wt-header-row1{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
        #wt-brand{display:flex;align-items:center;gap:13px}
        #wt-brand-icon{width:44px;height:44px;flex-shrink:0;background:linear-gradient(135deg,rgba(255,140,0,.2),rgba(255,69,0,.13));border:1px solid rgba(255,140,0,.3);border-radius:13px;display:flex;align-items:center;justify-content:center;color:#ff8c00;font-size:19px;box-shadow:0 0 22px rgba(255,140,0,.13)}
        #wt-brand-name{font-size:17px;font-weight:800;letter-spacing:.07em;color:#fff;line-height:1.1;text-shadow:0 0 28px rgba(255,140,0,.3)}
        #wt-brand-sub{font-size:10.5px;font-weight:400;color:rgba(255,190,90,.32);letter-spacing:.06em;margin-top:3px}
        #wt-header-btns{display:flex;align-items:center;gap:6px}
        #wt-lang-btn{height:30px;padding:0 10px;background:rgba(255,140,0,.07);border:1px solid rgba(255,140,0,.18);border-radius:8px;cursor:pointer;color:rgba(255,180,70,.55);font-family:'Outfit',sans-serif;font-size:11px;font-weight:700;letter-spacing:.07em;display:flex;align-items:center;gap:6px;transition:all .22s}
        #wt-lang-btn:hover{background:rgba(255,140,0,.14);border-color:rgba(255,140,0,.35);color:rgba(255,190,80,.9)}
        #wt-close-btn{width:30px;height:30px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:8px;cursor:pointer;color:rgba(255,180,130,.35);font-size:13px;display:flex;align-items:center;justify-content:center;transition:all .2s}
        #wt-close-btn:hover{background:rgba(255,50,50,.14);border-color:rgba(255,50,50,.3);color:#ff6060}
        #wt-status-row{display:flex;align-items:center;justify-content:space-between;padding:9px 13px;background:rgba(0,0,0,.3);border:1px solid rgba(255,140,0,.09);border-radius:9px}
        #wt-status-left{display:flex;align-items:center;gap:9px}
        #wt-dot{width:8px;height:8px;border-radius:50%;background:#3a3028;flex-shrink:0;transition:background .4s,box-shadow .4s}
        #wt-status-text{font-size:12.5px;font-weight:600;color:#3a3028;letter-spacing:.04em;transition:color .4s}
        .wt-sw{display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none}
        .wt-sw input{display:none}
        .wt-sw-label{font-size:11.5px;font-weight:600;color:rgba(255,180,70,.42)}
        .wt-sw-track{display:block;width:38px;height:21px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.11);border-radius:11px;position:relative;transition:all .3s;flex-shrink:0}
        .wt-sw input:checked~.wt-sw-track{background:rgba(255,140,0,.22);border-color:rgba(255,140,0,.5);box-shadow:0 0 10px rgba(255,140,0,.2)}
        .wt-sw-knob{position:absolute;top:2.5px;left:2.5px;width:14px;height:14px;border-radius:50%;background:rgba(255,200,140,.3);transition:all .28s cubic-bezier(.34,1.56,.64,1)}
        .wt-sw input:checked~.wt-sw-track .wt-sw-knob{left:calc(100% - 16.5px);background:#ff8c00;box-shadow:0 0 8px rgba(255,140,0,.7)}
        .wt-sec{padding:18px 20px;border-bottom:1px solid rgba(255,255,255,.034)}
        .wt-sec-label{display:flex;align-items:center;gap:8px;font-size:9.5px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,170,55,.32);margin-bottom:14px}
        #wt-tabs{display:flex;gap:5px}
        .wt-tab{flex:1;padding:10px 4px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;cursor:pointer;color:rgba(255,180,60,.35);font-family:'Outfit',sans-serif;font-size:10.5px;font-weight:600;display:flex;flex-direction:column;align-items:center;gap:5px;transition:all .22s}
        .wt-tab i{font-size:15px}
        .wt-tab:hover{background:rgba(255,140,0,.07);border-color:rgba(255,140,0,.2);color:rgba(255,180,60,.7)}
        .wt-tab.active{background:linear-gradient(145deg,rgba(255,140,0,.18),rgba(255,60,0,.1));border-color:rgba(255,140,0,.45);color:#ffa040;box-shadow:0 0 16px rgba(255,140,0,.1)}
        .wt-pane{display:none}
        .wt-pane.active{display:block;animation:wt-tab-in .28s ease}
        .wt-field-label{display:flex;align-items:center;gap:7px;font-size:11px;font-weight:600;color:rgba(255,180,70,.45);margin-bottom:8px;letter-spacing:.04em}
        .wt-field-label i{font-size:12px;color:rgba(255,140,0,.5)}
        .wt-input-row{display:flex;align-items:center;background:rgba(0,0,0,.32);border:1px solid rgba(255,140,0,.14);border-radius:9px;overflow:hidden;transition:border-color .22s,box-shadow .22s}
        .wt-input-row:focus-within{border-color:rgba(255,140,0,.5);box-shadow:0 0 0 3px rgba(255,140,0,.07)}
        .wt-input-ico{width:40px;height:42px;display:flex;align-items:center;justify-content:center;color:rgba(255,140,0,.4);font-size:13px;border-right:1px solid rgba(255,140,0,.09);flex-shrink:0}
        .wt-input{flex:1;background:transparent;border:none;outline:none;color:#ffd090;height:42px;padding:0 12px;font-family:'JetBrains Mono',monospace;font-size:11.5px}
        .wt-input::placeholder{color:rgba(255,180,70,.18)}
        .wt-chip-row{display:flex;align-items:center;gap:7px;margin-top:10px;flex-wrap:wrap}
        .wt-chip-lbl{font-size:10.5px;color:rgba(255,180,70,.28)}
        .wt-chip{display:inline-flex;align-items:center;gap:5px;padding:3px 11px;background:rgba(255,140,0,.07);border:1px solid rgba(255,140,0,.18);border-radius:20px;cursor:pointer;color:rgba(255,170,60,.6);font-size:10.5px;font-weight:600;transition:all .2s}
        .wt-chip:hover{background:rgba(255,140,0,.15);border-color:rgba(255,140,0,.38);color:#ffaa40}
        .wt-hint{display:flex;align-items:flex-start;gap:8px;margin-top:10px;padding:9px 11px;background:rgba(255,180,0,.04);border:1px solid rgba(255,180,0,.12);border-radius:8px;font-size:11px;color:rgba(255,205,70,.45);line-height:1.55}
        .wt-hint i{font-size:12px;color:#ffc107;flex-shrink:0;margin-top:1px}
        .wt-hint kbd{display:inline-block;padding:1px 7px;background:rgba(255,140,0,.15);border:1px solid rgba(255,140,0,.35);border-radius:5px;font-family:'JetBrains Mono',monospace;font-size:10.5px;font-weight:700;color:#ffb040;line-height:1.6}
        #wt-dropzone{border:1.5px dashed rgba(255,140,0,.18);border-radius:11px;padding:26px 16px;text-align:center;cursor:pointer;transition:all .25s;background:rgba(0,0,0,.18)}
        #wt-dropzone:hover,#wt-dropzone.over{border-color:rgba(255,140,0,.5);background:rgba(255,140,0,.05)}
        #wt-dz-ico{font-size:30px;color:rgba(255,140,0,.3);margin-bottom:10px;display:block}
        #wt-dz-main{font-size:13px;font-weight:500;color:rgba(255,180,70,.42);display:block;margin-bottom:4px}
        #wt-dz-sub{font-size:11px;color:rgba(255,180,70,.22);display:block}
        #wt-file-real{display:none}
        #wt-file-pill{display:none;margin-top:11px;padding:9px 13px;background:rgba(76,175,80,.08);border:1px solid rgba(76,175,80,.22);border-radius:9px;align-items:center;gap:9px}
        #wt-file-pill.show{display:flex}
        #wt-file-pill i{font-size:16px;color:#4caf50;flex-shrink:0}
        #wt-file-pill-name{flex:1;font-size:12px;font-weight:600;color:rgba(140,220,140,.8);font-family:'JetBrains Mono',monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        #wt-file-pill-size{font-size:10.5px;color:rgba(140,220,140,.45);flex-shrink:0}
        #wt-gh-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
        #wt-gh-header-left{display:flex;align-items:center;gap:10px}
        #wt-gh-icon{width:36px;height:36px;flex-shrink:0;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:10px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.55);font-size:17px}
        #wt-gh-title{font-size:13px;font-weight:700;color:rgba(255,200,120,.8)}
        #wt-gh-sub{font-size:10px;color:rgba(255,180,70,.3);margin-top:2px}
        #wt-gh-header-right{display:flex;align-items:center;gap:6px}
        .wt-gh-btn-sm{height:28px;padding:0 10px;border-radius:7px;cursor:pointer;font-family:'Outfit',sans-serif;font-size:10.5px;font-weight:600;display:flex;align-items:center;gap:5px;transition:all .2s}
        #wt-gh-visit-btn{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:rgba(255,200,120,.5);text-decoration:none}
        #wt-gh-visit-btn:hover{background:rgba(255,255,255,.09);color:rgba(255,200,120,.9)}
        #wt-gh-refresh-btn{background:rgba(255,140,0,.08);border:1px solid rgba(255,140,0,.2);color:rgba(255,170,60,.55)}
        #wt-gh-refresh-btn:hover{background:rgba(255,140,0,.15);color:#ffaa40}
        #wt-gh-list{display:flex;flex-direction:column;gap:10px}
        .wt-gh-card{background:rgba(0,0,0,.28);border:1px solid rgba(255,140,0,.1);border-radius:11px;overflow:hidden;transition:border-color .22s}
        .wt-gh-card:hover{border-color:rgba(255,140,0,.22)}
        .wt-gh-card-header{display:flex;align-items:flex-start;justify-content:space-between;padding:12px 13px 10px;background:linear-gradient(135deg,rgba(255,140,0,.06),transparent);border-bottom:1px solid rgba(255,140,0,.08)}
        .wt-gh-card-tag{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;color:rgba(255,170,60,.55);letter-spacing:.04em;margin-bottom:4px}
        .wt-gh-latest-badge{background:linear-gradient(90deg,#ff8c00,#ff4500);color:#fff;font-size:8.5px;font-weight:800;padding:1px 6px;border-radius:20px;margin-left:3px}
        .wt-gh-card-name{font-size:12.5px;font-weight:700;color:rgba(255,210,140,.85);margin-bottom:4px}
        .wt-gh-card-meta{font-size:10px;color:rgba(255,180,70,.32)}
        .wt-gh-card-link{color:rgba(255,255,255,.25);font-size:16px;padding:2px 4px;text-decoration:none;transition:color .2s}
        .wt-gh-card-link:hover{color:rgba(255,255,255,.7)}
        .wt-gh-card-body{padding:8px 13px;font-size:10.5px;color:rgba(255,190,80,.3);line-height:1.55;border-bottom:1px solid rgba(255,255,255,.04);white-space:pre-wrap}
        .wt-gh-assets{padding:10px 13px;display:flex;flex-direction:column;gap:7px}
        .wt-gh-asset{display:flex;align-items:center;justify-content:space-between;padding:8px 11px;background:rgba(255,255,255,.03);border:1px solid rgba(255,140,0,.08);border-radius:8px;gap:10px;transition:border-color .22s,background .2s}
        .wt-gh-asset:hover{background:rgba(255,140,0,.05);border-color:rgba(255,140,0,.18)}
        .wt-gh-asset-info{display:flex;align-items:center;gap:9px;flex:1;min-width:0}
        .wt-gh-asset-icon{font-size:18px;color:rgba(255,140,0,.4);flex-shrink:0}
        .wt-gh-asset-name{font-size:11.5px;font-weight:600;color:rgba(255,200,120,.7);font-family:'JetBrains Mono',monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .wt-gh-asset-size{font-size:10px;color:rgba(255,180,70,.28);margin-top:2px}
        .wt-gh-use-btn{flex-shrink:0;height:28px;padding:0 12px;background:rgba(255,140,0,.1);border:1px solid rgba(255,140,0,.25);border-radius:7px;cursor:pointer;color:rgba(255,170,60,.7);font-family:'Outfit',sans-serif;font-size:11px;font-weight:700;display:flex;align-items:center;gap:5px;transition:all .22s;white-space:nowrap}
        .wt-gh-use-btn:hover{background:rgba(255,140,0,.2);border-color:rgba(255,140,0,.5);color:#ffaa40}
        .wt-divider{height:1px;margin:0 20px;background:linear-gradient(90deg,transparent,rgba(255,140,0,.12),transparent)}
        .wt-btn-group{display:flex;flex-direction:column;gap:8px}
        .wt-btn{width:100%;padding:12px 18px;border-radius:10px;cursor:pointer;font-family:'Outfit',sans-serif;font-size:13px;font-weight:700;letter-spacing:.04em;display:flex;align-items:center;justify-content:center;gap:9px;transition:all .22s;border:1px solid transparent}
        .wt-btn-primary{background:linear-gradient(135deg,#ff8c00,#e05400);border-color:rgba(255,140,0,.4);color:#fff;box-shadow:0 4px 22px rgba(255,110,0,.28)}
        .wt-btn-primary:hover{filter:brightness(1.08);transform:translateY(-1px)}
        .wt-btn-primary:active{transform:translateY(0);filter:none}
        .wt-btn-sec{background:rgba(255,140,0,.08);border-color:rgba(255,140,0,.2);color:rgba(255,170,60,.65)}
        .wt-btn-sec:hover{background:rgba(255,140,0,.15);color:#ffaa40}
        .wt-btn-ghost{background:rgba(255,255,255,.03);border-color:rgba(255,255,255,.08);color:rgba(255,170,60,.32)}
        .wt-btn-ghost:hover{background:rgba(255,50,50,.09);border-color:rgba(255,50,50,.25);color:#ff7070}
        .wt-info-table{display:flex;flex-direction:column;gap:6px}
        .wt-info-row{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(0,0,0,.22);border:1px solid rgba(255,140,0,.07);border-radius:8px}
        .wt-info-key{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:500;color:rgba(255,180,70,.38)}
        .wt-info-key i{font-size:12px;color:rgba(255,140,0,.38);width:14px;text-align:center}
        .wt-info-val{font-size:11.5px;font-weight:600;color:rgba(255,180,70,.6);font-family:'JetBrains Mono',monospace;text-align:right;max-width:55%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        #wt-footer{flex-shrink:0;padding:11px 20px;border-top:1px solid rgba(255,140,0,.07);background:rgba(0,0,0,.22);display:flex;align-items:center;justify-content:space-between}
        #wt-footer-l{font-size:10px;color:rgba(255,180,70,.2);letter-spacing:.06em}
        #wt-footer-r{font-size:10px;color:rgba(255,180,70,.2);display:flex;align-items:center;gap:5px}
        .wt-esc{background:rgba(255,140,0,.1);border:1px solid rgba(255,140,0,.2);border-radius:5px;padding:1px 7px;color:rgba(255,170,60,.38);font-size:9.5px;font-weight:700;letter-spacing:.08em}
        #wt-ctrlf5-banner{display:flex;align-items:center;gap:10px;margin:14px 20px 0;padding:10px 13px;background:linear-gradient(135deg,rgba(255,140,0,.07),rgba(255,69,0,.04));border:1px solid rgba(255,140,0,.25);border-radius:10px}
        #wt-ctrlf5-banner i{color:#ff8c00;font-size:14px;flex-shrink:0}
        #wt-ctrlf5-banner span{font-size:11.5px;color:rgba(255,190,80,.65);line-height:1.5;flex:1}
        #wt-ctrlf5-banner kbd{display:inline-block;padding:1px 8px;background:rgba(255,140,0,.18);border:1px solid rgba(255,140,0,.4);border-radius:5px;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:#ffb040;line-height:1.7}
    `);
}

function buildSidebar() {
    if (sidebarEl) { sidebarEl.remove(); sidebarEl=null; }
    const el=document.createElement('div');
    el.id='wt-sidebar';
    const infoRows=[
        {icon:'fa-tag',          key:'info_version', val:'v4.6.0'      },
        {icon:'fa-user',         key:'info_author',  val:'tinysweet'   },
        {icon:'fa-keyboard',     key:'info_toggle',  val:'ESC'         },
        {icon:'fa-shield-halved',key:'info_mode',    val:'info_mode_val'},
    ];
    el.innerHTML=`
        <div id="wt-header">
            <div id="wt-header-row1">
                <div id="wt-brand">
                    <div id="wt-brand-icon"><i class="fa-solid fa-gears"></i></div>
                    <div><div id="wt-brand-name">WASM TOOL</div><div id="wt-brand-sub">${t('brand_sub')}</div></div>
                </div>
                <div id="wt-header-btns">
                    <button id="wt-lang-btn"><i class="fa-solid fa-language"></i><span>${cfg.lang.toUpperCase()}</span></button>
                    <button id="wt-close-btn"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>
            <div id="wt-status-row">
                <div id="wt-status-left"><div id="wt-dot"></div><span id="wt-status-text">${t('status_idle')}</span></div>
                <label class="wt-sw">
                    <input type="checkbox" id="wt-enabled" ${cfg.enabled?'checked':''}>
                    <span class="wt-sw-track"><span class="wt-sw-knob"></span></span>
                    <span class="wt-sw-label">${t('hook_label')}</span>
                </label>
            </div>
        </div>

        <div id="wt-ctrlf5-banner">
            <i class="fa-solid fa-bolt-lightning"></i>
            <span>${t('hint_ctrlf5')}</span>
        </div>

        <div id="wt-body">
            <div class="wt-sec">
                <div class="wt-sec-label"><i class="fa-solid fa-layer-group"></i><span>${t('sec_source')}</span></div>
                <div id="wt-tabs">
                    <button class="wt-tab ${cfg.mode==='remote'?'active':''}" data-pane="pane-remote"><i class="fa-solid fa-globe"></i><span>${t('tab_remote')}</span></button>
                    <button class="wt-tab ${cfg.mode==='local'?'active':''}"  data-pane="pane-local"><i class="fa-solid fa-server"></i><span>${t('tab_local')}</span></button>
                    <button class="wt-tab ${cfg.mode==='file'?'active':''}"   data-pane="pane-file"><i class="fa-solid fa-file-arrow-up"></i><span>${t('tab_file')}</span></button>
                    <button class="wt-tab" data-pane="pane-github"><i class="fa-brands fa-github"></i><span>${t('tab_github')}</span></button>
                </div>
            </div>
            <div class="wt-sec wt-pane ${cfg.mode==='remote'?'active':''}" id="pane-remote">
                <div class="wt-field-label"><i class="fa-solid fa-link"></i><span>${t('lbl_remote_url')}</span></div>
                <div class="wt-input-row"><div class="wt-input-ico"><i class="fa-solid fa-globe"></i></div>
                <input id="wt-remote-url" class="wt-input" type="text" value="${cfg.remoteUrl}" placeholder="${t('ph_remote')}"></div>
                <div class="wt-chip-row"><span class="wt-chip-lbl">${t('preset_lbl')}</span>
                <button class="wt-chip" data-url="${ORIGINAL_WASM_URL}"><i class="fa-solid fa-cube"></i><span>${t('preset_orig')}</span></button></div>
            </div>
            <div class="wt-sec wt-pane ${cfg.mode==='local'?'active':''}" id="pane-local">
                <div class="wt-field-label"><i class="fa-solid fa-network-wired"></i><span>${t('lbl_local_url')}</span></div>
                <div class="wt-input-row"><div class="wt-input-ico"><i class="fa-solid fa-server"></i></div>
                <input id="wt-local-url" class="wt-input" type="text" value="${cfg.localUrl}" placeholder="${t('ph_local')}"></div>
                <div class="wt-hint"><i class="fa-solid fa-triangle-exclamation"></i><span>${t('hint_cors')}</span></div>
            </div>
            <div class="wt-sec wt-pane ${cfg.mode==='file'?'active':''}" id="pane-file">
                <div id="wt-dropzone"><i class="fa-solid fa-cloud-arrow-up" id="wt-dz-ico"></i>
                <span id="wt-dz-main">${t('drop_main')}</span><span id="wt-dz-sub">${t('drop_sub')}</span></div>
                <input type="file" id="wt-file-real" accept=".wasm">
                <div id="wt-file-pill"><i class="fa-solid fa-circle-check"></i>
                <span id="wt-file-pill-name">—</span><span id="wt-file-pill-size"></span></div>
            </div>
            <div class="wt-sec wt-pane" id="pane-github">
                <div id="wt-gh-header">
                    <div id="wt-gh-header-left"><div id="wt-gh-icon"><i class="fa-brands fa-github"></i></div>
                    <div><div id="wt-gh-title">${t('gh_title')}</div><div id="wt-gh-sub">${t('gh_subtitle')}</div></div></div>
                    <div id="wt-gh-header-right">
                        <a id="wt-gh-visit-btn" class="wt-gh-btn-sm" href="${GITHUB_URL}" target="_blank"><i class="fa-brands fa-github"></i><span>${t('gh_visit')}</span></a>
                        <button id="wt-gh-refresh-btn" class="wt-gh-btn-sm"><i class="fa-solid fa-rotate-right"></i><span>${t('gh_refresh')}</span></button>
                    </div>
                </div>
                <div id="wt-gh-list"></div>
            </div>
            <div class="wt-divider"></div>
            <div class="wt-sec">
                <div class="wt-sec-label"><i class="fa-solid fa-bolt"></i><span>${t('sec_actions')}</span></div>
                <div class="wt-btn-group">
                    <button class="wt-btn wt-btn-primary" id="wt-apply"><i class="fa-solid fa-play"></i><span>${t('btn_apply')}</span></button>
                    <button class="wt-btn wt-btn-sec"     id="wt-clear-cache"><i class="fa-solid fa-rotate-right"></i><span>${t('btn_reload')}</span></button>
                    <button class="wt-btn wt-btn-ghost"   id="wt-reset"><i class="fa-solid fa-trash-can"></i><span>${t('btn_reset')}</span></button>
                </div>
                <!-- hint dưới nút -->
                <div class="wt-hint" style="margin-top:12px">
                    <i class="fa-solid fa-circle-info"></i>
                    <span>${t('hint_ctrlf5')}</span>
                </div>
            </div>
            <div class="wt-divider"></div>
            <div class="wt-sec">
                <div class="wt-sec-label"><i class="fa-solid fa-circle-info"></i><span>${t('sec_info')}</span></div>
                <div class="wt-info-table">
                    ${infoRows.map(({icon,key,val})=>`
                    <div class="wt-info-row">
                        <span class="wt-info-key"><i class="fa-solid ${icon}"></i><span>${t(key)}</span></span>
                        <span class="wt-info-val">${I18N.en[val]!==undefined?t(val):val}</span>
                    </div>`).join('')}
                </div>
            </div>
        </div>
        <div id="wt-footer">
            <span id="wt-footer-l">${t('footer_label')}</span>
            <span id="wt-footer-r"><span class="wt-esc">ESC</span><span>${t('footer_hint')}</span></span>
        </div>`;
    document.documentElement.appendChild(el);
    sidebarEl=el;
    setStatus(statusState);

    el.querySelector('#wt-close-btn').addEventListener('click', closeSidebar);
    el.querySelector('#wt-lang-btn').addEventListener('click',()=>{
        cfg.lang=cfg.lang==='vi'?'en':'vi'; saveCfg(); buildSidebar();
    });
    el.querySelector('#wt-enabled').addEventListener('change',e=>{
        cfg.enabled=e.target.checked; saveCfg();
        Toast.show(t(cfg.enabled?'toast_hook_on':'toast_hook_off'),cfg.enabled?'ok':'warning',1800);
    });
    el.querySelectorAll('.wt-tab').forEach(tab=>{
        tab.addEventListener('click',()=>{
            const pid=tab.dataset.pane, mode=pid.replace('pane-','');
            if (mode!=='github'){cfg.mode=mode;wasmCache=null;wasmPromise=null;preloadPromise=null;saveCfg();}
            el.querySelectorAll('.wt-tab').forEach(t2=>t2.classList.remove('active'));
            tab.classList.add('active');
            el.querySelectorAll('.wt-pane').forEach(p=>p.classList.remove('active'));
            el.querySelector('#'+pid).classList.add('active');
            if (pid==='pane-github'){const gl=el.querySelector('#wt-gh-list');if(!gl.innerHTML.trim())renderGitHubPane(gl);}
        });
    });
    el.querySelector('#wt-remote-url').addEventListener('input',e=>{
        cfg.remoteUrl=e.target.value.trim();wasmCache=null;wasmPromise=null;preloadPromise=null;saveCfg();
    });
    el.querySelector('#wt-local-url').addEventListener('input',e=>{
        cfg.localUrl=e.target.value.trim();wasmCache=null;wasmPromise=null;preloadPromise=null;saveCfg();
    });
    el.querySelectorAll('.wt-chip').forEach(chip=>{
        chip.addEventListener('click',()=>{
            const url=chip.dataset.url;
            el.querySelector('#wt-remote-url').value=url;
            cfg.remoteUrl=url;wasmCache=null;wasmPromise=null;preloadPromise=null;saveCfg();
            Toast.show(t('toast_preset'),'info',1800);
        });
    });
    el.querySelector('#wt-gh-refresh-btn').addEventListener('click',()=>{
        renderGitHubPane(el.querySelector('#wt-gh-list'));
    });

    const dz=el.querySelector('#wt-dropzone'),fInp=el.querySelector('#wt-file-real');
    const pill=el.querySelector('#wt-file-pill'),pName=el.querySelector('#wt-file-pill-name'),pSize=el.querySelector('#wt-file-pill-size');
    dz.addEventListener('click',()=>fInp.click());
    dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('over');});
    dz.addEventListener('dragleave',()=>dz.classList.remove('over'));
    dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('over');handleFile(e.dataTransfer.files[0]);});
    fInp.addEventListener('change',e=>handleFile(e.target.files[0]));
    function handleFile(file) {
        if (!file) return;
        if (!file.name.endsWith('.wasm')){Toast.show(t('toast_file_err'),'error',2400);return;}
        const reader=new FileReader();
        reader.onload=ev=>{
            wasmCache=ev.target.result;wasmPromise=null;preloadPromise=null;
            cfg.mode='file';setStatus('ok');saveCfg();
            injected=true;
            pill.classList.add('show');
            pName.textContent=file.name;
            pSize.textContent=(file.size/1024).toFixed(1)+' KB';
            Toast.show(`<b>${file.name}</b> · ${(file.size/1024).toFixed(1)} KB`,'ok',2200);
        };
        reader.readAsArrayBuffer(file);
    }
    el.querySelector('#wt-apply').addEventListener('click', async()=>{
        wasmCache=null;wasmPromise=null;preloadPromise=null;injected=false;setStatus('idle');
        await idbClearAll();
        await clearSiteCache();
        Toast.show(t('toast_fetching'),'info',1800);
        try {
            preloadPromise=loadWasm();
            await preloadPromise;
            preloadPromise=null;
            Toast.show(t('toast_reloading'),'ok',5000);
        } catch { Toast.show(t('toast_net_err'),'error',3500); }
    });

    el.querySelector('#wt-clear-cache').addEventListener('click', async()=>{
        wasmCache=null;wasmPromise=null;preloadPromise=null;injected=false;setStatus('idle');
        await idbClearAll();
        await clearSiteCache();
        Toast.show(t('toast_cache_clr'),'warning',5000);
    });

    el.querySelector('#wt-reset').addEventListener('click', async()=>{
        wasmCache=null;wasmPromise=null;preloadPromise=null;injected=false;
        cfg={mode:'remote',remoteUrl:ORIGINAL_WASM_URL,localUrl:'http://localhost:8080/diep_mod.wasm',enabled:true,lang:cfg.lang};
        saveCfg();
        await idbClearAll();
        await clearSiteCache();
        setStatus('idle');
        Toast.show(t('toast_reset'),'warning',2000);
        setTimeout(()=>buildSidebar(),400);
    });
}

function openSidebar()  { if(sidebarOpen)return; sidebarOpen=true; buildSidebar(); }
function closeSidebar() {
    if(!sidebarOpen||!sidebarEl)return;
    sidebarEl.classList.add('closing');
    setTimeout(()=>{sidebarEl?.remove();sidebarEl=null;sidebarOpen=false;},300);
}

document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.stopImmediatePropagation();sidebarOpen?closeSidebar():openSidebar();}
},true);

function init() {
    injectStyles();
    if (!document.getElementById('wt-fonts')) {
        const lk=document.createElement('link');
        lk.id='wt-fonts';lk.rel='stylesheet';
        lk.href='https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap';
        (document.head||document.documentElement).appendChild(lk);
    }
}
if(document.head){init();}
else{
    const obs=new MutationObserver(()=>{if(document.head){obs.disconnect();init();}});
    obs.observe(document.documentElement,{childList:true,subtree:true});
}
setTimeout(()=>Toast.show(t('toast_startup'),'info',3200),1200);