# Sizzle Station — a fast cooking game

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/thongtuehuu-cyber/makefun-best-cooking-game/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/thongtuehuu-cyber/makefun-best-cooking-game/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

A fast, original cooking game: orders land on the chalkboard, you build each dish
layer by layer from the eight ingredient bins — bun, patty, cheese, lettuce, tomato,
egg, fries and sauce — and ring the brass bell to serve before the ticket runs out.
Fast serves earn tips, combos multiply the score, and three lost orders end the shift.

## How to play

- **Click a bin** or press **1–8** to add that ingredient to the plate.
- Build the selected order's recipe **in order** — the next ingredient you need is
  highlighted on the rail and ghosted above the plate.
- **Click the bell** or press **Space / Enter** to serve a finished plate.
- **Backspace** takes the top layer off the plate; **Tab** switches the order ticket;
  **P** pauses.

The grill sizzles, the tickets tick down, and the shift lasts 150 seconds. Serve
fast, keep the combo alive, and don't let three customers walk out.

## Play it

Open `game/index.html` in a desktop browser, or serve it locally:

```sh
node serve.ts
# then open http://localhost:8080
```

No build step, no network at runtime — every file the game loads lives under `game/`.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=758914vc&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
