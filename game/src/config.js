// Sizzle Station — every tuning number, colour and recipe in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** One work shift lasts this long; when it ends the day is scored. */
export const SHIFT_SECONDS = 150;

export const HEARTS = 3;

/** Seconds an order lives: a base plus a little per ingredient in its recipe. */
export const ORDER = {
  baseSeconds: 16,
  perIngredientSeconds: 3,
  spawnFirstAt: 2,
  spawnIntervalStart: 11,
  spawnIntervalEnd: 6.5,
  maxConcurrent: 3,
};

export const SCORE = {
  serveBase: 100,
  perSecondLeft: 10,
  comboBonus: 25,
  mistake: -5,
  expired: -25,
};

/** The eight ingredients on the counter rail, in rail order. Keys 1-8 add them. */
export const INGREDIENTS = [
  { id: 'bun', name: 'Bun', key: '1', color: '#e8a54b', dark: '#b97a2e' },
  { id: 'patty', name: 'Patty', key: '2', color: '#7a4a2b', dark: '#5a3420' },
  { id: 'cheese', name: 'Cheese', key: '3', color: '#f2c94c', dark: '#c9a227' },
  { id: 'lettuce', name: 'Lettuce', key: '4', color: '#7bc043', dark: '#4e8a26' },
  { id: 'tomato', name: 'Tomato', key: '5', color: '#e5534b', dark: '#b2342c' },
  { id: 'egg', name: 'Egg', key: '6', color: '#fdf6e3', dark: '#f0b429' },
  { id: 'fries', name: 'Fries', key: '7', color: '#f5c542', dark: '#c0392b' },
  { id: 'sauce', name: 'Sauce', key: '8', color: '#ff8c42', dark: '#d35400' },
];

export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((item) => [item.id, item]));

/** The menu: each dish is a stack of ingredients, bottom first, top last. */
export const DISHES = [
  { name: 'Classic Burger', recipe: ['bun', 'patty', 'cheese', 'lettuce', 'tomato', 'bun'] },
  { name: 'Sunny Burger', recipe: ['bun', 'egg', 'cheese', 'tomato', 'bun'] },
  { name: 'Garden Plate', recipe: ['lettuce', 'tomato', 'cheese', 'egg', 'sauce'] },
  { name: 'Double Stack', recipe: ['bun', 'patty', 'patty', 'cheese', 'lettuce', 'bun'] },
  { name: 'Fry Basket', recipe: ['fries', 'sauce', 'cheese', 'fries'] },
  { name: 'Tomato Melt', recipe: ['bun', 'tomato', 'cheese', 'egg', 'bun'] },
];

export const PALETTE = {
  backdrop: '#241a12',
  wall: '#f3d9a4',
  wallTile: '#e8c88f',
  board: '#2e4a3a',
  boardFrame: '#8a5a2b',
  counter: '#a06a35',
  counterTop: '#c98d4e',
  rail: '#3a2a1c',
  panel: '#2b2018',
  text: '#fff6e6',
  muted: '#cbb693',
  gold: '#f2c94c',
  red: '#e5534b',
  green: '#7bc043',
  cream: '#fdf6e3',
  bell: '#e8b93c',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'sizzle-station.best';

/** Fixed hit regions, shared by the renderer and the mouse input. */
export const LAYOUT = {
  hud: { x: 0, y: 0, width: 1280, height: 56 },
  board: { x: 24, y: 64, width: 1232, height: 132 },
  ticket: { width: 320, height: 108, gap: 16 },
  kitchen: { x: 0, y: 204, width: 1280, height: 266 },
  counterTopY: 436,
  plate: { x: 520, y: 330, width: 240, height: 106 },
  grill: { x: 64, y: 330, width: 260, height: 106 },
  bell: { x: 1000, y: 330, width: 150, height: 106 },
  rail: { x: 24, y: 486, width: 1232, height: 168 },
  bin: { width: 140, height: 150, gap: 16 },
  hint: { x: 24, y: 668, width: 1232, height: 40 },
};
