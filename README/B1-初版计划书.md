# 🕹️ AI Vibe Coding 交付文档：2D回合制RPG游戏 MVP版

## 1. 游戏概述 (Game Overview)

- **游戏名称**：终端勇者 (Terminal Brave)
- **游戏类型**：2D 俯视角网格探索 + 回合制RPG
- **技术栈**：纯原生前端技术 (HTML5 Canvas + Vanilla JavaScript + CSS3)，**不使用任何第三方游戏引擎**，确保AI生成的代码轻量且易于调试。
- **核心玩法**：玩家在一个网格地图上移动（WASD/方向键），触碰敌人触发回合制战斗界面。战斗胜利获得经验升级，探索地图寻找出口或击败Boss。

---

## 2. 文件架构设计 (File Structure)
*请AI严格按照以下模块化结构生成代码，保持低耦合：*

- `index.html`：入口文件，包含Canvas容器、UI面板（状态栏、战斗菜单、日志窗口）。
- `style.css`：样式文件，负责游戏界面的像素风排版或极简极客风排版。
- `main.js`：游戏主循环（Game Loop）、状态机（控制地图模式与战斗模式的切换）。
- `map.js`：地图生成（二维数组）、渲染逻辑、碰撞检测与玩家移动。
- `combat.js`：回合制战斗逻辑计算、伤害公式、战斗内UI更新。
- `entities.js`：定义玩家（Player）和敌人（Enemy）的数据模型和类。

---

## 3. 核心数据模型 (Data Models)
*为了防止AI产生逻辑幻觉，强制约束以下数据结构：*

## 3.1 玩家实体 (Player Entity)

```javascript
const player = {
  name: "Hero",
  level: 1,
  hp: 100,
  maxHp: 100,
  mp: 20,
  maxMp: 20,
  attack: 15,    // 物理攻击力
  defense: 5,    // 物理防御力
  speed: 10,     // 决定战斗出手顺序
  exp: 0,
  expToNext: 50, // 升级所需经验
  position: { x: 1, y: 1 } // 地图网格坐标
};

```

## 3.2 技能字典 (Skills Dictionary)

```javascript
const skills = {
  attack: { name: "普通攻击", type: "physical", cost: 0, power: 1.0 },
  heal: { name: "恢复术", type: "magic", cost: 10, power: -0.5 }, // 负数代表回血
  heavyStrike: { name: "重击", type: "physical", cost: 5, power: 1.5 }
};

```

## 3.3 地图数据 (Map Array)
采用简单的二维数组表示，便于AI进行逻辑判断。

- `0` = 空地 (可通行)
- `1` = 墙壁 (不可通行)
- `2` = 玩家初始点
- `3` = 普通敌人 (触发战斗)
- `4` = 回复点 (恢复HP/MP并消失)
- `5` = Boss (触发Boss战)

---

## 4. 核心系统逻辑 (Core Mechanics)

## 4.1 探索状态机 (Exploration State)

- **输入捕获**：监听键盘 `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`。
- **碰撞检测**：移动前检查目标网格坐标的值。如果为 `1`，阻止移动；如果为 `3` 或 `5`，将当前游戏状态切换为 `COMBAT_STATE` 并加载对应敌人数据。
- **视角跟随**：如果地图大于Canvas尺寸，实现简单的摄像机居中逻辑（第一版MVP可设定为单屏幕固定地图以降低难度）。

## 4.2 战斗状态机 (Combat State)

- **回合判定**：对比 `player.speed` 和 `enemy.speed` 决定先手。
- **玩家回合**：等待UI输入（点击“攻击”、“技能”、“逃跑”按钮）。
- **敌人回合**：AI使用简单的随机策略（80%概率普攻，20%概率使用技能）。
- **伤害公式**：`最终伤害 = Math.max(1, (攻击方attack * 技能power) - 防御方defense)`。加入 ±10% 的随机浮动值。
- **结算逻辑**：
  - 若敌人HP <= 0，战斗胜利，结算经验值，地图上该敌人格子变为 `0`，切换回 `EXPLORE_STATE`。
  - 若玩家HP <= 0，游戏结束（Game Over UI）。

---

## 5. UI 与视图层布局 (UI Layout)
建议采用 **“左画面 + 右面板 / 下面板”** 的经典RPG布局：

1. **主视口 (Game Canvas)**：占用画面主视觉区域（例如 640x480），负责绘制地图网格、角色方块（MVP阶段可用不同颜色的方块或Emoji代替贴图：🧙‍♂️=玩家，👾=敌人，🧱=墙壁）。
2. **状态栏 (Status Panel)**：实时显示玩家当前 HP、MP、Level、EXP（使用CSS进度条）。
3. **行动菜单 (Action Menu)**：仅在战斗状态下显示，包含交互按钮（Attack, Heal, Flee）。
4. **战斗日志 (Battle Log)**：DOM元素 `<div>`，采用追加文本的方式输出战斗信息（例如：“勇者对史莱姆造成了 12 点伤害”），并自动滚动到底部。

---

## 6. AI 落地实施路径 (AI Implementation Phases)
*请AI编程助手严格按照以下步骤，逐阶段交付并测试代码，不要一次性生成所有文件。*

- **Phase 1: 基础框架与地图渲染**
  - 创建HTML骨架和CSS样式。
  - 在 `map.js` 中实现二维数组地图的Canvas渲染。
  - 在 `main.js` 中实现玩家实体在网格上的移动与墙壁碰撞。
- **Phase 2: UI系统与数据绑定**
  - 创建侧边栏/底部状态面板。
  - 实现玩家数据的实时更新（当玩家移动或受到伤害时，UI自动同步）。
- **Phase 3: 战斗系统 (核心)**
  - 实现触碰特定网格元素（如 `3`）时暂停地图渲染，弹出战斗界面。
  - 在 `combat.js` 中完成回合制逻辑、伤害计算与日志输出。
  - 实现战斗胜利后的经验值结算、升级逻辑（属性成长），并返回地图状态。
- **Phase 4: 游戏循环与打磨 (Vibe 优化)**
  - 添加简单的CSS动画（例如攻击时的屏幕震动效果 `shake`）。
  - 加入胜负判定逻辑（击败Boss显示胜利，HP归零显示GameOver并重置）。
