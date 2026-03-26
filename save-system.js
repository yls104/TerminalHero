(function exposeSaveSystem() {
  const SAVE_KEY = "terminal-brave-save-v1";
  const SAVE_VERSION = 1;

  function getStorage() {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return null;
      }
      return window.localStorage;
    } catch (error) {
      return null;
    }
  }

  function cloneValue(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function buildEnvelope(snapshot) {
    return {
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
      snapshot: cloneValue(snapshot || {}),
    };
  }

  function saveSnapshot(snapshot) {
    const storage = getStorage();
    if (!storage) {
      return { ok: false, reason: "当前环境不支持本地存档。" };
    }
    try {
      const envelope = buildEnvelope(snapshot);
      storage.setItem(SAVE_KEY, JSON.stringify(envelope));
      return { ok: true, savedAt: envelope.savedAt };
    } catch (error) {
      return { ok: false, reason: "写入存档失败。" };
    }
  }

  function loadSnapshot() {
    const storage = getStorage();
    if (!storage) {
      return { ok: false, reason: "当前环境不支持本地存档。" };
    }
    try {
      const raw = storage.getItem(SAVE_KEY);
      if (!raw) {
        return { ok: false, reason: "未找到可读取的存档。" };
      }
      const envelope = JSON.parse(raw);
      if (!envelope || typeof envelope !== "object" || !envelope.snapshot) {
        return { ok: false, reason: "存档内容损坏。" };
      }
      if (typeof envelope.version !== "number" || envelope.version > SAVE_VERSION) {
        return { ok: false, reason: "存档版本过新，当前版本无法读取。" };
      }
      return {
        ok: true,
        savedAt: envelope.savedAt || "",
        snapshot: cloneValue(envelope.snapshot),
      };
    } catch (error) {
      return { ok: false, reason: "读取存档失败。" };
    }
  }

  function clearSnapshot() {
    const storage = getStorage();
    if (!storage) {
      return { ok: false, reason: "当前环境不支持本地存档。" };
    }
    try {
      storage.removeItem(SAVE_KEY);
      return { ok: true };
    } catch (error) {
      return { ok: false, reason: "删除存档失败。" };
    }
  }

  function getSaveMetadata() {
    const result = loadSnapshot();
    if (!result.ok) {
      return { exists: false, savedAt: "", summary: "" };
    }
    const snapshot = result.snapshot || {};
    const summary = []
      .concat(snapshot.player && snapshot.player.className ? ["职业：" + snapshot.player.className] : [])
      .concat(snapshot.currentStageName ? ["区域：" + snapshot.currentStageName] : [])
      .join(" / ");
    return {
      exists: true,
      savedAt: result.savedAt || "",
      summary: summary,
    };
  }

  window.GameSaveSystem = {
    SAVE_KEY: SAVE_KEY,
    SAVE_VERSION: SAVE_VERSION,
    saveSnapshot: saveSnapshot,
    loadSnapshot: loadSnapshot,
    clearSnapshot: clearSnapshot,
    getSaveMetadata: getSaveMetadata,
  };
})();
