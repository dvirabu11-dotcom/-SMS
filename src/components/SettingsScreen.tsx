import React from 'react';
import { X, Sun, Moon, Bell, Monitor, Lock, Shield, User, Smartphone, Globe, Info, LogOut } from 'lucide-react';
import { AppSettings } from '../types';
import { cn } from '../lib/utils';

interface SettingsScreenProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  key?: string;
}

export function SettingsScreen({ isOpen, onClose, settings, setSettings }: SettingsScreenProps) {
  const [activeTab, setActiveTab] = React.useState<'profile' | 'appearance' | 'notifications' | 'privacy'>('profile');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'profile', label: 'פרופיל', icon: User },
    { id: 'appearance', label: 'מראה', icon: Sun },
    { id: 'notifications', label: 'התראות', icon: Bell },
    { id: 'privacy', label: 'פרטיות', icon: Shield },
  ];

  const primaryColors = [
    '#D4AF37', '#14b8a6', '#0ea5e9', '#3b82f6', '#10b981', '#a855f7', 
    '#f43f5e', '#f59e0b', '#84cc16', '#6366f1', '#ec4899', '#64748b'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/80"
      />
      <div 
        className={cn(
          "relative w-full max-w-4xl h-full sm:h-[80vh] flex flex-col sm:flex-row overflow-hidden sm:rounded-2xl border shadow-2xl transition-colors duration-300",
          settings.theme === 'dark' ? "bg-[#0a0a0a] border-[#1a1a1a] text-[#e0e0e0]" : "bg-white border-gray-100 text-gray-900"
        )}
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        {/* Sidebar Navigation */}
        <div className={cn(
          "w-full sm:w-64 border-l p-6 shrink-0",
          settings.theme === 'dark' ? "bg-[#111] border-[#1a1a1a]" : "bg-gray-50 border-gray-100"
        )}>
          <div className="flex items-center justify-between sm:block mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#D4AF37]/10" style={{ backgroundColor: `${settings.primaryColor}20` }}>
                <Globe className="w-5 h-5" style={{ color: settings.primaryColor }} />
              </div>
              <div>
                <h2 className="text-lg font-bold">הגדרות</h2>
                <p className="text-[10px] opacity-40 uppercase tracking-widest">ממשק משתמש</p>
              </div>
            </div>
            <button onClick={onClose} className="sm:hidden p-2 hover:bg-black/10 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="space-y-1">
            {tabs.map((tab, idx) => (
              <button
                key={`${tab.id}-${idx}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  activeTab === tab.id 
                    ? (settings.theme === 'dark' ? "bg-white/5 text-white" : "bg-white shadow-sm text-blue-600")
                    : "opacity-40 hover:opacity-100 hover:bg-white/5"
                )}
                style={activeTab === tab.id ? { color: settings.primaryColor } : {}}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-white/5 hidden sm:block">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all">
              <LogOut className="w-4 h-4" />
              התנתקות
            </button>
            <div className="px-4 py-4 mt-4">
              <p className="text-[10px] opacity-30">SmartMsg AI v1.2.0</p>
              <p className="text-[10px] opacity-30">© 2024 כל הזכויות שמורות</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold">
              {tabs.find(t => t.id === activeTab)?.label}
            </h3>
            <button onClick={onClose} className="hidden sm:block p-2 hover:bg-black/10 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Main content logic */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleAvatarChange} 
                  />
                  <div className="w-24 h-24 rounded-full border-4 border-[#1a1a1a] bg-gradient-to-tr from-[#111] to-[#222] flex items-center justify-center overflow-hidden">
                     {settings.avatarUrl ? (
                       <img src={settings.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                     ) : (
                       <span className="text-3xl font-serif italic text-white/20">ME</span>
                     )}
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full text-xs text-white font-bold"
                  >
                    ערוך
                  </button>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-bold">מנכ"ל המערכת</h4>
                  <p className="text-sm opacity-40">admin@smartmsg.ai</p>
                  <span className="inline-block px-2 py-0.5 rounded bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-widest mt-1">מאומת</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold opacity-30 uppercase tracking-widest">שם מלא</label>
                  <input 
                    type="text" 
                    defaultValue="ישראל ישראלי" 
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border bg-transparent outline-none focus:ring-2 transition-all",
                      settings.theme === 'dark' ? "border-white/10 focus:ring-[#D4AF37]/50" : "border-gray-200 focus:ring-blue-500/50"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold opacity-30 uppercase tracking-widest">מספר טלפון</label>
                  <input 
                    type="text" 
                    defaultValue="050-0000000" 
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border bg-transparent outline-none focus:ring-2 transition-all",
                      settings.theme === 'dark' ? "border-white/10 focus:ring-[#D4AF37]/50" : "border-gray-200 focus:ring-blue-500/50"
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-10 animate-in fade-in duration-300">
              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-widest opacity-40">מצב כהה</h4>
                <div className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5">
                  <span className="text-sm font-bold">הפעל מצב כהה</span>
                  <button 
                    onClick={() => setSettings(s => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      settings.theme === 'dark' ? "bg-blue-600" : "bg-gray-600"
                    )}
                  >
                    <div className={cn("absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm", settings.theme === 'dark' && "translate-x-6")} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-widest opacity-40">ערכת נושא</h4>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setSettings(s => ({ ...s, theme: 'light' }))}
                    className={cn(
                      "flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all",
                      settings.theme === 'light' ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20" : "border-white/5 bg-white/5 opacity-50 hover:opacity-100"
                    )}
                  >
                    <Sun className="w-8 h-8 text-yellow-500" />
                    <span className="font-bold text-sm">יום</span>
                  </button>
                  <button 
                    onClick={() => setSettings(s => ({ ...s, theme: 'dark' }))}
                    className={cn(
                      "flex flex-col items-center gap-3 p-6 rounded-2xl border transition-all",
                      settings.theme === 'dark' ? "border-[#D4AF37] bg-[#D4AF37]/5 ring-2 ring-[#D4AF37]/20" : "border-white/5 bg-white/5 opacity-50 hover:opacity-100"
                    )}
                  >
                    <Moon className="w-8 h-8 text-blue-400" />
                    <span className="font-bold text-sm">לילה</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-widest opacity-40">צבע מותג אישי</h4>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-3">
                  {primaryColors.map((c, idx) => (
                    <button 
                      key={`color-${c}-${idx}`} 
                      className={cn(
                        "aspect-square rounded-full border-2 transition-all hover:scale-110", 
                        settings.primaryColor === c ? "border-white scale-110 shadow-lg ring-4 ring-white/10" : "border-transparent opacity-40 hover:opacity-100"
                      )}
                      style={{ backgroundColor: c }}
                      onClick={() => setSettings(s => ({ ...s, primaryColor: c }))}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-widest opacity-40">סוג גופן</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'Inter', name: 'Original', desc: 'Classic & Legible' },
                    { id: "'Space Grotesk'", name: 'Modern', desc: 'Tech Friendly' },
                    { id: "'Playfair Display'", name: 'Editorial', desc: 'Classic Serif' }
                  ].map((font, idx) => (
                    <button 
                      key={`font-${font.id}-${idx}`}
                      onClick={() => setSettings(s => ({ ...s, fontFamily: font.id }))}
                      className={cn(
                        "p-4 rounded-xl border text-right transition-all",
                        settings.fontFamily === font.id 
                          ? (settings.theme === 'dark' ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-blue-500 bg-blue-50")
                          : "border-white/5 bg-white/5 hover:border-white/20"
                      )}
                    >
                      <div className="font-bold text-sm" style={{ fontFamily: font.id }}>{font.name}</div>
                      <div className="text-[10px] opacity-40 mt-1">{font.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-10 animate-in fade-in duration-300">
               <div className="space-y-6">
                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div>
                    <h4 className="font-bold">רטט בהתראה</h4>
                    <p className="text-xs opacity-40">הפעל רטט קצר בכל קבלת הודעה חדשה</p>
                  </div>
                  <button 
                    onClick={() => setSettings(s => ({ ...s, enableVibration: !s.enableVibration }))}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      settings.enableVibration ? "bg-green-500" : "bg-gray-600"
                    )}
                  >
                    <div className={cn("absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm", settings.enableVibration && "translate-x-6")} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div>
                    <h4 className="font-bold">קריאה אוטומטית</h4>
                    <p className="text-xs opacity-40">סמן הודעות כנקראו ברגע שנכנסים לשיחה</p>
                  </div>
                  <button 
                    onClick={() => setSettings(s => ({ ...s, autoRead: !s.autoRead }))}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      settings.autoRead ? "bg-green-500" : "bg-gray-600"
                    )}
                  >
                    <div className={cn("absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm", settings.autoRead && "translate-x-6")} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div>
                    <h4 className="font-bold">מצב לא מקוון</h4>
                    <p className="text-xs opacity-40">הצג את הממשק במצב לא מקוון לבדיקה</p>
                  </div>
                  <button 
                    onClick={() => setSettings(s => ({ ...s, offlineMode: !s.offlineMode }))}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      settings.offlineMode ? "bg-orange-500" : "bg-gray-600"
                    )}
                  >
                    <div className={cn("absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm", settings.offlineMode && "translate-x-6")} />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-white/5">
                  <div>
                    <h4 className="font-bold">התרעות חירום (CBS)</h4>
                    <p className="text-xs opacity-40">קבלת התרעות בזמן אמת על פי מיקומך</p>
                  </div>
                  <button 
                    onClick={() => setSettings(s => ({ ...s, cbsAlerts: !s.cbsAlerts }))}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      settings.cbsAlerts ? "bg-red-500" : "bg-gray-600"
                    )}
                  >
                    <div className={cn("absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm", settings.cbsAlerts && "translate-x-6")} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-widest opacity-40">משך הצגת התראה</h4>
                <div className="space-y-2">
                   <div className="justify-between flex text-xs font-bold opacity-60">
                    <span>{settings.notificationDuration} שניות</span>
                    <span className="opacity-40">10 שניות</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" step="1" 
                    value={settings.notificationDuration}
                    onChange={e => setSettings(s => ({ ...s, notificationDuration: parseInt(e.target.value) }))}
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer overflow-hidden outline-none"
                    style={{ accentColor: settings.primaryColor }}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
                <div className="flex items-center gap-3 text-[#D4AF37]" style={{ color: settings.primaryColor }}>
                  <Lock className="w-5 h-5" />
                  <h4 className="font-bold">הצפנה מקצה לקצה</h4>
                </div>
                <p className="text-sm opacity-60 leading-relaxed">ההודעות שלך מאובטחות ומוצפנות. אף אחד, גם לא המערכת, יכול לקרוא את תוכן ההודעות שלך ללא הרשאה.</p>
                <button className="text-xs font-bold px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors uppercase tracking-widest">למד עוד</button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 opacity-40" />
                    <div>
                      <h4 className="text-sm font-bold">נעילה באמצעות קוד</h4>
                      <p className="text-xs opacity-40 font-mono">Status: INACTIVE</p>
                    </div>
                  </div>
                  <button className="text-[10px] font-bold px-3 py-1 rounded bg-[#D4AF37]/20 text-[#D4AF37]" style={{ color: settings.primaryColor, backgroundColor: `${settings.primaryColor}20` }}>הפעל</button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 opacity-40" />
                    <div>
                      <h4 className="text-sm font-bold">סנכרון מכשירים</h4>
                      <p className="text-xs opacity-40 font-mono">1 Active device</p>
                    </div>
                  </div>
                  <button className="text-[10px] font-bold px-3 py-1 rounded bg-red-500/20 text-red-500">נתק הכל</button>
                </div>
              </div>

              <div className="pt-8 space-y-4">
                <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest">אזור מסוכן</h4>
                <button className="w-full sm:w-auto px-6 py-3 rounded-xl border border-red-500/30 text-red-500 text-sm font-bold hover:bg-red-500/10 transition-all">מחק חשבון ונתוני מערכת</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
