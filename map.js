const TILE = {
  FLOOR: 0,
  WALL: 1,
  PLAYER_START: 2,
  ENEMY: 3,
  HEAL_POINT: 4,
  BOSS: 5,
  PORTAL: 6,
};

const TILE_SIZE = 32;
const MAP_COLS = 20;
const MAP_ROWS = 15;
const assetCache = {};
const STAGE_ASSET_THEMES = {
  default: {
    floor: "floor",
    wall: "wall",
    enemy: "enemy",
    boss: "boss",
  },
  azure_town: {
    floor: "town_floor",
    wall: "town_wall",
    enemy: "enemy",
    boss: "boss",
  },
  verdant_grove: {
    floor: "grove_floor",
    wall: "grove_wall",
    enemy: "grove_enemy",
    boss: "grove_boss",
  },
  sunken_archive: {
    floor: "archive_floor",
    wall: "archive_wall",
    enemy: "archive_enemy",
    boss: "archive_boss",
  },
  ember_hollow: {
    floor: "ember_floor",
    wall: "ember_wall",
    enemy: "ember_enemy",
    boss: "ember_boss",
  },
};

const DEFAULT_MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 1, 0, 0, 3, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1],
  [1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 4, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 1, 0, 1, 0, 0, 3, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 0, 0, 1, 6, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

function createMap() {
  return DEFAULT_MAP.map((row) => [...row]);
}

function extractPlayerStart(mapData) {
  for (let y = 0; y < mapData.length; y += 1) {
    for (let x = 0; x < mapData[y].length; x += 1) {
      if (mapData[y][x] === TILE.PLAYER_START) {
        mapData[y][x] = TILE.FLOOR;
        return { x, y };
      }
    }
  }
  return { x: 1, y: 1 };
}

function isInsideMap(x, y) {
  return y >= 0 && y < MAP_ROWS && x >= 0 && x < MAP_COLS;
}

function getTile(mapData, x, y) {
  if (!isInsideMap(x, y)) {
    return TILE.WALL;
  }
  return mapData[y][x];
}

function canMoveTo(mapData, x, y) {
  const tile = getTile(mapData, x, y);
  return tile !== TILE.WALL;
}

function setTile(mapData, x, y, value) {
  if (!isInsideMap(x, y)) {
    return false;
  }
  mapData[y][x] = value;
  return true;
}

function drawMap(ctx, mapData, playerPosition, options) {
  const settings = options || {};
  const stageTheme = settings.stageTheme || settings.stageName || "";
  ctx.clearRect(0, 0, MAP_COLS * TILE_SIZE, MAP_ROWS * TILE_SIZE);

  for (let y = 0; y < MAP_ROWS; y += 1) {
    for (let x = 0; x < MAP_COLS; x += 1) {
      const tile = mapData[y][x];
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      drawTileSprite(ctx, getTileAssetKey(tile, stageTheme), px, py, tile);
    }
  }

  drawPlayer(ctx, playerPosition);
}

function drawPlayer(ctx, playerPosition) {
  const px = playerPosition.x * TILE_SIZE;
  const py = playerPosition.y * TILE_SIZE;
  drawTileSprite(ctx, "player", px, py, TILE.PLAYER_START);
}

function getTileAssetKey(tile, stageTheme) {
  const themeAssets = STAGE_ASSET_THEMES[stageTheme] || STAGE_ASSET_THEMES.default;
  if (tile === TILE.WALL) {
    return themeAssets.wall;
  }
  if (tile === TILE.ENEMY) {
    return themeAssets.enemy;
  }
  if (tile === TILE.HEAL_POINT) {
    return "heal";
  }
  if (tile === TILE.BOSS) {
    return themeAssets.boss;
  }
  if (tile === TILE.PORTAL) {
    return "portal";
  }
  return themeAssets.floor;
}

function drawTileSprite(ctx, assetKey, x, y, tile) {
  const image = assetCache[assetKey];
  if (image && image.complete) {
    ctx.drawImage(image, x, y, TILE_SIZE, TILE_SIZE);
    if (tile !== TILE.WALL) {
      ctx.strokeStyle = "rgba(125, 211, 252, 0.08)";
      ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
    }
    return;
  }

  if (tile === TILE.WALL) {
    ctx.fillStyle = "#475569";
  } else {
    ctx.fillStyle = "#0f172a";
  }
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.strokeStyle = "rgba(100, 116, 139, 0.35)";
  ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

  if (tile === TILE.ENEMY) {
    drawTileMarker(ctx, x, y, "#ef4444", "E");
  } else if (tile === TILE.HEAL_POINT) {
    drawTileMarker(ctx, x, y, "#22c55e", "H");
  } else if (tile === TILE.BOSS) {
    drawTileMarker(ctx, x, y, "#a855f7", "B");
  } else if (tile === TILE.PORTAL) {
    drawTileMarker(ctx, x, y, "#7dd3fc", "P");
  } else if (assetKey === "player") {
    drawTileMarker(ctx, x, y, "#22d3ee", "@");
  }
}

function drawTileMarker(ctx, x, y, color, text) {
  ctx.fillStyle = color;
  ctx.fillRect(x + 6, y + 6, TILE_SIZE - 12, TILE_SIZE - 12);

  ctx.fillStyle = "#020617";
  ctx.font = "bold 14px Consolas, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + TILE_SIZE / 2, y + TILE_SIZE / 2 + 1);
}

function loadMapAssets() {
  const manifest = {
    floor: "./assets/tiles/floor.svg",
    wall: "./assets/tiles/wall.svg",
    player: "./assets/tiles/player.svg",
    enemy: "./assets/tiles/enemy.svg",
    heal: "./assets/tiles/heal.svg",
    boss: "./assets/tiles/boss.svg",
    portal: "./assets/tiles/portal.svg",
    town_floor: "./assets/tiles/town_floor.svg",
    town_wall: "./assets/tiles/town_wall.svg",
    npc: "./assets/tiles/npc.svg",
    house: "./assets/tiles/house.svg",
    grove_floor: "./assets/tiles/grove_floor.svg",
    grove_wall: "./assets/tiles/grove_wall.svg",
    grove_enemy: "./assets/tiles/grove_enemy.svg",
    grove_boss: "./assets/tiles/grove_boss.svg",
    archive_floor: "./assets/tiles/archive_floor.svg",
    archive_wall: "./assets/tiles/archive_wall.svg",
    archive_enemy: "./assets/tiles/archive_enemy.svg",
    archive_boss: "./assets/tiles/archive_boss.svg",
    ember_floor: "./assets/tiles/ember_floor.svg",
    ember_wall: "./assets/tiles/ember_wall.svg",
    ember_enemy: "./assets/tiles/ember_enemy.svg",
    ember_boss: "./assets/tiles/ember_boss.svg",
  };

  const loaders = Object.keys(manifest).map(function loadOne(key) {
    return new Promise(function resolveImage(resolve) {
      const image = new Image();
      image.decoding = "async";
      image.onload = function onLoaded() {
        assetCache[key] = image;
        resolve({ key: key, ok: true });
      };
      image.onerror = function onFailed() {
        resolve({ key: key, ok: false });
      };
      image.src = manifest[key];
    });
  });

  return Promise.all(loaders);
}

function getMapAsset(key) {
  return assetCache[key] || null;
}

window.GameMap = {
  TILE,
  TILE_SIZE,
  MAP_COLS,
  MAP_ROWS,
  createMap,
  extractPlayerStart,
  isInsideMap,
  getTile,
  canMoveTo,
  setTile,
  loadMapAssets,
  getMapAsset,
  drawMap,
};
