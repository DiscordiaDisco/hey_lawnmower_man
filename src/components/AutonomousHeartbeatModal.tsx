import React, { useState } from 'react';
import {
  AutonomousActionPoolItem,
  AutonomousHeartbeatConfig,
  DEFAULT_AUTONOMOUS_ACTIONS,
  PulseActivityLogItem,
} from '../utils/workbenchLogic';

interface AutonomousHeartbeatModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AutonomousHeartbeatConfig;
  onUpdateConfig: (next: AutonomousHeartbeatConfig) => void;
  activityLog: PulseActivityLogItem[];
  onClearLog: () => void;
  onFirePulseNow: () => Promise<void>;
  isFiringNow: boolean;
  currentIdleCountdown: string;
  idleMinutes: number;
  sessionPulseCount: number;
}

const PRESET_MINUTES = [2, 5, 10, 15, 30, 60];
const ACTION_COUNT_OPTIONS = [1, 2, 3, 4, 5];
const MAX_PULSES_OPTIONS = [1, 2, 3, 5, 10];

export const AutonomousHeartbeatModal: React.FC<AutonomousHeartbeatModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  activityLog,
  onClearLog,
  onFirePulseNow,
  isFiringNow,
  currentIdleCountdown,
  idleMinutes,
  sessionPulseCount,
}) => {
  const [customActionName, setCustomActionName] = useState('');
  const [customActionDesc, setCustomActionDesc] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  if (!isOpen) return null;

  const handleToggleEnabled = () => {
    onUpdateConfig({
      ...config,
      enabled: !config.enabled,
    });
  };

  const handleSetMinutes = (mins: number) => {
    const clamped = Math.max(1, Math.min(240, mins));
    onUpdateConfig({
      ...config,
      idleMinutes: clamped,
    });
  };

  const handleSetRepeatMode = (mode: 'once_per_idle' | 'repeat_interval') => {
    onUpdateConfig({
      ...config,
      repeatMode: mode,
    });
  };

  const handleSetMaxPulses = (count: number) => {
    onUpdateConfig({
      ...config,
      maxPulsesPerSession: count,
    });
  };

  const handleSetMaxActions = (count: number) => {
    onUpdateConfig({
      ...config,
      maxActionsPerPulse: count,
    });
  };

  const handleToggleActionItem = (itemId: string) => {
    const nextPool = config.actionPool.map((item) =>
      item.id === itemId ? { ...item, enabled: !item.enabled } : item
    );
    onUpdateConfig({
      ...config,
      actionPool: nextPool,
    });
  };

  const handleDeleteCustomAction = (itemId: string) => {
    const nextPool = config.actionPool.filter((item) => item.id !== itemId);
    onUpdateConfig({
      ...config,
      actionPool: nextPool,
    });
  };

  const handleAddCustomAction = (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanName = customActionName.trim();
    if (!cleanName) return;

    const newItem: AutonomousActionPoolItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: `✨ ${cleanName}`,
      description: customActionDesc.trim() || cleanName,
      toolHint: 'custom_directive',
      enabled: true,
      isCustom: true,
    };

    onUpdateConfig({
      ...config,
      actionPool: [...config.actionPool, newItem],
    });

    setCustomActionName('');
    setCustomActionDesc('');
    setIsAddingCustom(false);
  };

  const handleResetActionPool = () => {
    if (!confirm('Reset action pool back to original default actions?')) return;
    onUpdateConfig({
      ...config,
      actionPool: DEFAULT_AUTONOMOUS_ACTIONS,
    });
  };

  const enabledCount = config.actionPool.filter((a) => a.enabled).length;

  return (
    <div
      className="fixed inset-0 z-[75] bg-black/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Autonomous Heartbeat & Sleep-Watch Control Panel"
      data-testid="autonomous-heartbeat-modal"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col rounded-2xl p-3 sm:p-4 space-y-3 bg-[#120d0f]/95 border border-[#c59b47] shadow-2xl">
        {/* Header with Quick ON/OFF Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#6b5331]/60 pb-2 shrink-0">
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-serif font-bold text-[#ffe5a3] flex items-center gap-1.5 truncate">
              <span>💓 Autonomous Heartbeat &amp; Sleep-Watch Control Panel</span>
            </h2>
            <p className="text-[10px] font-mono text-[#cbb693] truncate">
              Argon watches over Hex while idle or sleeping with real autonomous actions.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Master ON/OFF Switch */}
            <button
              type="button"
              onClick={handleToggleEnabled}
              data-testid="heartbeat-modal-master-toggle"
              className={`px-3 py-1 rounded-full text-xs font-mono font-semibold cursor-pointer border transition-all flex items-center gap-1.5 ${
                config.enabled
                  ? 'bg-emerald-950 border-emerald-400 text-emerald-100 shadow-sm ring-1 ring-emerald-400/40'
                  : 'bg-[#22161b] hover:bg-[#2c1d23] border-[#8e6d3b]/80 text-[#a89078]'
              }`}
            >
              <span>{config.enabled ? '💓' : '⏸'}</span>
              <span>{config.enabled ? 'Active / Armed' : 'Heartbeat Paused'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="h-7 px-3 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer shrink-0"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Live Status Bar & Test Pulse Trigger */}
        <div className="p-2.5 rounded-xl bg-[#191114] border border-[#c59b47]/70 space-y-2 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="text-[11px] font-mono font-bold flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    config.enabled ? 'bg-emerald-400 animate-ping' : 'bg-stone-500'
                  }`}
                />
                <span className="text-[#ffe5a3]">
                  {config.enabled
                    ? isFiringNow
                      ? 'Firing Autonomous Pulse Now...'
                      : `Next Pulse In: ${currentIdleCountdown || `${config.idleMinutes}:00`}`
                    : 'Engine Paused (Pill reads "Pulse OFF")'}
                </span>
              </div>
              <div className="text-[10px] font-mono text-[#cbb693] flex flex-wrap items-center gap-2">
                <span>Idle: {idleMinutes}m</span>
                <span>•</span>
                <span>Interval: {config.idleMinutes}m</span>
                <span>•</span>
                <span>
                  Mode:{' '}
                  {config.repeatMode === 'once_per_idle'
                    ? 'Fire Once per Idle Session'
                    : `Repeat (Max ${config.maxPulsesPerSession} / session)`}
                </span>
                <span>•</span>
                <span>Pulses fired: {sessionPulseCount}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void onFirePulseNow()}
              disabled={isFiringNow}
              data-testid="fire-pulse-now-btn"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-40 text-stone-950 font-mono font-bold text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 transition-all"
            >
              <span>{isFiringNow ? '⏳' : '⚡'}</span>
              <span>{isFiringNow ? 'Firing Heartbeat...' : 'Fire Pulse Now (Test)'}</span>
            </button>
          </div>
        </div>

        {/* Section 1: Idle Timer & Session Settings */}
        <div className="p-3 rounded-xl bg-[#150e12] border border-[#8e6d3b]/60 space-y-2.5 shrink-0">
          <h3 className="text-xs font-serif font-bold text-[#ffe5a3] flex items-center gap-1.5">
            <span>⏱️ Inactivity Timer &amp; Repeat Settings</span>
          </h3>

          {/* Idle Minutes Presets + Custom Input */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono text-[#d4b483]">
              Idle Time Before Pulse Fires:
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {PRESET_MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSetMinutes(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold cursor-pointer border transition-all ${
                    config.idleMinutes === m
                      ? 'bg-amber-950 border-amber-400 text-amber-200 ring-1 ring-amber-400/50'
                      : 'bg-[#22161b] hover:bg-[#2c1d23] border-[#6b5331]/60 text-[#cbb693]'
                  }`}
                >
                  {m}m
                </button>
              ))}

              <div className="flex items-center gap-1 ml-auto">
                <span className="text-[10px] font-mono text-[#a89078]">Custom:</span>
                <input
                  type="number"
                  min="1"
                  max="240"
                  value={config.idleMinutes}
                  onChange={(e) => handleSetMinutes(parseInt(e.target.value, 10) || 15)}
                  className="w-16 px-1.5 py-0.5 rounded bg-[#0d090b] border border-[#8e6d3b]/70 text-xs font-mono text-[#ffe5a3] text-center"
                />
                <span className="text-[10px] font-mono text-[#a89078]">min</span>
              </div>
            </div>
          </div>

          {/* Repeat Behavior & Max Pulses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#4a3622]/40">
            <div className="space-y-1">
              <div className="text-[11px] font-mono text-[#d4b483]">Repeat Behavior:</div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSetRepeatMode('once_per_idle')}
                  className={`flex-1 px-2 py-1 rounded-lg text-[10px] font-mono font-medium border text-center cursor-pointer transition-all ${
                    config.repeatMode === 'once_per_idle'
                      ? 'bg-amber-950 border-amber-400 text-amber-100 font-bold'
                      : 'bg-[#22161b] border-[#6b5331]/60 text-[#a89078]'
                  }`}
                >
                  Fire Once per Idle
                </button>
                <button
                  type="button"
                  onClick={() => handleSetRepeatMode('repeat_interval')}
                  className={`flex-1 px-2 py-1 rounded-lg text-[10px] font-mono font-medium border text-center cursor-pointer transition-all ${
                    config.repeatMode === 'repeat_interval'
                      ? 'bg-amber-950 border-amber-400 text-amber-100 font-bold'
                      : 'bg-[#22161b] border-[#6b5331]/60 text-[#a89078]'
                  }`}
                >
                  Repeat Every {config.idleMinutes}m
                </button>
              </div>
            </div>

            {config.repeatMode === 'repeat_interval' && (
              <div className="space-y-1">
                <div className="text-[11px] font-mono text-[#d4b483]">
                  Max Pulses per Sleep Session:
                </div>
                <div className="flex items-center gap-1">
                  {MAX_PULSES_OPTIONS.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleSetMaxPulses(num)}
                      className={`flex-1 px-1.5 py-1 rounded-lg text-[10px] font-mono text-center cursor-pointer border ${
                        config.maxPulsesPerSession === num
                          ? 'bg-amber-950 border-amber-400 text-amber-200 font-bold'
                          : 'bg-[#22161b] border-[#6b5331]/60 text-[#a89078]'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Amount of Actions Per Pulse & Visible Chat Toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#4a3622]/40">
            <div className="space-y-1">
              <div className="text-[11px] font-mono text-[#d4b483]">
                Actions per Pulse (Argon Tool Capacity):
              </div>
              <div className="flex items-center gap-1">
                {ACTION_COUNT_OPTIONS.map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => handleSetMaxActions(cnt)}
                    className={`flex-1 px-2 py-1 rounded-lg text-xs font-mono text-center cursor-pointer border ${
                      config.maxActionsPerPulse === cnt
                        ? 'bg-amber-950 border-amber-400 text-amber-200 font-bold'
                        : 'bg-[#22161b] border-[#6b5331]/60 text-[#a89078]'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-mono text-[#d4b483]">Chat Stream Visibility:</div>
              <label className="flex items-center gap-2 p-1.5 rounded-lg bg-[#0d090b] border border-[#6b5331]/40 cursor-pointer text-[10px] font-mono text-[#ffe5a3]">
                <input
                  type="checkbox"
                  checked={config.allowVisibleChatMessage}
                  onChange={(e) =>
                    onUpdateConfig({
                      ...config,
                      allowVisibleChatMessage: e.target.checked,
                    })
                  }
                  className="accent-[#c59b47]"
                />
                <span>Visible Message Bubble in Chat Stream</span>
              </label>
            </div>
          </div>

          {/* Prevent Screen Sleep / Screen Wake Lock */}
          <div className="pt-1.5 border-t border-[#4a3622]/40">
            <label className="flex items-center gap-2 p-1.5 rounded-lg bg-[#0d090b] border border-[#6b5331]/40 cursor-pointer text-[10px] font-mono text-[#ffe5a3]">
              <input
                type="checkbox"
                checked={Boolean(config.keepScreenAwake)}
                onChange={(e) =>
                  onUpdateConfig({
                    ...config,
                    keepScreenAwake: e.target.checked,
                  })
                }
                className="accent-[#c59b47]"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-[#ffd700]">🔆 Prevent Screen Sleep (Keep Screen Awake)</span>
                <span className="text-[9px] text-[#a89078]">Keeps phone screen awake while Sanctuary is open; when off-screen, background worker continues running unpaused.</span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 2: Editable Action Pool */}
        <div className="p-3 rounded-xl bg-[#150e12] border border-[#8e6d3b]/60 space-y-2.5 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-serif font-bold text-[#ffe5a3] flex items-center gap-1.5">
                <span>🛠️ Editable Action Pool ({enabledCount} / {config.actionPool.length} Enabled)</span>
              </h3>
              <p className="text-[10px] font-mono text-[#cbb693]">
                Argon randomly and contextually selects up to {config.maxActionsPerPulse} enabled actions.
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetActionPool}
              className="text-[10px] font-mono text-[#bba382] hover:text-amber-200 underline cursor-pointer"
            >
              Reset Defaults
            </button>
          </div>

          {/* Action List Checklist */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto overscroll-contain pr-1">
            {config.actionPool.map((item) => (
              <div
                key={item.id}
                className={`p-2 rounded-xl border flex items-start justify-between gap-2.5 transition-all ${
                  item.enabled
                    ? 'bg-[#1e1317] border-[#8e6d3b]/80 text-[#f5ead8]'
                    : 'bg-[#120a0d] border-[#4a3622]/40 text-[#8a7662] opacity-70'
                }`}
              >
                <label className="flex items-start gap-2.5 flex-1 cursor-pointer min-w-0">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={() => handleToggleActionItem(item.id)}
                    className="accent-[#c59b47] mt-0.5 shrink-0"
                  />
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-mono font-bold">{item.name}</span>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/40 border border-current/30 text-[#e6c88c]">
                        {item.toolHint}
                      </span>
                      {item.isCustom && (
                        <span className="text-[8px] font-mono px-1 rounded bg-amber-950 text-amber-300">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-serif-webtoon leading-tight line-clamp-2">
                      {item.description}
                    </div>
                  </div>
                </label>

                {item.isCustom && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomAction(item.id)}
                    title="Delete custom action"
                    className="text-stone-400 hover:text-red-400 p-1 cursor-pointer shrink-0 text-xs"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Custom Action Box */}
          {!isAddingCustom ? (
            <button
              type="button"
              onClick={() => setIsAddingCustom(true)}
              className="w-full py-1.5 rounded-lg border border-dashed border-[#8e6d3b]/70 hover:border-amber-400 text-xs font-mono text-[#ffe5a3] hover:text-white flex items-center justify-center gap-1.5 cursor-pointer bg-[#181013]"
            >
              <span>+</span>
              <span>Add Custom Autonomous Action / Prompt</span>
            </button>
          ) : (
            <form
              onSubmit={handleAddCustomAction}
              className="p-2.5 rounded-xl bg-[#0e090b] border border-amber-500/60 space-y-2"
            >
              <div className="text-[11px] font-mono font-bold text-[#ffe5a3]">
                New Custom Autonomous Action:
              </div>
              <input
                type="text"
                placeholder="Action Name (e.g. Check weather and leave note in Hex's Book)..."
                value={customActionName}
                onChange={(e) => setCustomActionName(e.target.value)}
                className="w-full px-2.5 py-1 rounded-lg bg-[#1a1215] border border-[#8e6d3b]/70 text-xs font-mono text-[#ffe5a3]"
              />
              <input
                type="text"
                placeholder="Detailed instructions or prompt for Argon..."
                value={customActionDesc}
                onChange={(e) => setCustomActionDesc(e.target.value)}
                className="w-full px-2.5 py-1 rounded-lg bg-[#1a1215] border border-[#8e6d3b]/70 text-xs font-mono text-[#ffe5a3]"
              />
              <div className="flex items-center justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCustom(false);
                    setCustomActionName('');
                    setCustomActionDesc('');
                  }}
                  className="px-2.5 py-1 rounded gilded-pill-btn text-xs font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!customActionName.trim()}
                  className="px-3 py-1 rounded gilded-send-btn text-xs font-mono font-bold cursor-pointer disabled:opacity-40"
                >
                  + Add to Action Pool
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Section 3: Recent Pulse Activity Log */}
        <div className="p-3 rounded-xl bg-[#150e12] border border-[#8e6d3b]/60 space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-serif font-bold text-[#ffe5a3] flex items-center gap-1.5">
              <span>📜 Recent Pulse Activity Log (Last 10)</span>
            </h3>

            {activityLog.length > 0 && (
              <button
                type="button"
                onClick={onClearLog}
                className="text-[10px] font-mono text-[#bba382] hover:text-red-300 underline cursor-pointer"
              >
                Clear Log
              </button>
            )}
          </div>

          {activityLog.length === 0 ? (
            <div className="p-3 rounded-lg bg-[#0e090b] border border-[#4a3622]/40 text-center text-[11px] font-mono text-[#8a7662]">
              No autonomous heartbeats have fired yet. Tap &ldquo;⚡ Fire Pulse Now (Test)&rdquo; above to test!
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto overscroll-contain pr-1">
              {activityLog.map((log) => {
                const dateStr = new Date(log.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                return (
                  <div
                    key={log.id}
                    className="p-2 rounded-lg bg-[#0e090b] border border-[#6b5331]/40 space-y-1 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between gap-1 text-[10px] text-[#cbb693]">
                      <span className="font-bold text-[#ffe5a3]">{dateStr}</span>
                      <div className="flex items-center gap-1">
                        <span className={`px-1.5 py-0.2 rounded border text-[9px] ${
                          log.appState === 'off_screen'
                            ? 'bg-purple-950/80 border-purple-400/60 text-purple-200'
                            : 'bg-amber-950/80 border-amber-400/60 text-amber-200'
                        }`}>
                          {log.appState === 'off_screen' ? '🌙 Off-Screen' : '📱 On-Screen'}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-[#201419] border border-[#8e6d3b]/50 text-amber-300">
                          {log.triggerReason} • {log.idleMinutes}m idle
                        </span>
                      </div>
                    </div>

                    {log.toolsExecuted.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1">
                        {log.toolsExecuted.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.2 rounded bg-amber-950/80 border border-amber-400/60 text-[9px] text-amber-200"
                          >
                            ⚙️ {t}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-[11px] font-serif-webtoon text-[#f5ead8] line-clamp-2 italic">
                      &ldquo;{log.summary}&rdquo;
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
