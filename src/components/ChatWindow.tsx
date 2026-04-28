import React, { useState, useRef, useEffect } from 'react';
import { Send, Clock, Sparkles, ChevronLeft, Smile, Image as ImageIcon, X, Pin, VolumeX, Volume2, Lock, Unlock, Info, Mic, Share2, Copy, Forward, Check, CheckCheck, ArrowDown } from 'lucide-react';
import { Message, Conversation } from '../types';
import { cn, formatDate, copyToClipboard } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from '@google/genai';

// Correct AI initialization according to skill
const getAi = () => {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

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
  onForwardMessage?: (msg: Message, targetConvId: string) => void;
  conversations?: Conversation[];
  offlineMode?: boolean;
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
  onToggleLock,
  onForwardMessage,
  conversations = [],
  offlineMode
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
  const [isListening, setIsListening] = useState(false);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ msg: Message; x: number; y: number } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (inputText !== draft) {
      onDraftChange?.(inputText);
    }
  }, [inputText, onDraftChange, draft]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.senderId !== 'user' && !offlineMode) {
      generateAiSuggestions();
    }
  }, [messages.length, offlineMode]);

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
    if (!process.env.GEMINI_API_KEY) {
      setAiSuggestions(['שלום!', 'איך אפשר לעזור?', 'נדבר אחר כך.']);
      return;
    }

    setIsGeneratingAi(true);
    try {
      const ai = getAi();
      if (!ai) {
        setAiSuggestions(['הבנתי', 'תודה', 'בסדר גמור']);
        return;
      }
      const lastMessages = messages.slice(-5).map(m => `${m.senderName}: ${m.text}`).join('\n');
      const promptText = `Based on these messages:\n${lastMessages}\n\nSuggest 3 short, helpful replies in Hebrew for the user to send. Provide only the suggestions, one per line. Use natural, conversational Hebrew.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: promptText,
      });
      
      const text = response.text || '';
      const suggestions = text.split('\n').filter(s => s.trim().length > 0).slice(0, 3);
      setAiSuggestions(suggestions);
    } catch (err) {
      console.error('AI generation failed', err);
      setAiSuggestions(['הבנתי', 'תודה', 'בסדר גמור']);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAiAction = async (action: 'reply' | 'improve' | 'summarize') => {
    if (!process.env.GEMINI_API_KEY) {
      alert('Gemini API key is not configured. Please add it to your environment variables.');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const ai = getAi();
      if (!ai) {
        alert('Gemini API key is not configured. Please add it to your environment variables.');
        return;
      }
      if (action === 'summarize') {
        const textToSummarize = messages.map(m => `${m.senderName}: ${m.text}`).join('\n');
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `סכם את השיחה הבאה בעברית ב-2-3 משפטים:\n\n${textToSummarize}`
        });
        alert(`סיכום השיחה:\n${response.text}`);
      } else if (action === 'reply') {
        await generateAiSuggestions();
      } else if (action === 'improve' && inputText) {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: `שפר את הטקסט הבא שיהיה מקצועי ומרשים יותר בעברית:\n\n${inputText}`
        });
        setInputText(response.text || '');
      }
    } catch (err) {
      console.error('AI Error:', err);
      alert('אירעה שגיאה בשירות ה-AI. אנא נסה שוב מאוחר יותר.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const startTranscription = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('טרנסקריפציה קולית אינה נתמכת בדפדפן זה');
      return;
    }
    
    setIsListening(true);
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'he-IL';
    recognition.continuous = false;
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText(prev => prev + transcript);
      setIsListening(false);
    };
    
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    setContextMenu({
      msg,
      x: e.clientX,
      y: e.clientY
    });
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleCopyMessage = (text: string) => {
    copyToClipboard(text).then(() => {
      alert('ההודעה הועתקה ללוח');
    }).catch(() => {
      // Fallback alert if something goes wrong
    });
  };

  const handleForwardSelect = (convId: string) => {
    if (forwardMessage && onForwardMessage) {
      onForwardMessage(forwardMessage, convId);
      setForwardMessage(null);
      alert('ההודעה הועברה בהצלחה');
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
            {conversation.avatarUrl ? (
              <img src={conversation.avatarUrl} alt={conversation.contactName} className="w-full h-full rounded-full object-cover shadow-sm" />
            ) : (
              <span className={cn(
                "text-[10px] font-serif italic",
                theme === 'dark' ? "text-[#D4AF37]" : "text-blue-600"
              )}>{conversation.contactName[0]}</span>
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-serif italic leading-none truncate">{conversation.contactName}</h2>
            <div className="flex items-center gap-2 mt-1">
              {offlineMode ? (
                <p className="text-[8px] uppercase tracking-tighter text-orange-500 font-bold animate-pulse">ממתין לחיבור...</p>
              ) : (
                <p className={cn(
                  "text-[8px] uppercase tracking-tighter",
                  theme === 'dark' ? "text-[#D4AF37]" : "text-blue-600"
                )}>ערוץ מאובטח</p>
              )}
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
            onClick={() => handleAiAction('summarize')}
            disabled={isGeneratingAi}
            className={cn("p-2 transition-colors disabled:opacity-50 flex items-center gap-1", theme === 'dark' ? "hover:text-[#D4AF37]" : "hover:text-blue-600")}
            title="סכם שיחה"
          >
            <Sparkles className={cn("w-5 h-5 sm:w-4 sm:h-4", isGeneratingAi && "animate-pulse")} />
            <span className="hidden sm:inline text-[9px] font-bold">סכם</span>
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-4 space-y-3 relative"
      >
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
            layout
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.3, 
              ease: [0.23, 1, 0.32, 1],
              opacity: { duration: 0.2 }
            }}
            key={m.id}
            onContextMenu={(e) => handleContextMenu(e, m)}
            className={cn(
              "flex flex-col max-w-[75%] sm:max-w-[60%] space-y-0.5",
              m.senderId === 'user' ? "mr-auto items-end" : "ml-auto items-start"
            )}
          >
            <div className={cn(
              "px-2.5 py-1 rounded-lg border text-[11px] sm:text-xs leading-snug overflow-hidden relative group/msg",
              m.senderId === 'user' 
                ? theme === 'dark' ? "bg-[#1a1a1a] border-[#D4AF37]/20 text-[#D4AF37] rounded-br-none" : "bg-blue-600 border-blue-600 text-white rounded-br-none shadow-md"
                : theme === 'dark' ? "bg-[#121212] border-[#1a1a1a] text-[#e0e0e0] rounded-bl-none" : "bg-gray-100 border-gray-200 text-gray-800 rounded-bl-none"
            )}>
              {m.imageUrl && (
                <img src={m.imageUrl} alt="Attachment" className="max-w-full rounded-lg mb-1.5 border border-black/10" />
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
                    onClick={() => handleCopyMessage(m.text)}
                    className="p-1 rounded hover:bg-black/10 transition-all opacity-0 group-hover/msg:opacity-100"
                    title="העתק הודעה"
                  >
                    <Copy className="w-3 h-3 opacity-40 shrink-0" />
                  </button>
                  <button 
                    onClick={() => setForwardMessage(m)}
                    className="p-1 rounded hover:bg-black/10 transition-all opacity-0 group-hover/msg:opacity-100"
                    title="העבר הודעה"
                  >
                    <Forward className="w-3 h-3 opacity-40 shrink-0" />
                  </button>
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
                <span title={new Date(m.timestamp).toLocaleString('he-IL')}>{new Date(m.timestamp).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
                {m.senderId === 'user' && (
                  <div className="flex items-center ml-0.5" title={m.status === 'read' ? 'נקרא' : m.status === 'delivered' ? 'נמסר' : 'נשלח'}>
                    {m.status === 'read' ? (
                      <CheckCheck className={cn("w-3 h-3", theme === 'dark' ? "text-[#D4AF37]" : "text-blue-500")} />
                    ) : m.status === 'delivered' ? (
                      <CheckCheck className="w-3 h-3 opacity-40" />
                    ) : (
                      <Check className="w-3 h-3 opacity-40" />
                    )}
                  </div>
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

        {/* Typing Indicator */}
        <AnimatePresence>
          {conversation.isTyping && (
            <motion.div
              key="typing-indicator"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="flex items-center gap-2 mb-2 ml-auto"
            >
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 rounded-2xl rounded-bl-none border shadow-sm",
                theme === 'dark' ? "bg-[#121212] border-[#1a1a1a]" : "bg-gray-100 border-gray-200"
              )}>
                <div className="flex gap-1" key="typing-dots-container">
                  <motion.div
                    key="dot-1"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                    className={cn("w-1.5 h-1.5 rounded-full", theme === 'dark' ? "bg-[#D4AF37]" : "bg-blue-600")}
                  />
                  <motion.div
                    key="dot-2"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                    className={cn("w-1.5 h-1.5 rounded-full", theme === 'dark' ? "bg-[#D4AF37]" : "bg-blue-600")}
                  />
                  <motion.div
                    key="dot-3"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                    className={cn("w-1.5 h-1.5 rounded-full", theme === 'dark' ? "bg-[#D4AF37]" : "bg-blue-600")}
                  />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">מקליד...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />

        {/* Context Menu */}
        <AnimatePresence>
          {contextMenu && (
            <motion.div
              key="message-context-menu"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ 
                position: 'fixed', 
                top: Math.min(contextMenu.y, window.innerHeight - 200), 
                left: Math.min(contextMenu.x, window.innerWidth - 180),
                zIndex: 60 
              }}
              className={cn(
                "w-44 py-1 rounded-xl border shadow-2xl overflow-hidden",
                theme === 'dark' ? "bg-[#111] border-[#D4AF37]/30 text-white" : "bg-white border-gray-100 text-gray-900"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => { handleCopyMessage(contextMenu.msg.text); setContextMenu(null); }}
                className={cn(
                  "w-full px-4 py-2 text-right text-xs flex items-center justify-between hover:bg-black/5 transition-colors",
                  theme === 'dark' ? "hover:bg-white/5" : "hover:bg-gray-50"
                )}
              >
                <span>העתק</span>
                <Copy className="w-3.5 h-3.5 opacity-60" />
              </button>
              <button 
                onClick={() => { setForwardMessage(contextMenu.msg); setContextMenu(null); }}
                className={cn(
                  "w-full px-4 py-2 text-right text-xs flex items-center justify-between hover:bg-black/5 transition-colors",
                  theme === 'dark' ? "hover:bg-white/5" : "hover:bg-gray-50"
                )}
              >
                <span>העבר</span>
                <Forward className="w-3.5 h-3.5 opacity-60" />
              </button>
              <button 
                onClick={() => { setSelectedDetailMessage(contextMenu.msg); setContextMenu(null); }}
                className={cn(
                  "w-full px-4 py-2 text-right text-xs flex items-center justify-between hover:bg-black/5 transition-colors",
                  theme === 'dark' ? "hover:bg-white/5" : "hover:bg-gray-50"
                )}
              >
                <span>פרטים</span>
                <Info className="w-3.5 h-3.5 opacity-60" />
              </button>
              <div className={cn("h-px my-1", theme === 'dark' ? "bg-white/5" : "bg-gray-100")} />
              {contextMenu.msg.senderId === 'user' && (
                <button 
                  onClick={() => { onToggleLock?.(conversation.id, contextMenu.msg.id); setContextMenu(null); }}
                  className={cn(
                    "w-full px-4 py-2 text-right text-xs flex items-center justify-between hover:bg-black/5 transition-colors",
                    theme === 'dark' ? "hover:bg-white/5" : "hover:bg-gray-50"
                  )}
                >
                  <span>{contextMenu.msg.isLocked ? "בטל נעילה" : "נעל הודעה"}</span>
                  {contextMenu.msg.isLocked ? <Unlock className="w-3.5 h-3.5 opacity-60" /> : <Lock className="w-3.5 h-3.5 opacity-60" />}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll to Bottom Button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              key="scroll-to-bottom-btn"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              onClick={scrollToBottom}
              className={cn(
                "fixed bottom-32 left-1/2 -translate-x-1/2 z-20 p-2.5 rounded-full border shadow-2xl transition-all hover:scale-110",
                theme === 'dark' ? "bg-[#111] border-[#D4AF37]/30 text-[#D4AF37]" : "bg-white border-blue-600/30 text-blue-600"
              )}
            >
              <ArrowDown className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Suggestion Bar */}
      <AnimatePresence>
        {aiSuggestions.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0, y: 10 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className={cn(
              "border-t px-6 py-3 flex gap-2 overflow-x-auto scrollbar-none",
              theme === 'dark' ? "bg-[#0a0a0a] border-[#1a1a1a]" : "bg-gray-50 border-gray-100"
            )}
          >
            {aiSuggestions.map((s, i) => (
              <motion.button
                key={`ai-sugg-${i}-${s}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                onClick={() => { setInputText(s); setAiSuggestions([]); }}
                className={cn(
                  "whitespace-nowrap px-4 py-1.5 border rounded text-[10px] uppercase tracking-widest transition-colors shadow-sm",
                  theme === 'dark' ? "bg-[#121212] border-[#1a1a1a] text-[#D4AF37] hover:bg-[#1a1a1a]" : "bg-white border-gray-200 text-blue-600 hover:bg-white"
                )}
              >
                {s}
              </motion.button>
            ))}
            <button 
              onClick={() => generateAiSuggestions()}
              disabled={isGeneratingAi}
              className={cn(
                "p-2 transition-all",
                isGeneratingAi ? "text-blue-500 animate-spin" : "opacity-30 hover:opacity-60"
              )}
              title="רענן הצעות AI"
            >
              <Sparkles className="w-4 h-4" />
            </button>
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
              key="selected-image-preview"
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
            <motion.div key="emoji-picker-wrapper">
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setShowEmojis(false)}
              />
              <motion.div 
                 key="emoji-picker-dropdown"
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
                  {EMOJIS.map((emoji, idx) => (
                    <button 
                      key={`emoji-${emoji}-${idx}`}
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
            </motion.div>
          )}

          {showScheduler && (
            <motion.div 
              key="message-scheduler-panel"
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
            <button 
              onClick={startTranscription}
              className={cn(
                "p-2 transition-all",
                isListening ? "text-red-500 animate-pulse opacity-100" : "opacity-30 hover:opacity-60"
              )}
              title="שיכתוב קולי"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 min-w-0 relative flex flex-col">
            <input
              placeholder="הקלד הודעה..."
              className="bg-transparent flex-1 focus:outline-none text-base sm:text-sm py-4 w-full"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                const keyCode = e.keyCode || e.which;
                if ((e.key === 'Enter' || keyCode === 13 || keyCode === 23 || keyCode === 66) && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button 
              onClick={() => generateAiSuggestions()}
              disabled={isGeneratingAi}
              className={cn(
                "absolute left-2 top-1/2 -translate-y-1/2 p-2 opacity-30 hover:opacity-100 transition-opacity",
                isGeneratingAi && "animate-pulse opacity-100"
              )}
              title="קבל הצעות תגובה"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            {inputText.length > 0 && (
              <span className={cn(
                "absolute -bottom-2 right-0 text-[9px] sm:text-xs font-mono transition-all",
                inputText.length > 160 ? "text-red-500 font-bold opacity-100" : "opacity-40"
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

      {/* Forward Message Modal */}
      <AnimatePresence>
        {forwardMessage && (
          <div key="forward-target-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              key="forward-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setForwardMessage(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={cn(
                "relative w-full max-w-sm p-6 rounded-2xl border shadow-2xl space-y-6 text-right flex flex-col max-h-[70vh]",
                theme === 'dark' ? "bg-[#0a0a0a] border-[#1a1a1a] text-white" : "bg-white border-gray-100 text-gray-900"
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-serif italic uppercase tracking-widest opacity-60">העברת הודעה</h3>
                <button onClick={() => setForwardMessage(null)} className="p-1 opacity-40 hover:opacity-100">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 py-2">
                <p className="text-[10px] opacity-40 uppercase tracking-widest mb-2 font-bold">בחר איש קשר</p>
        {conversations.filter(c => c.id !== conversation.id).map((c) => (
                  <button
                    key={`fwd-${c.id}`}
                    onClick={() => handleForwardSelect(c.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-right",
                      theme === 'dark' ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full border flex items-center justify-center shrink-0",
                      theme === 'dark' ? "border-[#D4AF37] bg-black" : "border-blue-600 bg-white"
                    )}>
                      {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt={c.contactName} className="w-full h-full rounded-full object-cover shadow-sm" />
                      ) : (
                        <span className={cn(
                          "text-[10px] font-serif italic",
                          theme === 'dark' ? "text-[#D4AF37]" : "text-blue-600"
                        )}>{c.contactName[0]}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium">{c.contactName}</span>
                  </button>
                ))}
              </div>

              <div className={cn(
                "p-3 rounded-lg border text-[10px] leading-relaxed opacity-60 italic max-h-24 overflow-hidden",
                theme === 'dark' ? "bg-white/5 border-white/5" : "bg-gray-50 border-gray-100"
              )}>
                "{forwardMessage.text.length > 100 ? forwardMessage.text.slice(0, 100) + '...' : forwardMessage.text}"
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Message Details Modal */}
      <AnimatePresence>
        {selectedDetailMessage && (
          <div key="detail-modal-root" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              key="detail-overlay"
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
