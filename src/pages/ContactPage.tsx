import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  MessageCircle,
  Pin,
  Mail,
  Clock,
  MapPin,
  HelpCircle,
  Send,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Heart
} from 'lucide-react';
import { motion } from 'motion/react';

export const ContactPage: React.FC = () => {
  const { showToast } = useStore();

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How long does delivery take?',
      a: 'We proudly fulfill our promise of delivery within 7 Days across India! Once your order is handcrafted with organic milk cotton yarn (takes 1-2 days), it is packaged in aesthetic eco wrap and shipped via Shiprocket express courier with live tracking updates.'
    },
    {
      q: 'What yarn do you use for your crochet products?',
      a: 'We exclusively weave with 100% premium 5-ply organic milk cotton yarn. It is ultra-soft, hypoallergenic, colorfast, and does not pill or irritate sensitive skin, making it perfect for hair accessories and baby keepsakes.'
    },
    {
      q: 'How do I care for and wash my crochet pieces?',
      a: 'We recommend gentle hand washing in cool water with mild shampoo or liquid detergent. Gently press out excess water with a clean dry towel and lay flat in the shade to dry. Never wring, tumble dry, or machine wash on harsh spin.'
    },
    {
      q: 'Can I request a custom crochet design from Pinterest?',
      a: 'Yes, absolutely! Head to our Custom Orders page or send us a picture on WhatsApp. We can make custom bouquets, plush amigurumi, initial letters, phone charms, and themed favor gifts.'
    },
    {
      q: 'What is your return or replacement policy?',
      a: 'Since every crochet piece is handmade with meticulous slow craft, we do not accept arbitrary returns. However, if your order arrives damaged during transit or has an error, we provide an immediate 100% free artisan replacement.'
    }
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactMessage) return;
    showToast('Message sent! Our artisan team will reply via email or WhatsApp within a few hours 🌸');
    setContactName('');
    setContactEmail('');
    setContactMessage('');
  };

  return (
    <div className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-handwriting text-2xl text-[#708238] block font-semibold">
          Get in Touch
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#5B3A29]">
          Artisan Atelier & Customer Care
        </h1>
        <p className="text-xs sm:text-sm text-[#6E6863] mt-2">
          Have a question about an order, custom commission, or wholesale wedding favors? We’d love to talk to you.
        </p>
      </div>

      {/* Contact Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* WhatsApp */}
        <div className="p-6 rounded-3xl bg-white border border-[#EAD5C5] shadow-xs text-center space-y-3 flex flex-col justify-between">
          <div className="w-12 h-12 rounded-2xl bg-[#E8F8EE] text-[#25D366] flex items-center justify-center mx-auto">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-[#2E2E2E]">WhatsApp Chat</h3>
            <p className="text-xs text-[#6E6863] mt-1">
              Fastest response for order status, custom photos & inquiries.
            </p>
          </div>
          <a
            href="https://wa.me/918097706536?text=Hello%20DreamQueen!%20I%20have%20an%20inquiry%20regarding%20handmade%20crochet."
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 rounded-full bg-[#25D366] text-white text-xs font-semibold hover:bg-[#1EBE5D] transition shadow-xs"
          >
            Chat +91 8097706536
          </a>
        </div>

        {/* Pinterest */}
        <div className="p-6 rounded-3xl bg-white border border-[#EAD5C5] shadow-xs text-center space-y-3 flex flex-col justify-between">
          <div className="w-12 h-12 rounded-2xl bg-[#FEE2E2] text-[#E60023] flex items-center justify-center mx-auto">
            <Pin className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-[#2E2E2E]">Pinterest Inspiration</h3>
            <p className="text-xs text-[#6E6863] mt-1">
              Explore aesthetic crochet moodboards, yarn ideas & craft lookbooks.
            </p>
          </div>
          <a
            href="https://in.pinterest.com/ayeshalk2025/?actingBusinessId=1147221842487308120"
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 rounded-full bg-[#E60023] text-white text-xs font-semibold hover:bg-[#C8001F] transition shadow-xs flex items-center justify-center gap-1.5"
          >
            <Pin className="w-3.5 h-3.5" />
            <span>@ayeshalk2025 on Pinterest</span>
          </a>
        </div>

        {/* Atelier Hours */}
        <div className="p-6 rounded-3xl bg-white border border-[#EAD5C5] shadow-xs text-center space-y-3 flex flex-col justify-between">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF3A8] text-[#855D00] flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading text-base font-bold text-[#2E2E2E]">Artisan Hours</h3>
            <p className="text-xs text-[#6E6863] mt-1">
              Monday to Saturday: 10:00 AM – 7:00 PM IST (Sundays reserved for family craft)
            </p>
          </div>
          <div className="text-xs font-semibold text-[#708238] py-2">
            Studio in Mumbai & Pune, India
          </div>
        </div>
      </div>

      {/* Message Form & Story Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Contact Form */}
        <div className="bg-white rounded-3xl border border-[#EAD5C5] p-6 sm:p-8 shadow-xs space-y-4">
          <h3 className="font-heading text-xl font-bold text-[#5B3A29]">
            Send an Artisan a Note
          </h3>
          <p className="text-xs text-[#6E6863]">
            We read and reply to every message with love.
          </p>

          <form onSubmit={handleSendMessage} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-[#55504C] mb-1">Your Name *</label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#55504C] mb-1">Email / Phone *</label>
              <input
                type="text"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#55504C] mb-1">Message *</label>
              <textarea
                required
                rows={4}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="What can we craft for you?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-[#5B3A29] hover:bg-[#43291B] text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Message</span>
            </button>
          </form>
        </div>

        {/* Brand Story Box */}
        <div className="bg-[#FFF8F0] rounded-3xl border border-[#EAD5C5] p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌸</span>
            <h3 className="font-heading text-xl font-bold text-[#5B3A29]">
              The DreamQueen Philosophy
            </h3>
          </div>

          <p className="text-xs text-[#55504C] leading-relaxed">
            In a world dominated by mass factory production, DreamQueen was founded to preserve the warmth of mindful, tactile needlework. Every stitch in our flower clips, rose keychains, and amigurumi dolls is crafted row-by-row by passionate women artisans.
          </p>

          <p className="text-xs text-[#55504C] leading-relaxed">
            We believe gifting should feel intimate and thoughtful. That’s why each parcel is packed in eco-friendly kraft tissue, decorated with sweet stickers, and sprinkled with scented lavender sprigs.
          </p>

          <div className="pt-2 border-t border-[#EAD5C5] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white text-[#708238] border border-[#EAD5C5]">
              <Heart className="w-5 h-5 fill-[#708238]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#5B3A29]">Slow Fashion & Fair Wages</h4>
              <p className="text-[11px] text-[#6E6863]">
                Empowering independent home-based women artisans across India.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="pt-8 border-t border-[#EAD5C5] space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <HelpCircle className="w-8 h-8 text-[#708238] mx-auto mb-2" />
          <h3 className="font-heading text-2xl font-bold text-[#5B3A29]">
            Frequently Asked Questions
          </h3>
          <p className="text-xs text-[#6E6863] mt-1">
            Everything you need to know about ordering, shipping, and yarn care.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-[#EAD5C5] overflow-hidden shadow-2xs"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-[#5B3A29] hover:bg-[#FFF8F0] transition"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#8C7A6B] transition-transform duration-200 ${
                    openFaq === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-xs text-[#55504C] leading-relaxed border-t border-[#F0DFD1] pt-3 bg-[#FFFDFB]">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
