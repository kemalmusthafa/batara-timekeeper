/**
 * Custom hook for countdown timekeeper with state machine
 * State: idle -> arming -> running -> paused -> finished/aborted
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { saveSession, getState, saveState, clearState, generateId, getLastSessions, clearSessions, type Session } from '@/utils/storage';
import { 
  beepOnce, 
  beepDouble, 
  beepWarningTriple, 
  beepFinishAlarm, 
  beepAbortLow,
  initAudioContext 
} from '@/utils/audio';

export type TimekeeperState = 'idle' | 'arming' | 'running' | 'paused' | 'finished' | 'aborted';

const ARMING_DURATION = 3000; // 3 seconds
const TICK_INTERVAL = 16; // ~60fps for smooth millisecond display
const PERSIST_INTERVAL = 250; // 250ms for state persistence (less frequent)
const STORAGE_KEY_PREFIX = 'timekeeper_';

interface TimekeeperConfig {
  activityType: string;
  targetMinutes: number;
  targetSeconds: number;
  warningThresholdMinutes: number;
}

interface TimekeeperStateData {
  state: TimekeeperState;
  remainingMs: number;
  armingCountdown: number;
  isWarning: boolean;
  mute: boolean;
}

export function useCountdownTimekeeper() {
  const [config, setConfig] = useState<TimekeeperConfig>({
    activityType: 'Loading',
    targetMinutes: 5,
    targetSeconds: 0,
    warningThresholdMinutes: 2,
  });

  const [stateData, setStateData] = useState<TimekeeperStateData>({
    state: 'idle',
    remainingMs: 0,
    armingCountdown: 0,
    isWarning: false,
    mute: false,
  });

  const [sessions, setSessions] = useState<Session[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(false);

  // Refs for timer management
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const persistIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimestampRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number | null>(null);
  const accumulatedPausedMsRef = useRef<number>(0);
  const armingStartTimestampRef = useRef<number | null>(null);
  const warningTriggeredRef = useRef<boolean>(false);
  const sessionIdRef = useRef<string | null>(null);
  const lastCountdownRef = useRef<number | null>(null);
  const finishAlarmTriggeredRef = useRef<boolean>(false);

  // Calculate target duration in milliseconds
  const targetDurationMs = config.targetMinutes * 60 * 1000 + config.targetSeconds * 1000;
  const warningThresholdMs = config.warningThresholdMinutes * 60 * 1000;

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = getState();
    if (savedState && savedState.state !== 'idle') {
      // Restore state
      setConfig(prev => ({
        ...prev,
        activityType: savedState.activityType || prev.activityType,
      }));
      
      setStateData(prev => ({
        ...prev,
        state: savedState.state as TimekeeperState,
        mute: savedState.mute || false,
      }));

      startTimestampRef.current = savedState.startTimestamp;
      pausedAtRef.current = savedState.pausedAt;
      accumulatedPausedMsRef.current = savedState.accumulatedPausedMs || 0;
      armingStartTimestampRef.current = savedState.armingStartTimestamp;
      warningTriggeredRef.current = savedState.warningTriggered || false;

      // Resume timer if needed
      if (savedState.state === 'running') {
        if (startTimestampRef.current) {
          const now = Date.now();
          const elapsed = now - startTimestampRef.current - accumulatedPausedMsRef.current;
          const remaining = savedState.targetDurationMs - elapsed;

          if (remaining <= 0) {
            // Already finished
            finishSession();
          } else {
            startTimer(savedState.targetDurationMs);
          }
        }
      } else if (savedState.state === 'arming') {
        if (armingStartTimestampRef.current) {
          const elapsed = Date.now() - armingStartTimestampRef.current;
          const remaining = ARMING_DURATION - elapsed;
          
          if (remaining <= 0) {
            transitionToRunning(savedState.targetDurationMs);
          } else {
            startArmingTimer(savedState.targetDurationMs);
          }
        }
      } else if (savedState.state === 'paused') {
        // Keep paused state, don't start timer
      }
    }

    // Load sessions
    loadSessions();
  }, []);

  // Load sessions from storage
  const loadSessions = useCallback(() => {
    setSessions(getLastSessions(10));
  }, []);

  // Save current state to localStorage
  const persistState = useCallback((currentState: TimekeeperState) => {
    const stateToSave = {
      state: currentState,
      activityType: config.activityType,
      targetDurationMs,
      startTimestamp: startTimestampRef.current,
      pausedAt: pausedAtRef.current,
      accumulatedPausedMs: accumulatedPausedMsRef.current,
      armingStartTimestamp: armingStartTimestampRef.current,
      warningTriggered: warningTriggeredRef.current,
      mute: stateData.mute,
    };
    saveState(stateToSave);
  }, [config.activityType, targetDurationMs, stateData.mute]);

  // Cleanup timer
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (persistIntervalRef.current) {
      clearInterval(persistIntervalRef.current);
      persistIntervalRef.current = null;
    }
  }, []);

  // Start arming countdown (3..2..1)
  const startArmingTimer = useCallback((duration: number) => {
    clearTimer();
    armingStartTimestampRef.current = Date.now();
    warningTriggeredRef.current = false;
    finishAlarmTriggeredRef.current = false;
    lastCountdownRef.current = null;

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - (armingStartTimestampRef.current || now);
      const remaining = ARMING_DURATION - elapsed;
      const countdown = Math.ceil(remaining / 1000);

      // Play beep when countdown changes (3, 2, 1)
      if (countdown > 0 && countdown !== lastCountdownRef.current && !stateData.mute && audioEnabled) {
        beepOnce();
        lastCountdownRef.current = countdown;
      }

      if (remaining <= 0) {
        clearTimer();
        transitionToRunning(duration);
      } else {
        setStateData(prev => ({
          ...prev,
          armingCountdown: Math.max(0, countdown),
        }));
      }
    }, 100);
  }, [clearTimer, stateData.mute, audioEnabled]);

  // Finish session
  const finishSession = useCallback(() => {
    clearTimer();
    
    if (startTimestampRef.current && sessionIdRef.current) {
      const endTime = Date.now();
      const effectiveDuration = endTime - startTimestampRef.current - accumulatedPausedMsRef.current;
      const overdueMs = effectiveDuration > targetDurationMs ? effectiveDuration - targetDurationMs : 0;
      
      const session: Session = {
        id: sessionIdRef.current,
        activityType: config.activityType,
        targetDurationMs,
        startAt: startTimestampRef.current,
        endAt: endTime,
        status: 'finished',
        effectiveDurationMs: effectiveDuration,
        overdueMs: overdueMs > 0 ? overdueMs : undefined,
      };

      saveSession(session);
      loadSessions();
    }

    setStateData(prev => ({
      ...prev,
      state: 'finished',
      remainingMs: 0,
      isWarning: false,
    }));

    if (!stateData.mute && audioEnabled) {
      beepFinishAlarm();
    }

    // Reset refs
    startTimestampRef.current = null;
    pausedAtRef.current = null;
    accumulatedPausedMsRef.current = 0;
    armingStartTimestampRef.current = null;
    warningTriggeredRef.current = false;
    finishAlarmTriggeredRef.current = false;
    sessionIdRef.current = null;

    clearState();
  }, [clearTimer, config.activityType, targetDurationMs, stateData.mute, audioEnabled, loadSessions]);

  // Start main countdown timer
  const startTimer = useCallback((duration: number) => {
    clearTimer();
    
    // High frequency interval for smooth display (~60fps)
    intervalRef.current = setInterval(() => {
      if (!startTimestampRef.current) return;

      const now = Date.now();
      const elapsed = now - startTimestampRef.current - accumulatedPausedMsRef.current;
      const remaining = duration - elapsed;

      // Check warning threshold (only once)
      if (!warningTriggeredRef.current && remaining > 0 && remaining <= warningThresholdMs) {
        warningTriggeredRef.current = true;
        setStateData(prev => ({ ...prev, isWarning: true }));
        
        if (!stateData.mute && audioEnabled) {
          beepWarningTriple();
        }
      }

      // Trigger finish alarm when reaching 0 (only once)
      if (!finishAlarmTriggeredRef.current && remaining <= 0) {
        finishAlarmTriggeredRef.current = true;
        if (!stateData.mute && audioEnabled) {
          beepFinishAlarm();
        }
      }

      // Update display - allow negative values to show overdue time
      setStateData(prev => ({
        ...prev,
        remainingMs: remaining,
      }));
    }, TICK_INTERVAL);

    // Lower frequency interval for state persistence
    persistIntervalRef.current = setInterval(() => {
      persistState('running');
    }, PERSIST_INTERVAL);

    persistState('running');
  }, [clearTimer, warningThresholdMs, stateData.mute, audioEnabled, persistState, finishSession]);

  // Transition from arming to running
  const transitionToRunning = useCallback((duration: number) => {
    setStateData(prev => ({ ...prev, state: 'running', armingCountdown: 0 }));
    startTimestampRef.current = Date.now();
    accumulatedPausedMsRef.current = 0;
    pausedAtRef.current = null;
    sessionIdRef.current = generateId();
    
    if (!stateData.mute && audioEnabled) {
      beepDouble();
    }

    startTimer(duration);
  }, [stateData.mute, audioEnabled, startTimer]);

  // Start session
  const startSession = useCallback(() => {
    if (stateData.state !== 'idle') return;
    
    setStateData(prev => ({ ...prev, state: 'arming' }));
    startArmingTimer(targetDurationMs);
    persistState('arming');
  }, [stateData.state, startArmingTimer, targetDurationMs, persistState]);

  // Pause session
  const pauseSession = useCallback(() => {
    if (stateData.state !== 'running') return;
    
    clearTimer();
    pausedAtRef.current = Date.now();
    setStateData(prev => ({ ...prev, state: 'paused' }));
    persistState('paused');
  }, [stateData.state, clearTimer, persistState]);

  // Resume session
  const resumeSession = useCallback(() => {
    if (stateData.state !== 'paused' || !startTimestampRef.current || !pausedAtRef.current) return;

    const now = Date.now();
    accumulatedPausedMsRef.current += now - pausedAtRef.current;
    pausedAtRef.current = null;

    setStateData(prev => ({ ...prev, state: 'running' }));
    
    const nowElapsed = now - startTimestampRef.current - accumulatedPausedMsRef.current;
    const remaining = targetDurationMs - nowElapsed;
    
    if (remaining <= 0) {
      finishSession();
    } else {
      startTimer(targetDurationMs);
    }
  }, [stateData.state, targetDurationMs, startTimer, finishSession]);

  // Abort session
  const abortSession = useCallback(() => {
    if (stateData.state === 'idle' || stateData.state === 'finished') return;

    clearTimer();

    if (startTimestampRef.current && sessionIdRef.current) {
      const endTime = Date.now();
      const effectiveDuration = endTime - startTimestampRef.current - accumulatedPausedMsRef.current;
      const overdueMs = effectiveDuration > targetDurationMs ? effectiveDuration - targetDurationMs : 0;

      const session: Session = {
        id: sessionIdRef.current,
        activityType: config.activityType,
        targetDurationMs,
        startAt: startTimestampRef.current,
        endAt: endTime,
        status: 'aborted',
        effectiveDurationMs: effectiveDuration,
        overdueMs: overdueMs > 0 ? overdueMs : undefined,
      };

      saveSession(session);
      loadSessions();
    }

    setStateData(prev => ({
      ...prev,
      state: 'aborted',
      isWarning: false,
      armingCountdown: 0,
    }));

    if (!stateData.mute && audioEnabled) {
      beepAbortLow();
    }

    // Reset refs
    startTimestampRef.current = null;
    pausedAtRef.current = null;
    accumulatedPausedMsRef.current = 0;
    armingStartTimestampRef.current = null;
    warningTriggeredRef.current = false;
    finishAlarmTriggeredRef.current = false;
    sessionIdRef.current = null;

    clearState();
  }, [stateData.state, clearTimer, config.activityType, targetDurationMs, stateData.mute, audioEnabled, loadSessions]);

  // Reset to idle
  const resetSession = useCallback(() => {
    clearTimer();
    setStateData({
      state: 'idle',
      remainingMs: 0,
      armingCountdown: 0,
      isWarning: false,
      mute: stateData.mute,
    });
    startTimestampRef.current = null;
    pausedAtRef.current = null;
    accumulatedPausedMsRef.current = 0;
    armingStartTimestampRef.current = null;
    warningTriggeredRef.current = false;
    finishAlarmTriggeredRef.current = false;
    sessionIdRef.current = null;
    clearState();
  }, [clearTimer, stateData.mute]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setStateData(prev => {
      const newMute = !prev.mute;
      persistState(stateData.state);
      return { ...prev, mute: newMute };
    });
  }, [stateData.state, persistState]);

  // Enable audio
  const enableAudio = useCallback(() => {
    initAudioContext();
    setAudioEnabled(true);
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    clearSessions();
    loadSessions();
  }, [loadSessions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    config,
    setConfig,
    stateData,
    sessions,
    audioEnabled,
    startSession,
    pauseSession,
    resumeSession,
    abortSession,
    finishSession,
    resetSession,
    toggleMute,
    enableAudio,
    clearHistory,
  };
}