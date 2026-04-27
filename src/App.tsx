import { useState, useMemo, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { Message, Conversation, FilterOptions, AppSettings } from './types';
import { mockConversations, mockMessages } from './mockData';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Bell, Sun, Moon, Settings, AlertTriangle, X, Monitor, QrCode } from 'lucide-react';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('conversations');
    return saved ? JSON.parse(saved) : mockConversations;
  });
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('drafts');
    return saved ? JSON.parse(saved) : {};
  });
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    const saved = localStorage.getItem('messages');
    return saved ? JSON.parse(saved) : mockMessages;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('settings');
    return saved ? JSON.parse(saved) : {
      theme: 'dark',
      primaryColor: '#14b8a6', // Turquoise default
      notificationDuration: 3, // In seconds now as per request
      notificationSound: 'default',
      fontFamily: 'Inter',
      cbsAlerts: true,
      enableVibration: true,
      autoRead: false
    };
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'info' | 'success' | 'alert'} | null>(null);
  const [cbsAlert, setCbsAlert] = useState<string | null>(null);

  // Handle local notifications with sound
  useEffect(() => {
    if (notification) {
      if (settings.notificationSound !== 'none') {
        const audio = new Audio(`https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3`); // Placeholder high quality sound
        audio.volume = 0.5;
        audio.play().catch(() => {});
      }
      if (settings.enableVibration && 'vibrate' in navigator) {
        navigator.vibrate(200);
      }
      const timer = setTimeout(() => setNotification(null), settings.notificationDuration * 1000);
      return () => clearTimeout(timer);
    }
  }, [notification, settings]);
  
  // Save everything
  useEffect(() => {
    localStorage.setItem('conversations', JSON.stringify(conversations));
    localStorage.setItem('messages', JSON.stringify(messages));
    localStorage.setItem('drafts', JSON.stringify(drafts));
    localStorage.setItem('settings', JSON.stringify(settings));
    
    // Apply font
    document.body.style.fontFamily = settings.fontFamily;
  }, [conversations, messages, settings]);

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // CBS Alerts Simulation
  useEffect(() => {
    if (!settings.cbsAlerts) return;
    
    const interval = setInterval(() => {
      if (Math.random() > 0.98) {
        const alerts = ["צבע אדום - אזור תעשייה אשקלון", "התרעת CBS: מזג אוויר קיצוני", "הודעת חירום: תרגיל ארצי ב-10:00"];
        const alert = alerts[Math.floor(Math.random() * alerts.length)];
        setCbsAlert(alert);
        setTimeout(() => setCbsAlert(null), 10000);
      }
    }, 20000);
    
    return () => clearInterval(interval);
  }, [settings.cbsAlerts]);

  // Filtering and Sorting Logic
  const filteredConversations = useMemo(() => {
    let result = [...conversations];

    // Filter by search term
    if (searchTerm) {
      result = result.filter(c => 
        c.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.lastMessage?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Advanced filters
    if (filterOptions.showUnreadOnly) {
      result = result.filter(c => c.unreadCount > 0);
    }

    // Smart Sorting: Pinned first, then by timestamp descending
    result.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.lastTimestamp - a.lastTimestamp;
    });

    return result;
  }, [conversations, searchTerm, filterOptions]);

  const togglePin = (id: string) => {
    setConversations(prev => prev.map(c => 
      c.id === id ? { ...c, isPinned: !c.isPinned } : c
    ));
    showNotification('סטטוס נעיצה עודכן', 'success');
  };

  const toggleMute = (id: string) => {
    setConversations(prev => prev.map(c => 
      c.id === id ? { ...c, isMuted: !c.isMuted } : c
    ));
    showNotification('הגדרות השתקה עודכנו');
  };

  const [view, setView] = useState<'list' | 'chat'>('list');
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (view === 'list') {
        if (e.key === 'ArrowDown') {
          setFocusedIndex(prev => Math.min(prev + 1, filteredConversations.length - 1));
        } else if (e.key === 'ArrowUp') {
          setFocusedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
          const target = filteredConversations[focusedIndex];
          if (target) {
            setActiveConversationId(target.id);
            setView('chat');
          }
        }
      } else if (view === 'chat') {
        if (e.key === 'Escape') {
          setView('list');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, filteredConversations, focusedIndex]);

  const handleDraftChange = useCallback((id: string, val: string) => {
    setDrafts(prev => {
      if (prev[id] === val) return prev;
      return { ...prev, [id]: val };
    });
  }, []);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setView('chat');
    
    if (settings.autoRead) {
      setConversations(prev => prev.map(c => 
        c.id === id ? { ...c, unreadCount: 0 } : c
      ));
      setMessages(prev => {
        const chatMsgs = prev[id] || [];
        return {
          ...prev,
          [id]: chatMsgs.map(m => ({ ...m, isRead: true, status: 'read' as const }))
        };
      });
    }
  };

  const handleToggleMessageLock = (convId: string, msgId: string) => {
    setMessages(prev => {
      const chatMsgs = prev[convId] || [];
      return {
        ...prev,
        [convId]: chatMsgs.map(m => m.id === msgId ? { ...m, isLocked: !m.isLocked } : m)
      };
    });
    showNotification('סטטוס נעילת הודעה עודכן');
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const activeMessages = activeConversationId ? messages[activeConversationId] || [] : [];

  const showNotification = (msg: string, type: 'info' | 'success' | 'alert' = 'info') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), settings.notificationDuration);
  };

  const handleNewChat = () => {
    const name = prompt('הכנס שם איש קשר חדש:');
    if (!name) return;
    
    const newId = Date.now().toString();
    const newConv: Conversation = {
      id: newId,
      contactName: name,
      lastMessage: 'שיחה חדשה',
      lastTimestamp: Date.now(),
      unreadCount: 0
    };
    
    setConversations([newConv, ...conversations]);
    setActiveConversationId(newId);
    setView('chat');
    showNotification('שיחה חדשה נוצרה');
  };

  const handleSendMessage = (text: string, scheduledFor?: number, imageUrl?: string) => {
    if (!activeConversationId) return;

    // Clear draft when sending
    setDrafts(prev => {
      const next = { ...prev };
      delete next[activeConversationId];
      return next;
    });

    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      senderId: 'user',
      senderName: 'אני',
      timestamp: Date.now(),
      isRead: true,
      scheduledFor,
      isScheduled: !!scheduledFor,
      imageUrl,
      status: scheduledFor ? 'sent' : 'delivered',
      sentAt: Date.now(),
      deliveredAt: scheduledFor ? undefined : Date.now() + 1000,
      readAt: undefined
    };

    setMessages(prev => ({
      ...prev,
      [activeConversationId]: [...(prev[activeConversationId] || []), newMessage],
    }));

    if (!scheduledFor) {
      setTimeout(() => {
        setMessages(prev => {
          const current = prev[activeConversationId] || [];
          return {
            ...prev,
            [activeConversationId]: current.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m)
          };
        });
      }, 1000);

      setConversations(prev => prev.map(c => 
        c.id === activeConversationId 
          ? { ...c, lastMessage: text || 'תמונה', lastTimestamp: Date.now() }
          : c
      ));
      showNotification('הודעה נשלחה בהצלחה', 'success');
    } else {
      showNotification('הודעה תוזמנה לעתיד', 'info');
    }
  };

  return (
    <div className={cn(
      "flex h-screen overflow-hidden border-2 transition-colors duration-300",
      settings.theme === 'dark' ? "bg-[#050505] text-[#e0e0e0] border-[#1a1a1a]" : "bg-gray-50 text-gray-900 border-gray-200"
    )} dir="rtl">
      
      {/* Mini Nav Bar */}
      <nav className={cn(
        "w-16 border-l hidden sm:flex flex-col items-center py-6 space-y-6 shrink-0",
        settings.theme === 'dark' ? "bg-[#0a0a0a] border-[#1a1a1a]" : "bg-white border-gray-200"
      )}>
        <button 
          onClick={() => setSettings(s => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))}
          className="w-10 h-10 rounded-full flex items-center justify-center border border-[#333] hover:bg-white/10 transition-colors"
        >
          {settings.theme === 'dark' ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>
        <button 
          onClick={() => setShowSync(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
          title="סנכרון דפדפן"
        >
          <Monitor className="w-5 h-5" />
        </button>
        <button 
          onClick={() => setShowSettings(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity"
          title="הגדרות"
        >
          <Settings className="w-5 h-5" />
        </button>
        <div className="mt-auto mb-4 w-8 h-8 rounded-full border border-[#333] flex items-center justify-center">
          <div className="text-[8px] font-serif italic" style={{ color: settings.primaryColor }}>AI</div>
        </div>
      </nav>

      <div className="flex w-full h-full relative">
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 20, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className={cn(
                "fixed top-0 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-2xl text-xs font-bold flex items-center gap-2",
                notification.type === 'success' ? "bg-green-500 text-white" : notification.type === 'alert' ? "bg-red-600 text-white" : "bg-blue-600 text-white"
              )}
            >
              <Bell className="w-3 h-3" />
              {notification.message}
            </motion.div>
          )}

          {cbsAlert && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed bottom-4 right-4 z-50 bg-red-600 text-white p-4 rounded-lg shadow-2xl max-w-xs flex gap-3 border-2 border-white/20"
            >
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-bold text-sm">התרעת חירום (CBS)</p>
                <p className="text-xs mt-1">{cbsAlert}</p>
              </div>
              <button 
                onClick={() => setCbsAlert(null)}
                className="absolute top-2 left-2 p-1 hover:bg-white/10 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}

          {showSync && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setShowSync(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className={cn(
                  "w-full max-w-sm rounded-xl p-8 text-center space-y-6",
                  settings.theme === 'dark' ? "bg-[#121212] border border-[#1a1a1a]" : "bg-white shadow-2xl"
                )}
                onClick={e => e.stopPropagation()}
              >
                <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-2">
                  <Monitor className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold">סנכרון עם הדפדפן</h3>
                <p className="text-xs opacity-60">סרוק את הקוד כדי להמשיך את ההתכתבות במחשב האישי</p>
                <div className={cn(
                  "aspect-square w-48 mx-auto p-4 rounded-lg bg-white flex items-center justify-center",
                  settings.theme === 'dark' ? "opacity-90" : "border-4 border-gray-100"
                )}>
                  <QrCode className="w-full h-full text-black" />
                </div>
                <button 
                  onClick={() => setShowSync(false)}
                  className="w-full py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all"
                  style={{ backgroundColor: settings.primaryColor, color: 'white' }}
                >
                  הבנתי
                </button>
              </motion.div>
            </motion.div>
          )}

          {showSettings && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setShowSettings(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className={cn(
                  "w-full max-w-md rounded-xl p-6 shadow-2xl space-y-6",
                  settings.theme === 'dark' ? "bg-[#121212] border border-[#1a1a1a]" : "bg-white"
                )}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-serif italic text-[#D4AF37]" style={{ color: settings.primaryColor }}>הגדרות ממשק</h3>
                  <button onClick={() => setShowSettings(false)} className="p-2 opacity-50 hover:opacity-100"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold opacity-50">צבע מותג</label>
                    <div className="flex gap-2">
                      {['#14b8a6', '#0ea5e9', '#0d9488', '#3b82f6', '#10b981', '#a855f7'].map(c => (
                        <button 
                          key={c} 
                          className={cn("w-6 h-6 rounded-full border-2", settings.primaryColor === c ? "border-white" : "border-transparent")}
                          style={{ backgroundColor: c }}
                          onClick={() => setSettings(s => ({ ...s, primaryColor: c }))}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold opacity-50 flex justify-between">
                      <span>משך התראה</span>
                      <span>{settings.notificationDuration} שניות</span>
                    </label>
                    <input 
                      type="range" min="1" max="10" step="1" 
                      value={settings.notificationDuration}
                      onChange={e => setSettings(s => ({ ...s, notificationDuration: parseInt(e.target.value) }))}
                      className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: settings.primaryColor }}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold opacity-50">צליל התראה</label>
                    <select 
                      className="w-full bg-transparent border-b border-white/10 py-1 outline-none text-sm"
                      value={settings.notificationSound}
                      onChange={e => setSettings(s => ({ ...s, notificationSound: e.target.value }))}
                    >
                      <option value="default" className="bg-[#121212]">דיגיטלי (ברירת מחדל)</option>
                      <option value="chime" className="bg-[#121212]">פעמון עדין</option>
                      <option value="pop" className="bg-[#121212]">פופ</option>
                      <option value="none" className="bg-[#121212]">ללא</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold opacity-50">גופן גוגל</label>
                    <select 
                      className="w-full bg-transparent border-b border-white/10 py-1 outline-none"
                      value={settings.fontFamily}
                      onChange={e => setSettings(s => ({ ...s, fontFamily: e.target.value }))}
                    >
                      <option value="Inter">Inter (Classic)</option>
                      <option value="'Space Grotesk'">Space Grotesk (Tech)</option>
                      <option value="'Playfair Display'">Playfair Display (Serif)</option>
                    </select>
                  </div>

                  <div className="space-y-3 pt-2">
                    <h4 className="text-[9px] uppercase tracking-widest opacity-30 font-bold border-b border-white/5 pb-1">הגדרות מתקדמות</h4>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">רטט בהתראה</span>
                      <button 
                        onClick={() => setSettings(s => ({ ...s, enableVibration: !s.enableVibration }))}
                        className={cn(
                          "w-8 h-4 rounded-full transition-colors relative",
                          settings.enableVibration ? "bg-green-500" : "bg-gray-600"
                        )}
                      >
                        <div className={cn("absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-all", settings.enableVibration && "translate-x-4")} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">קריאה אוטומטית</span>
                      <button 
                        onClick={() => setSettings(s => ({ ...s, autoRead: !s.autoRead }))}
                        className={cn(
                          "w-8 h-4 rounded-full transition-colors relative",
                          settings.autoRead ? "bg-green-500" : "bg-gray-600"
                        )}
                      >
                        <div className={cn("absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-all", settings.autoRead && "translate-x-4")} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">התרעות CBS (חירום)</span>
                      <button 
                        onClick={() => setSettings(s => ({ ...s, cbsAlerts: !s.cbsAlerts }))}
                        className={cn(
                          "w-8 h-4 rounded-full transition-colors relative",
                          settings.cbsAlerts ? "bg-red-500" : "bg-gray-600"
                        )}
                      >
                        <div className={cn("absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-all", settings.cbsAlerts && "translate-x-4")} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex min-w-0 relative h-full">
          {/* Sidebar */}
          <motion.div 
            initial={false}
            animate={{ 
              x: view === 'chat' && window.innerWidth < 640 ? '100%' : '0%',
              opacity: view === 'chat' && window.innerWidth < 640 ? 0 : 1
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "absolute inset-0 sm:relative sm:w-80 h-full shrink-0 transition-all duration-300 z-10",
              view === 'chat' ? "hidden sm:block" : "block w-full"
            )}
          >
            <Sidebar 
              conversations={filteredConversations}
              activeId={activeConversationId}
              onSelect={handleSelectConversation}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterOptions={filterOptions}
              setFilterOptions={setFilterOptions}
              focusedIndex={focusedIndex}
              theme={settings.theme}
              onNewChat={handleNewChat}
              onOpenSettings={() => setShowSettings(true)}
              primaryColor={settings.primaryColor}
              onTogglePin={togglePin}
              onToggleMute={toggleMute}
              drafts={drafts}
            />
          </motion.div>
          
          {/* Main Chat Area */}
          <motion.main 
            initial={false}
            animate={{ 
              x: view === 'list' && window.innerWidth < 640 ? '-100%' : '0%',
              opacity: view === 'list' && window.innerWidth < 640 ? 0 : 1
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "absolute inset-0 sm:relative flex-1 flex flex-col min-w-0 border-r transition-all duration-300",
              settings.theme === 'dark' ? "bg-[#050505] border-[#1a1a1a]" : "bg-white border-gray-100",
              view === 'list' ? "hidden sm:flex" : "flex w-full"
            )}
          >
            <AnimatePresence mode="wait">
              {activeConversationId ? (
                <ChatWindow 
                  key={activeConversationId}
                  conversation={activeConversation!}
                  messages={activeMessages}
                  onSendMessage={handleSendMessage}
                  onBack={() => setView('list')}
                  theme={settings.theme}
                  onTogglePin={togglePin}
                  onToggleMute={toggleMute}
                  primaryColor={settings.primaryColor}
                  draft={drafts[activeConversationId] || ''}
                  onDraftChange={(val) => activeConversationId && handleDraftChange(activeConversationId, val)}
                  onToggleLock={handleToggleMessageLock}
                />
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex items-center justify-center text-gray-600 p-8 text-center"
                >
                  <div>
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border",
                      settings.theme === 'dark' ? "bg-[#1a1a1a] border-[#333]" : "bg-gray-100 border-gray-200"
                    )}>
                      <svg className="w-8 h-8 text-[#D4AF37]" style={{ color: settings.primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.827-1.213L3 20l1.391-3.954A8.237 8.237 0 0121 12z" />
                      </svg>
                    </div>
                    <h2 className={cn("text-xl font-serif italic", settings.theme === 'dark' ? "text-[#D4AF37]" : "text-blue-600")} style={{ color: settings.theme === 'light' ? undefined : settings.primaryColor }}>SmartMsg AI</h2>
                    <p className="mt-2 text-sm opacity-60">בחר שיחה כדי להתחיל</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.main>
        </div>

        {/* Smart Insights Panel */}
        <section className="w-64 border-r border-[#1a1a1a] p-6 bg-[#0a0a0a] hidden lg:block">
          <h3 className="text-xs font-serif italic text-[#D4AF37] uppercase tracking-widest mb-6" style={{ color: settings.primaryColor }}>Smart Insights</h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase opacity-40 tracking-widest">Conversation Sentiment</label>
              <div className="flex space-x-1 gap-1">
                <div className="h-1 flex-1 bg-[#D4AF37]" style={{ backgroundColor: settings.primaryColor }}></div>
                <div className="h-1 flex-1 bg-[#D4AF37]" style={{ backgroundColor: settings.primaryColor }}></div>
                <div className="h-1 flex-1 opacity-20 bg-[#D4AF37]" style={{ backgroundColor: settings.primaryColor }}></div>
                <div className="h-1 flex-1 opacity-20 bg-[#D4AF37]" style={{ backgroundColor: settings.primaryColor }}></div>
              </div>
              <p className="text-[10px] italic font-serif opacity-80" style={{ color: settings.primaryColor }}>ממוקד • טכני</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase opacity-40 tracking-widest">Auto-Summary</label>
              <p className="text-xs leading-relaxed italic opacity-70">
                המשתמש בודק תאימות לגרסאות אנדרואיד ישנות ומתמקד באופטימיזציית זיכרון.
              </p>
            </div>

            <div className="p-4 border border-[#1a1a1a] bg-[#050505] rounded">
              <h4 className="text-[10px] uppercase mb-2 tracking-tight" style={{ color: settings.primaryColor }}>Advanced Action</h4>
              <button className="text-[10px] w-full py-2 bg-[#1a1a1a] border border-[#333] hover:bg-[#222] transition-colors uppercase tracking-widest" style={{ borderColor: settings.primaryColor + '40' }}>
                Generate Report
              </button>
            </div>

            <div className="mt-12">
              <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" style={{ background: `linear-gradient(to right, transparent, ${settings.primaryColor}30, transparent)` }}></div>
              <p className="text-center text-[9px] mt-4 opacity-20 uppercase tracking-[0.3em]">End of Stack</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
