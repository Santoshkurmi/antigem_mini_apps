// Pocket Notes storage: IndexedDB (native SQLite underneath). Shared by both pages.
const DB_NAME = 'pocket-notes';
let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const s = req.result.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
      s.createIndex('updated', 'updated');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function reqP(r) { return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }

async function store(mode) { return (await openDb()).transaction('notes', mode).objectStore('notes'); }

const Notes = {
  /** Newest first, via the "updated" index. */
  async all() {
    const s = await store('readonly');
    return new Promise((resolve, reject) => {
      const out = [];
      const c = s.index('updated').openCursor(null, 'prev');
      c.onsuccess = () => { const cur = c.result; if (cur) { out.push(cur.value); cur.continue(); } else resolve(out); };
      c.onerror = () => reject(c.error);
    });
  },
  async get(id) { return reqP((await store('readonly')).get(Number(id))); },
  async put(note) {
    note.updated = Date.now();
    if (!note.created) note.created = note.updated;
    const id = await reqP((await store('readwrite')).put(note));
    note.id = id;
    return note;
  },
  async remove(id) { return reqP((await store('readwrite')).delete(Number(id))); },
};

/** First line = title, rest = body. */
function titleOf(n) { return (n.text || '').split('\n')[0].replace(/^#+\s*/, '').trim() || 'Untitled'; }

function escapeHtml(s) { return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

/** Markdown-lite: headings, bold, italic, code, links, lists, checkboxes, quotes. */
function renderMd(text) {
  const inline = s => escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<i>$2</i>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2">$1</a>');
  let html = '', inList = false;
  for (const line of text.split('\n')) {
    let m;
    if ((m = line.match(/^\s*[-*] \[( |x)\] (.*)/i))) {
      if (!inList) { html += '<ul class="md-list">'; inList = true; }
      html += `<li class="md-task${m[1] !== ' ' ? ' done' : ''}">${m[1] !== ' ' ? '☑' : '☐'} ${inline(m[2])}</li>`;
      continue;
    }
    if ((m = line.match(/^\s*[-*] (.*)/))) {
      if (!inList) { html += '<ul class="md-list">'; inList = true; }
      html += `<li>${inline(m[1])}</li>`;
      continue;
    }
    if (inList) { html += '</ul>'; inList = false; }
    if ((m = line.match(/^(#{1,3}) (.*)/))) html += `<h${m[1].length + 1}>${inline(m[2])}</h${m[1].length + 1}>`;
    else if ((m = line.match(/^> (.*)/))) html += `<blockquote>${inline(m[1])}</blockquote>`;
    else if (line.trim() === '') html += '<div class="md-gap"></div>';
    else html += `<p>${inline(line)}</p>`;
  }
  if (inList) html += '</ul>';
  return html;
}

const EXPORT_DIR = '/sdcard/Documents/PocketNotes';
