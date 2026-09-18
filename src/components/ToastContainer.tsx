import React from 'react';
import { useStore } from '../context/StoreContext';
import { CheckCircle2, Info, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ToastContainer: React.FC = () => {
  const { toasts } = useStore();

  return (
    <div
      id="toast-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`pointer-events-auto flex items-center gap-3 p-4 rounded-2xl shadow-lg border backdrop-blur-md transition-all ${
              toast.type === 'error'
                ? 'bg-[#FFF0F0] border-[#F8D7DA] text-[#842029]'
                : toast.type === 'info'
                ? 'bg-[#FFF8F0] border-[#EAD5C5] text-[#5B3A29]'
                : 'bg-[#FFF8F0] border-[#E8D4C8] text-[#5B3A29]'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-[#842029] shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-5 h-5 text-[#708238] shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-[#708238] shrink-0" />
            )}
            <p className="text-sm font-medium leading-snug">{toast.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
