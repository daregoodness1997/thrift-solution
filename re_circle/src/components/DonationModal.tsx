import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Leaf, HelpCircle, Check, Trash2, Heart } from 'lucide-react';
import { ListingCategory, Listing } from '../types';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddListing: (listing: Listing) => void;
}

export const DonationModal: React.FC<DonationModalProps> = ({
  isOpen,
  onClose,
  onAddListing
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  
  // Form States
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ListingCategory>('Clothing');
  const [condition, setCondition] = useState<'New' | 'Excellent' | 'Gently Used' | 'Distressed'>('Gently Used');
  const [size, setSize] = useState('');
  const [price, setPrice] = useState('25');
  const [tag, setTag] = useState<'VINTAGE' | 'RARE' | 'HANDMADE' | 'ESSENTIAL' | 'UNIQUE'>('ESSENTIAL');
  const [donorName, setDonorName] = useState('Eco Neighbour');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Drag and Drop States
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Dynamic CO2 saved calculation based on category
  const getCO2Estimate = (cat: ListingCategory): number => {
    switch (cat) {
      case 'Clothing': return 18;
      case 'Furniture': return 45;
      case 'Accessories': return 12;
      case 'Home Goods': return 8;
    }
  };

  const currentCO2Estimate = getCO2Estimate(category);

  // Handle Drag Events
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleUploadAreaClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const newListing: Listing = {
      id: `custom-${Date.now()}`,
      title: title.trim(),
      category,
      condition,
      size: size.trim() || undefined,
      price: Math.max(1, Number(price) || 5),
      description: description.trim(),
      image: imagePreview || undefined,
      tag,
      donorName: donorName.trim() || 'Eco Neighbour',
      date: new Date().toISOString().split('T')[0],
      co2Saved: currentCO2Estimate,
      status: 'Available'
    };

    onAddListing(newListing);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setCategory('Clothing');
    setCondition('Gently Used');
    setSize('');
    setPrice('25');
    setTag('ESSENTIAL');
    setDonorName('Eco Neighbour');
    setDescription('');
    setImagePreview(null);
    setStep(1);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          id="donation-modal-backdrop"
        />

        {/* Content Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative bg-[#FDFDFC] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] z-10"
          id="donation-modal-card"
        >
          {/* Header */}
          <div className="p-6 border-b border-[#EAEAEA] flex items-center justify-between bg-white shrink-0">
            <div>
              <span className="text-[#4A5D4E] uppercase tracking-widest text-[9px] font-bold">
                Circular economy
              </span>
              <h2 className="text-xl font-light text-[#1A1A1A] tracking-tight">
                Donate to the Marketplace
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-50 border border-[#EAEAEA] text-[#717171] hover:text-[#2D2D2D] flex items-center justify-center cursor-pointer hover:shadow-xs transition-all active:scale-95"
              id="btn-close-donation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
            {step === 1 ? (
              /* STEP 1: Core details & Categories */
              <div className="p-6 space-y-5 flex-1">
                {/* Category Selection */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block mb-2">
                    1. Select Category
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {(['Clothing', 'Furniture', 'Accessories', 'Home Goods'] as ListingCategory[]).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`py-3 px-1 rounded-xl text-xs font-medium text-center border transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                          category === cat
                            ? 'bg-[#F5F7F5] border-[#4A5D4E] text-[#4A5D4E] shadow-xs'
                            : 'bg-white border-[#EAEAEA] text-[#717171] hover:border-[#CCC]'
                        }`}
                        id={`category-btn-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <span className="font-sans text-xs">{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Real-time environmental impact score preview */}
                <div className="bg-[#F5F7F5] rounded-2xl p-3.5 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#4A5D4E] shadow-xs shrink-0 mt-0.5">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#4A5D4E] uppercase tracking-wider font-mono">
                      Dynamic Offset Preview
                    </h4>
                    <p className="text-[#666] text-[11px] leading-relaxed font-light mt-0.5">
                      By keeping a <strong className="font-semibold text-[#4A5D4E]">{category}</strong> item in motion, you save approximately <strong className="font-bold text-[#1A1A1A] font-mono">{currentCO2Estimate} kg</strong> of CO₂ emissions required to manufacture a brand-new replacement.
                    </p>
                  </div>
                </div>

                {/* Name of item */}
                <div>
                  <label htmlFor="item-title-input" className="text-[10px] uppercase tracking-widest text-[#999] font-bold block mb-1.5">
                    2. Item Title
                  </label>
                  <input
                    id="item-title-input"
                    type="text"
                    required
                    placeholder="e.g. Vintage Leather Jacket, Oak End Table"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white border border-[#EAEAEA] rounded-xl px-4 py-2.5 text-xs text-[#2D2D2D] outline-none focus:border-[#4A5D4E] focus:ring-1 focus:ring-[#4A5D4E] transition-all"
                  />
                </div>

                {/* Condition and size */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="item-condition-select" className="text-[10px] uppercase tracking-widest text-[#999] font-bold block mb-1.5">
                      3. Condition
                    </label>
                    <select
                      id="item-condition-select"
                      value={condition}
                      onChange={(e) => setCondition(e.target.value as any)}
                      className="w-full bg-white border border-[#EAEAEA] rounded-xl px-4 py-2.5 text-xs text-[#2D2D2D] outline-none focus:border-[#4A5D4E] transition-all"
                    >
                      <option value="New">Brand New</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Gently Used">Gently Used</option>
                      <option value="Distressed">Distressed / Retro</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="item-size-input" className="text-[10px] uppercase tracking-widest text-[#999] font-bold block mb-1.5">
                      4. Size / Volume (Optional)
                    </label>
                    <input
                      id="item-size-input"
                      type="text"
                      placeholder="e.g. M, 12oz, 45x45cm"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="w-full bg-white border border-[#EAEAEA] rounded-xl px-4 py-2.5 text-xs text-[#2D2D2D] outline-none focus:border-[#4A5D4E] transition-all"
                    />
                  </div>
                </div>

                {/* Suggested Donation value */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="item-price-input" className="text-[10px] uppercase tracking-widest text-[#999] font-bold block mb-1.5">
                      5. Suggested Price ($)
                    </label>
                    <input
                      id="item-price-input"
                      type="number"
                      min="1"
                      required
                      placeholder="25"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-white border border-[#EAEAEA] rounded-xl px-4 py-2.5 text-xs text-[#2D2D2D] outline-none focus:border-[#4A5D4E] font-mono transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="item-highlight-tag" className="text-[10px] uppercase tracking-widest text-[#999] font-bold block mb-1.5">
                      6. Highlight Tag
                    </label>
                    <select
                      id="item-highlight-tag"
                      value={tag}
                      onChange={(e) => setTag(e.target.value as any)}
                      className="w-full bg-white border border-[#EAEAEA] rounded-xl px-4 py-2.5 text-xs text-[#2D2D2D] outline-none focus:border-[#4A5D4E] transition-all"
                    >
                      <option value="ESSENTIAL">Curated Essential</option>
                      <option value="VINTAGE">Vintage Heritage</option>
                      <option value="RARE">Rare Treasure</option>
                      <option value="HANDMADE">Artisanal Handmade</option>
                      <option value="UNIQUE">Unique Statement</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              /* STEP 2: Media, Story, & Donor Identity */
              <div className="p-6 space-y-5 flex-1">
                {/* Upload Section with drag-and-drop & browse */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block mb-1.5">
                    7. Upload Photo
                  </label>
                  
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleUploadAreaClick}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center relative overflow-hidden ${
                      imagePreview 
                        ? 'border-[#4A5D4E] bg-[#F5F7F5]/20 h-44' 
                        : isDragging
                          ? 'border-[#4A5D4E] bg-[#F5F7F5] h-36'
                          : 'border-[#EAEAEA] bg-[#F9F9F9] hover:bg-neutral-50 h-36'
                    }`}
                    id="donation-upload-zone"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                      id="donation-file-input"
                    />

                    {imagePreview ? (
                      /* File Preview Mode */
                      <>
                        <img
                          src={imagePreview}
                          alt="Donation preview"
                          className="absolute inset-0 w-full h-full object-cover opacity-90"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/10 hover:bg-black/30 transition-all flex items-center justify-center group">
                          <button
                            type="button"
                            onClick={removeImage}
                            className="bg-white/95 text-rose-600 p-2.5 rounded-full hover:bg-white transition-all shadow-md active:scale-90"
                            title="Remove image"
                            id="btn-remove-image"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      /* Drag-and-Drop Prompt Mode */
                      <>
                        <div className="w-10 h-10 bg-white border border-[#EAEAEA] text-[#717171] rounded-full flex items-center justify-center shadow-xs mb-2">
                          <Upload className="w-5 h-5 text-[#4A5D4E]" />
                        </div>
                        <p className="text-xs text-[#2D2D2D] font-medium">
                          {isDragging ? 'Drop your image here' : 'Drag image here, or click to browse'}
                        </p>
                        <p className="text-[10px] text-[#999] mt-1 font-light">
                          Supports PNG, JPG up to 5MB. Real photo or illustration.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Donor Name */}
                <div>
                  <label htmlFor="donor-name-input" className="text-[10px] uppercase tracking-widest text-[#999] font-bold block mb-1.5">
                    8. Your Name / Donor Identifier
                  </label>
                  <input
                    id="donor-name-input"
                    type="text"
                    placeholder="e.g. Evelyn G. or Eco Friend"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full bg-white border border-[#EAEAEA] rounded-xl px-4 py-2.5 text-xs text-[#2D2D2D] outline-none focus:border-[#4A5D4E] transition-all"
                  />
                </div>

                {/* Description & Story */}
                <div>
                  <label htmlFor="item-description-textarea" className="text-[10px] uppercase tracking-widest text-[#999] font-bold block mb-1.5">
                    9. Provenance & Story
                  </label>
                  <textarea
                    id="item-description-textarea"
                    required
                    rows={4}
                    placeholder="Tell us about the item's history, origin, fit or materials. A good story makes curation thrive!"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-white border border-[#EAEAEA] rounded-xl px-4 py-2.5 text-xs text-[#2D2D2D] outline-none focus:border-[#4A5D4E] focus:ring-1 focus:ring-[#4A5D4E] font-light resize-none transition-all"
                  />
                </div>
              </div>
            )}

            {/* Sticky Action Footer */}
            <div className="p-6 border-t border-[#EAEAEA] bg-white flex justify-between items-center shrink-0">
              {step === 1 ? (
                <>
                  <div className="flex items-center gap-1.5 text-[#999] text-[10px] font-medium font-mono">
                    <span className="text-[#4A5D4E]">Step 1</span>
                    <span>/</span>
                    <span>2</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!title.trim()}
                    className="bg-[#4A5D4E] text-white text-xs font-semibold px-6 py-2.5 rounded-full hover:bg-[#3D4D40] active:scale-[0.98] transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    id="btn-next-step"
                  >
                    Continue to Photo & Story
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="bg-transparent border border-[#EAEAEA] text-[#717171] text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-[#F3F3F3] transition-colors cursor-pointer"
                    id="btn-prev-step"
                  >
                    Back to Details
                  </button>
                  <button
                    type="submit"
                    disabled={!description.trim()}
                    className="bg-[#4A5D4E] text-white text-xs font-semibold px-6 py-2.5 rounded-full hover:bg-[#3D4D40] active:scale-[0.98] transition-all cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    id="btn-submit-donation"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white/10" />
                    <span>Publish Donation (-{currentCO2Estimate}kg CO₂)</span>
                  </button>
                </>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
