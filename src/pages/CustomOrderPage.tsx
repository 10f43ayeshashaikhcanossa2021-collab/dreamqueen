import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Sparkles,
  Upload,
  MessageCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { safeImage } from '../utils/imageHelper';
import { uploadImageToBucket, validateImageUploadFile } from '../lib/supabase';
import { isValidIndianPhone } from '../utils/pricing';

export const CustomOrderPage: React.FC = () => {
  const { submitCustomOrder, currentUser, openAuthModal, showToast } = useStore();

  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [category, setCategory] = useState('Keychains & Amigurumi');
  const [colorPreference, setColorPreference] = useState('Pastel Pink & Sage Green');
  const [size, setSize] = useState('Medium (approx 8-12 cm)');
  const [budget, setBudget] = useState('₹150 - ₹300');
  const [deliveryDatePreference, setDeliveryDatePreference] = useState('Standard 7 Days');
  const [referenceImageUrl, setReferenceImageUrl] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (currentUser) {
      if (!customerName) setCustomerName(currentUser.name);
      if (!email) setEmail(currentUser.email);
      if (!phone) setPhone(currentUser.phone);
    }
  }, [currentUser]);

  const sampleInspirations = [
    '/assets/aistudio/rose_bag_crochet____dm_to_order_on_8097706536_e6644b1f.jpg',
    '/assets/aistudio/WhatsApp_Image_2026-11-10_at_6.57.38_PM_51e04cb2.jpeg',
    '/assets/aistudio/WhatsApp_Image_2026-11-10_at_6.57.37_PM__1__b69ab62b.jpeg'
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageUploadFile(file);
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }

    if (!currentUser) {
      showToast('Please sign in first to upload a custom reference image.', 'info');
      openAuthModal('custom_order');
      return;
    }

    setIsUploading(true);
    try {
      const { publicUrl, error } = await uploadImageToBucket(
        'custom-order-references',
        file,
        currentUser.id
      );
      if (error || !publicUrl) {
        showToast(error || 'Upload failed. Ensure custom-order-references bucket exists.', 'error');
        return;
      }
      setReferenceImageUrl(publicUrl);
      showToast('Reference image uploaded to studio storage!');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || !message.trim()) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    if (!isValidIndianPhone(phone)) {
      showToast('Please enter a valid 10-digit Indian WhatsApp number', 'error');
      return;
    }

    if (!currentUser) {
      showToast('Please sign in or create an account to submit your bespoke order', 'info');
      openAuthModal('custom_order');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitCustomOrder({
        userId: currentUser.id,
        customerName: customerName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        category,
        colorPreference,
        size,
        budget,
        deliveryDatePreference,
        referenceImageUrl: referenceImageUrl || sampleInspirations[0],
        message: message.trim()
      });

      setIsSubmitted(true);
      showToast('Custom inquiry received! Our artisan will WhatsApp you within 2 hours.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="text-xs font-handwriting text-2xl text-[#708238] block font-semibold">
          Artisan Atelier
        </span>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#5B3A29]">
          Bespoke Custom Crochet Orders
        </h1>
        <p className="text-xs sm:text-sm text-[#6E6863] mt-2">
          Saw something lovely on Pinterest? Share your pin or vision with our master crochet artisans and let’s turn yarn into your dream piece.
        </p>
      </div>

      {isSubmitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl border border-[#EAD5C5] p-8 sm:p-12 text-center space-y-4 shadow-md max-w-lg mx-auto"
        >
          <div className="w-16 h-16 rounded-full bg-[#E8F0DC] text-[#4A5D1E] flex items-center justify-center mx-auto border-2 border-[#D5E5BC]">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="font-heading text-2xl font-bold text-[#5B3A29]">
            Inquiry Received with Love!
          </h2>
          <p className="text-xs text-[#6E6863] leading-relaxed">
            Our artisan has received your custom crochet design specs. We will reach out on your WhatsApp (<strong>{phone}</strong>) within 2-4 hours to confirm yarn shades, final pricing, and start hooking!
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`https://wa.me/918097706536?text=${encodeURIComponent(
                `Hi DreamQueen, I just submitted a custom crochet order for ${customerName}!`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#25D366] text-white text-xs font-semibold hover:bg-[#1EBE5D] transition shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Direct WhatsApp Chat</span>
            </a>

            <button
              onClick={() => setIsSubmitted(false)}
              className="px-6 py-3 rounded-full bg-[#FFF8F0] border border-[#EAD5C5] text-[#5B3A29] text-xs font-semibold hover:bg-[#F8D7DA]/40 transition cursor-pointer"
            >
              Submit Another Idea
            </button>
          </div>
        </motion.div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-[#EAD5C5] shadow-md p-6 sm:p-10 space-y-6"
        >
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#708238] mb-3">
              1. Your Contact Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#55504C] mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#55504C] mb-1">
                  WhatsApp Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 8097706536"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#55504C] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F0DFD1]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#708238] mb-3">
              2. Reference Picture / Inspiration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block p-4 rounded-2xl border-2 border-dashed border-[#EAD5C5] bg-[#FFF8F0] hover:bg-[#F8D7DA]/30 cursor-pointer text-center transition">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 text-[#5B3A29] mx-auto mb-1.5 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6 text-[#5B3A29] mx-auto mb-1.5" />
                  )}
                  <span className="text-xs font-semibold text-[#5B3A29] block">
                    {isUploading ? 'Uploading to Storage...' : 'Upload Reference Screenshot or Photo'}
                  </span>
                  <span className="text-[10px] text-[#8C7A6B]">
                    JPG, PNG or WEBP up to 5 MB
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>

                {Boolean(referenceImageUrl?.trim()) && (
                  <div className="mt-2 flex items-center gap-2">
                    <img
                      src={safeImage(referenceImageUrl)}
                      alt="Uploaded Reference"
                      className="w-12 h-12 rounded-lg object-cover border border-[#EAD5C5]"
                    />
                    <span className="text-xs text-[#708238] font-medium">Reference image attached</span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-[11px] text-[#8C7A6B] block mb-1">
                  Or pick a style inspiration sample:
                </span>
                <div className="flex gap-2">
                  {sampleInspirations.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReferenceImageUrl(img)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                        referenceImageUrl === img
                          ? 'border-[#5B3A29] scale-105'
                          : 'border-[#EAD5C5] opacity-75'
                      }`}
                    >
                      <img src={safeImage(img)} alt="sample" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F0DFD1] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#708238] mb-1">
              3. Design Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#55504C] mb-1">
                  Item Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
                >
                  <option value="Keychains & Amigurumi">Keychains & Amigurumi Charms</option>
                  <option value="Hair Accessories">Hair Clips, Ties & Headbands</option>
                  <option value="Flowers & Bouquets">Everlasting Flower Bouquets</option>
                  <option value="Bookmarks">Bookmarks & Book Thongs</option>
                  <option value="Pouches & Bags">Mini Coin Pouches & Bags</option>
                  <option value="Home Decor">Coasters & Mug Rugs</option>
                  <option value="Other">Other Unique Design</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#55504C] mb-1">
                  Yarn Color Preferences
                </label>
                <input
                  type="text"
                  value={colorPreference}
                  onChange={(e) => setColorPreference(e.target.value)}
                  placeholder="e.g. Pastel Lilac, Milk White, Forest Green"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#55504C] mb-1">
                  Desired Size
                </label>
                <input
                  type="text"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="e.g. Small (5cm), Medium (10cm), 15cm"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#55504C] mb-1">
                  Target Budget
                </label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
                >
                  <option value="₹50 - ₹150">₹50 - ₹150 (Clips / Small Keychains)</option>
                  <option value="₹150 - ₹300">₹150 - ₹300 (Detailed Charms / Pouches)</option>
                  <option value="₹300 - ₹600">₹300 - ₹600 (Bouquets / Multi-piece Sets)</option>
                  <option value="₹600+">₹600+ (Elaborate Custom Plush / Bulk Favors)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#55504C] mb-1">
                  Delivery Preference
                </label>
                <input
                  type="text"
                  value={deliveryDatePreference}
                  onChange={(e) => setDeliveryDatePreference(e.target.value)}
                  placeholder="e.g. Delivered within 7 Days, or Needed before Oct 15th Birthday"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#EAD5C5] bg-[#FDF9F4] focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#F0DFD1]">
            <label className="block text-xs font-semibold text-[#55504C] mb-1">
              Tell the Artisan About Your Vision *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Describe details like shape, personalization, initial letters, beads, or any special requests..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3.5 text-xs rounded-2xl border border-[#EAD5C5] bg-[#FDF9F4] focus:outline-none focus:ring-1 focus:ring-[#5B3A29]"
            />
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <p className="text-[11px] text-[#8C7A6B]">
              No advance required until you approve the yarn sample &amp; design quote.
            </p>

            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-8 py-3.5 rounded-full bg-[#5B3A29] hover:bg-[#43291B] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-[#D4A017]" />
              )}
              <span>{isSubmitting ? 'Submitting...' : 'Submit Custom Request'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
