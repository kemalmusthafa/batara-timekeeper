/**
 * Audio utilities using Web Audio API
 * Handles all beep sounds for the timekeeper
 */

let audioContext: AudioContext | null = null;

/**
 * Initialize audio context (must be called on user interaction)
 */
export function initAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play a beep tone
 */
function beep(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine'
): void {
  if (!audioContext) {
    audioContext = initAudioContext();
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}

/**
 * Play racing countdown beep (for 3..2..1 countdown)
 * Like racing game countdown - clear beep
 */
export function beepOnce(): void {
  if (!audioContext) {
    audioContext = initAudioContext();
  }
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 600;
  oscillator.type = 'sine';
  
  // Quick attack and decay like racing countdown
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.05);
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.25);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.25);
}

/**
 * Play racing start sound (green flag / GO sound)
 * Ascending frequency sweep like racing game start - longer and more dramatic
 */
export function beepDouble(): void {
  if (!audioContext) {
    audioContext = initAudioContext();
  }
  
  // First beep - longer ascending sweep (like engine revving)
  const oscillator1 = audioContext.createOscillator();
  const gainNode1 = audioContext.createGain();
  
  oscillator1.connect(gainNode1);
  gainNode1.connect(audioContext.destination);
  
  oscillator1.frequency.setValueAtTime(300, audioContext.currentTime);
  oscillator1.frequency.linearRampToValueAtTime(1500, audioContext.currentTime + 0.5);
  oscillator1.type = 'sawtooth'; // More aggressive sound
  
  gainNode1.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode1.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + 0.1);
  gainNode1.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.3);
  gainNode1.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
  
  oscillator1.start(audioContext.currentTime);
  oscillator1.stop(audioContext.currentTime + 0.5);
  
  // Second beep - longer high pitch beep (GO signal)
  setTimeout(() => {
    if (!audioContext) return;
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();
    
    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);
    
    oscillator2.frequency.value = 1000;
    oscillator2.type = 'square';
    
    gainNode2.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode2.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.05);
    gainNode2.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.2);
    gainNode2.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.35);
    
    oscillator2.start(audioContext.currentTime);
    oscillator2.stop(audioContext.currentTime + 0.35);
  }, 400);
}

/**
 * Play warning triple beep (three quick beeps)
 */
export function beepWarningTriple(): void {
  beep(1000, 0.1);
  setTimeout(() => beep(1000, 0.1), 150);
  setTimeout(() => beep(1000, 0.1), 300);
}

/**
 * Play finish alarm (longer tone, repeated)
 */
export function beepFinishAlarm(): void {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => beep(600, 0.3, 'square'), i * 300);
  }
}

/**
 * Play racing stop/abort sound (screech/brake sound)
 * Longer descending frequency like braking/screeching - more dramatic
 */
export function beepAbortLow(): void {
  if (!audioContext) {
    audioContext = initAudioContext();
  }
  
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  // Longer descending frequency like braking/screeching sound
  oscillator.frequency.setValueAtTime(900, audioContext.currentTime);
  oscillator.frequency.linearRampToValueAtTime(200, audioContext.currentTime + 0.7);
  oscillator.type = 'sawtooth'; // More harsh sound
  
  // Quick attack, longer decay (like screeching to stop)
  gainNode.gain.setValueAtTime(0, audioContext.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.6, audioContext.currentTime + 0.05);
  gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.2);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.7);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.7);
}

/**
 * Check if audio is supported
 */
export function isAudioSupported(): boolean {
  return !!(window.AudioContext || (window as any).webkitAudioContext);
}