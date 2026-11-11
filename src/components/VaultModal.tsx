import React, { useState, useEffect, useRef } from 'react';
import {
  MediaVaultItem,
  MediaVaultCategory,
  loadMediaVault,
  addMediaVaultItem,
  deleteMediaVaultItem,
  savePhoneDirectoryHandle,
  getPhoneDirectoryHandle,
  writeItemToPhoneFolder,
  detectMediaCategory,
  isVideoAttachment,
} from '../utils/workbenchLogic';

interface VaultModalProps {
  onClose: () => void;
  onAttachItemToChat?: (item: MediaVaultItem) => void;
}

export const VaultModal: React.FC<VaultModalProps> = ({
  onClose,
  onAttachItemToChat,
}) => {
  const [items, setItems] = useState<MediaVaultItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<MediaVaultCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [folderStatus, setFolderStatus] = useState<'checking' | 'linked' | 'sandbox'>('checking');
  const [linkedDirName, setLinkedDirName] = useState<string | null>(null);
  const [sandboxNotice, setSandboxNotice] = useState<string | null>(null);
  const [inspectingItem, setInspectingItem] = useState<MediaVaultItem | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshVault = async () => {
    const list = await loadMediaVault();
    setItems(list);
  };

  useEffect(() => {
    void refreshVault();

    // Check directory handle link status
    void (async () => {
      try {
        const handle = await getPhoneDirectoryHandle();
        if (handle) {
          setLinkedDirName(handle.name || 'ArgonSanctuary');
          setFolderStatus('linked');
          return;
        }
      } catch {
        // ignore
      }
      setFolderStatus('sandbox');
      setSandboxNotice(
        'Sandbox Mode: Saving to IndexedDB Vault (Phone Folder unlocks on standalone deploy)'
      );
    })();
  }, []);

  const handleLinkPhoneFolder = async () => {
    setIsLinking(true);
    setSandboxNotice(null);
    try {
      if (typeof (window as any).showDirectoryPicker !== 'function') {
        throw new Error('showDirectoryPicker is not supported in this browser.');
      }
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
      });
      await savePhoneDirectoryHandle(handle);
      setLinkedDirName(handle.name || 'ArgonSanctuary');
      setFolderStatus('linked');
      setActionFeedback(`Linked "${handle.name || 'ArgonSanctuary'}" phone folder successfully.`);
      setTimeout(() => setActionFeedback(null), 3500);

      // Backfill any existing vault items to the linked phone folder
      const currentVault = await loadMediaVault();
      for (const it of currentVault) {
        void writeItemToPhoneFolder(handle, it);
      }
    } catch (err: unknown) {
      // In cross-origin iframes or unflagged webviews, showDirectoryPicker throws SecurityError
      setFolderStatus('sandbox');
      setSandboxNotice(
        'Sandbox Mode: Saving to IndexedDB Vault (Phone Folder unlocks on standalone deploy)'
      );
    } finally {
      setIsLinking(false);
    }
  };

  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let addedCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        let textContent: string | undefined = undefined;
        if (
          file.type.startsWith('text/') ||
          /\.(md|txt|json|csv|ts|tsx|js|html)$/i.test(file.name)
        ) {
          try {
            textContent = await file.text();
          } catch {
            // ignore
          }
        }

        const category = detectMediaCategory(file.type, file.name);
        await addMediaVaultItem({
          filename: file.name,
          category,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl,
          origin: 'chat_upload',
          textContent,
        });
        addedCount++;
      } catch {
        // continue
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    await refreshVault();
    setActionFeedback(`Added ${addedCount} file(s) to Sanctuary Media Vault.`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleDeleteItem = async (id: string, filename: string) => {
    if (window.confirm(`Delete "${filename}" from Sanctuary Media Vault?`)) {
      await deleteMediaVaultItem(id);
      await refreshVault();
      if (inspectingItem?.id === id) {
        setInspectingItem(null);
      }
    }
  };

  const handleDownloadItem = (item: MediaVaultItem) => {
    try {
      const a = document.createElement('a');
      a.href = item.dataUrl;
      a.download = item.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // ignore
    }
  };

  const handleAttach = (item: MediaVaultItem) => {
    if (onAttachItemToChat) {
      onAttachItemToChat(item);
      onClose();
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (activeCategory !== 'all' && item.category !== activeCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.filename.toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      const matchText = (item.textContent || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchText) return false;
    }
    return true;
  });

  const voiceClipsCount = items.filter((it) => it.category === 'voice_clips').length;
  const imagesCount = items.filter((it) => it.category === 'images').length;
  const filesCount = items.filter((it) => it.category === 'files').length;
  const totalBytes = items.reduce((acc, it) => acc + (it.size || 0), 0);
  const formattedStorage =
    totalBytes > 1024 * 1024
      ? `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(totalBytes / 1024)} KB`;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0d090c]/95 flex flex-col overflow-x-hidden backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Sanctuary Media Vault"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleUploadFiles}
      />

      {/* Sticky Top Bar */}
      <header className="shrink-0 sticky top-0 z-20 bg-[#160f13] border-b border-[#8e6d3b]/70 px-3 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3 rounded-full gilded-pill-btn text-xs font-semibold cursor-pointer shrink-0"
            >
              [ ← Back ]
            </button>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-serif font-bold text-[#e6c88c] truncate flex items-center gap-1.5">
                <span>🗄️ Sanctuary Media Vault</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleLinkPhoneFolder}
              disabled={isLinking}
              title="Link Android phone folder via File System Access API"
              className={`h-9 px-3 rounded-xl border text-xs font-mono font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                folderStatus === 'linked'
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200'
                  : 'bg-[#241a1d] hover:bg-[#332227] border-[#c59b47]/70 text-[#ffe5a3]'
              }`}
            >
              <span>{folderStatus === 'linked' ? '📁 Linked' : '📁 Link Phone Folder'}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-9 px-3 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer whitespace-nowrap flex items-center gap-1"
            >
              <span>+ Upload</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 max-w-4xl w-full mx-auto space-y-3">
        {/* Status Banner / Feedback */}
        {actionFeedback && (
          <div className="p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-400 text-xs font-mono text-emerald-200">
            ✓ {actionFeedback}
          </div>
        )}

        {/* Origin / Sandbox Notice Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#140e11] border border-[#6b5331]/50 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[#e6c88c]">
              {folderStatus === 'linked'
                ? `📁 Folder Linked: "${linkedDirName || 'ArgonSanctuary'}" (voice_clips/, images/, files/)`
                : '📦 IndexedDB Vault Active'}
            </span>
            <span className="text-[#a8937b]">({formattedStorage} used)</span>
          </div>
          {sandboxNotice && (
            <span className="text-[11px] text-[#d4b483] italic">
              {sandboxNotice}
            </span>
          )}
        </div>

        {/* Storage Breakdown Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
              activeCategory === 'all'
                ? 'bg-[#2a1d17] border-[#e6c88c] text-[#fff3db]'
                : 'bg-[#140e10] border-[#6b5331]/50 text-[#cbb693] hover:border-[#8e6d3b]'
            }`}
          >
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#a8937b]">Total Media</div>
            <div className="text-lg font-serif font-bold text-[#e6c88c]">{items.length}</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('voice_clips')}
            className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
              activeCategory === 'voice_clips'
                ? 'bg-purple-950/70 border-purple-400 text-purple-100'
                : 'bg-[#140e10] border-[#6b5331]/50 text-[#cbb693] hover:border-[#8e6d3b]'
            }`}
          >
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#a8937b]">Voice Clips</div>
            <div className="text-lg font-serif font-bold text-purple-300">🎙️ {voiceClipsCount}</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('images')}
            className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
              activeCategory === 'images'
                ? 'bg-amber-950/70 border-amber-400 text-amber-100'
                : 'bg-[#140e10] border-[#6b5331]/50 text-[#cbb693] hover:border-[#8e6d3b]'
            }`}
          >
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#a8937b]">Images</div>
            <div className="text-lg font-serif font-bold text-amber-300">🖼️ {imagesCount}</div>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('files')}
            className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
              activeCategory === 'files'
                ? 'bg-cyan-950/70 border-cyan-400 text-cyan-100'
                : 'bg-[#140e10] border-[#6b5331]/50 text-[#cbb693] hover:border-[#8e6d3b]'
            }`}
          >
            <div className="text-[10px] uppercase font-mono tracking-wider text-[#a8937b]">Documents</div>
            <div className="text-lg font-serif font-bold text-cyan-300">📄 {filesCount}</div>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search vault files, voice notes, documents..."
            className="w-full p-2.5 pl-3 rounded-xl gilded-input-well text-xs font-mono text-[#f5ead8] placeholder-[#7d6547]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-stone-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Media Grid / List */}
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#140e11] border border-[#6b5331]/40 space-y-2">
            <div className="text-3xl">🗄️</div>
            <div className="text-sm font-serif text-[#e6c88c]">No media items found</div>
            <p className="text-xs font-mono text-[#a8937b] max-w-sm mx-auto">
              {searchQuery
                ? 'Try matching a different keyword or switch category tabs above.'
                : 'Chat attachments, live voice recordings, and uploaded files are automatically saved here without duplication.'}
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 px-4 py-2 rounded-full gilded-send-btn text-xs font-semibold cursor-pointer"
            >
              + Upload File to Vault
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const formattedDate = new Date(item.createdAt).toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              const fileSizeKb = Math.round(item.size / 1024) || 1;

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-[#171014] border border-[#c59b47]/50 hover:border-[#e6c88c] transition-all flex flex-col justify-between space-y-2 shadow-lg"
                >
                  {/* Top Item Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-bold text-[#f5ead8] truncate" title={item.filename}>
                          {item.category === 'voice_clips' && '🎙️ '}
                          {item.category === 'images' && '🖼️ '}
                          {item.category === 'files' && '📄 '}
                          {item.filename}
                        </div>
                        <div className="text-[10px] font-mono text-[#a8937b] flex items-center gap-1.5 mt-0.5">
                          <span>{formattedDate}</span>
                          <span>•</span>
                          <span>{fileSizeKb} KB</span>
                          <span>•</span>
                          <span className="capitalize">{item.category.replace('_', ' ')}</span>
                        </div>
                      </div>

                      {/* Origin Pill */}
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-[#241a1d] border border-[#6b5331]/50 text-[#d4b483] shrink-0">
                        {item.origin.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Preview Area */}
                    {isVideoAttachment(item.mimeType, item.filename) ? (
                      <div className="pt-1">
                        <video
                          controls
                          playsInline
                          preload="metadata"
                          src={item.dataUrl}
                          className="w-full max-h-48 rounded-lg border border-[#6b5331]/50 bg-black object-contain"
                        />
                      </div>
                    ) : item.category === 'voice_clips' ? (
                      <div className="pt-1">
                        <audio
                          controls
                          src={item.dataUrl}
                          className="w-full h-8 rounded"
                          preload="metadata"
                        />
                      </div>
                    ) : item.category === 'images' ? (
                      <div
                        onClick={() => setInspectingItem(item)}
                        className="relative h-28 rounded-lg overflow-hidden border border-[#6b5331]/50 bg-black/40 cursor-pointer group"
                      >
                        <img
                          src={item.dataUrl}
                          alt={item.filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-mono text-white">
                          🔍 Click to View Full Res
                        </div>
                      </div>
                    ) : item.category === 'files' ? (
                      <div
                        onClick={() => setInspectingItem(item)}
                        className="p-2 rounded-lg bg-black/40 border border-[#6b5331]/40 text-[11px] font-mono text-[#d4b483] cursor-pointer hover:bg-black/60 transition-colors"
                      >
                        {item.textContent ? (
                          <div className="line-clamp-3 text-[#f5ead8] italic">
                            {item.textContent.slice(0, 180)}
                          </div>
                        ) : (
                          <div className="text-[#a8937b] italic">
                            Binary document ({item.mimeType})
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-[#6b5331]/40">
                    <div className="flex items-center gap-1">
                      {onAttachItemToChat && (
                        <button
                          type="button"
                          onClick={() => handleAttach(item)}
                          className="h-7 px-2.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-[10px] font-mono text-emerald-200 cursor-pointer flex items-center gap-1"
                        >
                          <span>🔁 Attach to Chat</span>
                        </button>
                      )}
                      {(isVideoAttachment(item.mimeType, item.filename) || item.category === 'images' || item.category === 'files') && (
                        <button
                          type="button"
                          onClick={() => setInspectingItem(item)}
                          className="h-7 px-2 rounded-lg bg-[#241a1d] hover:bg-[#332227] border border-[#8e6d3b]/50 text-[10px] font-mono text-[#e6c88c] cursor-pointer"
                        >
                          Inspect
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownloadItem(item)}
                        title="Download file"
                        className="h-7 px-2 rounded-lg bg-[#140e10] hover:bg-[#201518] border border-[#6b5331]/60 text-[10px] font-mono text-[#cbb693] cursor-pointer"
                      >
                        ⬇️
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id, item.filename)}
                        title="Delete from Vault"
                        className="h-7 px-2 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-[10px] font-mono text-red-200 cursor-pointer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Lightbox / Document Inspect Modal */}
      {inspectingItem && (
        <div
          className="fixed inset-0 z-60 bg-black/85 flex flex-col items-center justify-center p-3 sm:p-6 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-w-2xl w-full max-h-[90vh] bg-[#160f13] border border-[#c59b47] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-3 border-b border-[#6b5331]/50 flex items-center justify-between gap-2 bg-[#140e11]">
              <div className="min-w-0">
                <span className="text-xs font-serif font-bold text-[#ffe5a3] block truncate">
                  {inspectingItem.filename}
                </span>
                <span className="text-[10px] font-mono text-[#a8937b]">
                  {Math.round(inspectingItem.size / 1024)} KB • {inspectingItem.mimeType}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {onAttachItemToChat && (
                  <button
                    type="button"
                    onClick={() => handleAttach(inspectingItem)}
                    className="h-7 px-2.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-[10px] font-mono text-emerald-200 cursor-pointer"
                  >
                    🔁 Attach to Chat
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDownloadItem(inspectingItem)}
                  className="h-7 px-2.5 rounded-lg bg-[#241a1d] hover:bg-[#332227] border border-[#8e6d3b]/50 text-[10px] font-mono text-[#e6c88c] cursor-pointer"
                >
                  ⬇️ Download
                </button>
                <button
                  type="button"
                  onClick={() => setInspectingItem(null)}
                  className="h-7 w-7 rounded-full bg-stone-900 text-stone-300 hover:text-white flex items-center justify-center text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center">
              {isVideoAttachment(inspectingItem.mimeType, inspectingItem.filename) ? (
                <video
                  controls
                  playsInline
                  autoPlay
                  src={inspectingItem.dataUrl}
                  className="max-h-[70vh] max-w-full rounded-lg shadow-lg bg-black object-contain"
                />
              ) : inspectingItem.category === 'images' ? (
                <img
                  src={inspectingItem.dataUrl}
                  alt={inspectingItem.filename}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
                />
              ) : inspectingItem.textContent ? (
                <pre className="w-full text-xs font-mono text-[#f5ead8] bg-black/50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {inspectingItem.textContent}
                </pre>
              ) : (
                <div className="text-center p-6 text-xs font-mono text-[#a8937b]">
                  Preview not available for binary document. Tap &quot;Download&quot; to inspect on device.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
