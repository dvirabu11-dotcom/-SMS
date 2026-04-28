import React from 'react';
import { X, Phone, Mail, MapPin, User } from 'lucide-react';
import { Conversation } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ContactDetailsProps {
  conversation: Conversation;
  theme: 'dark' | 'light';
  onClose: () => void;
}

export function ContactDetails({ conversation, theme, onClose }: ContactDetailsProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "w-full max-w-sm rounded-3xl p-6 shadow-2xl border",
            theme === 'dark' ? "bg-[#111] border-[#222]" : "bg-white border-gray-100"
          )}
        >
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl font-serif italic">פרטי איש קשר</h3>
            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
              <X className="w-5 h-5 opacity-50" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className={cn(
              "w-24 h-24 rounded-full border-4 flex items-center justify-center text-3xl font-serif italic",
              theme === 'dark' ? "border-[#D4AF37] bg-[#1a1a1a] text-[#D4AF37]" : "border-blue-600 bg-gray-50 text-blue-600"
            )}>
              {conversation.avatarUrl ? (
                <img src={conversation.avatarUrl} alt={conversation.contactName} className="w-full h-full rounded-full object-cover" />
              ) : (
                conversation.contactName[0]
              )}
            </div>
            <h2 className="text-2xl font-bold mt-2">{conversation.contactName}</h2>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5">
              <Phone className="w-5 h-5 opacity-40" />
              <span className="text-sm">050-1234567</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5">
              <Mail className="w-5 h-5 opacity-40" />
              <span className="text-sm text-blue-500">contact@example.com</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/5">
              <MapPin className="w-5 h-5 opacity-40" />
              <span className="text-sm">תל אביב, ישראל</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
