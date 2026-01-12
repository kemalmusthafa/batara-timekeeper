/**
 * LocalStorage utilities for session history and state persistence
 */

export interface Session {
  id: string;
  activityType: string;
  targetDurationMs: number;
  startAt: number;
  endAt: number;
  status: 'finished' | 'aborted';
  effectiveDurationMs: number;
  overdueMs?: number; // Waktu telat dalam milliseconds (jika melebihi target)
}

export interface PersistedState {
  state: string;
  activityType: string;
  targetDurationMs: number;
  startTimestamp: number | null;
  pausedAt: number | null;
  accumulatedPausedMs: number;
  armingStartTimestamp: number | null;
  warningTriggered: boolean;
  mute: boolean;
}

const SESSIONS_KEY = 'timekeeper_sessions';
const STATE_KEY = 'timekeeper_state';
const MAX_SESSIONS = 100;

/**
 * Save session to history
 */
export function saveSession(session: Session): void {
  try {
    const existing = getSessions();
    const updated = [session, ...existing].slice(0, MAX_SESSIONS);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save session:', error);
  }
}

/**
 * Get all sessions from history
 */
export function getSessions(): Session[] {
  try {
    const data = localStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get sessions:', error);
    return [];
  }
}

/**
 * Get last N sessions
 */
export function getLastSessions(count: number = 10): Session[] {
  return getSessions().slice(0, count);
}

/**
 * Clear all sessions
 */
export function clearSessions(): void {
  try {
    localStorage.removeItem(SESSIONS_KEY);
  } catch (error) {
    console.error('Failed to clear sessions:', error);
  }
}

/**
 * Save current state
 */
export function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}

/**
 * Get saved state
 */
export function getState(): PersistedState | null {
  try {
    const data = localStorage.getItem(STATE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get state:', error);
    return null;
  }
}

/**
 * Clear saved state
 */
export function clearState(): void {
  try {
    localStorage.removeItem(STATE_KEY);
  } catch (error) {
    console.error('Failed to clear state:', error);
  }
}

/**
 * Generate simple UUID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}