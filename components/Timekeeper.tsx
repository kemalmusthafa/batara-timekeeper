'use client';

import { useState, useEffect } from 'react';
import { useCountdownTimekeeper } from '@/hooks/useCountdownTimekeeper';

const ACTIVITY_TYPES = [
  'Loading',
  'Repair',
  'Inspection',
  'Ready',
  'Non-downtime',
  'Downtime',
];

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const milliseconds = Math.floor(ms % 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Timekeeper() {
  const {
    config,
    setConfig,
    stateData,
    sessions,
    audioEnabled,
    startSession,
    pauseSession,
    resumeSession,
    abortSession,
    resetSession,
    toggleMute,
    enableAudio,
    clearHistory,
  } = useCountdownTimekeeper();

  // Dark/Light mode state
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('timekeeper-theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
    }
  }, []);

  // Save theme preference to localStorage
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('timekeeper-theme', newMode ? 'dark' : 'light');
  };

  const getStateBadgeColor = () => {
    const baseColors = {
      idle: isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-500 border-gray-400',
      arming: 'bg-yellow-500 border-yellow-400 shadow-lg shadow-yellow-500/50',
      running: 'bg-green-500 border-green-400 shadow-lg shadow-green-500/50',
      paused: 'bg-orange-500 border-orange-400 shadow-lg shadow-orange-500/50',
      finished: 'bg-blue-500 border-blue-400 shadow-lg shadow-blue-500/50',
      aborted: 'bg-red-600 border-red-400 shadow-lg shadow-red-500/50',
    };
    return baseColors[stateData.state] || baseColors.idle;
  };

  const getTimerColor = () => {
    if (stateData.isWarning) {
      return isDarkMode 
        ? 'text-red-400 drop-shadow-[0_0_20px_rgba(248,113,113,0.8)] animate-pulse'
        : 'text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.6)] animate-pulse';
    }
    
    switch (stateData.state) {
      case 'idle':
        return isDarkMode ? 'text-gray-400' : 'text-gray-600';
      case 'arming':
        return isDarkMode 
          ? 'text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]'
          : 'text-yellow-600 drop-shadow-[0_0_20px_rgba(202,138,4,0.6)]';
      case 'running':
        return isDarkMode 
          ? 'text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.8)]'
          : 'text-green-600 drop-shadow-[0_0_20px_rgba(22,163,74,0.6)]';
      case 'paused':
        return isDarkMode 
          ? 'text-orange-400 drop-shadow-[0_0_20px_rgba(251,146,60,0.8)]'
          : 'text-orange-600 drop-shadow-[0_0_20px_rgba(234,88,12,0.6)]';
      case 'finished':
        return isDarkMode 
          ? 'text-blue-400 drop-shadow-[0_0_20px_rgba(96,165,250,0.8)]'
          : 'text-blue-600 drop-shadow-[0_0_20px_rgba(37,99,235,0.6)]';
      case 'aborted':
        return isDarkMode 
          ? 'text-red-400 drop-shadow-[0_0_20px_rgba(248,113,113,0.8)]'
          : 'text-red-600 drop-shadow-[0_0_20px_rgba(220,38,38,0.6)]';
      default:
        return isDarkMode ? 'text-gray-400' : 'text-gray-600';
    }
  };

  const getStateLabel = () => {
    switch (stateData.state) {
      case 'idle':
        return 'Idle';
      case 'arming':
        return 'Arming';
      case 'running':
        return 'Running';
      case 'paused':
        return 'Paused';
      case 'finished':
        return 'Finished';
      case 'aborted':
        return 'Aborted';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <div className="w-full">
        {/* Header - F1 Style */}
        <div className={`p-3 md:p-4 lg:p-6 border-b ${isDarkMode ? 'border-gray-800 bg-gradient-to-r from-gray-900 to-black' : 'border-gray-200 bg-gradient-to-r from-gray-50 to-white'}`}>
          <div className="flex items-center justify-between gap-2 md:gap-4">
            {/* Logo - Left */}
            <div className="flex items-center flex-shrink-0">
              <img 
                src="/profile.png" 
                alt="Logo" 
                className="h-8 md:h-10 lg:h-12 w-auto object-contain"
              />
            </div>

            {/* Title - Center */}
            <div className="flex-1 text-center min-w-0 px-2 md:px-4">
              <h1 className={`text-sm md:text-lg lg:text-xl xl:text-2xl font-bold mb-0.5 md:mb-1 tracking-wider uppercase truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Timekeeper Countdown
              </h1>
              <p className={`text-[10px] md:text-xs lg:text-sm tracking-wide truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                PT BATARA DHARMA PERSADA
              </p>
            </div>

            {/* Dark Mode Toggle - Right */}
            <div className="flex-shrink-0">
              <button
                onClick={toggleTheme}
                className={`px-2 md:px-3 lg:px-4 py-1.5 md:py-2 border-2 font-bold text-[10px] md:text-xs tracking-wider uppercase transition-all ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
                    : 'bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200'
                }`}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <span className="hidden md:inline">{isDarkMode ? '☀️ Light' : '🌙 Dark'}</span>
                <span className="md:hidden">{isDarkMode ? '☀️' : '🌙'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Timer Display - F1 Style Full Width */}
        <div className={`w-full border-b-4 py-6 md:py-10 lg:py-16 text-center relative overflow-hidden ${
          isDarkMode 
            ? 'bg-gradient-to-b from-gray-900 to-black border-gray-800' 
            : 'bg-gradient-to-b from-gray-50 to-white border-gray-200'
        }`}>
          {/* Grid overlay effect */}
          <div className={`absolute inset-0 ${isDarkMode ? 'opacity-5' : 'opacity-10'}`} style={{
            backgroundImage: isDarkMode
              ? 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)'
              : 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
          
          {/* State Badge - F1 Style */}
          <div className="mb-4 md:mb-6 lg:mb-8 relative z-10">
            <span className={`inline-block px-3 md:px-4 lg:px-6 py-1.5 md:py-2 border-2 text-white font-bold text-[10px] md:text-xs lg:text-sm tracking-wider uppercase ${getStateBadgeColor()}`}>
              {getStateLabel()}
            </span>
            {stateData.isWarning && (
              <span className="ml-2 md:ml-3 inline-block px-3 md:px-4 lg:px-6 py-1.5 md:py-2 border-2 border-red-400 bg-red-600 text-white font-bold animate-pulse text-[10px] md:text-xs lg:text-sm tracking-wider uppercase shadow-lg shadow-red-500/50">
                ⚠ Warning
              </span>
            )}
          </div>

          {/* Timer - F1 Style Large Display */}
          {stateData.state === 'arming' ? (
            <div className={`text-[6rem] sm:text-[8rem] md:text-[12rem] lg:text-[15rem] xl:text-[18rem] font-mono font-black mb-4 md:mb-6 relative z-10 leading-none ${
              isDarkMode
                ? 'text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] md:drop-shadow-[0_0_30px_rgba(250,204,21,0.9)]'
                : 'text-yellow-600 drop-shadow-[0_0_20px_rgba(202,138,4,0.6)] md:drop-shadow-[0_0_30px_rgba(202,138,4,0.7)]'
            }`}>
              {stateData.armingCountdown}
            </div>
          ) : (
            <div className={`text-[5rem] sm:text-[6rem] md:text-[10rem] lg:text-[12rem] xl:text-[16rem] font-mono font-black mb-4 md:mb-6 relative z-10 leading-none ${getTimerColor()}`}>
              {formatTime(stateData.remainingMs)}
            </div>
          )}

          {/* Audio Controls - F1 Style */}
          <div className="flex justify-center gap-2 md:gap-3 mb-4 md:mb-6 relative z-10">
            {!audioEnabled && (
              <button
                onClick={enableAudio}
                className="px-3 md:px-4 lg:px-5 py-1.5 md:py-2 bg-green-600 border-2 border-green-400 text-white hover:bg-green-500 transition-all text-[10px] md:text-xs font-bold tracking-wider uppercase shadow-lg shadow-green-500/50"
              >
                Enable Sound
              </button>
            )}
            {audioEnabled && (
              <button
                onClick={toggleMute}
                className={`px-3 md:px-4 lg:px-5 py-1.5 md:py-2 border-2 transition-all text-[10px] md:text-xs font-bold tracking-wider uppercase shadow-lg ${
                  stateData.mute
                    ? 'bg-gray-700 border-gray-500 text-gray-400 hover:bg-gray-600'
                    : 'bg-blue-600 border-blue-400 text-white hover:bg-blue-500 shadow-blue-500/50'
                }`}
              >
                {stateData.mute ? '🔇 Muted' : '🔊 Sound'}
              </button>
            )}
          </div>

          {/* Control Buttons - F1 Style */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 lg:gap-4 relative z-10 px-2">
            {stateData.state === 'idle' && (
              <button
                onClick={startSession}
                className="px-5 md:px-6 lg:px-8 py-2 md:py-2.5 lg:py-3 bg-green-600 border-2 border-green-400 text-white hover:bg-green-500 transition-all font-bold text-xs md:text-sm lg:text-base tracking-wider uppercase shadow-lg shadow-green-500/50"
              >
                ▶ Start
              </button>
            )}

            {stateData.state === 'running' && (
              <>
                <button
                  onClick={pauseSession}
                  className="px-5 md:px-6 lg:px-8 py-2 md:py-2.5 lg:py-3 bg-orange-600 border-2 border-orange-400 text-white hover:bg-orange-500 transition-all font-bold text-xs md:text-sm tracking-wider uppercase shadow-lg shadow-orange-500/50"
                >
                  ⏸ Pause
                </button>
                <button
                  onClick={abortSession}
                  className="px-5 md:px-6 lg:px-8 py-2 md:py-2.5 lg:py-3 bg-red-600 border-2 border-red-400 text-white hover:bg-red-500 transition-all font-bold text-xs md:text-sm tracking-wider uppercase shadow-lg shadow-red-500/50"
                >
                  ⏹ Stop
                </button>
              </>
            )}

            {stateData.state === 'paused' && (
              <>
                <button
                  onClick={resumeSession}
                  className="px-5 md:px-6 lg:px-8 py-2 md:py-2.5 lg:py-3 bg-green-600 border-2 border-green-400 text-white hover:bg-green-500 transition-all font-bold text-xs md:text-sm tracking-wider uppercase shadow-lg shadow-green-500/50"
                >
                  ▶ Resume
                </button>
                <button
                  onClick={abortSession}
                  className="px-5 md:px-6 lg:px-8 py-2 md:py-2.5 lg:py-3 bg-red-600 border-2 border-red-400 text-white hover:bg-red-500 transition-all font-bold text-xs md:text-sm tracking-wider uppercase shadow-lg shadow-red-500/50"
                >
                  ⏹ Stop
                </button>
              </>
            )}

            {(stateData.state === 'finished' || stateData.state === 'aborted') && (
              <button
                onClick={resetSession}
                className="px-5 md:px-6 lg:px-8 py-2 md:py-2.5 lg:py-3 bg-blue-600 border-2 border-blue-400 text-white hover:bg-blue-500 transition-all font-bold text-xs md:text-sm tracking-wider uppercase shadow-lg shadow-blue-500/50"
              >
                ⟲ Reset
              </button>
            )}

            {stateData.state === 'arming' && (
              <button
                onClick={abortSession}
                className="px-5 md:px-6 lg:px-8 py-2 md:py-2.5 lg:py-3 bg-red-600 border-2 border-red-400 text-white hover:bg-red-500 transition-all font-bold text-xs md:text-sm tracking-wider uppercase shadow-lg shadow-red-500/50"
              >
                ✕ Abort
              </button>
            )}
          </div>
        </div>

        {/* Content Area - F1 Style */}
        <div className={`w-full px-3 md:px-4 lg:px-8 py-4 md:py-6 ${isDarkMode ? 'bg-black' : 'bg-gray-50'}`}>
          <div className="max-w-6xl mx-auto">
            {/* Config Panel - F1 Style */}
            <div className={`border-2 p-3 md:p-4 lg:p-6 mb-4 md:mb-6 ${
              isDarkMode 
                ? 'bg-gray-900 border-gray-700' 
                : 'bg-white border-gray-300 shadow-lg'
            }`}>
          <h2 className={`text-base md:text-lg font-bold mb-3 md:mb-4 tracking-wider uppercase border-b-2 pb-2 ${
            isDarkMode 
              ? 'text-white border-gray-700' 
              : 'text-gray-900 border-gray-300'
          }`}>Session Configuration</h2>
          
          <div className="space-y-4">
            {/* Activity Type */}
            <div>
              <label className={`block text-xs font-bold mb-2 tracking-wide uppercase ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Activity Type
              </label>
              <select
                value={config.activityType}
                onChange={(e) => setConfig({ ...config, activityType: e.target.value })}
                disabled={stateData.state !== 'idle'}
                className={`w-full px-4 py-2 border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed font-mono ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white disabled:bg-gray-950 disabled:border-gray-800 disabled:text-gray-600'
                    : 'bg-white border-gray-300 text-gray-900 disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400'
                }`}
              >
                {ACTIVITY_TYPES.map((type) => (
                  <option key={type} value={type} className={isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-bold mb-2 tracking-wide uppercase ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Minutes
                </label>
                <input
                  type="number"
                  min="0"
                  max="999"
                  value={config.targetMinutes === 0 ? '' : config.targetMinutes}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Remove leading zeros and parse
                    const cleanVal = val.replace(/^0+/, '') || '0';
                    const numVal = parseInt(cleanVal, 10);
                    if (!isNaN(numVal) && numVal >= 0 && numVal <= 999) {
                      setConfig({ ...config, targetMinutes: numVal });
                    } else if (val === '') {
                      setConfig({ ...config, targetMinutes: 0 });
                    }
                  }}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (isNaN(val) || val < 0) {
                      setConfig({ ...config, targetMinutes: 0 });
                    } else if (val > 999) {
                      setConfig({ ...config, targetMinutes: 999 });
                    }
                  }}
                  disabled={stateData.state !== 'idle'}
                  className={`w-full px-4 py-2 border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed font-mono ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white disabled:bg-gray-950 disabled:border-gray-800 disabled:text-gray-600'
                      : 'bg-white border-gray-300 text-gray-900 disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400'
                  }`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold mb-2 tracking-wide uppercase ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Seconds
                </label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={config.targetSeconds === 0 ? '' : config.targetSeconds}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Remove leading zeros and parse
                    const cleanVal = val.replace(/^0+/, '') || '0';
                    const numVal = parseInt(cleanVal, 10);
                    if (!isNaN(numVal) && numVal >= 0 && numVal <= 59) {
                      setConfig({ ...config, targetSeconds: numVal });
                    } else if (val === '') {
                      setConfig({ ...config, targetSeconds: 0 });
                    }
                  }}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (isNaN(val) || val < 0) {
                      setConfig({ ...config, targetSeconds: 0 });
                    } else if (val > 59) {
                      setConfig({ ...config, targetSeconds: 59 });
                    }
                  }}
                  disabled={stateData.state !== 'idle'}
                  className={`w-full px-4 py-2 border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed font-mono ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-600 text-white disabled:bg-gray-950 disabled:border-gray-800 disabled:text-gray-600'
                      : 'bg-white border-gray-300 text-gray-900 disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400'
                  }`}
                />
              </div>
            </div>

            {/* Warning Threshold */}
            <div>
              <label className={`block text-xs font-bold mb-2 tracking-wide uppercase ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Warning Threshold (minutes)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={config.warningThresholdMinutes}
                onChange={(e) => setConfig({ ...config, warningThresholdMinutes: parseInt(e.target.value) || 2 })}
                disabled={stateData.state !== 'idle'}
                className={`w-full px-4 py-2 border-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed font-mono ${
                  isDarkMode
                    ? 'bg-gray-800 border-gray-600 text-white disabled:bg-gray-950 disabled:border-gray-800 disabled:text-gray-600'
                    : 'bg-white border-gray-300 text-gray-900 disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400'
                }`}
              />
            </div>
          </div>
        </div>

            {/* Session History - F1 Style */}
            <div className={`border-2 p-3 md:p-4 lg:p-6 ${
              isDarkMode 
                ? 'bg-gray-900 border-gray-700' 
                : 'bg-white border-gray-300 shadow-lg'
            }`}>
              <div className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-3 md:mb-4 border-b-2 pb-2 md:pb-3 ${
                isDarkMode ? 'border-gray-700' : 'border-gray-300'
              }`}>
                <h2 className={`text-base md:text-lg font-bold tracking-wider uppercase ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Session History (Last 10)</h2>
                {sessions.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="px-3 md:px-4 py-1.5 md:py-2 bg-red-600 border-2 border-red-400 text-white hover:bg-red-500 transition-all text-[10px] md:text-xs font-bold tracking-wider uppercase shadow-lg shadow-red-500/50 self-start sm:self-auto"
                  >
                    Clear
                  </button>
                )}
              </div>

              {sessions.length === 0 ? (
                <p className={`text-center py-6 md:py-8 font-mono text-xs md:text-sm ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>No sessions</p>
              ) : (
                <div className="overflow-x-auto -mx-3 md:mx-0">
                  <table className="w-full text-[10px] md:text-xs lg:text-sm font-mono">
                    <thead>
                      <tr className={`border-b-2 ${
                        isDarkMode ? 'border-gray-700' : 'border-gray-300'
                      }`}>
                        <th className={`text-left py-2 md:py-3 px-2 md:px-3 font-bold tracking-wider uppercase ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Time</th>
                        <th className={`text-left py-2 md:py-3 px-2 md:px-3 font-bold tracking-wider uppercase ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Activity</th>
                        <th className={`text-right py-2 md:py-3 px-2 md:px-3 font-bold tracking-wider uppercase ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Target</th>
                        <th className={`text-center py-2 md:py-3 px-2 md:px-3 font-bold tracking-wider uppercase ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Status</th>
                        <th className={`text-right py-2 md:py-3 px-2 md:px-3 font-bold tracking-wider uppercase ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((session) => (
                        <tr key={session.id} className={`border-b transition-colors ${
                          isDarkMode 
                            ? 'border-gray-800 hover:bg-gray-800' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}>
                          <td className={`py-2 md:py-3 px-2 md:px-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formatDateTime(session.startAt)}</td>
                          <td className={`py-2 md:py-3 px-2 md:px-3 font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{session.activityType}</td>
                          <td className={`py-2 md:py-3 px-2 md:px-3 text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formatDuration(session.targetDurationMs)}</td>
                          <td className="py-2 md:py-3 px-2 md:px-3 text-center">
                            <span className={`inline-block px-2 md:px-3 py-0.5 md:py-1 border-2 text-[10px] md:text-xs font-bold tracking-wider uppercase ${
                              session.status === 'finished' 
                                ? 'bg-green-600 border-green-400 text-white shadow-lg shadow-green-500/50' 
                                : 'bg-red-600 border-red-400 text-white shadow-lg shadow-red-500/50'
                            }`}>
                              {session.status === 'finished' ? '✓' : '✕'}
                            </span>
                          </td>
                          <td className={`py-2 md:py-3 px-2 md:px-3 text-right ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formatDuration(session.effectiveDurationMs)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}