import React from 'react';
import { X, ShieldCheck, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UpiQrCard } from './UpiQrCard';

interface UpiScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpiScannerModal: React.FC<UpiScannerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          className="relative bg-[#FDF9F4] w-full max-w-md rounded-3xl shadow-2xl border border-[#EAD5C5] overflow-hidden p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-[#8C7A6B] hover:text-[#5B3A29] hover:bg-[#F8D7DA]/50 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="text-center pr-6">
            <span className="text-xs font-bold text-[#708238] uppercase tracking-wider block">
              Official DreamQueen Payment Scanner
            </span>
            <h3 className="font-heading text-xl font-bold text-[#5B3A29]">
              Scan to Pay via Any UPI App
            </h3>
            <p className="text-xs text-[#6E6863] mt-1">
              Supports Google Pay, PhonePe, Paytm, BHIM & PostBank mobile banking
            </p>
          </div>

          {/* Real QR Card */}
          <UpiQrCard showActions={true} />

          {/* Trust Guarantee Note */}
          <div className="p-3 bg-[#E8F0DC]/70 rounded-2xl border border-[#D5E2C4] flex items-center gap-2.5 text-left">
            <ShieldCheck className="w-5 h-5 text-[#4A5D1E] shrink-0" />
            <div className="text-[11px] text-[#4A5D1E] leading-relaxed">
              <strong>Verified Atelier Account:</strong> Payments directly credit DreamQueen’s India Post Payments Bank account with zero processing markup.
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
