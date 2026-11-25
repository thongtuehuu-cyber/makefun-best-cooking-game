// The screenshot scenes behind ?shot=start|play|serve|end. Each one plays the real
// rules forward from a fresh world for a fixed amount of simulated time, steered by a
// simple autopilot (add the next ingredient the selected order needs, ring the bell
// when the plate is complete), so every frame is what a real game looks like and the
// same seed always gives the same frame.
import { STEP } from './config.js';
import { EVENT_OVER, EVENT_SERVE } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 6;
const PLAY_SECONDS = 60;
const SERVE_SECONDS = 90;
const END_LIMIT_SECONDS = 600;
const ADD_EVERY = 0.9;

/**
 * Set `world` to the named scene (start, play, serve or end; any other name is start)
 * and return the screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'serve' && name !== 'end') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) world.step(STEP, null);
    return { screen: SCREEN_TITLE, best: 0 };
  }

  if (name === 'end') {
    // A cook who never touches the stove: orders expire until the hearts run out.
    for (let index = 0; index < END_LIMIT_SECONDS / STEP; index += 1) {
      if (world.step(STEP, null) & EVENT_OVER) break;
    }
    return { screen: SCREEN_OVER, best: world.state.score };
  }

  // Play and serve both cook for real. The pilot adds one correct layer every
  // ADD_EVERY seconds and rings the bell the moment a plate is complete.
  let addTimer = 1.2;
  const limit = name === 'serve' ? SERVE_SECONDS : PLAY_SECONDS;
  for (let index = 0; index < limit / STEP; index += 1) {
    addTimer -= STEP;
    let actions = null;
    if (addTimer <= 0) {
      addTimer += ADD_EVERY;
      if (world.plateComplete()) actions = { serve: true };
      else {
        const next = world.nextNeeded();
        if (next !== null) actions = { add: next };
      }
    }
    const events = world.step(STEP, actions);
    if (events & EVENT_OVER) break;
    if (name === 'serve' && world.state.served >= 1 && world.plateComplete()) break;
    if (name === 'play' && world.state.served >= 1 && world.state.plate.length >= 2) break;
  }
  return { screen: SCREEN_PLAY, best: world.state.score };
}
