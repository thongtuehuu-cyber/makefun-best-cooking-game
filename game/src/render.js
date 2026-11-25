// Drawing only: the world's state and the current screen in, pixels out. The 1280x720
// playfield is scaled to fit the window and centred, the margin filled with the backdrop
// colour. Everything is drawn with canvas shapes — a tiled kitchen wall, the chalkboard
// order board, a grill with live flames, the plate stack, the brass serve bell and the
// eight ingredient bins. Text that holds a number is rebuilt only when it changes.
import { FIELD, FONT, HEARTS, INGREDIENTS, INGREDIENT_BY_ID, LAYOUT, PALETTE, SHIFT_SECONDS } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const PANEL = { width: 640, top: 150, line: 34, bottom: 78 };
const BIN = LAYOUT.bin;
const TICKET = LAYOUT.ticket;

function cachedLabel(prefix) {
  let value = null;
  let text = '';
  return function label(next) {
    if (next !== value) {
      value = next;
      text = prefix + next;
    }
    return text;
  };
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const scoreLabel = cachedLabel('Score ');
  const comboLabel = cachedLabel('Combo x');
  const bestLabel = cachedLabel('Best ');
  const finalLabel = cachedLabel('Score ');
  const servedLabel = cachedLabel('Served ');
  const timeLabel = cachedLabel('');

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align, baseline) {
    if (!fonts.has(size)) fonts.set(size, `bold ${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = baseline || 'alphabetic';
    context.fillText(value, x, y);
  }

  function plainText(value, x, y, size, color, align, baseline) {
    if (!fonts.has('p' + size)) fonts.set('p' + size, `${size}px ${FONT}`);
    context.font = fonts.get('p' + size);
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = baseline || 'alphabetic';
    context.fillText(value, x, y);
  }

  // ---- ingredients ---------------------------------------------------------
  // Each draws inside the box (x, y, width, height). `variant` is 'top' or
  // 'bottom' for a bun on the plate stack; bins and tickets use the plain icon.
  function drawIngredient(id, x, y, width, height, variant) {
    const item = INGREDIENT_BY_ID[id];
    const cx = x + width / 2;
    const mid = y + height / 2;
    context.save();
    if (id === 'bun') {
      if (variant === 'bottom') {
        context.fillStyle = item.color;
        roundRect(context, x + 2, y + height * 0.35, width - 4, height * 0.6, height * 0.25);
        context.fill();
      } else {
        context.fillStyle = item.color;
        context.beginPath();
        context.moveTo(x + 2, y + height * 0.75);
        context.quadraticCurveTo(cx, y - height * 0.35, x + width - 2, y + height * 0.75);
        context.closePath();
        context.fill();
        context.fillStyle = '#fff3d6';
        for (const [sx, sy] of [[-0.22, 0.28], [0.05, 0.12], [0.26, 0.32], [-0.05, 0.42], [0.18, 0.5]]) {
          context.beginPath();
          context.ellipse(cx + sx * width, y + sy * height, width * 0.045, height * 0.06, 0.4, 0, Math.PI * 2);
          context.fill();
        }
      }
    } else if (id === 'patty') {
      context.fillStyle = item.color;
      roundRect(context, x + 1, mid - height * 0.28, width - 2, height * 0.56, height * 0.22);
      context.fill();
      context.fillStyle = item.dark;
      for (let i = 0; i < 4; i += 1) {
        context.beginPath();
        context.arc(x + width * (0.2 + i * 0.2), mid + height * 0.1, width * 0.04, 0, Math.PI * 2);
        context.fill();
      }
    } else if (id === 'cheese') {
      context.fillStyle = item.color;
      context.beginPath();
      context.moveTo(x + 2, y + height * 0.15);
      context.lineTo(x + width - 2, y + height * 0.15);
      context.lineTo(x + width - 2, y + height * 0.7);
      context.lineTo(x + width * 0.72, y + height * 0.95);
      context.lineTo(x + width * 0.55, y + height * 0.68);
      context.lineTo(x + width * 0.38, y + height * 0.92);
      context.lineTo(x + width * 0.2, y + height * 0.68);
      context.lineTo(x + 2, y + height * 0.7);
      context.closePath();
      context.fill();
    } else if (id === 'lettuce') {
      context.fillStyle = item.color;
      context.beginPath();
      context.moveTo(x + 2, mid);
      for (let i = 0; i <= 6; i += 1) {
        const px = x + 2 + (i / 6) * (width - 4);
        const py = mid + (i % 2 === 0 ? -height * 0.22 : height * 0.22);
        context.lineTo(px, py);
      }
      context.lineTo(x + width - 2, mid + height * 0.18);
      context.lineTo(x + 2, mid + height * 0.18);
      context.closePath();
      context.fill();
    } else if (id === 'tomato') {
      context.fillStyle = item.color;
      context.beginPath();
      context.ellipse(cx, mid, width * 0.46, height * 0.3, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#f28b82';
      context.beginPath();
      context.ellipse(cx, mid - height * 0.08, width * 0.3, height * 0.14, 0, 0, Math.PI * 2);
      context.fill();
    } else if (id === 'egg') {
      context.fillStyle = item.color;
      context.beginPath();
      context.ellipse(cx, mid, width * 0.46, height * 0.32, 0, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = item.dark;
      context.beginPath();
      context.arc(cx, mid, height * 0.2, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#ffd54f';
      context.beginPath();
      context.arc(cx - height * 0.03, mid - height * 0.03, height * 0.13, 0, Math.PI * 2);
      context.fill();
    } else if (id === 'fries') {
      context.fillStyle = '#d23c2e';
      context.beginPath();
      context.moveTo(x + width * 0.14, y + height * 0.35);
      context.lineTo(x + width * 0.86, y + height * 0.35);
      context.lineTo(x + width * 0.78, y + height * 0.95);
      context.lineTo(x + width * 0.22, y + height * 0.95);
      context.closePath();
      context.fill();
      context.fillStyle = item.color;
      for (let i = 0; i < 4; i += 1) {
        const fx = x + width * (0.24 + i * 0.17);
        context.fillRect(fx, y + height * 0.05, width * 0.1, height * 0.5);
      }
    } else if (id === 'sauce') {
      context.fillStyle = item.color;
      context.beginPath();
      context.moveTo(x + width * 0.1, y + height * 0.3);
      context.bezierCurveTo(cx - width * 0.3, y + height * 0.05, cx + width * 0.2, y + height * 0.55, x + width * 0.3, y + height * 0.32);
      context.bezierCurveTo(cx + width * 0.35, y + height * 0.6, cx - width * 0.1, y + height * 0.85, x + width * 0.55, y + height * 0.62);
      context.bezierCurveTo(cx + width * 0.45, y + height * 0.85, cx - width * 0.35, y + height * 0.95, x + width * 0.85, y + height * 0.78);
      context.lineTo(x + width * 0.9, y + height * 0.92);
      context.lineTo(x + width * 0.08, y + height * 0.92);
      context.closePath();
      context.fill();
    }
    context.restore();
  }

  // ---- kitchen -------------------------------------------------------------
  function drawWall(state) {
    context.fillStyle = PALETTE.wall;
    context.fillRect(0, LAYOUT.kitchen.y, FIELD.width, 232);
    context.fillStyle = PALETTE.wallTile;
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 16; col += 1) {
        if ((row + col) % 2 === 0) context.fillRect(col * 80 + (row % 2) * 40 - 40, LAYOUT.kitchen.y + row * 58, 78, 56);
      }
    }
    // Window with a sunny street outside.
    context.fillStyle = '#7ec8e3';
    roundRect(context, 420, 218, 180, 96, 10);
    context.fill();
    context.fillStyle = '#fff6e6';
    context.fillRect(505, 218, 10, 96);
    context.fillRect(420, 262, 180, 10);
    context.fillStyle = '#f2c94c';
    context.beginPath();
    context.arc(462, 246, 16, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#7bc043';
    context.fillRect(420, 296, 180, 18);
    // Chef portrait on the wall.
    context.fillStyle = '#fff6e6';
    context.beginPath();
    context.arc(1150, 268, 44, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#f2c9a0';
    context.beginPath();
    context.arc(1150, 276, 26, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(1140, 248, 14, 0, Math.PI * 2);
    context.arc(1150, 240, 16, 0, Math.PI * 2);
    context.arc(1160, 248, 14, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#2b2018';
    context.beginPath();
    context.arc(1142, 274, 3, 0, Math.PI * 2);
    context.arc(1158, 274, 3, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#2b2018';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(1150, 282, 9, 0.15 * Math.PI, 0.85 * Math.PI);
    context.stroke();
    plainText('CHEF', 1150, 330, 13, PALETTE.text, 'center');
  }

  function drawGrill(state) {
    const grill = LAYOUT.grill;
    context.fillStyle = '#3a3f4a';
    roundRect(context, grill.x, grill.y, grill.width, grill.height, 12);
    context.fill();
    context.fillStyle = '#22252c';
    context.fillRect(grill.x + 12, grill.y + 12, grill.width - 24, 34);
    // Live flames, flickering with the shift clock.
    const t = state.elapsed * 6;
    for (let i = 0; i < 5; i += 1) {
      const fx = grill.x + 34 + i * 46;
      const flame = 16 + 7 * Math.sin(t + i * 1.7);
      context.fillStyle = i % 2 === 0 ? '#ff8c42' : '#f2c94c';
      context.beginPath();
      context.moveTo(fx - 13, grill.y + 46);
      context.quadraticCurveTo(fx - 6, grill.y + 46 - flame, fx, grill.y + 46 - flame - 8);
      context.quadraticCurveTo(fx + 6, grill.y + 46 - flame, fx + 13, grill.y + 46);
      context.closePath();
      context.fill();
    }
    // A patty sizzling on the grate.
    context.fillStyle = '#7a4a2b';
    roundRect(context, grill.x + 96, grill.y + 58, 68, 22, 9);
    context.fill();
    context.fillStyle = '#5a3420';
    context.beginPath();
    context.arc(grill.x + 118, grill.y + 66, 3, 0, Math.PI * 2);
    context.arc(grill.x + 140, grill.y + 70, 3, 0, Math.PI * 2);
    context.fill();
    plainText('GRILL', grill.x + grill.width / 2, grill.y + grill.height - 8, 13, '#cbb693', 'center');
  }

  function drawBell(state) {
    const bell = LAYOUT.bell;
    const glow = state.bellGlow;
    if (glow > 0) {
      context.fillStyle = `rgba(242, 201, 76, ${0.25 + 0.35 * glow})`;
      context.beginPath();
      context.arc(bell.x + bell.width / 2, bell.y + 52, 74, 0, Math.PI * 2);
      context.fill();
    }
    context.fillStyle = '#8a5a2b';
    roundRect(context, bell.x + 8, bell.y + 78, bell.width - 16, 12, 6);
    context.fill();
    context.fillStyle = PALETTE.bell;
    context.beginPath();
    context.moveTo(bell.x + 22, bell.y + 78);
    context.quadraticCurveTo(bell.x + bell.width / 2, bell.y - 6, bell.x + bell.width - 22, bell.y + 78);
    context.closePath();
    context.fill();
    context.fillStyle = '#c9972a';
    context.fillRect(bell.x + bell.width / 2 - 4, bell.y + 6, 8, 10);
    context.fillStyle = '#fff3d6';
    context.beginPath();
    context.ellipse(bell.x + bell.width / 2 - 18, bell.y + 34, 10, 16, -0.5, 0, Math.PI * 2);
    context.fill();
    plainText(glow > 0 ? 'RING IT!' : 'SERVE', bell.x + bell.width / 2, bell.y + bell.height - 6, 14, glow > 0 ? PALETTE.gold : PALETTE.muted, 'center');
  }

  function drawPlate(state) {
    const plate = LAYOUT.plate;
    const cx = plate.x + plate.width / 2;
    const baseY = plate.y + plate.height - 14;
    // The plate itself.
    context.fillStyle = '#e8e2d4';
    context.beginPath();
    context.ellipse(cx, baseY, 116, 18, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#c9c0aa';
    context.beginPath();
    context.ellipse(cx, baseY - 2, 92, 12, 0, 0, Math.PI * 2);
    context.fill();
    // The stack, bottom layer first, each layer a little narrower as it rises.
    const stack = state.plate;
    const layerH = 20;
    for (let i = 0; i < stack.length; i += 1) {
      const id = stack[i];
      const shrink = i * 2;
      const ly = baseY - 14 - (i + 1) * layerH;
      const variant = id === 'bun' ? (i === 0 ? 'bottom' : 'top') : null;
      drawIngredient(id, cx - 78 + shrink, ly, 156 - shrink * 2, layerH + 8, variant);
    }
    // Ghost of the next ingredient the order needs.
    const order = state.orders[state.selected];
    if (order && stack.length < order.dish.recipe.length) {
      const next = order.dish.recipe[stack.length];
      const gy = baseY - 14 - (stack.length + 1) * layerH;
      context.globalAlpha = 0.35 + 0.15 * Math.sin(state.elapsed * 4);
      drawIngredient(next, cx - 78, gy, 156, layerH + 8, next === 'bun' ? 'top' : null);
      context.globalAlpha = 1;
    }
    if (stack.length === 0) {
      plainText('Your plate — pick ingredients below', cx, baseY - 44, 15, PALETTE.muted, 'center');
    }
  }

  // ---- order board ---------------------------------------------------------
  function drawBoard(state) {
    const board = LAYOUT.board;
    context.fillStyle = PALETTE.boardFrame;
    roundRect(context, board.x - 6, board.y - 6, board.width + 12, board.height + 12, 12);
    context.fill();
    context.fillStyle = PALETTE.board;
    roundRect(context, board.x, board.y, board.width, board.height, 8);
    context.fill();
    text('ORDER BOARD', board.x + 16, board.y + 26, 20, '#f2c94c', 'left');
    plainText('click a ticket to cook it', board.x + 16, board.y + board.height - 14, 13, '#9db8a6', 'left');
    for (let slot = 0; slot < 3; slot += 1) {
      const ticket = {
        x: board.x + 16 + slot * (TICKET.width + TICKET.gap) + 190,
        y: board.y + 12,
        width: TICKET.width,
        height: TICKET.height,
      };
      const order = state.orders[slot];
      const selected = slot === state.selected && order;
      context.fillStyle = selected ? '#fff6e6' : '#e8e2d4';
      roundRect(context, ticket.x, ticket.y, ticket.width, ticket.height, 10);
      context.fill();
      if (selected) {
        context.strokeStyle = PALETTE.gold;
        context.lineWidth = 4;
        roundRect(context, ticket.x, ticket.y, ticket.width, ticket.height, 10);
        context.stroke();
      }
      if (!order) {
        plainText('— waiting for the next customer —', ticket.x + ticket.width / 2, ticket.y + 58, 15, '#9a8f7a', 'center');
        continue;
      }
      const urgent = order.timer <= 5;
      text(order.dish.name, ticket.x + 14, ticket.y + 26, 19, '#2b2018', 'left');
      text(`${Math.ceil(order.timer)}s`, ticket.x + ticket.width - 14, ticket.y + 26, 19, urgent ? PALETTE.red : '#2b2018', 'right');
      // Recipe icons in order; done ones get a green tick.
      const iconW = 30;
      const startX = ticket.x + 14;
      for (let i = 0; i < order.dish.recipe.length; i += 1) {
        const ix = startX + i * (iconW + 6);
        const done = i < state.plate.length && selected;
        drawIngredient(order.dish.recipe[i], ix, ticket.y + 44, iconW, 26, order.dish.recipe[i] === 'bun' ? (i === 0 ? 'bottom' : 'top') : null);
        if (done) {
          context.fillStyle = PALETTE.green;
          context.beginPath();
          context.arc(ix + iconW - 4, ticket.y + 44, 9, 0, Math.PI * 2);
          context.fill();
          context.strokeStyle = '#ffffff';
          context.lineWidth = 2.5;
          context.beginPath();
          context.moveTo(ix + iconW - 8, ticket.y + 44);
          context.lineTo(ix + iconW - 5, ticket.y + 47);
          context.lineTo(ix + iconW + 1, ticket.y + 39);
          context.stroke();
        }
      }
      // Countdown bar.
      const barW = ticket.width - 28;
      context.fillStyle = '#d8d0bd';
      roundRect(context, ticket.x + 14, ticket.y + 84, barW, 10, 5);
      context.fill();
      const frac = Math.max(0, order.timer / order.maxTimer);
      context.fillStyle = urgent ? PALETTE.red : PALETTE.green;
      roundRect(context, ticket.x + 14, ticket.y + 84, barW * frac, 10, 5);
      context.fill();
    }
  }

  // ---- ingredient rail ------------------------------------------------------
  function drawRail(state) {
    const rail = LAYOUT.rail;
    context.fillStyle = PALETTE.rail;
    roundRect(context, rail.x, rail.y, rail.width, rail.height, 12);
    context.fill();
    text('INGREDIENTS', rail.x + 16, rail.y + 28, 18, PALETTE.gold, 'left');
    const order = state.orders[state.selected];
    const next = order && state.plate.length < order.dish.recipe.length
      ? order.dish.recipe[state.plate.length]
      : null;
    for (let index = 0; index < INGREDIENTS.length; index += 1) {
      const item = INGREDIENTS[index];
      const bin = {
        x: rail.x + 16 + index * (BIN.width + BIN.gap),
        y: rail.y + 36,
        width: BIN.width,
        height: BIN.height - 10,
      };
      const isNext = item.id === next;
      context.fillStyle = isNext ? '#fff6e6' : '#57432e';
      roundRect(context, bin.x, bin.y, bin.width, bin.height, 10);
      context.fill();
      if (isNext) {
        context.strokeStyle = PALETTE.gold;
        context.lineWidth = 3;
        roundRect(context, bin.x, bin.y, bin.width, bin.height, 10);
        context.stroke();
      }
      drawIngredient(item.id, bin.x + 22, bin.y + 14, bin.width - 44, 62, item.id === 'bun' ? 'top' : null);
      text(item.name, bin.x + bin.width / 2, bin.y + bin.height - 34, 17, isNext ? '#2b2018' : PALETTE.text, 'center');
      plainText(`[${item.key}]`, bin.x + bin.width / 2, bin.y + bin.height - 12, 13, isNext ? '#8a5a2b' : PALETTE.muted, 'center');
    }
  }

  function drawHeart(x, y, size, filled) {
    context.fillStyle = filled ? PALETTE.red : '#57432e';
    context.beginPath();
    context.moveTo(x, y + size * 0.9);
    context.bezierCurveTo(x - size * 1.2, y, x - size * 0.5, y - size * 0.9, x, y - size * 0.25);
    context.bezierCurveTo(x + size * 0.5, y - size * 0.9, x + size * 1.2, y, x, y + size * 0.9);
    context.fill();
  }

  // ---- HUD ------------------------------------------------------------------
  function drawHud(state, best) {
    const hud = LAYOUT.hud;
    context.fillStyle = PALETTE.panel;
    context.fillRect(hud.x, hud.y, hud.width, hud.height);
    text('SIZZLE STATION', 24, 38, 26, PALETTE.gold, 'left');
    text(scoreLabel(state.score), 330, 38, 24, PALETTE.text, 'left');
    if (state.combo >= 2) text(comboLabel(state.combo), 520, 38, 24, PALETTE.green, 'left');
    const minutes = Math.floor(state.shiftLeft / 60);
    const seconds = Math.floor(state.shiftLeft % 60);
    const clock = `${minutes}:${String(seconds).padStart(2, '0')}`;
    text(timeLabel(`TIME ${clock}`), 700, 38, 24, state.shiftLeft <= 30 ? PALETTE.red : PALETTE.text, 'left');
    text(servedLabel(state.served), 880, 38, 24, PALETTE.text, 'left');
    for (let i = 0; i < HEARTS; i += 1) {
      drawHeart(1060 + i * 34, 28, 11, i < state.hearts);
    }
    text(bestLabel(best), 1240, 38, 20, PALETTE.muted, 'right');
  }

  function drawCounter(state) {
    context.fillStyle = PALETTE.counter;
    context.fillRect(0, LAYOUT.counterTopY, FIELD.width, 34);
    context.fillStyle = PALETTE.counterTop;
    context.fillRect(0, LAYOUT.counterTopY, FIELD.width, 10);
    context.fillStyle = '#2b2018';
    context.fillRect(0, LAYOUT.counterTopY + 34, FIELD.width, 16);
    const order = state.orders[state.selected];
    if (order && state.plate.length === order.dish.recipe.length) {
      const pulse = 1 + 0.04 * Math.sin(state.elapsed * 6);
      context.save();
      context.translate(640, 300);
      context.scale(pulse, pulse);
      text('READY TO SERVE — RING THE BELL!', 0, 0, 28, PALETTE.gold, 'center');
      context.restore();
    }
    if (state.serveCheer > 0) {
      // The last serve's cheer, drawn under the plate for a couple of seconds.
      plainText(`+${state.lastServePoints}  ${state.lastServeName} served!`, 640, 470, 16, PALETTE.green, 'center');
    }
  }

  function drawHint() {
    const hint = LAYOUT.hint;
    plainText(
      '1–8 add ingredient   •   Space / click the bell to serve   •   Backspace removes the top layer   •   Tab switches order   •   P pauses',
      hint.x + hint.width / 2, hint.y + 24, 15, PALETTE.muted, 'center',
    );
  }

  function drawPanel(title, lines, prompt) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = 'rgba(20, 12, 6, 0.72)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.panel;
    roundRect(context, x, y, PANEL.width, height, 16);
    context.fill();
    context.strokeStyle = PALETTE.gold;
    context.lineWidth = 3;
    roundRect(context, x, y, PANEL.width, height, 16);
    context.stroke();
    text(title, FIELD.width / 2, y + 78, 46, PALETTE.gold, 'center');
    for (let index = 0; index < lines.length; index += 1) {
      plainText(lines[index], FIELD.width / 2, y + PANEL.top + index * PANEL.line, 21, PALETTE.muted, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 36, 23, PALETTE.gold, 'center');
  }

  const TITLE_LINES = [
    'Orders land on the board — build each dish in order,',
    'ring the bell before the ticket runs out.',
    'Fast serves earn tips. Three lost orders end the day.',
    '',
  ];
  const PAUSED_LINES = ['The grill is holding. The tickets are waiting.'];

  /** Paint one frame: kitchen, board, plate, rail, HUD — then a panel for the screen. */
  function draw(state, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    const shakeX = state.shake > 0 ? Math.sin(state.elapsed * 55) * state.shake * 14 : 0;
    context.setTransform(view.scale, 0, 0, view.scale, view.x + shakeX * view.scale, view.y);
    drawWall(state);
    drawBoard(state);
    drawGrill(state);
    drawPlate(state);
    drawBell(state);
    drawCounter(state);
    drawRail(state);
    drawHud(state, best);
    drawHint();
    if (state.flash > 0) {
      context.fillStyle = `rgba(229, 83, 75, ${state.flash * 0.28})`;
      context.fillRect(0, 0, FIELD.width, FIELD.height);
    }
    if (screen === SCREEN_TITLE) {
      TITLE_LINES[3] = bestLabel(best);
      drawPanel('SIZZLE STATION', TITLE_LINES, 'Press Space or click to start the shift');
      return;
    }
    if (screen === SCREEN_PAUSED) {
      drawPanel('Paused', PAUSED_LINES, 'Press P to get back to the stove');
      return;
    }
    if (screen === SCREEN_OVER) {
      const lines = [
        finalLabel(state.score),
        bestLabel(best),
        `Dishes served: ${state.served}   •   Best combo x${state.bestCombo}   •   Orders lost: ${state.lost}`,
        state.overReason,
        '',
      ];
      drawPanel('Shift Over', lines, 'Press Space or click to work another shift');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return {
    draw,
    /** Map a client (mouse) point into playfield coordinates. */
    toField(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * FIELD.width;
      const y = ((clientY - rect.top) / rect.height) * FIELD.height;
      if (x < 0 || y < 0 || x > FIELD.width || y > FIELD.height) return null;
      return { x, y };
    },
  };
}
