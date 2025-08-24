// memory.js
const DB_NAME = "AIChatMemory";
const DB_VERSION = 1;
const STORE_NAME = "conversations";

// Nombre max de messages à garder en mémoire locale (modifiable)
const DEFAULT_MAX_MESSAGES = 20;

/**
 * Ouvre ou crée la base IndexedDB
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

/**
 * Attendre la fin d'une transaction (compat fallback)
 */
function waitForTransactionComplete(tx) {
  return new Promise((resolve, reject) => {
    // Si l'implémentation fournit tx.complete (Promise) : utiliser
    if (tx && tx.complete && typeof tx.complete.then === "function") {
      tx.complete.then(resolve).catch(reject);
      return;
    }

    // Sinon utiliser les handlers classiques
    tx.oncomplete = () => resolve();
    tx.onabort = (e) => reject(e?.target?.error || new Error("Transaction aborted"));
    tx.onerror = (e) => reject(e?.target?.error || new Error("Transaction error"));
  });
}

/**
 * Sauvegarde un message (role: "user" | "assistant" | "bot", content: "texte...")
 * Limite la mémoire locale à maxMessages (DEFAULT_MAX_MESSAGES si pas fourni)
 * Résout avec l'id inséré (number) une fois la transaction complétée.
 */
export async function saveMessage(role, content, maxMessages = DEFAULT_MAX_MESSAGES) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    // 1) Ajouter le message
    const addReq = store.add({ role, content, timestamp: Date.now() });

    addReq.onsuccess = async (evt) => {
      const insertedId = evt.target.result;

      try {
        // 2) Récupérer tous les messages (dans la même transaction) pour purger les plus anciens si besoin
        const getAllReq = store.getAll();
        getAllReq.onsuccess = async () => {
          const all = (getAllReq.result || []).sort((a, b) => a.timestamp - b.timestamp);
          if (all.length > maxMessages) {
            const toDelete = all.slice(0, all.length - maxMessages);
            toDelete.forEach(msg => {
              if (msg.id !== undefined) store.delete(msg.id);
            });
          }

          // attendre la fin de la transaction avant de résoudre
          try {
            await waitForTransactionComplete(tx);
            resolve(insertedId);
          } catch (errTx) {
            reject(errTx);
          }
        };

        getAllReq.onerror = (err) => {
          // si getAll échoue, on attend la transaction et rejette
          waitForTransactionComplete(tx).then(() => {
            reject(err.target?.error || new Error("Erreur getAll après add"));
          }).catch(reject);
        };
      } catch (err) {
        // en cas d'erreur interne
        waitForTransactionComplete(tx).then(() => reject(err)).catch(reject);
      }
    };

    addReq.onerror = (event) => {
      // erreur sur add
      waitForTransactionComplete(tx).then(() => reject(event.target.error)).catch(reject);
    };
  });
}

/**
 * Récupère toutes les conversations triées par date croissante
 * Résout avec un tableau d'objets { id, role, content, timestamp }
 */
export async function getMessages() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const sorted = (request.result || []).sort((a, b) => a.timestamp - b.timestamp);
      resolve(sorted);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

/**
 * Récupère le contexte (les derniers `limit` messages) au format utile pour l'IA:
 * [{ role: 'user'|'assistant'|'bot', content: '...' }, ...]
 */
export async function getContext(limit = 10) {
  const all = await getMessages();
  const last = all.slice(-limit);
  return last.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
}

/**
 * Supprime toute la mémoire locale (reset)
 */
export async function clearMessages() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.clear();

  return waitForTransactionComplete(tx);
}

/**
 * Export de la constante par défaut si besoin
 */
export { DEFAULT_MAX_MESSAGES };
