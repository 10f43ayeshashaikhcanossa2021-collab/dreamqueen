import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles, Send, CheckCircle2 } from 'lucide-react';

export const Newsletter: React.FC = () => {
  const { showToast } = useStore();
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    setIsSubscribed(true);
    showToast('Subscribed! Use code DREAM10 at checkout for 10% off ✨');
  };

  return (
    <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="relative rounded-3xl bg-gradient-to-r from-[#FFF8F0] via-[#FDF3E7] to-[#FCECEE] p-8 sm:p-12 border border-[#EAD5C5] shadow-sm text-center overflow-hidden">
        {/* Ambient background sparkle */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#F8D7DA]/60 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#FFF3A8]/40 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/80 border border-[#EAD5C5] text-xs font-semibold text-[#8B4052] mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#D4A017]" />
            <span>Join the DreamQueen Crochet Club</span>
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#5B3A29]">
            Never Miss a Handmade Drop
          </h2>

          <p className="text-sm text-[#6E6863] mt-2 mb-6">
            Subscribe for early bird access to limited-edition seasonal crochet drops, DIY crochet tutorials, and an instant <strong>10% off</strong> voucher code.
          </p>

          {isSubscribed ? (
            <div className="bg-white/90 border border-[#D5E5BC] rounded-2xl p-4 flex items-center justify-center gap-2 text-[#4A5D1E] max-w-md mx-auto">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-semibold">
                Welcome to the family! Use code <strong>DREAM10</strong> on your next order.
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
              <input
                type="email"
                required
                placeholder="Enter your email address..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-5 py-3 rounded-full bg-white border border-[#EAD5C5] text-sm text-[#2E2E2E] placeholder-[#8C7A6B] focus:outline-none focus:ring-2 focus:ring-[#5B3A29]/20 focus:border-[#5B3A29] shadow-xs"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-full bg-[#5B3A29] hover:bg-[#43291B] text-white font-medium text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 shrink-0"
              >
                <span>Subscribe</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          <p className="text-[11px] text-[#9C948D] mt-3">
            No spam, ever. Only cozy crochet love & discount gifts. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
};
