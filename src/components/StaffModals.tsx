import React, { useState, useRef, useEffect } from 'react';
import {
  ALLOWED_PRESET_MODELS,
  AgentToolPermissions,
  STAFF_AVATAR_PRESETS,
  StaffAgent,
  StaffAvatarPresetId,
  StaffJobDescription,
  TOOL_PERMISSION_DEFINITIONS,
  ToolPermissionCategory,
  ToolPermissionMatrix,
  getPermissionsForEntity,
  loadToolPermissionMatrix,
  normalizePermissionEntityKey,
  resolveStaffStatusIconCoord,
  sanitizeTwentyThreeCharField,
  saveToolPermissionMatrix,
} from '../utils/workbenchLogic';
import { ApothecaryIcon } from './ApothecaryIcon';
import { loadAvatarRepository } from './HouseholdAvatarUploaderModal';

function resolveAgentAvatarCoords(agent: StaffAgent): { xPct: number; yPct: number; label: string } {
  if (agent.avatarPreset) {
    const found = STAFF_AVATAR_PRESETS.find((p) => p.id === agent.avatarPreset);
    if (found) return { xPct: found.xPct, yPct: found.yPct, label: found.label };
  }
  if (agent.id === 'agent-haiku' || agent.name.toLowerCase().includes('haiku')) {
    return { xPct: 50, yPct: 28, label: 'Haiku Puppy Paw Slamming Bell' };
  }
  if (agent.id === 'agent-carbon' || agent.name.toLowerCase().includes('carbon')) {
    return { xPct: 36, yPct: 96, label: 'Carbon (Stressed Intern)' };
  }
  return { xPct: 50, yPct: 52, label: 'Gentleman Mouse' };
}

interface EntityPermissionMenuButtonsProps {
  entityKey: string;
  entityName: string;
  perms: AgentToolPermissions;
  onTogglePerm: (entityKey: string, permKey: ToolPermissionCategory) => void;
}

