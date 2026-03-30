const fs = require("fs");
const path = require("path");
const vm = require("vm");

const projectRoot = path.resolve(__dirname, "..");

function readFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function loadScriptIntoContext(context, relativePath) {
  vm.runInContext(readFile(relativePath), context, { filename: relativePath });
}

function validateHtmlContract(indexHtml) {
  [
    "gameCanvas",
    "virtualJoystick",
    "statusToggle",
    "floatingStatusPanel",
    "btnOpenLog",
    "btnSaveMenu",
    "battleLog",
  ].forEach(function eachId(id) {
    assert(indexHtml.includes('id="' + id + '"'), "index.html 缺少关键节点 #" + id);
  });
}

function validateStyleContract(styleCss) {
  [
    ".virtual-joystick",
    ".floating-status-panel",
    ".hud-toggle",
    ".battle-log p:nth-last-child(n + 3)",
    ".mini-button",
  ].forEach(function eachSelector(selector) {
    assert(styleCss.includes(selector), "style.css 缺少移动端或日志相关样式：" + selector);
  });
}

function createBrowserContext() {
  const context = {
    console: console,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    Math: Math,
    Date: Date,
    JSON: JSON,
    window: {
      localStorage: {
        _store: {},
        getItem(key) {
          return Object.prototype.hasOwnProperty.call(this._store, key) ? this._store[key] : null;
        },
        setItem(key, value) {
          this._store[key] = String(value);
        },
        removeItem(key) {
          delete this._store[key];
        },
      },
      GameMap: {
        TILE: { FLOOR: 0, WALL: 1, PLAYER_START: 2, ENEMY: 3, HEAL_POINT: 4, BOSS: 5, PORTAL: 6, ELITE: 7, EVENT: 8 },
        MAP_COLS: 20,
        MAP_ROWS: 15,
      },
    },
  };
  context.window.window = context.window;
  return vm.createContext(context);
}

function validateDataAndViewModels() {
  const context = createBrowserContext();
  loadScriptIntoContext(context, "stage-data.js");
  loadScriptIntoContext(context, "view-models.js");
  loadScriptIntoContext(context, "save-system.js");

  const stageApi = context.window.GameStageData;
  const viewApi = context.window.GameViewModels;
  const saveApi = context.window.GameSaveSystem;

  assert(stageApi && typeof stageApi.createStageProgress === "function", "stage-data.js 未暴露 createStageProgress");
  assert(Array.isArray(stageApi.CHAPTERS) && stageApi.CHAPTERS.length >= 3, "章节配置未正确暴露");

  const progress = stageApi.createStageProgress();
  assert(progress.chapterProgress, "createStageProgress 未生成 chapterProgress");
  assert(Array.isArray(progress.chapterProgress.unlockedChapterIds), "chapterProgress.unlockedChapterIds 缺失");
  assert(progress.longTerm && typeof progress.longTerm.townRenown === "number", "longTerm.townRenown 缺失");

  const archiveChapter = stageApi.getChapterByStageId("sunken_archive");
  assert(archiveChapter && archiveChapter.label.includes("第二章"), "getChapterByStageId 未返回正确章节");

  const summaryHtml = viewApi.renderRunSummaryHtml(viewApi.createRunSummaryViewModel({
    stageLabel: "青藤密林",
    unlockedChapterLabel: "第二章：书库回响",
    unlockedStageLabel: "沉没书库",
  }));
  assert(summaryHtml.includes("章节推进"), "结算视图未展示章节推进");

  const saveResult = saveApi.saveSnapshot({
    currentStageName: "azure_town",
    currentStageLabel: "蔚蓝城镇",
    currentStageMode: "town",
    player: { className: "勇者" },
    progress: progress,
  });
  assert(saveResult.ok, "save-system.js 无法保存基础快照");
  const metadata = saveApi.getSaveMetadata();
  assert(metadata.exists, "save-system.js 未能读取保存后的元信息");
}

function validateSourceSyntax(relativePath) {
  const source = readFile(relativePath);
  try {
    new vm.Script(source, { filename: relativePath });
  } catch (error) {
    fail(relativePath + " 存在语法错误：" + error.message);
  }
}

function main() {
  validateHtmlContract(readFile("index.html"));
  validateStyleContract(readFile("style.css"));
  [
    "main.js",
    "stage-data.js",
    "view-models.js",
    "save-system.js",
  ].forEach(validateSourceSyntax);
  validateDataAndViewModels();
  console.log("基础验证通过：UI 合同、章节进度、结算视图与存档链路正常。");
}

main();
