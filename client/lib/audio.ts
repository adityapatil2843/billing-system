/**
 * Synthesizes a crisp POS supermarket barcode scanner beep using Web Audio API
 */
export function playScanBeep() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Classic high frequency barcode scanner tone (around 2400 Hz)
    osc.frequency.setValueAtTime(2400, ctx.currentTime);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    // Quick decay for a crisp snap sound
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.11);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Audio contexts may be blocked if user has not interacted with DOM yet
  }
}

/**
 * Positive double chime for successful checkout
 */
export function playSuccessChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const playNote = (freq: number, delay: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);
      gain.gain.setValueAtTime(0.15, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + dur);
    };

    playNote(523.25, 0, 0.15); // C5
    playNote(659.25, 0.12, 0.2); // E5
    playNote(783.99, 0.24, 0.35); // G5
  } catch {
    // audio failure fallback
  }
}
