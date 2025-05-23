const DB_NAME = "dyslexia-helper";
const DB_VERSION = 2;

let dbPromise = null;

window.openDB = function () {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;

      if (!db.objectStoreNames.contains("defs")) {
        db.createObjectStore("defs", { keyPath: ["word", "sentence"] });
      }

      if (!db.objectStoreNames.contains("pageEmbeds")) {
        const store = db.createObjectStore("pageEmbeds", { keyPath: ["url", "idx"] });
        store.createIndex("byUrl", "url", { unique: false });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return dbPromise;
};

/* --------------------- Definitions Cache --------------------- */
window.idbGet = async function (word, sentence) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction("defs", "readonly");
    const store = tx.objectStore("defs");
    const req = store.get([word, sentence]);

    req.onsuccess = () => resolve(req.result?.def || null);
    req.onerror = () => resolve(null);
  });
};

window.idbPut = async function (word, sentence, def) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction("defs", "readwrite");
    const store = tx.objectStore("defs");
    store.put({ word, sentence, def });
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
};

/* --------------------- Page Embedding Cache --------------------- */
window.storeEmbeds = async function (url, chunks, vectors) {
  const db = await openDB();
  const tx = db.transaction("pageEmbeds", "readwrite");
  const store = tx.objectStore("pageEmbeds");

  chunks.forEach((text, idx) => {
    store.put({ url, idx, text, vec: vectors[idx] });
  });

  return new Promise((resolve) => {
    tx.oncomplete = resolve;
    tx.onerror = resolve;
  });
};

window.hasEmbeds = async function (url) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction("pageEmbeds", "readonly");
    const index = tx.objectStore("pageEmbeds").index("byUrl");
    const req = index.getKey(IDBKeyRange.only(url));

    req.onsuccess = () => resolve(req.result !== undefined);
    req.onerror = () => resolve(false);
  });
};

window.getEmbeds = async function (url) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction("pageEmbeds", "readonly");
    const index = tx.objectStore("pageEmbeds").index("byUrl");
    const req = index.getAll(IDBKeyRange.only(url));

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve([]);
  });
};
