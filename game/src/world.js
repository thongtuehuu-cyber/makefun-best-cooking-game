// The game's rules and state, with no drawing and no browser in it: the order board,
// the plate stack, the shift clock, hearts, score and combo. step() advances one fixed
// step and returns what happened as bit flags, so the caller can react (and play sounds)
// without the world knowing about screens or audio. Nothing here allocates after
// createWorld returns, except the short-lived order objects.
import { DISHES, HEARTS, INGREDIENTS, ORDER, SCORE, SHIFT_SECONDS } from './config.js';

export const EVENT_ADD = 1;
export const EVENT_WRONG = 2;
export const EVENT_SERVE = 4;
export const EVENT_EXPIRE = 8;
export const EVENT_OVER = 16;
export const EVENT_TICK = 32;

let nextOrderId = 1;

function orderTime(recipe) {
  return ORDER.baseSeconds + ORDER.perIngredientSeconds * recipe.length;
}

function pickDish(random, avoid) {
  let index = Math.floor(random() * DISHES.length);
  if (DISHES.length > 1 && DISHES[index].name === avoid) index = (index + 1) % DISHES.length;
  return DISHES[index];
}

export function createWorld(random) {
  const state = {
    score: 0,
    combo: 0,
    bestCombo: 0,
    hearts: HEARTS,
    shiftLeft: SHIFT_SECONDS,
    elapsed: 0,
    orders: [],
    selected: 0,
    plate: [],
    served: 0,
    lost: 0,
    mistakes: 0,
    spawnTimer: ORDER.spawnFirstAt,
    over: false,
    overReason: '',
    shake: 0,
    flash: 0,
    lastServePoints: 0,
    lastServeName: '',
    serveCheer: 0,
    bellGlow: 0,
  };

  function reset() {
    state.score = 0;
    state.combo = 0;
    state.bestCombo = 0;
    state.hearts = HEARTS;
    state.shiftLeft = SHIFT_SECONDS;
    state.elapsed = 0;
    state.orders = [];
    state.selected = 0;
    state.plate = [];
    state.served = 0;
    state.lost = 0;
    state.mistakes = 0;
    state.spawnTimer = ORDER.spawnFirstAt;
    state.over = false;
    state.overReason = '';
    state.shake = 0;
    state.flash = 0;
    state.lastServePoints = 0;
    state.lastServeName = '';
    state.serveCheer = 0;
    state.bellGlow = 0;
    nextOrderId = 1;
  }

  function spawnOrder() {
    const avoid = state.orders.length > 0 ? state.orders[state.orders.length - 1].dish.name : '';
    const dish = pickDish(random, avoid);
    const time = orderTime(dish.recipe);
    state.orders.push({
      id: nextOrderId,
      dish,
      timer: time,
      maxTimer: time,
      done: false,
    });
    nextOrderId += 1;
  }

  function spawnInterval() {
    const progress = 1 - state.shiftLeft / SHIFT_SECONDS;
    return ORDER.spawnIntervalStart + (ORDER.spawnIntervalEnd - ORDER.spawnIntervalStart) * progress;
  }

  /** The order the plate is being built for (the selected ticket, or the oldest). */
  function currentOrder() {
    if (state.orders.length === 0) return null;
    if (state.selected >= state.orders.length) state.selected = state.orders.length - 1;
    return state.orders[state.selected];
  }

  /** The next ingredient the current order still needs, or null when the plate is full. */
  function nextNeeded() {
    const order = currentOrder();
    if (order === null) return null;
    if (state.plate.length >= order.dish.recipe.length) return null;
    return order.dish.recipe[state.plate.length];
  }

  function plateComplete() {
    const order = currentOrder();
    return order !== null && state.plate.length === order.dish.recipe.length;
  }

  function addIngredient(id) {
    if (state.over) return 0;
    const order = currentOrder();
    if (order === null) return 0;
    const needed = nextNeeded();
    if (needed === null) return 0;
    if (id !== needed) {
      state.score = Math.max(0, state.score + SCORE.mistake);
      state.combo = 0;
      state.mistakes += 1;
      state.shake = 0.35;
      state.flash = 0.4;
      return EVENT_WRONG;
    }
    state.plate.push(id);
    if (plateComplete()) state.bellGlow = 1;
    return EVENT_ADD;
  }

  function removeLast() {
    if (state.over || state.plate.length === 0) return 0;
    state.plate.pop();
    state.bellGlow = 0;
    return EVENT_ADD;
  }

  function serve() {
    if (state.over) return 0;
    const order = currentOrder();
    if (order === null || !plateComplete()) {
      state.shake = 0.3;
      return EVENT_WRONG;
    }
    const secondsLeft = Math.max(0, Math.ceil(order.timer));
    const points = SCORE.serveBase + SCORE.perSecondLeft * secondsLeft + SCORE.comboBonus * state.combo;
    state.score += points;
    state.lastServePoints = points;
    state.lastServeName = order.dish.name;
    state.combo += 1;
    if (state.combo > state.bestCombo) state.bestCombo = state.combo;
    state.served += 1;
    state.serveCheer = 2.5;
    state.orders.splice(state.orders.indexOf(order), 1);
    if (state.selected >= state.orders.length) state.selected = Math.max(0, state.orders.length - 1);
    state.plate = [];
    state.bellGlow = 0;
    return EVENT_SERVE;
  }

  function selectOrder(index) {
    if (index < 0 || index >= state.orders.length) return;
    if (index !== state.selected) {
      state.selected = index;
      state.plate = [];
      state.bellGlow = 0;
    }
  }

  function cycleOrder() {
    if (state.orders.length === 0) return;
    selectOrder((state.selected + 1) % state.orders.length);
  }

  /**
   * One fixed step. `actions` carries the player's one-shot inputs for this step:
   * { add, serve, remove, cycle, select } — add is an ingredient id or null.
   */
  function step(dt, actions) {
    let events = 0;
    if (state.over) return events;
    state.elapsed += dt;
    state.shiftLeft = Math.max(0, state.shiftLeft - dt);
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
    if (state.flash > 0) state.flash = Math.max(0, state.flash - dt);
    if (state.serveCheer > 0) state.serveCheer = Math.max(0, state.serveCheer - dt);
    if (state.bellGlow > 0) state.bellGlow = Math.max(0, state.bellGlow - dt * 0.5);

    if (actions) {
      if (typeof actions.select === 'number') selectOrder(actions.select);
      if (actions.cycle) cycleOrder();
      if (actions.remove) events |= removeLast();
      if (actions.add) events |= addIngredient(actions.add);
      if (actions.serve) events |= serve();
    }

    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0 && state.orders.length < ORDER.maxConcurrent) {
      spawnOrder();
      state.spawnTimer += spawnInterval();
    }

    for (let index = state.orders.length - 1; index >= 0; index -= 1) {
      const order = state.orders[index];
      const before = Math.ceil(order.timer);
      order.timer -= dt;
      if (order.timer <= 5 && Math.ceil(order.timer) !== before) events |= EVENT_TICK;
      if (order.timer <= 0) {
        state.orders.splice(index, 1);
        state.lost += 1;
        state.hearts -= 1;
        state.combo = 0;
        state.score = Math.max(0, state.score + SCORE.expired);
        state.shake = 0.5;
        state.flash = 0.5;
        events |= EVENT_EXPIRE;
        if (state.selected >= state.orders.length) state.selected = Math.max(0, state.orders.length - 1);
        if (state.plate.length > 0) {
          // The dish being built for the lost order is cleared with it.
          const lostDish = order.dish;
          const orderStill = state.orders[state.selected];
          if (!orderStill || orderStill.dish.name !== lostDish.name) state.plate = [];
        }
        if (state.hearts <= 0) {
          state.over = true;
          state.overReason = 'The lunch rush wore you out — three orders walked out.';
          events |= EVENT_OVER;
          return events;
        }
      }
    }

    if (state.shiftLeft <= 0) {
      state.over = true;
      state.overReason = state.served > 0 ? 'Shift complete — the kitchen closes on a good day.' : 'Shift complete — no dish served today.';
      events |= EVENT_OVER;
    }
    return events;
  }

  reset();
  return { state, reset, step, currentOrder, nextNeeded, plateComplete };
}
