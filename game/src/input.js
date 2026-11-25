// Keyboard and pointer input. Number keys add an ingredient, Space or Enter rings the
// serve bell, Backspace takes the top layer off the plate, Tab cycles the order ticket,
// P pauses. Clicks do the same: ingredient bins, order tickets, the bell, the plate.
// One-shot presses are queued as actions and taken once by the loop, so a press between
// two frames is never lost and never counted twice.
import { INGREDIENTS, LAYOUT } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;

const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const REMOVE = new Set(['Backspace', 'KeyX']);
const CYCLE = new Set(['Tab', 'KeyQ']);

function inRect(x, y, rect) {
  return x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
}

function binRect(index) {
  const rail = LAYOUT.rail;
  const bin = LAYOUT.bin;
  return {
    x: rail.x + index * (bin.width + bin.gap),
    y: rail.y,
    width: bin.width,
    height: bin.height,
  };
}

function ticketRect(index) {
  const board = LAYOUT.board;
  const ticket = LAYOUT.ticket;
  return {
    x: board.x + 16 + index * (ticket.width + ticket.gap) + 190,
    y: board.y + 12,
    width: ticket.width,
    height: ticket.height,
  };
}

export function createInput(canvas, toField) {
  let actions = 0;
  let pending = { add: null, serve: false, remove: false, cycle: false, select: null };

  function addIngredient(id) {
    pending.add = id;
  }

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (CONFIRM.has(event.code)) {
      actions |= ACTION_CONFIRM;
      pending.serve = true;
    } else if (PAUSE.has(event.code)) {
      actions |= ACTION_PAUSE;
    } else if (REMOVE.has(event.code)) {
      pending.remove = true;
    } else if (CYCLE.has(event.code)) {
      pending.cycle = true;
      event.preventDefault();
      return;
    } else if (event.code.startsWith('Digit')) {
      const index = Number(event.code.slice(5)) - 1;
      if (index >= 0 && index < INGREDIENTS.length) addIngredient(INGREDIENTS[index].id);
      else return;
    } else if (event.code.startsWith('Numpad')) {
      const index = Number(event.code.slice(6)) - 1;
      if (index >= 0 && index < INGREDIENTS.length) addIngredient(INGREDIENTS[index].id);
      else return;
    } else {
      return;
    }
    event.preventDefault();
  });

  canvas.addEventListener('pointerdown', (event) => {
    const point = toField(event.clientX, event.clientY);
    if (point === null) return;
    actions |= ACTION_CONFIRM;
    for (let index = 0; index < INGREDIENTS.length; index += 1) {
      if (inRect(point.x, point.y, binRect(index))) {
        addIngredient(INGREDIENTS[index].id);
        return;
      }
    }
    for (let index = 0; index < 3; index += 1) {
      if (inRect(point.x, point.y, ticketRect(index))) {
        pending.select = index;
        return;
      }
    }
    if (inRect(point.x, point.y, LAYOUT.bell)) {
      pending.serve = true;
      return;
    }
    if (inRect(point.x, point.y, LAYOUT.plate)) {
      pending.remove = true;
    }
  });

  return {
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The game actions queued since the last call (ingredient, serve, ...). */
    takeGameActions() {
      const taken = pending;
      pending = { add: null, serve: false, remove: false, cycle: false, select: null };
      return taken;
    },
  };
}
