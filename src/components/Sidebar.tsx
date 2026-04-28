import { useEffect, useState } from 'react';
import { Search, Filter, ArrowUpDown, MessageSquare, Clock, Plus, Settings, ChevronDown, ChevronUp, Calendar, X as CloseIcon } from 'lucide-react';
import { Conversation, SortField, SortOrder, FilterOptions } from '../types';
import { cn, formatDate } from '../lib/utils';
import { AnimatePresence } from 'motion/react';

export interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  filterOptions: FilterOptions;
  setFilterOptions: (options: FilterOptions) => void;
  focusedIndex?: number;
  theme: 'dark' | 'light';
  onNewChat?: () => void;
  onOpenSettings?: () => void;
  primaryColor?: string;
  onTogglePin?: (id: string) => void;
  onToggleMute?: (id: string) => void;
  drafts?: Record<string, string>;
  isLoading?: boolean;
}

export function Sidebar({
  conversations,
  activeId,
  onSelect,
  searchTerm,
  onSearchChange,
  filterOptions,
  setFilterOptions,
  focusedIndex,
  theme,
  onNewChat,
  onOpenSettings,
  primaryColor = '#D4AF37',
  onTogglePin,
  onToggleMute,
  drafts = {},
  isLoading = false
}: SidebarProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  useEffect(() => {
    if (focusedIndex !== undefined) {
      const items = document.querySelectorAll('[data-conv-item]');
      items[focusedIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [focusedIndex]);

  const clearFilters = () => {
    onSearchChange('');
    setFilterOptions({ ...filterOptions, contactName: '', keywords: '', startDate: undefined, endDate: undefined });
  };

  const hasActiveFilters = searchTerm || filterOptions.contactName || filterOptions.keywords || filterOptions.startDate || filterOptions.endDate;

  return (
    <aside className={cn(
      "w-full flex flex-col h-full border-l",
      theme === 'dark' ? "bg-[#0a0a0a] border-[#1a1a1a]" : "bg-white border-gray-200"
    )}>
      <div className={cn(
        "p-4 pt-[calc(env(safe-area-inset-top)+1rem)] space-y-3 shrink-0 bg-opacity-80 border-b",
        theme === 'dark' ? "bg-[#0a0a0a] border-[#1a1a1a]" : "bg-white border-gray-100"
      )}>
        <div className="flex items-center justify-between">
          <h1 className={cn(
            "text-xl font-serif italic tracking-tight",
            theme === 'dark' ? "text-[#D4AF37]" : "text-blue-600"
          )} style={{ color: theme === 'light' ? undefined : primaryColor }}>
            הודעות
          </h1>
          <div className="flex gap-2">
            <button 
              onClick={onNewChat}
              className={cn(
                "p-1.5 rounded-full transition-colors",
                theme === 'dark' ? "bg-[#1a1a1a] text-[#D4AF37] hover:bg-[#252525]" : "bg-gray-100 text-blue-600 hover:bg-gray-200"
              )}
              style={{ color: theme === 'light' ? undefined : primaryColor }}
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              onClick={onOpenSettings}
              className={cn(
                "p-1.5 rounded-full transition-colors",
                theme === 'dark' ? "text-gray-500 hover:text-white" : "text-gray-400 hover:text-gray-900"
              )}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-2 w-3 h-3 text-gray-500" />
          <input
            type="text"
            placeholder="חיפוש..."
            className={cn(
              "w-full pr-8 pl-3 py-1.5 border rounded outline-none transition-all text-[10px]",
              theme === 'dark' 
                ? "bg-[#121212] border-[#1a1a1a] text-[#e0e0e0] focus:border-[#D4AF37]/50" 
                : "bg-gray-50 border-gray-200 text-gray-900 focus:border-blue-500/50"
            )}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Controls - Minimalized */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none items-center justify-between">
          <div className="flex gap-1">
            <button
              onClick={() => setFilterOptions({ ...filterOptions, showUnreadOnly: !filterOptions.showUnreadOnly })}
              className={cn(
                "p-1 px-3 border rounded-full transition-all text-[9px] font-bold uppercase tracking-widest",
                filterOptions.showUnreadOnly 
                  ? theme === 'dark' ? "bg-[#D4AF37] text-black border-[#D4AF37]" : "bg-blue-600 text-white border-blue-600"
                  : theme === 'dark' ? "bg-transparent border-[#1a1a1a] text-gray-500" : "bg-transparent border-gray-200 text-gray-500"
              )}
              style={filterOptions.showUnreadOnly && theme === 'dark' ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
            >
              {filterOptions.showUnreadOnly ? 'רק שלא נקראו' : 'הכל'}
            </button>
          </div>
          <span className="text-[8px] opacity-30 font-bold uppercase tracking-widest">
            {conversations.length} שיחות
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-2 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-px">
            {conversations.map((c) => (
              <div
                key={c.id}
                data-conv-item
                tabIndex={0}
                role="button"
                aria-label={`שיחה עם ${c.contactName}`}
                onClick={() => onSelect(c.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(c.id);
                  }
                }}
                className={cn(
                  "w-full flex items-center p-3 group text-right border-l-2 relative cursor-pointer focus:outline-none",
                  activeId === c.id 
                    ? theme === 'dark' ? "bg-[#1a1a1a] border-[#D4AF37] text-[#e0e0e0]" : "bg-blue-50 border-blue-500 text-gray-900"
                    : conversations.findIndex(cv => cv.id === c.id) === focusedIndex
                      ? theme === 'dark' ? "bg-[#121212] border-[#D4AF37]/40 ring-1 ring-[#D4AF37]/20 text-[#e0e0e0]" : "bg-gray-100 border-blue-500/40 ring-1 ring-blue-500/20 text-gray-900"
                      : theme === 'dark' ? "hover:bg-[#121212]/50 border-transparent text-[#e0e0e0]/60" : "hover:bg-gray-50 border-transparent text-gray-700"
                )}
                style={activeId === c.id && theme === 'dark' ? { borderColor: primaryColor } : {}}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full border flex items-center justify-center shrink-0 ml-3 relative",
                  theme === 'dark' ? "bg-[#1a1a1a] border-[#333]" : "bg-gray-100 border-gray-200"
                )}>
                  {c.avatarUrl ? (
                    <img src={c.avatarUrl} alt={c.contactName} className="w-full h-full rounded-full object-cover shadow-sm" />
                  ) : (
                    <span className={cn(
                      "text-[9px] font-serif italic",
                      theme === 'dark' ? "text-[#D4AF37]" : "text-blue-600"
                    )} style={theme === 'dark' ? { color: primaryColor } : {}}>{c.contactName[0]}</span>
                  )}
                  {c.isMuted && (
                    <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-0.5 border border-black/20">
                       <span className="text-[6px]">🔇</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <div className="flex items-center gap-1 min-w-0">
                      {c.isPinned && <span className="text-[10px] text-gray-500">📌</span>}
                      {c.isArchived && <span className="text-[10px] text-gray-500 italic ml-1">📦</span>}
                      <span className={cn(
                        "text-xs font-semibold truncate",
                        activeId === c.id ? theme === 'dark' ? "text-white" : "text-blue-700" : ""
                      )}>
                        {c.contactName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[8px] tracking-widest uppercase opacity-30">
                        {formatDate(c.lastTimestamp).split(',')[1]}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); (window as any).onDeleteConversation?.(c.id); }}
                        className="p-1 opacity-0 group-hover:opacity-40 hover:opacity-100 hover:text-red-500 transition-all hover:bg-black/10 rounded"
                      >
                        <CloseIcon className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] truncate opacity-40 mt-0.5">
                    {drafts[c.id] ? (
                      <span className={cn(
                        "font-bold",
                        theme === 'dark' ? "text-[#D4AF37]" : "text-blue-600"
                      )}>טיוטה: {drafts[c.id]}</span>
                    ) : (
                      c.lastMessage
                    )}
                  </p>
                </div>

                {c.unreadCount > 0 && activeId !== c.id && (
                  <span className={cn(
                    "text-black text-[8px] font-bold px-1 py-0.5 rounded-sm min-w-[14px] text-center ml-2",
                    theme === 'dark' ? "bg-[#D4AF37]" : "bg-blue-600 text-white"
                  )} style={theme === 'dark' ? { backgroundColor: primaryColor } : {}}>
                    {c.unreadCount}
                  </span>
                )}
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-xs italic font-serif">
                לא נמצאו שיחות
              </div>
            )}
          </div>
        )}
      </div>

    </aside>
  );
}
