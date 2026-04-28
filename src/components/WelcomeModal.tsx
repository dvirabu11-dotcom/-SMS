import { X, Sparkles, Shield, Zap, BarChart3, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  primaryColor: string;
  key?: string;
}

export function WelcomeModal({ isOpen, onClose, theme, primaryColor }: WelcomeModalProps) {
  if (!isOpen) return null;

  const features = [
    {
      title: "סיכומי בינה מלאכותית",
      description: "קבל תובנות מהירות וסיכומים אוטומטיים של ההתכתבויות שלך בלחיצת כפתור.",
      icon: <Sparkles className="w-5 h-5" />,
      color: primaryColor,
    },
    {
      title: "אבטחה מקצה לקצה",
      description: "ההודעות שלך מוצפנות ונשמרות באופן מקומי בלבד. הפרטיות שלך היא בראש סדר העדיפויות.",
      icon: <Shield className="w-5 h-5" />,
      color: "#10b981", // Emerald
    },
    {
      title: "שיפור ניסוח חכם",
      description: "ה-AI שלנו עוזר לך לכתוב הודעות מדויקות, מקצועיות ומרשימות יותר.",
      icon: <Zap className="w-5 h-5" />,
      color: "#3b82f6", // Blue
    },
    {
      title: "ניתוח תובנות מתקדם",
      description: "עקוב אחרי דפוסי השיחה שלך וקבל סטטיסטיקות בזמן אמת על סגנון התקשורת.",
      icon: <BarChart3 className="w-5 h-5" />,
      color: "#f59e0b", // Amber
    }
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      
      <div
        className={cn(
          "relative w-full max-w-2xl bg-opacity-95 rounded-3xl shadow-2xl border overflow-hidden",
          theme === 'dark' ? "bg-[#0a0a0a] border-[#1a1a1a] text-white" : "bg-white border-gray-100 text-gray-900"
        )}
        dir="rtl"
      >
        {/* Header Decoration */}
        <div 
          className="absolute top-0 right-0 w-full h-1"
          style={{ backgroundColor: primaryColor }}
        />

        <div className="p-8 sm:p-10">
          <div className="flex justify-between items-start mb-8">
            <div className="space-y-1">
              <h2 className="text-3xl font-serif italic flex items-center gap-3">
                ברוכים הבאים ל- <span style={{ color: primaryColor }}>SmartMsg AI</span>
              </h2>
              <p className="text-sm opacity-60">הדור הבא של התקשורת החכמה כבר כאן.</p>
            </div>
            <button 
              onClick={onClose}
              className={cn(
                "p-2 rounded-full transition-colors",
                theme === 'dark' ? "hover:bg-white/5" : "hover:bg-gray-100"
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className={cn(
                  "p-5 rounded-2xl border transition-all hover:translate-y-[-2px]",
                  theme === 'dark' ? "bg-[#121212] border-[#1a1a1a]/50" : "bg-gray-50 border-gray-100"
                )}
              >
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-opacity-10"
                  style={{ backgroundColor: `${feature.color}15`, color: feature.color }}
                >
                  {feature.icon}
                </div>
                <h4 className="font-bold text-sm mb-2">{feature.title}</h4>
                <p className="text-xs opacity-60 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={onClose}
              className="w-full sm:flex-1 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor, color: 'white' }}
            >
              <CheckCircle2 className="w-4 h-4" />
              בואו נתחיל
            </button>
            <p className="text-[10px] opacity-40 text-center sm:text-right px-2 italic">
              בלחיצה על הכפתור הנך מסכים לתנאי השימוש ומדיניות הפרטיות שלנו.
            </p>
          </div>
        </div>

        {/* Technical Accent Backdrop */}
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-[100px] opacity-20 pointer-events-none" style={{ backgroundColor: primaryColor }} />
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[80px] opacity-10 pointer-events-none" style={{ backgroundColor: primaryColor }} />
      </div>
    </div>
  );
}
