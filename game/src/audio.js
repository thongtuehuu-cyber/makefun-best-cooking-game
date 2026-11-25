// All sound is synthesised with the Web Audio API — no audio files, no network.
// The context is created on the first user gesture; screenshot scenes stay silent.
export function createAudio() {
  let context = null;

  function ensure() {
    if (context !== null) return context;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    } catch {
      context = null;
    }
    return context;
  }

  function tone(freq, dur, type, gain, when) {
    const ctx = ensure();
    if (ctx === null) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, ctx.currentTime + when);
    amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + dur);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(ctx.currentTime + when);
    osc.stop(ctx.currentTime + when + dur + 0.02);
  }

  return {
    /** Call from any real key press or click so the context is allowed to start. */
    unlock() {
      ensure();
    },
    add() {
      tone(520, 0.09, 'triangle', 0.12, 0);
      tone(780, 0.08, 'triangle', 0.1, 0.05);
    },
    wrong() {
      tone(160, 0.16, 'sawtooth', 0.08, 0);
      tone(110, 0.2, 'sawtooth', 0.07, 0.08);
    },
    serve() {
      tone(880, 0.12, 'sine', 0.14, 0);
      tone(1174, 0.16, 'sine', 0.14, 0.1);
      tone(1568, 0.22, 'sine', 0.12, 0.2);
    },
    expire() {
      tone(220, 0.25, 'square', 0.06, 0);
      tone(174, 0.35, 'square', 0.06, 0.18);
    },
    tick() {
      tone(980, 0.05, 'square', 0.05, 0);
    },
    start() {
      tone(523, 0.1, 'triangle', 0.12, 0);
      tone(659, 0.1, 'triangle', 0.12, 0.09);
      tone(784, 0.18, 'triangle', 0.12, 0.18);
    },
  };
}