const EntityPermissionMenuButtons: React.FC<EntityPermissionMenuButtonsProps> = ({
  entityKey,
  entityName,
  perms,
  onTogglePerm,
}) => {
  const [openMenu, setOpenMenu] = useState<'assigned' | 'unassigned' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const assignedList = TOOL_PERMISSION_DEFINITIONS.filter((perm) => Boolean(perms[perm.key]));
  const unassignedList = TOOL_PERMISSION_DEFINITIONS.filter((perm) => !perms[perm.key]);

  // Click outside and Escape key handler for smooth pop-up menu dismissal
  useEffect(() => {
    if (!openMenu) return;

    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenu]);

  return (
    <div ref={containerRef} className="relative space-y-2 pt-1">
      {/* 2 Clean Action Buttons: ASSIGNED and UNASSIGNED */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpenMenu('assigned')}
          data-testid={`perm-assigned-btn-${entityKey}`}
          aria-expanded={openMenu === 'assigned'}
          className="min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-mono font-bold cursor-pointer transition-all flex items-center gap-2 shadow-sm bg-emerald-950/90 hover:bg-emerald-900 border-emerald-500/80 text-emerald-200"
        >
          <span>🟢 ASSIGNED ({assignedList.length})</span>
          <span className="text-[10px]">▾</span>
        </button>

        <button
          type="button"
          onClick={() => setOpenMenu('unassigned')}
          data-testid={`perm-unassigned-btn-${entityKey}`}
          aria-expanded={openMenu === 'unassigned'}
          className="min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-mono font-bold cursor-pointer transition-all flex items-center gap-2 shadow-sm bg-[#181113] hover:bg-[#241a1d] border-[#8e6d3b]/70 text-[#cbb693]"
        >
          <span>⚪ UNASSIGNED ({unassignedList.length})</span>
          <span className="text-[10px]">▾</span>
        </button>
      </div>

      {/* Pop-up Menu Modal with Dark Backdrop */}
      {openMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenMenu(null)}
        >
          <div
            data-testid={`perm-popup-menu-${entityKey}-${openMenu}`}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg p-4 rounded-2xl bg-[#160f14] border-2 border-[#c59b47] shadow-2xl space-y-3.5 relative"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#6b5331]/50 pb-2.5">
              <div className="min-w-0">
                <span className="text-sm font-serif font-bold text-[#ffe5a3] block">
                  {openMenu === 'assigned'
                    ? `🟢 ASSIGNED TOOLS — ${entityName} (${assignedList.length})`
                    : `⚪ UNASSIGNED TOOLS — ${entityName} (${unassignedList.length})`}
                </span>
                <p className="text-[11px] font-mono text-[#cbb693]">
                  {openMenu === 'assigned'
                    ? 'Tap any tool to turn it OFF and move it to Unassigned.'
                    : `Tap any tool to turn it ON and assign it to ${entityName}.`}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {openMenu === 'assigned' && assignedList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      assignedList.forEach((perm) => onTogglePerm(entityKey, perm.key));
                    }}
                    className="h-8 px-2.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-xs font-mono text-red-200 cursor-pointer"
                  >
                    Turn All OFF
                  </button>
                )}
                {openMenu === 'unassigned' && unassignedList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      unassignedList.forEach((perm) => onTogglePerm(entityKey, perm.key));
                    }}
                    className="h-8 px-2.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-xs font-mono text-emerald-200 cursor-pointer"
                  >
                    Turn All ON
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpenMenu(null)}
                  className="h-8 px-3 rounded-full gilded-pill-btn text-xs font-mono font-semibold cursor-pointer"
                >
                  ✕ Done
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto pr-0.5">
              {openMenu === 'assigned' ? (
                assignedList.length === 0 ? (
                  <div className="p-4 text-xs font-mono text-[#cbb693] italic text-center w-full">
                    No tools currently assigned. Switch to UNASSIGNED to assign tools to {entityName}.
                  </div>
                ) : (
                  assignedList.map((perm) => (
                    <button
                      key={`${entityKey}-assigned-${perm.key}`}
                      type="button"
                      onClick={() => onTogglePerm(entityKey, perm.key)}
                      data-testid={`perm-toggle-${entityKey}-${perm.key}`}
                      title={`${perm.label} — ${perm.shortDesc} (Click to turn OFF)`}
                      className="min-h-[46px] px-3.5 py-2 rounded-xl border border-emerald-400/80 bg-emerald-950/90 hover:bg-red-950/90 hover:border-red-400 hover:text-red-200 text-emerald-100 text-xs font-mono cursor-pointer transition-all flex items-center gap-2 group shadow-sm"
                    >
                      <span>{perm.label}</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-900/90 group-hover:bg-red-900/90 text-[10px] font-bold uppercase text-emerald-200 group-hover:text-red-100">
                        ON ✕
                      </span>
                    </button>
                  ))
                )
              ) : unassignedList.length === 0 ? (
                <div className="p-4 text-xs font-mono text-emerald-300 italic text-center w-full">
                  ✓ All tools are currently assigned to {entityName}!
                </div>
              ) : (
                unassignedList.map((perm) => (
                  <button
                    key={`${entityKey}-unassigned-${perm.key}`}
                    type="button"
                    onClick={() => onTogglePerm(entityKey, perm.key)}
                    data-testid={`perm-toggle-${entityKey}-${perm.key}`}
                    title={`${perm.label} — ${perm.shortDesc} (Click to turn ON)`}
                    className="min-h-[46px] px-3.5 py-2 rounded-xl border border-[#6b5331]/60 bg-[#140e11] hover:bg-emerald-950/90 hover:border-emerald-400 hover:text-emerald-100 text-[#a8937b] text-xs font-mono cursor-pointer transition-all flex items-center gap-2 group shadow-sm"
                  >
                    <span>{perm.label}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#241a1e] group-hover:bg-emerald-900/90 text-[10px] font-bold uppercase text-[#cbb693] group-hover:text-emerald-100">
                      + OFF
                    </span>
                  </button>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t border-[#6b5331]/40 pt-2 text-[10px] font-mono text-[#a8937b]">
              <span>Changes take effect immediately for {entityName}.</span>
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === 'assigned' ? 'unassigned' : 'assigned')}
                className="text-[#e6c88c] underline hover:text-white cursor-pointer"
              >
                Switch to {openMenu === 'assigned' ? 'UNASSIGNED' : 'ASSIGNED'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



interface StaffQuartersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStaffStatus: () => void;
  onOpenAvatarUploader?: () => void;
  onOpenGitHubDeploy?: () => void;
  agents: StaffAgent[];
  jobs: StaffJobDescription[];
  onHireAgent: (agent: Omit<StaffAgent, 'id' | 'status'>) => void;
  onUpdateAgent?: (agentId: string, updates: Partial<Omit<StaffAgent, 'id'>>) => void;
  onDeleteAgent: (id: string) => void;
  onOrderInChat: (agent: StaffAgent) => void;
  onAssignJob?: (agentId: string, jobId: string) => void;
  permissionMatrix?: ToolPermissionMatrix;
  onTogglePermission?: (entityKey: string, permKey: ToolPermissionCategory) => void;
}

export const StaffQuartersModal: React.FC<StaffQuartersModalProps> = ({
  isOpen,
  onClose,
  onOpenStaffStatus,
  onOpenAvatarUploader,
  onOpenGitHubDeploy,
  agents,
  jobs,
  onHireAgent,
  onUpdateAgent,
  onDeleteAgent,
  onOrderInChat,
  onAssignJob,
  permissionMatrix,
  onTogglePermission,
}) => {
  const [isHirePopupOpen, setIsHirePopupOpen] = useState(false);
  const [model, setModel] = useState<string>('gemini-3.8-flash');
  const [name, setName] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [assignedJobId, setAssignedJobId] = useState<string>('job-web-scout');
  const [tonePrompt, setTonePrompt] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [avatarPreset, setAvatarPreset] = useState<StaffAvatarPresetId>('gentlemanMouse');
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Staff popup modal states
  const [editingAgent, setEditingAgent] = useState<StaffAgent | null>(null);
  const [editModel, setEditModel] = useState<string>('gemini-3.8-flash');
  const [editName, setEditName] = useState<string>('');
  const [editJobTitle, setEditJobTitle] = useState<string>('');
  const [editAssignedJobId, setEditAssignedJobId] = useState<string>('job-web-scout');
  const [editTonePrompt, setEditTonePrompt] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editAvatarPreset, setEditAvatarPreset] = useState<StaffAvatarPresetId>('gentlemanMouse');
  const [editFormError, setEditFormError] = useState<string | null>(null);

  const [localMatrix, setLocalMatrix] = useState<ToolPermissionMatrix>(() =>
    loadToolPermissionMatrix()
  );

  if (!isOpen) return null;

  const activeMatrix = permissionMatrix || localMatrix;

  const handleTogglePerm = (entityIdOrName: string, permKey: ToolPermissionCategory) => {
    const normKey = normalizePermissionEntityKey(entityIdOrName);
    if (onTogglePermission) {
      onTogglePermission(normKey, permKey);
      return;
    }
    const currentPerms = getPermissionsForEntity(normKey, activeMatrix);
    const updated: ToolPermissionMatrix = {
      ...activeMatrix,
      [normKey]: {
        ...currentPerms,
        [permKey]: !currentPerms[permKey],
      },
    };
    setLocalMatrix(updated);
    saveToolPermissionMatrix(updated);
  };

  const argonPerms = getPermissionsForEntity('argon', activeMatrix);
  const statusIcon = resolveStaffStatusIconCoord(agents);

  const handleStartEditAgent = (agent: StaffAgent) => {
    setEditingAgent(agent);
    setEditModel(agent.model || 'gemini-3.8-flash');
    setEditName(agent.name || '');
    setEditJobTitle(agent.jobTitle || '');
    setEditAssignedJobId(agent.assignedJobId || jobs[0]?.id || 'job-web-scout');
    setEditTonePrompt(agent.tonePrompt || '');
    setEditDescription(agent.description || '');
    setEditAvatarPreset(agent.avatarPreset || 'gentlemanMouse');
    setEditFormError(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;
    const cleanName = sanitizeTwentyThreeCharField(editName.trim());
    const cleanJobTitle = sanitizeTwentyThreeCharField(editJobTitle.trim());
    const cleanTone = editTonePrompt.replace(/\r?\n/g, ' ').trim();

    if (!cleanName) {
      setEditFormError('Staff Name is required (max 23 chars).');
      return;
    }
    if (!cleanJobTitle) {
      setEditFormError('Job Title is required (max 23 chars).');
      return;
    }
    if (!cleanTone) {
      setEditFormError('Roleplay Voice & Demeanor Guide is required.');
      return;
    }

    if (onUpdateAgent) {
      onUpdateAgent(editingAgent.id, {
        name: cleanName,
        jobTitle: cleanJobTitle,
        model: editModel,
        description:
          editDescription.trim() ||
          `${cleanName} (${cleanJobTitle}) working under Argon's command.`,
        tonePrompt: cleanTone,
        assignedJobId: editAssignedJobId || jobs[0]?.id || 'job-web-scout',
        avatarPreset: editAvatarPreset,
      });
    }

    setEditingAgent(null);
    setEditFormError(null);
  };

  const handleHireSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeTwentyThreeCharField(name.trim());
    const cleanJobTitle = sanitizeTwentyThreeCharField(jobTitle.trim());
    const cleanTone = tonePrompt.replace(/\r?\n/g, ' ').trim();

    if (!cleanName) {
      setFormError('Staff Name is required (max 23 chars).');
      return;
    }
    if (!cleanJobTitle) {
      setFormError('Job Title is required (max 23 chars).');
      return;
    }
    if (!cleanTone) {
      setFormError('Roleplay Voice & Demeanor Guide is required.');
      return;
    }

    onHireAgent({
      name: cleanName,
      jobTitle: cleanJobTitle,
      model,
      description:
        description.trim() ||
        `${cleanName} (${cleanJobTitle}) working under Argon's command.`,
      tonePrompt: cleanTone,
      assignedJobId: assignedJobId || jobs[0]?.id || 'job-web-scout',
      avatarPreset,
    });

    setName('');
    setJobTitle('');
    setAssignedJobId('job-web-scout');
    setTonePrompt('');
    setDescription('');
    setAvatarPreset('gentlemanMouse');
    setFormError(null);
    setIsHirePopupOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#110c0a] flex flex-col overflow-x-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Staff Quarters"
    >
      {/* Sticky Top Header Bar */}
      <header className="shrink-0 sticky top-0 z-20 bg-[#1a130f] border-b border-[#8e6d3b]/70 px-2.5 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-1.5">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-2.5 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
          >
            [ ← Back ]
          </button>

          <h2 className="text-xs sm:text-sm font-serif tracking-wider text-[#e6c88c] truncate flex items-center gap-1.5">
            <ApothecaryIcon icon="staffQuarters" xPct={92} yPct={4} size={22} />
            <span>Staff Quarters ({agents.length})</span>
          </h2>

          <div className="flex items-center gap-1 shrink-0">
            {onOpenGitHubDeploy && (
              <button
                type="button"
                onClick={onOpenGitHubDeploy}
                className="h-9 px-2.5 rounded-full gilded-pill-btn text-[11px] font-semibold cursor-pointer whitespace-nowrap flex items-center gap-1 border-[#D4AF37]/80 text-[#ffe5a3] hover:bg-[#D4AF37]/20"
                title="1-Tap GitHub Pages Quick-Fix & Deploy (Zero Confirmation Bleed)"
              >
                <span>🚀 Pages</span>
              </button>
            )}
            {onOpenAvatarUploader && (
              <button
                type="button"
                onClick={onOpenAvatarUploader}
                className="h-9 px-2.5 rounded-full gilded-pill-btn text-[11px] font-semibold cursor-pointer whitespace-nowrap flex items-center gap-1"
                title="Establish or customize entity avatars in Household Avatar Repository"
              >
                <span>🦊 Avatars</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenStaffStatus}
              className="h-9 px-2.5 rounded-full gilded-pill-btn text-[11px] font-semibold cursor-pointer whitespace-nowrap flex items-center gap-1"
            >
              <ApothecaryIcon xPct={statusIcon.xPct} yPct={statusIcon.yPct} size={18} />
              <span>Status</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setIsHirePopupOpen(true);
              }}
              className="h-9 px-3 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              + Hire Staff
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable Staff Roster & Sanctuary Tool Permission Matrix */}
      <main className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 max-w-4xl w-full mx-auto space-y-3">
        <p className="text-xs font-mono text-[#cbb693]">
          Staff agents run on their own assigned Gemini model, execute their enabled Sanctuary tools, and post in their own distinct chat bubble (*actions* &amp; &ldquo;dialogue&rdquo;) without ever merging with Argon&rsquo;s speech.
        </p>

        {/* Argon Lead Sanctuary Tool Permission Matrix Card */}
        <section
          aria-label="Argon Tool Permissions"
          data-testid="argon-permission-matrix-card"
          className="p-3.5 rounded-xl bubble-smoked-glass space-y-2.5 border border-[#e6c88c]/70 bg-[#171014]/90"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xs sm:text-sm font-serif font-bold text-[#ffe5a3]">
                🔐 Sanctuary Tool Permission Matrix — Argon, Haiku &amp; A Monkey
              </h3>
              <p className="text-[11px] font-mono text-[#cbb693]">
                Toggle which Sanctuary tools Argon, Haiku, and A Monkey (plus any hired Staff agent) are allowed to invoke in real time.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#2a1d15] border border-[#c59b47]/60 text-[10px] font-mono text-[#e6c88c]">
              ⚜️ Argon (Lead Sanctuary Host)
            </span>
          </div>

          <EntityPermissionMenuButtons
            entityKey="argon"
            entityName="Argon"
            perms={argonPerms}
            onTogglePerm={handleTogglePerm}
          />
        </section>

        {agents.map((agent) => {
          const assignedJob = jobs.find((j) => j.id === agent.assignedJobId);
          const avatarCoords = resolveAgentAvatarCoords(agent);
          const entityKey = normalizePermissionEntityKey(agent.id || agent.name);
          const agentPerms = getPermissionsForEntity(entityKey, activeMatrix);
          const isBuiltInStaff =
            agent.id === 'agent-haiku' ||
            agent.id === 'agent-monkey' ||
            agent.id === 'agent-carbon' ||
            agent.name.toLowerCase().includes('carbon');

          return (
            <div
              key={agent.id}
              data-testid={`staff-card-${entityKey}`}
              className="p-3.5 rounded-xl bubble-smoked-glass space-y-2 border border-[#c59b47]/60"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex items-start gap-2.5">
                  <div className="w-10 h-10 rounded-full border border-[#c59b47]/70 bg-[#140e0b] flex items-center justify-center shrink-0 overflow-hidden">
                    {(() => {
                      if (agent.avatarPreset?.startsWith('data:image/') || agent.avatarPreset?.startsWith('http')) {
                        return (
                          <img
                            src={agent.avatarPreset}
                            alt={agent.name}
                            className="w-full h-full object-cover"
                          />
                        );
                      }
                      try {
                        const repo = loadAvatarRepository();
                        const repoItem = repo.find(
                          (item) =>
                            item.entityKey === agent.id ||
                            item.entityKey.toLowerCase() === agent.name.toLowerCase() ||
                            item.entityName.toLowerCase() === agent.name.toLowerCase() ||
                            (agent.name.toLowerCase().includes('haiku') &&
                              (item.entityKey.toLowerCase().includes('haiku') ||
                                item.entityName.toLowerCase().includes('haiku')))
                        );
                        if (repoItem?.dataUrl) {
                          return (
                            <img
                              src={repoItem.dataUrl}
                              alt={agent.name}
                              className="w-full h-full object-cover"
                            />
                          );
                        }
                      } catch {
                        // ignore
                      }
                      if (agent.name.toLowerCase().includes('haiku')) {
                        return (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-[#29170e] text-amber-200 select-none">
                            <span className="text-lg leading-none">🐶</span>
                          </div>
                        );
                      }
                      if (agent.name.toLowerCase().includes('monkey')) {
                        return (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-[#181524] text-amber-200 select-none">
                            <span className="text-lg leading-none">🐒</span>
                          </div>
                        );
                      }
                      if (agent.name.toLowerCase().includes('carbon')) {
                        return (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-[#18181f] text-slate-300 select-none" title="Carbon (Stressed Intern)">
                            <span className="text-lg leading-none">📜</span>
                          </div>
                        );
                      }
                      return (
                        <ApothecaryIcon
                          xPct={avatarCoords.xPct}
                          yPct={avatarCoords.yPct}
                          icon="staffStatusActive"
                          size={32}
                          title={avatarCoords.label}
                        />
                      );
                    })()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm sm:text-base font-bold text-[#f5ead8]">
                        {agent.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#2a1d15] border border-[#c59b47]/60 text-[10px] font-mono text-[#e6c88c]">
                        {agent.jobTitle}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#140e0b] border border-[#785c37]/60 text-[10px] font-mono text-[#cbb693]">
                        {agent.model}
                      </span>
                    </div>
                    <p className="text-xs text-[#e6d4b5] mt-1 leading-relaxed">
                      {agent.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEditAgent(agent)}
                    aria-label={`Edit ${agent.name}`}
                    className="h-7 px-2.5 rounded-lg bg-[#2b1d16] hover:bg-[#3d2a1f] border border-[#c59b47]/70 text-[11px] font-mono text-[#ffe5a3] cursor-pointer"
                  >
                    ✎ Edit
                  </button>
                  {!isBuiltInStaff && (
                    <button
                      type="button"
                      onClick={() => onDeleteAgent(agent.id)}
                      aria-label={`Dismiss ${agent.name}`}
                      className="h-7 px-2 rounded bg-red-950/80 border border-red-500/50 text-[11px] font-mono text-red-200 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-[#0d0a0c]/85 border border-[#6b5331]/60 text-xs font-mono space-y-1">
                <div className="text-[10px] text-[#d4b483]">
                  Roleplay Voice &amp; Demeanor Guide (*actions* &amp; &ldquo;speech&rdquo;):
                </div>
                <div className="text-[#f5ead8] italic break-words">
                  {agent.tonePrompt}
                </div>
              </div>

              {/* Per-Agent Tool Permission Matrix Pop-up Menus (ASSIGNED & UNASSIGNED) */}
              <div className="p-2.5 rounded-lg bg-[#140e0c]/90 border border-[#8e6d3b]/50 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-semibold text-[#ffe5a3]">
                    🛠️ {agent.name}&rsquo;s Sanctuary Tool Permissions:
                  </span>
                  <span className="text-[10px] font-mono text-[#cbb693]">
                    Separate Chat Bubble (`sender: &apos;staff&apos;`)
                  </span>
                </div>
                <EntityPermissionMenuButtons
                  entityKey={entityKey}
                  entityName={agent.name}
                  perms={agentPerms}
                  onTogglePerm={handleTogglePerm}
                />
              </div>



              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-[#cbb693]">
                  <label htmlFor={`quarters-job-select-${agent.id}`}>
                    Job Preset:
                  </label>
                  {onAssignJob ? (
                    <select
                      id={`quarters-job-select-${agent.id}`}
                      data-testid={`quarters-job-select-${entityKey}`}
                      value={agent.assignedJobId}
                      onChange={(e) => onAssignJob(agent.id, e.target.value)}
                      className="h-8 px-2 rounded-lg gilded-input-well font-mono text-[11px] text-[#e6c88c]"
                    >
                      {jobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <strong className="text-[#e6c88c]">{assignedJob?.title || 'Unassigned'}</strong>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onOrderInChat(agent)}
                  data-testid={`command-staff-btn-${entityKey}`}
                  className="h-8 px-3 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <ApothecaryIcon icon="staffStatusActive" xPct={50} yPct={28} size={18} />
                  <span>Command {agent.name} in Chat</span>
                </button>
              </div>
            </div>
          );
        })}
      </main>

      {/* "Edit Staff" Popup Modal */}
      {editingAgent && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Edit Staff Popup"
        >
          <div className="w-full max-w-md rounded-2xl gilded-dock-frame p-4 space-y-3.5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-2 border-b border-[#8e6d3b]/50 pb-2">
              <button
                type="button"
                onClick={() => setEditingAgent(null)}
                className="h-8 px-2.5 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer"
              >
                [ ← Cancel ]
              </button>
              <h3 className="text-sm font-serif font-bold text-[#e6c88c]">
                Edit Staff — {editingAgent.name}
              </h3>
              <span className="w-12" />
            </div>

            {editFormError && (
              <div
                role="alert"
                className="p-2.5 rounded-xl bg-red-950/90 border border-red-500/80 text-xs font-mono text-red-200"
              >
                {editFormError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3">
              {/* 0. Staff Avatar Presets */}
              <div>
                <span className="block text-xs font-mono text-[#d4b483] mb-1.5">
                  Staff Avatar Preset
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {STAFF_AVATAR_PRESETS.slice(0, 4).map((preset) => {
                    const isSelected = editAvatarPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setEditAvatarPreset(preset.id)}
                        aria-label={`Select ${preset.label} Avatar`}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#2b1e16] border-[#e6c88c] ring-1 ring-[#e6c88c]'
                            : 'bg-[#120d0a] border-[#6b5331]/60 hover:border-[#c59b47]'
                        }`}
                      >
                        <ApothecaryIcon
                          xPct={preset.xPct}
                          yPct={preset.yPct}
                          size={34}
                          title={preset.label}
                        />
                        <span className="text-[10px] font-mono text-[#f5ead8] text-center leading-tight">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 1. Model Dropdown */}
              <div>
                <label
                  htmlFor="edit-staff-model"
                  className="block text-xs font-mono text-[#d4b483] mb-1"
                >
                  Assigned Gemini Model
                </label>
                <select
                  id="edit-staff-model"
                  value={editModel}
                  onChange={(e) => setEditModel(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl gilded-input-well font-mono text-xs text-[#f5ead8]"
                >
                  {ALLOWED_PRESET_MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Name Text Box (23-character limit) */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-[#d4b483] mb-1">
                  <label htmlFor="edit-staff-name">Name (Max 23 chars)</label>
                  <span>{editName.length}/23</span>
                </div>
                <input
                  id="edit-staff-name"
                  type="text"
                  maxLength={23}
                  value={editName}
                  onChange={(e) => setEditName(sanitizeTwentyThreeCharField(e.target.value))}
                  placeholder="e.g. Haiku, Bambi, Rook"
                  className="w-full h-10 px-3 rounded-xl gilded-input-well font-mono text-xs text-[#f5ead8]"
                />
              </div>

              {/* 3. Job Title Text Box (23-character limit) */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-[#d4b483] mb-1">
                  <label htmlFor="edit-staff-job-title">Job Title (Max 23 chars)</label>
                  <span>{editJobTitle.length}/23</span>
                </div>
                <input
                  id="edit-staff-job-title"
                  type="text"
                  maxLength={23}
                  value={editJobTitle}
                  onChange={(e) => setEditJobTitle(sanitizeTwentyThreeCharField(e.target.value))}
                  placeholder="e.g. Web Scout, Good Boy, Scribe"
                  className="w-full h-10 px-3 rounded-xl gilded-input-well font-mono text-xs text-[#f5ead8]"
                />
              </div>

              {/* 3b. Assigned Job Preset Dropdown */}
              <div>
                <label
                  htmlFor="edit-staff-job-preset"
                  className="block text-xs font-mono text-[#d4b483] mb-1"
                >
                  Job Preset (Pipeline / Web Scout Assignment)
                </label>
                <select
                  id="edit-staff-job-preset"
                  value={editAssignedJobId}
                  onChange={(e) => setEditAssignedJobId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl gilded-input-well font-mono text-xs text-[#f5ead8]"
                >
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} — {job.prompt.slice(0, 42)}…
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Roleplay Voice & Demeanor Guide */}
              <div>
                <label
                  htmlFor="edit-staff-tone"
                  className="block text-xs font-mono text-[#d4b483] mb-1"
                >
                  Roleplay Voice &amp; Demeanor Guide (*actions* &amp; &ldquo;speech&rdquo;)
                </label>
                <input
                  id="edit-staff-tone"
                  type="text"
                  value={editTonePrompt}
                  onChange={(e) => setEditTonePrompt(e.target.value.replace(/\r?\n/g, ' '))}
                  placeholder="Eager, loyal demeanor..."
                  className="w-full h-10 px-3 rounded-xl gilded-input-well font-mono text-xs text-[#f5ead8]"
                />
              </div>

              {/* 5. Visual / Persona Description */}
              <div>
                <label
                  htmlFor="edit-staff-desc"
                  className="block text-xs font-mono text-[#d4b483] mb-1"
                >
                  Visual / Persona Description
                </label>
                <input
                  id="edit-staff-desc"
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Loyal assistant waiting for Argon's pipeline orders..."
                  className="w-full h-10 px-3 rounded-xl gilded-input-well font-mono text-xs text-[#f5ead8]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAgent(null)}
                  className="h-10 px-4 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* "Hire Staff" Create Agent Popup Modal */}
      {isHirePopupOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Hire Staff Popup"
        >
          <div className="w-full max-w-md rounded-2xl gilded-dock-frame p-4 space-y-3.5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-2 border-b border-[#8e6d3b]/50 pb-2">
              <button
                type="button"
                onClick={() => setIsHirePopupOpen(false)}
                className="h-8 px-2.5 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer"
              >
                [ ← Back ]
              </button>
              <h3 className="text-sm font-serif font-bold text-[#e6c88c]">
                Hire Staff (Create Agent)
              </h3>
              <span className="w-12" />
            </div>

            {formError && (
              <div
                role="alert"
                className="p-2.5 rounded-xl bg-red-950/90 border border-red-500/80 text-xs font-mono text-red-200"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleHireSubmit} className="space-y-3">
              {/* 0. Staff Avatar Presets */}
              <div>
                <span className="block text-xs font-mono text-[#d4b483] mb-1.5">
                  Staff Avatar Preset (Apothecary Sheet 2)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {STAFF_AVATAR_PRESETS.slice(0, 4).map((preset) => {
                    const isSelected = avatarPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setAvatarPreset(preset.id)}
                        aria-label={`Select ${preset.label} Avatar`}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#2b1e16] border-[#e6c88c] ring-1 ring-[#e6c88c]'
                            : 'bg-[#120d0a] border-[#6b5331]/60 hover:border-[#c59b47]'
                        }`}
                      >
                        <ApothecaryIcon
                          xPct={preset.xPct}
                          yPct={preset.yPct}
                          size={34}
                          title={preset.label}
                        />
                        <span className="text-[10px] font-mono text-[#f5ead8] text-center leading-tight">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 1. Model Dropdown */}
              <div>
                <label
                  htmlFor="hire-staff-model"
                  className="block text-xs font-mono text-[#d4b483] mb-1"
                >
                  Assigned Gemini Model
                </label>
                <select
                  id="hire-staff-model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl gilded-input-well font-mono text-xs text-[#f5ead8]"
                >
                  {ALLOWED_PRESET_MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Name Text Box (23-character limit) */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-[#d4b483] mb-1">
                  <label htmlFor="hire-staff-name">Name (Max 23 chars)</label>
                  <span>{name.length}/23</span>
                </div>
                <input
                  id="hire-staff-name"
                  type="text"
                  maxLength={23}
                  value={name}
                  onChange={(e) => setName(sanitizeTwentyThreeCharField(e.target.value))}
                  placeholder="e.g. Haiku, Bambi, Rook"
                  className="w-full h-10 px-3 rounded-xl gilded-input-well font-mono text-xs text-[#f5ead8]"
                />
              </div>

              {/* 3. Job Title Text Box (23-character limit) */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-[#d4b483] mb-1">
                  <label htmlFor="hire-staff-job-title">Job Title (Max 23 chars)</label>
                  <span>{jobTitle.length}/23</span>
                </div>
                <input
                  id="hire-staff-job-title"
                  type="text"
                  maxLength={23}
                  value={jobTitle}
                  onChange={(e) => setJobTitle(sanitizeTwentyThreeCharField(e.target.value))}
                  placeholder="e.g. Web Scout, Good Boy, Scribe"
                  className="w-full h-10 px-3 rounded-xl gilded-input-well font-mono text-xs text-[#f5ead8]"
                />
              </div>

              {/* 3b. Assigned Job Preset Dropdown */}
              <div>
                <label
                  htmlFor="hire-staff-job-preset"
                  className="block text-xs font-mono text-[#d4b483] mb-1"
                >
                  Job Preset (Pipeline / Web Scout Assignment)
                </label>
                <select
                  id="hire-staff-job-preset"
                  value={assignedJobId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setAssignedJobId(nextId);
                    const found = jobs.find((j) => j.id === nextId);
                    if (found && !jobTitle.trim()) {
                      setJobTitle(sanitizeTwentyThreeCharField(found.title));
                    }
                  }}
                  className="w-full h-10 px-3 rounded-xl gilded-input-well font-mono text-xs text-[#f5ead8]"
                >
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} — {job.prompt.slice(0, 42)}…
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Roleplay Voice & Demeanor Guide */}
              <div>
                <label
                  htmlFor="hire-staff-tone"
                  className="block text-xs font-mono text-[#d4b483] mb-1"
                >
                  Roleplay Voice &amp; Demeanor Guide (*actions* &amp; &ldquo;speech&rdquo;)
                </label>
                <input
                  id="hire-staff-tone"
                  type="text"
                  value={tonePrompt}
                  onChange={(e) => setTonePrompt(e.target.value.replace(/\r?\n/g, ' '))}
                  placeholder="Eager, loyal demeanor; uses *italics for actions* and &quot;quotes for speech&quot;"
                  className="w-full h-10 px-3 rounded-xl gilded-input-well font-mono text-xs text-[#f5ead8]"
                />
              </div>

              {/* 5. Character / Appearance Description */}
              <div>
                <label
                  htmlFor="hire-staff-desc"
                  className="block text-xs font-mono text-[#d4b483] mb-1"
                >
                  Visual / Persona Description
                </label>
                <input
                  id="hire-staff-desc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Loyal assistant waiting for Argon's pipeline orders..."
                  className="w-full h-10 px-3 rounded-xl gilded-input-well font-mono text-xs text-[#f5ead8]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHirePopupOpen(false)}
                  className="h-10 px-4 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer"
                >
                  Confirm Hire
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

interface StaffStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStaffQuarters: () => void;
  onOpenGitHubDeploy?: () => void;
  agents: StaffAgent[];
  jobs: StaffJobDescription[];
  onAssignJob: (agentId: string, jobId: string) => void;
  onRunAgentTask: (agentId: string) => Promise<void>;
  onStopAgentTask: (agentId: string) => void;
  onCreateJob: (title: string, prompt: string) => void;
}

export const StaffStatusModal: React.FC<StaffStatusModalProps> = ({
  isOpen,
  onClose,
  onOpenStaffQuarters,
  onOpenGitHubDeploy,
  agents,
  jobs,
  onAssignJob,
  onRunAgentTask,
  onStopAgentTask,
  onCreateJob,
}) => {
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobPrompt, setJobPrompt] = useState('');
  const [jobError, setJobError] = useState<string | null>(null);

  if (!isOpen) return null;

  const statusHeaderIcon = resolveStaffStatusIconCoord(agents);

  const handleSaveJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) {
      setJobError('Job Title is required.');
      return;
    }
    if (!jobPrompt.trim()) {
      setJobError('Job Description Prompt is required.');
      return;
    }
    onCreateJob(jobTitle.trim(), jobPrompt.trim());
    setJobTitle('');
    setJobPrompt('');
    setJobError(null);
    setIsCreateJobOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#110c0a] flex flex-col overflow-x-hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Staff Status & Pipeline Assignments"
    >
      {/* Sticky Top Header Bar */}
      <header className="shrink-0 sticky top-0 z-20 bg-[#1a130f] border-b border-[#8e6d3b]/70 px-2.5 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-1.5">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-2.5 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
          >
            [ ← Back ]
          </button>

          <h2 className="text-xs sm:text-sm font-serif tracking-wider text-[#e6c88c] truncate flex items-center gap-1.5">
            <ApothecaryIcon
              xPct={statusHeaderIcon.xPct}
              yPct={statusHeaderIcon.yPct}
              size={22}
            />
            <span>Staff Status &amp; Pipelines</span>
          </h2>

          <div className="flex items-center gap-1 shrink-0">
            {onOpenGitHubDeploy && (
              <button
                type="button"
                onClick={onOpenGitHubDeploy}
                className="h-9 px-2.5 rounded-full gilded-pill-btn text-[11px] font-semibold cursor-pointer whitespace-nowrap flex items-center gap-1 border-[#D4AF37]/80 text-[#ffe5a3] hover:bg-[#D4AF37]/20"
                title="1-Tap GitHub Pages Quick-Fix & Deploy (Zero Confirmation Bleed)"
              >
                <span>🚀 Pages</span>
              </button>
            )}
            <button
              type="button"
              onClick={onOpenStaffQuarters}
              className="h-9 px-2.5 rounded-full gilded-pill-btn text-[11px] font-semibold cursor-pointer whitespace-nowrap flex items-center gap-1"
            >
              <ApothecaryIcon icon="staffQuarters" xPct={92} yPct={4} size={18} />
              <span>Quarters</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setJobError(null);
                setIsCreateJobOpen(true);
              }}
              className="h-9 px-3 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              + Create Job
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable Staff Assignment & Pipeline Control List */}
      <main className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 max-w-4xl w-full mx-auto space-y-3.5">
        <div className="space-y-2.5">
          {agents.map((agent) => {
            const currentJob = jobs.find((j) => j.id === agent.assignedJobId) || jobs[0];
            const avatarCoords = resolveAgentAvatarCoords(agent);
            return (
              <div
                key={agent.id}
                className="p-3.5 rounded-xl bubble-smoked-glass space-y-2.5 border border-[#c59b47]/60"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <ApothecaryIcon
                      xPct={avatarCoords.xPct}
                      yPct={avatarCoords.yPct}
                      size={24}
                      title={avatarCoords.label}
                    />
                    <span className="text-sm font-bold text-[#f5ead8] truncate">
                      {agent.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#2a1d15] border border-[#c59b47]/50 text-[10px] font-mono text-[#e6c88c]">
                      {agent.jobTitle}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider ${
                      agent.status === 'running'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                        : agent.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                        : agent.status === 'stopped'
                        ? 'bg-red-500/20 text-red-300 border border-red-400/50'
                        : 'bg-[#1f1612] text-[#cbb693] border border-[#785c37]/50'
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>

                {/* Dropdown to Switch Assigned Task */}
                <div>
                  <label
                    htmlFor={`staff-job-select-${agent.id}`}
                    className="block text-[11px] font-mono text-[#d4b483] mb-1"
                  >
                    Assigned Pipeline Task (Job Description):
                  </label>
                  <select
                    id={`staff-job-select-${agent.id}`}
                    value={agent.assignedJobId}
                    onChange={(e) => onAssignJob(agent.id, e.target.value)}
                    className="w-full h-9 px-2.5 rounded-xl gilded-input-well font-mono text-xs text-[#f5ead8]"
                  >
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title} — {job.prompt.slice(0, 48)}…
                      </option>
                    ))}
                  </select>
                </div>

                {currentJob && (
                  <div className="p-2 rounded-lg bg-[#0d0a0c]/80 border border-[#594327]/50 text-[11px] font-mono text-[#cbb693]">
                    <strong className="text-[#e6c88c]">Prompt:</strong> {currentJob.prompt}
                  </div>
                )}

                {agent.lastOutput && (
                  <div className="p-2.5 rounded-lg bg-[#140e0b]/95 border border-[#8e6d3b]/50 text-xs font-mono text-[#f5ead8] whitespace-pre-wrap break-words">
                    {agent.lastOutput}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onStopAgentTask(agent.id)}
                    className="h-8 px-3 rounded-full gilded-pill-btn text-xs font-mono cursor-pointer"
                  >
                    ■ Stop Task
                  </button>
                  <button
                    type="button"
                    disabled={agent.status === 'running'}
                    onClick={() => onRunAgentTask(agent.id)}
                    className="h-8 px-3.5 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {agent.status === 'running' ? 'Running…' : '▶ Run Task in Chat'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Job Descriptions Library */}
        <section className="pt-2 space-y-2">
          <h3 className="text-xs font-mono uppercase tracking-wider text-[#d4b483]">
            Available Job Descriptions ({jobs.length})
          </h3>
          <div className="space-y-2">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="p-2.5 rounded-xl bg-[#16100d]/90 border border-[#6b5331]/60 text-xs font-mono"
              >
                <div className="font-bold text-[#e6c88c]">{job.title}</div>
                <div className="text-[#cbb693] mt-0.5 break-words">{job.prompt}</div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* "Create Job" Popup Modal */}
      {isCreateJobOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Create Job Description"
        >
          <div className="w-full max-w-md rounded-2xl gilded-dock-frame p-4 space-y-3.5">
            <div className="flex items-center justify-between gap-2 border-b border-[#8e6d3b]/50 pb-2">
              <button
                type="button"
                onClick={() => setIsCreateJobOpen(false)}
                className="h-8 px-2.5 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer"
              >
                [ ← Back ]
              </button>
              <h3 className="text-sm font-serif font-bold text-[#e6c88c]">
                Create Job Description
              </h3>
              <span className="w-12" />
            </div>

            {jobError && (
              <div
                role="alert"
                className="p-2.5 rounded-xl bg-red-950/90 border border-red-500/80 text-xs font-mono text-red-200"
              >
                {jobError}
              </div>
            )}

            <form onSubmit={handleSaveJob} className="space-y-3">
              <div>
                <label
                  htmlFor="new-job-title-input"
                  className="block text-xs font-mono text-[#d4b483] mb-1"
                >
                  Job Title
                </label>
                <input
                  id="new-job-title-input"
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. DeepSeek Formatter, Telemetry Check"
                  className="w-full h-10 px-3 rounded-xl gilded-input-well font-mono text-xs text-[#f5ead8]"
                />
              </div>

              <div>
                <label
                  htmlFor="new-job-prompt-input"
                  className="block text-xs font-mono text-[#d4b483] mb-1"
                >
                  Job Description Prompt (Task Instructions for Staff Agent)
                </label>
                <textarea
                  id="new-job-prompt-input"
                  rows={5}
                  value={jobPrompt}
                  onChange={(e) => setJobPrompt(e.target.value)}
                  placeholder="Enter the exact pipeline task instructions to assign to staff agents..."
                  className="w-full p-3 rounded-xl gilded-input-well font-mono text-xs text-[#f5ead8]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreateJobOpen(false)}
                  className="h-10 px-4 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer"
                >
                  Save Job Description
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
