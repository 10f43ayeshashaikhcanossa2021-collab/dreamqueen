import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, Download, Smartphone } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface UpiQrCardProps {
  amount?: number;
  orderNumber?: string;
  className?: string;
  showActions?: boolean;
}

export const UpiQrCard: React.FC<UpiQrCardProps> = ({
  amount,
  orderNumber,
  className = '',
  showActions = true
}) => {
  const { showToast, storeSettings } = useStore();
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const payeeVpa = storeSettings.upiId || '8097706536@postbank';
  const payeeName = storeSettings.upiPayeeName || 'AYESHA LUKMAN SHAIKH';

  const upiUrl = amount
    ? `upi://pay?pa=${encodeURIComponent(payeeVpa)}&pn=${encodeURIComponent(payeeName)}&am=${amount.toFixed(
        2
      )}&cu=INR${orderNumber ? `&tn=${encodeURIComponent(`DreamQueen Order ${orderNumber}`)}` : ''}`
    : `upi://pay?pa=${encodeURIComponent(payeeVpa)}&pn=${encodeURIComponent(payeeName)}&cu=INR`;

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(upiUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#2E2E2E',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [upiUrl]);

  const handleCopyVpa = async () => {
    try {
      await navigator.clipboard.writeText(payeeVpa);
      setCopied(true);
      showToast(`UPI ID ${payeeVpa} copied to clipboard`, 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast(`UPI ID: ${payeeVpa}`);
    }
  };

  return (
    <div
      className={`bg-white rounded-3xl border-2 border-[#EAD5C5] shadow-md p-5 text-center flex flex-col items-center max-w-sm mx-auto ${className}`}
    >
      {/* India Post Payments Bank Header */}
      <div className="w-full flex items-center justify-center gap-3 pb-3 border-b border-[#F5EBE1]">
        <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
          <div className="w-9 h-11 bg-[#B72832] rounded-full flex items-center justify-center relative shadow-2xs">
            <svg
              className="absolute -top-1 -left-1 w-11 h-11 pointer-events-none"
              viewBox="0 0 44 44"
              fill="none"
            >
              <path
                d="M 2 36 C 14 30, 26 14, 38 6"
                stroke="#EFB22D"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 6 39 C 18 34, 28 18, 40 10"
                stroke="#EFB22D"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        <div className="text-left flex items-center gap-2">
          <div>
            <div className="text-xs font-black text-[#8B2332] tracking-tight leading-tight">
              इंडिया पोस्ट
            </div>
            <div className="text-xs font-black text-[#8B2332] tracking-tight leading-tight">
              पेमेंट्स बैंक
            </div>
          </div>
          <div className="h-7 w-[1.5px] bg-[#A07078]" />
          <div>
            <div className="text-[11px] font-bold text-[#6E2430] leading-tight">India Post</div>
            <div className="text-[11px] font-bold text-[#6E2430] leading-tight">
              Payments Bank
            </div>
          </div>
        </div>
      </div>

      {/* Subtitle */}
      <div className="py-2.5">
        <h4 className="text-xs sm:text-sm font-semibold text-[#424242] tracking-wide">
          {orderNumber ? `Pay for Order ${orderNumber}` : 'Scan this QR Code'}
        </h4>
        {amount ? (
          <div className="mt-1 px-3 py-1 rounded-full bg-[#FFF8F0] border border-[#EAD5C5] inline-block text-xs font-bold font-price text-[#5B3A29]">
            Amount to Pay: ₹{amount}
          </div>
        ) : (
          <span className="text-[11px] text-[#6E6863]">
            Works with Google Pay, PhonePe, Paytm & any UPI app
          </span>
        )}
      </div>

      {/* Dynamic Order-Specific QR Code */}
      <div className="p-3 bg-white rounded-2xl border border-[#EAD5C5] shadow-inner my-1 relative group">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`UPI QR Code for ${payeeName}${amount ? ` - ₹${amount}` : ''}`}
            className="w-52 h-52 object-contain rounded-lg"
          />
        ) : (
          <img
            src="/upi-qr-matrix.png"
            alt={`UPI QR Scanner for ${payeeName}`}
            className="w-52 h-52 object-contain rounded-lg"
          />
        )}
      </div>

      {/* Payee Info */}
      <div className="pt-2 text-center">
        <div className="font-heading font-bold text-sm sm:text-base text-[#2E2E2E] tracking-wide">
          {payeeName}
        </div>
        <div className="font-mono text-xs font-bold text-[#5B3A29] mt-0.5 bg-[#FFF8F0] px-3 py-1 rounded-lg border border-[#EAD5C5]/70 inline-block">
          {payeeVpa}
        </div>
      </div>

      {/* Powered by UPI */}
      <div className="pt-3 pb-1 flex flex-col items-center">
        <span className="text-[8px] font-bold text-[#6E6863] tracking-widest uppercase">
          POWERED BY
        </span>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="font-black italic text-sm tracking-wider text-[#333333]">UPI</span>
          <div className="flex items-center -space-x-1">
            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[7px] border-l-[#E57200]" />
            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[7px] border-l-[#008752]" />
          </div>
        </div>
      </div>

      {showActions && (
        <div className="w-full pt-3 mt-2 border-t border-[#F5EBE1] grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={handleCopyVpa}
            className="py-2 px-3 rounded-xl border border-[#EAD5C5] bg-[#FFF8F0] hover:bg-[#F3E5D8] text-[#5B3A29] font-bold flex items-center justify-center gap-1.5 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#708238]" />
                <span className="text-[#708238]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy UPI ID</span>
              </>
            )}
          </button>

          <a
            href={upiUrl}
            className="py-2 px-3 rounded-xl bg-[#5B3A29] hover:bg-[#43291B] text-white font-bold flex items-center justify-center gap-1.5 transition shadow-2xs"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Open in App</span>
          </a>

          <a
            href={qrDataUrl || '/upi-scanner.svg'}
            download={orderNumber ? `dreamqueen-upi-${orderNumber}.png` : 'dreamqueen-upi-qr.png'}
            className="col-span-2 py-1.5 rounded-lg text-[11px] text-[#6E6863] hover:text-[#5B3A29] flex items-center justify-center gap-1 hover:underline transition"
          >
            <Download className="w-3 h-3" />
            <span>Download QR Code</span>
          </a>
        </div>
      )}
    </div>
  );
};
