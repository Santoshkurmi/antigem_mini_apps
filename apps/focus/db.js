// Tiny IndexedDB helpers (native SQLite under the hood) shared by both pages.
const FocusDB = (() => {
  let dbp = null;
  const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      const o = indexedDB.open('focus', 1);
      o.onupgradeneeded = () => {
        const db = o.result;
        const t = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
        t.createIndex('done', 'done');
        const s = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
        s.createIndex('day', 'day');
      };
      o.onsuccess = () => res(o.result);
      o.onerror = () => rej(o.error);
    });
    return dbp;
  }
  async function store(name, mode = 'readonly') { return (await open()).transaction(name, mode).objectStore(name); }
  return {
    all: async name => req((await store(name)).getAll()),
    get: async (name, id) => req((await store(name)).get(id)),
    put: async (name, v) => req((await store(name, 'readwrite')).put(v)),
    del: async (name, id) => req((await store(name, 'readwrite')).delete(id)),
    byDay: async day => req((await store('sessions')).index('day').getAll(day)),
  };
})();
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
