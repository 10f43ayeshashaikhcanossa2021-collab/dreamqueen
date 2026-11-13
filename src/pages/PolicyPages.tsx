import React from 'react';
import { useStore } from '../context/StoreContext';
import { ArrowLeft, ShieldCheck, Truck, RefreshCw, FileText } from 'lucide-react';

interface PolicyPageProps {
  policyType: 'privacy' | 'terms' | 'shipping' | 'refunds';
}

export const PolicyPages: React.FC<PolicyPageProps> = ({ policyType }) => {
  const { setActiveTab } = useStore();

  const configs = {
    privacy: {
      title: 'Privacy Policy',
      icon: ShieldCheck,
      updated: 'November 2026',
      sections: [
        {
          heading: '1. Information We Collect',
          body: 'When you browse DreamQueen Atelier, place an order, or create an account, we collect your name, email address, 10-digit mobile number, and shipping address exclusively to fulfill your handmade crochet order, issue invoices, and send delivery updates.'
        },
        {
          heading: '2. Security & Payment Privacy',
          body: 'Customer accounts are authenticated securely via Supabase Auth with encrypted credentials. We never store your passwords in browser storage, and online payments are verified via official UPI reference checks or Razorpay cryptographic signatures without storing card details on our servers.'
        },
        {
          heading: '3. Data Usage & Contact',
          body: 'We do not sell, rent, or trade your personal details with third-party advertisers. For data access or deletion requests, email ayeshalk2025@gmail.com or write to Room No. 30, Building No. 47, Anarya Co. Op. Housing Society, Mahim (East).'
        }
      ]
    },
    terms: {
      title: 'Terms & Conditions',
      icon: FileText,
      updated: 'November 2026',
      sections: [
        {
          heading: '1. Handmade Artisan Craftsmanship',
          body: 'Every DreamQueen piece is crocheted by hand using organic milk cotton yarn. Subtle variations in stitch tension or petal symmetry are natural hallmarks of authentic handcraft and make each item one of a kind.'
        },
        {
          heading: '2. Pricing, Taxes & Order Verification',
          body: 'All product prices are listed in Indian Rupees (INR). Shipping fees (₹20 standard under ₹499, free at ₹499+) and Cash on Delivery fees (₹10) are validated on our server prior to order confirmation. Direct UPI QR payments remain pending until verified against bank settlement.'
        },
        {
          heading: '3. Intellectual Property',
          body: 'All original crochet photography, product descriptions, and DreamQueen Atelier branding remain the property of DreamQueen Atelier and may not be reproduced commercially without written permission.'
        }
      ]
    },
    shipping: {
      title: 'Shipping & Delivery Policy',
      icon: Truck,
      updated: 'November 2026',
      sections: [
        {
          heading: '1. Crafting & Dispatch Timeline',
          body: 'Ready-to-ship items dispatch within 24–48 business hours. Custom crochet requests or multi-piece bundles are crafted to order within 1–3 business days and shipped across India to arrive within 7 days.'
        },
        {
          heading: '2. Shipping Rates Across India',
          body: 'Standard tracked shipping across India is ₹20 for orders below ₹499, and completely FREE on orders of ₹499 and above. Cash on Delivery orders include a ₹10 COD handling charge.'
        },
        {
          heading: '3. Live Tracking',
          body: 'Every parcel receives an order reference number (e.g. DQ-XXXXXX) and tracking update inside your Customer Account as well as on the private Order Tracking page.'
        }
      ]
    },
    refunds: {
      title: 'Cancellation & Refund Policy',
      icon: RefreshCw,
      updated: 'November 2026',
      sections: [
        {
          heading: '1. Order Cancellations',
          body: 'Orders may be cancelled directly from your Customer Account before packing and courier dispatch (while in Order Placed, Payment Pending, or Preparing status). Any paid inventory is restored automatically.'
        },
        {
          heading: '2. Undamaged Craft Guarantee & Replacements',
          body: 'If an item arrives damaged in transit or differs from your selected variation, notify us within 48 hours of delivery with an unboxing photograph via ayeshalk2025@gmail.com or WhatsApp +91 8097706536 for a 100% free replacement or refund.'
        },
        {
          heading: '3. Refund Processing',
          body: 'Approved refunds for Razorpay orders are returned to your original payment method within 5–7 business days. UPI QR refunds are transferred back to the originating UPI handle after verification.'
        }
      ]
    }
  };

  const current = configs[policyType];
  const Icon = current.icon;

  return (
    <div className="py-12 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <button
        onClick={() => setActiveTab('home')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5B3A29] hover:underline"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
      </button>

      <div className="bg-white rounded-3xl border border-[#EAD5C5] p-6 sm:p-10 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#F0DFD1]">
          <div className="w-11 h-11 rounded-2xl bg-[#FFF8F0] border border-[#EAD5C5] flex items-center justify-center text-[#5B3A29]">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#5B3A29]">
              {current.title}
            </h1>
            <span className="text-[11px] text-[#6E6863]">Last updated: {current.updated}</span>
          </div>
        </div>

        <div className="space-y-5">
          {current.sections.map((sec) => (
            <div key={sec.heading} className="space-y-1.5">
              <h2 className="font-heading text-base font-bold text-[#5B3A29]">{sec.heading}</h2>
              <p className="text-xs sm:text-sm text-[#55504C] leading-relaxed">{sec.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
