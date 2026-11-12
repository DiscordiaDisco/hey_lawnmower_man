import React, { useState, useEffect } from 'react';
import {
  Globe,
  GitBranch,
  Rocket,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  FileCode,
  Terminal,
  X,
  Zap,
  ArrowRight,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { executeGithubApi } from '../services/gemini';

interface GitHubPagesDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  githubToken?: string;
  onOrderInChat?: (message: string) => void;
  onRunStaffTask?: (agentId: string, jobName: string, prompt: string) => void;
}

interface PagesStatusResult {
  ok: boolean;
  status?: number;
  enabled?: boolean;
  html_url?: string | null;
  cname?: string | null;
  branch?: string | null;
  path?: string | null;
  message?: string;
  pages?: Record<string, unknown> | null;
  build?: {
    status?: string;
    commit?: string;
    updated_at?: string;
    error?: { message?: string };
  } | null;
  steps?: Array<{ step: string; ok: boolean; detail?: string }>;
}

export const GitHubPagesDeployModal: React.FC<GitHubPagesDeployModalProps> = ({
  isOpen,
  onClose,
  githubToken = '',
  onOrderInChat,
  onRunStaffTask,
}) => {
  const [repoInput, setRepoInput] = useState<string>(() => {
    return localStorage.getItem('argon_quickdeploy_repo') || 'DiscordiaDisco/hey_lawnmower_man';
  });
  const [branch, setBranch] = useState<string>('main');
  const [deployPath, setDeployPath] = useState<string>('/');
  const [customCname, setCustomCname] = useState<string>(() => {
    return localStorage.getItem('argon_quickdeploy_cname') || '';
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusResult, setStatusResult] = useState<PagesStatusResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Quick 1-Shot File Commit Sub-drawer
  const [showCommitDrawer, setShowCommitDrawer] = useState<boolean>(false);
  const [quickFilePath, setQuickFilePath] = useState<string>('index.html');
  const [quickFileContent, setQuickFileContent] = useState<string>('');
  const [quickCommitMsg, setQuickCommitMsg] = useState<string>('Update via 1-shot quick deploy');

  useEffect(() => {
    if (isOpen && repoInput.trim()) {
      void fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const parseOwnerAndRepo = (): { owner: string; repo: string } | null => {
    const clean = repoInput.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '');
    const parts = clean.split('/').filter(Boolean);
    if (parts.length === 2) {
      return { owner: parts[0], repo: parts[1] };
    }
    return null;
  };

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    window.setTimeout(() => setSuccessToast(null), 3500);
  };

  const fetchStatus = async () => {
    const parsed = parseOwnerAndRepo();
    if (!parsed) {
      setErrorMessage('Please enter a valid owner/repository (e.g. DiscordiaDisco/hey_lawnmower_man).');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);

    try {
      localStorage.setItem('argon_quickdeploy_repo', repoInput.trim());
      const res = await fetch('/api/github/pages-quick-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-github-token': githubToken.trim(),
        },
        body: JSON.stringify({
          owner: parsed.owner,
          repo: parsed.repo,
          action: 'status',
          token: githubToken.trim(),
        }),
      });

      const data = (await res.json()) as PagesStatusResult;
      setStatusResult(data);
      if (data.cname && !customCname) {
        setCustomCname(data.cname);
      }
      if (data.branch) {
        setBranch(data.branch);
      }
      if (data.path) {
        setDeployPath(data.path);
      }
    } catch (err) {
      // Fallback direct execution using client executeGithubApi
      try {
        const ghRes = await executeGithubApi({
          endpoint: `/repos/${parsed.owner}/${parsed.repo}/pages`,
          method: 'GET',
          token: githubToken,
        });
        if (ghRes.ok && ghRes.data) {
          const p = ghRes.data as Record<string, unknown>;
          setStatusResult({
            ok: true,
            enabled: true,
            html_url: (p.html_url as string) || null,
            cname: (p.cname as string) || null,
            branch: ((p.source as { branch?: string })?.branch as string) || 'main',
            path: ((p.source as { path?: string })?.path as string) || '/',
            pages: p,
          });
        } else {
          setStatusResult({
            ok: false,
            enabled: false,
            message: ghRes.error || 'GitHub Pages not enabled on this repo.',
          });
        }
      } catch (clientErr) {
        setErrorMessage(clientErr instanceof Error ? clientErr.message : String(clientErr));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handle1TapQuickDeploy = async () => {
    const parsed = parseOwnerAndRepo();
    if (!parsed) {
      setErrorMessage('Please enter a valid owner/repository.');
      return;
    }
    setErrorMessage(null);
    setIsLoading(true);

    try {
      localStorage.setItem('argon_quickdeploy_repo', repoInput.trim());
      if (customCname.trim()) {
        localStorage.setItem('argon_quickdeploy_cname', customCname.trim());
      }

      const res = await fetch('/api/github/pages-quick-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-github-token': githubToken.trim(),
        },
        body: JSON.stringify({
          owner: parsed.owner,
          repo: parsed.repo,
          action: 'full_deploy',
          branch: branch.trim() || 'main',
          path: deployPath.trim() || '/',
          cname: customCname.trim() || '',
          token: githubToken.trim(),
        }),
      });

      const data = (await res.json()) as PagesStatusResult;
      setStatusResult(data);
      if (data.ok) {
        showNotification('🚀 GitHub Pages deployed & configured in 1 tap!');
      } else {
        setErrorMessage(data.message || 'Quick deploy encountered an issue.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handle1ShotCommit = async () => {
    const parsed = parseOwnerAndRepo();
    if (!parsed) {
      setErrorMessage('Please enter a valid owner/repository.');
      return;
    }
    if (!quickFilePath.trim()) {
      setErrorMessage('Target file path is required.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/github/pages-quick-fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-github-token': githubToken.trim(),
        },
        body: JSON.stringify({
          owner: parsed.owner,
          repo: parsed.repo,
          action: 'commit_file',
          branch: branch.trim() || 'main',
          filePath: quickFilePath.trim(),
          fileContent: quickFileContent,
          commitMessage: quickCommitMsg.trim() || `Update ${quickFilePath} via quick fix`,
          token: githubToken.trim(),
        }),
      });

      const data = (await res.json()) as { ok: boolean; path?: string; sha?: string; error?: string };
      if (data.ok) {
        showNotification(`✓ 1-shot committed ${data.path || quickFilePath} without SHA conflicts!`);
        setShowCommitDrawer(false);
      } else {
        setErrorMessage(data.error || '1-shot commit failed.');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelegateToFlash = () => {
    const parsed = parseOwnerAndRepo();
    const repoStr = parsed ? `${parsed.owner}/${parsed.repo}` : repoInput.trim();
    const taskPrompt = `Deploy and configure GitHub Pages for repository "${repoStr}" on branch "${branch}" (path "${deployPath}")${
      customCname.trim() ? ` with custom CNAME "${customCname.trim()}"` : ''
    }. Execute the entire inspection and deployment pipeline in a single turn using your 1-shot github_api tools on Flash tokens.`;

    if (onRunStaffTask) {
      onRunStaffTask('agent-haiku', 'GitHub Pages & Deploy', taskPrompt);
      showNotification('🐾 Dispatched 1-tap deploy pipeline to Haiku (Flash)!');
      onClose();
    } else if (onOrderInChat) {
      onOrderInChat(
        `🐾 Haiku, please run the "GitHub Pages & Deploy" pipeline on "${repoStr}" (branch: ${branch}, path: ${deployPath}${
          customCname.trim() ? `, CNAME: ${customCname.trim()}` : ''
        }) in a single pass on Flash tokens!`
      );
      showNotification('🐾 Dispatched command to Haiku in chat!');
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#161215]/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="GitHub Pages and Repo Quick Deploy"
    >
      <div className="w-full max-w-md my-auto rounded-2xl bg-[#161215] border border-[#D4AF37]/50 shadow-2xl p-4 sm:p-5 space-y-4 text-[#f5ead8] relative overflow-hidden">
        {/* Subtle Pearlescent Pale-Rose Ambient Glow */}
        <div
          className="absolute -top-24 -right-24 w-48 h-48 rounded-full pointer-events-none blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #E6A8B5 0%, #D4AF37 100%)' }}
        />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#D4AF37]/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E6A8B5]/10 border border-[#E6A8B5]/40 flex items-center justify-center text-[#E6A8B5]">
              <Rocket className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-serif font-bold text-[#ffe5a3] flex items-center gap-1.5">
                <span>GitHub Pages Quick-Deploy</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] font-mono">
                  1-Tap
                </span>
              </h3>
              <p className="text-[11px] font-mono text-[#cbb693]">
                Zero confirmation bleed · Cheap Flash execution
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#E6A8B5]/15 text-[#cbb693] hover:text-[#ffe5a3] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notifications & Error Banners */}
        {successToast && (
          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/60 text-red-200 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Repository Input Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-[#ffe5a3] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
              Repository (owner/repo)
            </span>
            <button
              type="button"
              onClick={fetchStatus}
              disabled={isLoading}
              className="text-[11px] text-[#E6A8B5] hover:text-[#ffe5a3] flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Inspect</span>
            </button>
          </label>
          <input
            type="text"
            value={repoInput}
            onChange={(e) => setRepoInput(e.target.value)}
            placeholder="DiscordiaDisco/hey_lawnmower_man"
            className="w-full h-11 px-3 rounded-xl bg-[#120e11] border border-[#D4AF37]/40 text-sm font-mono text-[#f5ead8] focus:outline-none focus:border-[#D4AF37] transition-colors"
          />
        </div>

        {/* Branch & Source Path Controls */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-[#cbb693] flex items-center gap-1">
              <GitBranch className="w-3 h-3 text-[#D4AF37]" />
              Branch
            </label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full h-10 px-2.5 rounded-xl bg-[#120e11] border border-[#D4AF37]/40 text-xs font-mono text-[#f5ead8] focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="main">main</option>
              <option value="gh-pages">gh-pages</option>
              <option value="master">master</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-[#cbb693] flex items-center gap-1">
              <FileCode className="w-3 h-3 text-[#D4AF37]" />
              Source Folder
            </label>
            <select
              value={deployPath}
              onChange={(e) => setDeployPath(e.target.value)}
              className="w-full h-10 px-2.5 rounded-xl bg-[#120e11] border border-[#D4AF37]/40 text-xs font-mono text-[#f5ead8] focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="/">/ (root)</option>
              <option value="/docs">/docs</option>
            </select>
          </div>
        </div>

        {/* Custom CNAME Domain */}
        <div className="space-y-1">
          <label className="text-[11px] font-mono text-[#cbb693] flex items-center justify-between">
            <span>Custom CNAME Domain (Optional)</span>
            <span className="text-[10px] text-[#E6A8B5]/80">1-shot CNAME file upsert</span>
          </label>
          <input
            type="text"
            value={customCname}
            onChange={(e) => setCustomCname(e.target.value)}
            placeholder="hex.linkin.love or sub.domain.com"
            className="w-full h-10 px-3 rounded-xl bg-[#120e11] border border-[#D4AF37]/30 text-xs font-mono text-[#f5ead8] focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        {/* Live Status Card */}
        {statusResult && (
          <div className="p-3 rounded-xl bg-[#E6A8B5]/5 border border-[#D4AF37]/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#cbb693] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                Pages Status:
              </span>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  statusResult.enabled
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                    : 'bg-amber-950/80 text-amber-300 border border-amber-500/50'
                }`}
              >
                {statusResult.enabled ? '● Active' : '○ Not Enabled'}
              </span>
            </div>

            {statusResult.html_url && (
              <div className="pt-1 flex items-center justify-between gap-2 overflow-hidden">
                <a
                  href={statusResult.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-[#ffe5a3] hover:text-[#ffffff] truncate underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3 shrink-0 text-[#D4AF37]" />
                  <span className="truncate">{statusResult.html_url}</span>
                </a>
              </div>
            )}

            {statusResult.build && (
              <div className="text-[10px] font-mono text-[#cbb693] flex items-center justify-between pt-1 border-t border-[#D4AF37]/20">
                <span>Build: {statusResult.build.status || 'built'}</span>
                {statusResult.build.commit && (
                  <span>commit: {statusResult.build.commit.slice(0, 7)}</span>
                )}
              </div>
            )}

            {statusResult.steps && statusResult.steps.length > 0 && (
              <div className="pt-1.5 space-y-1">
                {statusResult.steps.map((st, idx) => (
                  <div key={idx} className="text-[10px] font-mono flex items-center gap-1 text-[#f5ead8]">
                    <span>{st.ok ? '✓' : '✗'}</span>
                    <span className="text-[#cbb693]">{st.step}:</span>
                    <span className="truncate">{st.detail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 1-Shot File Upsert Sub-Drawer Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowCommitDrawer(!showCommitDrawer)}
            className="w-full text-left text-xs font-mono text-[#E6A8B5] hover:text-[#ffe5a3] flex items-center justify-between py-1 border-t border-[#D4AF37]/20"
          >
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#D4AF37]" />
              1-Shot File Upsert (index.html, CNAME, etc.)
            </span>
            <span className="text-[10px]">{showCommitDrawer ? '▲ hide' : '▼ expand'}</span>
          </button>

          {showCommitDrawer && (
            <div className="mt-2 p-3 rounded-xl bg-[#120e11] border border-[#D4AF37]/30 space-y-2.5">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-[#cbb693]">File Path in Repo</label>
                <input
                  type="text"
                  value={quickFilePath}
                  onChange={(e) => setQuickFilePath(e.target.value)}
                  placeholder="index.html or CNAME"
                  className="w-full h-8 px-2.5 rounded-lg bg-[#181216] border border-[#D4AF37]/30 text-xs font-mono text-[#f5ead8]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-[#cbb693]">File Content</label>
                <textarea
                  rows={3}
                  value={quickFileContent}
                  onChange={(e) => setQuickFileContent(e.target.value)}
                  placeholder="Paste file content or leave empty..."
                  className="w-full p-2 rounded-lg bg-[#181216] border border-[#D4AF37]/30 text-xs font-mono text-[#f5ead8] resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handle1ShotCommit}
                disabled={isLoading}
                className="w-full h-9 rounded-xl bg-[#E6A8B5]/20 hover:bg-[#E6A8B5]/30 border border-[#E6A8B5]/60 text-xs font-mono font-bold text-[#ffe5a3] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Commit File (1-Shot Upsert)</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-[#D4AF37]/30">
          {/* Main 1-Tap Quick Deploy Button */}
          <button
            type="button"
            onClick={handle1TapQuickDeploy}
            disabled={isLoading}
            className="w-full min-h-[46px] rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E6A8B5] text-[#161215] font-serif font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/15 hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#161215]" />
                <span>Executing Pipeline...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-[#161215] text-[#161215]" />
                <span>1-Tap Deploy &amp; Configure Pages</span>
              </>
            )}
          </button>

          {/* Delegate to Haiku (Flash) Button */}
          <button
            type="button"
            onClick={handleDelegateToFlash}
            disabled={isLoading}
            className="w-full min-h-[44px] rounded-xl bg-[#120e11] hover:bg-[#1f161c] border border-[#D4AF37]/50 text-xs font-mono text-[#ffe5a3] flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Cpu className="w-3.5 h-3.5 text-[#E6A8B5]" />
            <span>🐾 Run Pipeline on Gemini 3.8 Flash (Haiku)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
