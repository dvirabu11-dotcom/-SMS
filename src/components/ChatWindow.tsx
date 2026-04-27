import React, { useState, useRef, useEffect } from 'react';
import { Send, Clock, Sparkles, ChevronLeft, Smile, Image as ImageIcon, X, Pin, VolumeX, Volume2, Lock, Unlock, Info } from 'lucide-react';
import { Message, Conversation } from '../types';
import { cn, formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';

// Simple check for API key
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  onSendMessage: (text: string, scheduledFor?: number, imageUrl?: string) => void;
  onTogglePin?: (id: string) => void;
  onToggleMute?: (id: string) => void;
  key?: string;
  onBack?: () => void;
  theme: 'dark' | 'light';
  primaryColor?: string;
  draft?: string;
  onDraftChange?: (val: string) => void;
  onToggleLock?: (convId: string, msgId: string) => void;
}

const EMOJIS = ['😀', '😂', '😍', '👍', '🙏', '🔥', '🤔', '😎', '😢', '👇', '✅', '❤️'];

export function ChatWindow({ 
  conversation, 
  messages, 
  onSendMessage, 
  onTogglePin,
  onToggleMute,
  onBack,
  theme,
  primaryColor = '#D4AF37',
  draft = '',
  onDraftChange,
  onToggleLock
}: ChatWindowProps) {
  const [inputText, setInputText] = useState(draft);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedDetailMessage, setSelectedDetailMessage] = useState<Message | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (inputText !== draft) {
      onDraftChange?.(inputText);
    }
  }, [inputText, onDraftChange, draft]);

  const handleSend = () => {
    if (!inputText.trim() && !selectedImage) return;
    
    let scheduledTimestamp: number | undefined;
    if (showScheduler && scheduledDate && scheduledTime) {
      scheduledTimestamp = new Date(`${scheduledDate}T${scheduledTime}`).getTime();
    }

    onSendMessage(inputText, scheduledTimestamp, selectedImage || undefined);
    setInputText('');
    setSelectedImage(null);
    setShowScheduler(false);
    setShowEmojis(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateAiSuggestions = async () => {
    if (!ai) {
      setAiSuggestions(['שלום!', 'איך אפשר לעזור?', 'נדבר אחר כך.']);
      return;
    }

    setIsGeneratingAi(true);
    try {
      const lastMessages = messages.slice(-5).map(m => `${m.senderName}: ${m.text}`).join('\n');
      const prompt = `Based on these messages:\n${lastMessages}\n\nSuggest 3 short, helpful replies in Hebrew for the user to send. Provide only the suggestions, one per line. Use natural, conversational Hebrew.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      const suggestions = (response.text || '').split('\n').filter(s => s.trim().length > 0).slice(0, 3);
      setAiSuggestions(suggestions);
    } catch (err) {
      console.error('AI generation failed', err);
      setAiSuggestions(['הבנתי', 'תודה', 'בסדר גמור']);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full transition-colors duration-300",
      theme === 'dark' ? "bg-[#050505]" : "bg-white"
    )}>
      {/* Header */}
      <header className={cn(
        "h-16 sm:h-16 px-4 border-b flex items-center justify-between sticky top-0 z-10 shrink-0 gap-2",
        theme === 'dark' ? "bg-[#080808] border-[#1a1a1a]" : "bg-white border-gray-100 shadow-sm"
      )}>
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onBack && (
            <button onClick={onBack} className={cn("p-2 -mr-2 sm:hidden", theme === 'dark' ? "text-[#D4AF37]" : "text-blue-600")}>
              <ChevronLeft className="w-6 h-6 flip-rtl" />
            </button>
          )}
          <div className={cn(
            "w-8 h-8 rounded-full border flex items-center justify-center shrink-0",
            theme === 'dark' ? "border-[#D4AF37] bg-[#1a1a1a]" : "border-blue-600 bg-gray-50"
          )}>
            <span className={cn(
              "text-[10px] font-serif italic",
              theme === 'dark' ? "text-[#D4AF37]" : "text-blue-600"
            )}>{conversation.contactName[0]}</span>
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-serif italic leading-none truncate">{conversation.contactName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className={cn(
                "text-[8px] uppercase tracking-tighter",
                theme === 'dark' ? "text-[#D4AF37]" : "text-blue-600"
              )}>ערוץ מאובטח</p>
              <span className="text-[7px] opacity-30">•</span>
              <p className="text-[8px] opacity-40 uppercase tracking-tighter">{messages.length} הודעות</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 sm:gap-4 text-xs uppercase tracking-widest items-center shrink-0">
          <button 
            onClick={() => onToggleMute?.(conversation.id)}
            className={cn(
              "p-2 rounded-full transition-colors",
              theme === 'dark' ? "hover:bg-white/10" : "hover:bg-gray-100"
            )}
            title={conversation.isMuted ? "בטל השתקה" : "השתק שיחה"}
          >
            {conversation.isMuted ? <Volume2 className="w-5 h-5 sm:w-4 sm:h-4 text-gray-500" /> : <VolumeX className="w-5 h-5 sm:w-4 sm:h-4 text-gray-500" />}
          </button>
          <button 
            onClick={() => onTogglePin?.(conversation.id)}
            className={cn(
              "p-2 rounded-full transition-colors",
              theme === 'dark' ? "hover:bg-white/10" : "hover:bg-gray-100"
            )}
            title={conversation.isPinned ? "בטל נעיצה" : "נעץ שיחה"}
          >
            <Pin className={cn("w-5 h-5 sm:w-4 sm:h-4 transition-colors", conversation.isPinned ? "text-[#D4AF37]" : "text-gray-500")} style={conversation.isPinned && theme === 'dark' ? { color: primaryColor } : {}} />
          </button>
           <button 
            onClick={generateAiSuggestions}
            disabled={isGeneratingAi}
            className={cn("p-2 transition-colors disabled:opacity-50", theme === 'dark' ? "hover:text-[#D4AF37]" : "hover:text-blue-600")}
            title="עוזר AI"
          >
            <Sparkles className={cn("w-5 h-5 sm:w-4 sm:h-4", isGeneratingAi && "animate-pulse")} />
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
        <div className="flex justify-center mb-8">
          <span className={cn(
            "text-[10px] uppercase tracking-[0.2em] px-3 py-1 border rounded-full",
            theme === 'dark' ? "border-[#1a1a1a] text-[#D4AF37] bg-[#0a0a0a]" : "border-gray-100 text-blue-600 bg-gray-50"
          )}>
            שיחה מוצפנת מקצה לקצה
          </span>
        </div>

        {messages.map((m) => (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            key={m.id}
            className={cn(
              "flex flex-col max-w-[85%] sm:max-w-[70%] space-y-1",
              m.senderId === 'user' ? "mr-auto items-end" : "ml-auto items-start"
            )}
          >
            <div className={cn(
              "px-4 py-3 rounded-xl border text-sm leading-relaxed overflow-hidden relative group/msg",
              m.senderId === 'user' 
                ? theme === 'dark' ? "bg-[#1a1a1a] border-[#D4AF37]/20 text-[#D4AF37] rounded-br-none" : "bg-blue-600 border-blue-600 text-white rounded-br-none shadow-md"
                : theme === 'dark' ? "bg-[#121212] border-[#1a1a1a] text-[#e0e0e0] rounded-bl-none" : "bg-gray-100 border-gray-200 text-gray-800 rounded-bl-none"
            )}>
              {m.imageUrl && (
                <img src={m.imageUrl} alt="Attachment" className="max-w-full rounded-lg mb-2 border border-black/10" />
              )}
              <div className="flex justify-between items-start gap-2">
                <span className="flex-1">{m.text}</span>
                <div className="flex flex-col gap-1 items-center">
                  {m.senderId === 'user' && (
                    <button 
                      onClick={() => onToggleLock?.(conversation.id, m.id)}
                      className={cn(
                        "p-1 rounded hover:bg-black/10 transition-all opacity-0 group-hover/msg:opacity-100",
                        m.isLocked && "opacity-100"
                      )}
                    >
                      {m.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 opacity-30" />}
                    </button>
                  )}
                  <button 
                    onClick={() => setSelectedDetailMessage(m)}
                    className="p-1 rounded hover:bg-black/10 transition-all opacity-0 group-hover/msg:opacity-100"
                  >
                    <Info className="w-3 h-3 opacity-40 shrink-0" />
                  </button>
                </div>
              </div>
              <div className="mt-1 flex items-center justify-end gap-1.5 opacity-70 text-[9px] font-medium">
                {m.isLocked && <Lock className="w-2.5 h-2.5 mr-auto opacity-40" />}
                <span>{new Date(m.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
                {m.senderId === 'user' && (
                  <span className={cn(
                    "flex items-center",
                    m.status === 'read' ? (theme === 'dark' ? "text-[#D4AF37]" : "text-blue-500") : "text-current opacity-40"
                  )}>
                    {m.status === 'read' ? '✓✓' : m.status === 'delivered' ? '✓✓' : m.status === 'sent' ? '✓' : ''}
                  </span>
                )}
              </div>
              {m.isScheduled && (
                <div className="mt-2 flex items-center gap-1 opacity-50 text-[9px] uppercase tracking-wider">
                  <Clock className="w-3 h-3" />
                  <span>תוזמן ל: {formatDate(m.scheduledFor!)}</span>
                </div>
              )}
            </div>
            <span className="text-[9px] opacity-30 px-1 uppercase tracking-tighter">
              {formatDate(m.timestamp)}
            </span>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Bar */}
      <AnimatePresence>
        {aiSuggestions.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={cn(
              "border-t px-6 py-3 flex gap-2 overflow-x-auto scrollbar-none",
              theme === 'dark' ? "bg-[#0a0a0a] border-[#1a1a1a]" : "bg-gray-50 border-gray-100"
            )}
          >
            {aiSuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => { setInputText(s); setAiSuggestions([]); }}
                className={cn(
                  "whitespace-nowrap px-4 py-1.5 border rounded text-[10px] uppercase tracking-widest transition-colors shadow-sm",
                  theme === 'dark' ? "bg-[#121212] border-[#1a1a1a] text-[#D4AF37] hover:bg-[#1a1a1a]" : "bg-white border-gray-200 text-blue-600 hover:bg-white"
                )}
              >
                {s}
              </button>
            ))}
            <button 
              onClick={() => setAiSuggestions([])}
              className={cn("opacity-40 hover:opacity-100", theme === 'dark' ? "text-[#D4AF37]" : "text-blue-600")}
            >
              <ChevronLeft className="w-4 h-4 flip-rtl" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className={cn(
        "p-4 sm:p-6 border-t transition-colors relative",
        theme === 'dark' ? "bg-[#080808] border-[#1a1a1a]" : "bg-gray-50 border-gray-200"
      )}>
        {/* Panels */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 relative group"
            >
              <div className="relative inline-block">
                <img src={selectedImage} alt="Preview" className="h-24 w-auto rounded border-2 border-current shadow-lg" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}

          {showEmojis && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setShowEmojis(false)}
              />
              <motion.div 
                 initial={{ opacity: 0, y: 10, scale: 0.95 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: 10, scale: 0.95 }}
                 className={cn(
                   "absolute bottom-full left-4 mb-4 p-4 rounded-2xl border flex flex-col gap-3 shadow-2xl z-40 w-[240px]",
                   theme === 'dark' ? "bg-[#0f0f0f] border-[#222]" : "bg-white border-gray-200"
                 )}
              >
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold">אימוג'י</span>
                  <button onClick={() => setShowEmojis(false)} className="p-1 hover:bg-black/5 rounded-full transition-colors">
                    <X className="w-3 h-3 opacity-40" />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {EMOJIS.map(emoji => (
                    <button 
                      key={emoji}
                      onClick={() => { 
                        setInputText(prev => prev + emoji);
                      }}
                      className="text-2xl hover:scale-125 transition-transform p-3 hover:bg-black/5 dark:hover:bg-white/10 rounded-xl"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}

          {showScheduler && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={cn(
                "mb-4 rounded border p-4 flex flex-wrap gap-4 items-end shadow-xl",
                theme === 'dark' ? "bg-[#0a0a0a] border-[#D4AF37]/20" : "bg-white border-blue-600/20"
              )}
            >
              <div className="flex-1 space-y-1">
                <label className={cn("text-[9px] font-bold uppercase tracking-widest", theme === 'dark' ? "text-[#D4AF37]" : "text-blue-600")}>תאריך שידור</label>
                <input 
                  type="date" 
                  className={cn(
                    "w-full border rounded px-3 py-2 text-xs outline-none focus:border-current/40",
                    theme === 'dark' ? "bg-[#121212] border-[#1a1a1a] text-[#e0e0e0]" : "bg-gray-50 border-gray-200 text-gray-900"
                  )}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-1">
                <label className={cn("text-[9px] font-bold uppercase tracking-widest", theme === 'dark' ? "text-[#D4AF37]" : "text-blue-600")}>זמן שידור</label>
                <input 
                  type="time" 
                  className={cn(
                    "w-full border rounded px-3 py-2 text-xs outline-none focus:border-current/40",
                    theme === 'dark' ? "bg-[#121212] border-[#1a1a1a] text-[#e0e0e0]" : "bg-gray-50 border-gray-200 text-gray-900"
                  )}
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setShowScheduler(false)}
                className={cn("px-4 py-2 text-xs border tracking-widest uppercase", theme === 'dark' ? "bg-[#1a1a1a] border-[#333]" : "bg-gray-100 border-gray-300")}
              >
                ביטול
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={cn(
          "flex items-center gap-2 sm:gap-4 border rounded px-2 sm:px-4 py-1 transition-colors shadow-inner",
          theme === 'dark' ? "bg-[#121212] border-[#1a1a1a]" : "bg-white border-gray-200"
        )}>
          <div className="flex gap-1 shrink-0">
            <button 
              onClick={() => setShowScheduler(!showScheduler)}
              className={cn(
                "p-2 transition-all",
                showScheduler ? theme === 'dark' ? "text-[#D4AF37]" : "text-blue-600" : "opacity-30 hover:opacity-60"
              )}
            >
              <Clock className="w-4 h-4" />
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 opacity-30 hover:opacity-60 transition-all"
            >
              <ImageIcon className="w-4 h-4" />
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </button>
            <button 
              onClick={() => setShowEmojis(!showEmojis)}
              className={cn(
                "p-2 transition-all",
                showEmojis ? theme === 'dark' ? "text-[#D4AF37]" : "text-blue-600" : "opacity-30 hover:opacity-60"
              )}
            >
              <Smile className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 min-w-0 relative flex flex-col">
            <input
              placeholder="הקלד הודעה..."
              className="bg-transparent flex-1 focus:outline-none text-base sm:text-sm py-4 w-full"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            {inputText.length > 0 && (
              <span className={cn(
                "absolute -bottom-1.5 right-0 text-[7px] uppercase tracking-widest font-mono transition-all",
                inputText.length > 160 ? "text-red-500 opacity-100" : "opacity-30"
              )}>
                {inputText.length}/160
              </span>
            )}
          </div>

          <button 
            onClick={handleSend}
            disabled={!inputText.trim() && !selectedImage}
            className={cn(
              "flex items-center justify-center p-3 sm:p-3 disabled:opacity-20 hover:opacity-80 transition-all shrink-0 min-w-[44px] min-h-[44px]",
              theme === 'dark' ? "text-[#D4AF37]" : "text-blue-600"
            )}
          >
            <Send className="w-6 h-6 sm:w-5 sm:h-5 flip-rtl" />
          </button>
        </div>
      </div>

      {/* Message Details Modal */}
      <AnimatePresence>
        {selectedDetailMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDetailMessage(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={cn(
                "relative w-full max-w-xs p-6 rounded-2xl border shadow-2xl space-y-6",
                theme === 'dark' ? "bg-[#0a0a0a] border-[#1a1a1a] text-white" : "bg-white border-gray-100 text-gray-900"
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-serif italic uppercase tracking-widest opacity-60">פרטי הודעה</h3>
                <button 
                  onClick={() => setSelectedDetailMessage(null)}
                  className="p-1 opacity-40 hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2 rounded-full",
                    theme === 'dark' ? "bg-white/5" : "bg-gray-50"
                  )}>
                    <Send className="w-4 h-4 opacity-50" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider opacity-40">נשלח</p>
                    <p className="text-xs font-mono">
                      {new Date(selectedDetailMessage.sentAt || selectedDetailMessage.timestamp).toLocaleString('he-IL')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2 rounded-full",
                    theme === 'dark' ? "bg-white/5" : "bg-gray-50"
                  )}>
                    <Clock className="w-4 h-4 opacity-50" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider opacity-40">נמסר</p>
                    <p className="text-xs font-mono">
                      {selectedDetailMessage.deliveredAt 
                        ? new Date(selectedDetailMessage.deliveredAt).toLocaleString('he-IL') 
                        : 'ממתין...'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2 rounded-full",
                    theme === 'dark' ? "bg-white/5" : "bg-gray-50"
                  )}>
                    <Smile className="w-4 h-4 opacity-50" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wider opacity-40">נקרא</p>
                    <p className="text-xs font-mono">
                      {selectedDetailMessage.readAt 
                        ? new Date(selectedDetailMessage.readAt).toLocaleString('he-IL') 
                        : (selectedDetailMessage.status === 'read' ? 'נקרא' : 'טרם נקרא')}
                    </p>
                  </div>
                </div>
              </div>

              <div className={cn(
                "p-3 rounded-lg border text-[10px] leading-relaxed opacity-60 italic",
                theme === 'dark' ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"
              )}>
                "{selectedDetailMessage.text.length > 50 ? selectedDetailMessage.text.slice(0, 50) + '...' : selectedDetailMessage.text}"
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
