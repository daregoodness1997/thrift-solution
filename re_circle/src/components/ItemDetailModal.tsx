import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Leaf, User, Calendar, CheckCircle2, DollarSign, Award, ShoppingBag } from 'lucide-react';
import { Listing } from '../types';
import { ItemImage } from './ItemImage';

interface ItemDetailModalProps {
  listing: Listing | null;
  onClose: () => void;
  onClaim: (id: string) => void;
  userBalance: number;
  onGoToDashboard: () => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  listing,
  onClose,
  onClaim,
  userBalance,
  onGoToDashboard
}) => {
  const [claimingState, setClaimingState] = useState<'idle' | 'processing' | 'success'>('idle');

  if (!listing) return null;

  const handleClaimSubmit = () => {
    setClaimingState('processing');
    setTimeout(() => {
      onClaim(listing.id);
      setClaimingState('success');
    }, 1200);
  };

  const isAlreadyClaimed = listing.status === 'Claimed';
  const isInsufficientFunds = !isAlreadyClaimed && userBalance < listing.price;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={claimingState === 'processing' ? undefined : onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          id="detail-modal-backdrop"
        />

        {/* Content Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative bg-[#FDFDFC] rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] md:max-h-[560px] z-10"
          id="detail-modal-card"
        >
          {/* Close Button */}
          {claimingState !== 'processing' && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/90 border border-[#EAEAEA] text-[#717171] hover:text-[#2D2D2D] flex items-center justify-center hover:shadow-xs cursor-pointer transition-all active:scale-95"
              id="btn-close-detail"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {claimingState === 'success' ? (
            /* CLAIM SUCCESS PANEL */
            <div className="flex-1 p-8 md:p-12 flex flex-col items-center justify-center text-center bg-white min-h-[300px]">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="w-16 h-16 bg-[#F5F7F5] border border-[#E1E8E1] text-[#4A5D4E] rounded-full flex items-center justify-center mb-6 shadow-sm"
              >
                <CheckCircle2 className="w-8 h-8" />
              </motion.div>

              <span className="text-[#4A5D4E] uppercase tracking-widest text-[10px] font-bold mb-2 block">
                Item Claimed Successfully
              </span>
              
              <h3 className="text-2xl md:text-3xl font-light text-[#1A1A1A] mb-4 tracking-tight">
                Thank you for choosing <span className="italic font-serif text-[#4A5D4E]">circular care</span>.
              </h3>

              <p className="text-[#717171] text-sm max-w-md mb-8 leading-relaxed">
                Your purchase of the <strong className="font-semibold text-[#2D2D2D]">{listing.title}</strong> keeps resources in motion. You have directly supported local initiatives and contributed to textile recycling.
              </p>

              {/* Carbon metrics block */}
              <div className="grid grid-cols-2 gap-4 bg-[#F5F7F5] rounded-2xl p-4 w-full max-w-md mb-8">
                <div className="text-center border-r border-[#E1E8E1] pr-2">
                  <div className="flex items-center justify-center gap-1 text-[#4A5D4E] mb-1">
                    <Leaf className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider font-mono">CO₂ Saved</span>
                  </div>
                  <span className="text-lg font-bold text-[#1A1A1A] font-mono">{listing.co2Saved} kg</span>
                </div>
                <div className="text-center pl-2">
                  <div className="flex items-center justify-center gap-1 text-[#4A5D4E] mb-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider font-mono">Fund Contribution</span>
                  </div>
                  <span className="text-lg font-bold text-[#1A1A1A] font-mono">${listing.price}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="bg-[#4A5D4E] text-white text-xs font-semibold px-8 py-3 rounded-full hover:bg-[#3D4D40] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                id="btn-success-close"
              >
                Return to Marketplace
              </button>
            </div>
          ) : (
            <>
              {/* Left Column: Image Representation */}
              <div className="w-full md:w-1/2 bg-[#F3F3F3] h-[240px] md:h-full relative overflow-hidden flex items-center justify-center border-b md:border-b-0 md:border-r border-[#EAEAEA]">
                <ItemImage category={listing.category} image={listing.image} title={listing.title} className="w-full h-full object-cover" />
                
                {/* Floating Tags */}
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <span className="bg-white/95 backdrop-blur-xs text-[#2D2D2D] text-[9px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md shadow-xs border border-[#EAEAEA]">
                    {listing.category}
                  </span>
                  {listing.size && (
                    <span className="bg-white/95 backdrop-blur-xs text-[#2D2D2D] text-[9px] font-bold px-2.5 py-1 rounded-md shadow-xs border border-[#EAEAEA]">
                      Size {listing.size}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Column: Details */}
              <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-4">
                  {/* Category & Status */}
                  <div className="flex justify-between items-center">
                    <span className="text-[#4A5D4E] uppercase tracking-widest text-[9px] font-bold">
                      {listing.tag || 'CURATED FIND'}
                    </span>
                    <span className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                      isAlreadyClaimed 
                        ? 'bg-neutral-100 text-neutral-500 border border-neutral-200' 
                        : 'bg-[#F5F7F5] text-[#4A5D4E] border border-[#E1E8E1]'
                    }`}>
                      {isAlreadyClaimed ? 'Claimed' : 'Available'}
                    </span>
                  </div>

                  {/* Title & Price */}
                  <div className="flex justify-between items-start gap-4">
                    <h2 className="text-xl md:text-2xl font-light text-[#1A1A1A] tracking-tight leading-tight">
                      {listing.title}
                    </h2>
                    <span className="text-lg md:text-xl font-bold text-[#4A5D4E] font-mono whitespace-nowrap">
                      ${listing.price}
                    </span>
                  </div>

                  {/* Environmental leaf highlight */}
                  <div className="bg-[#F5F7F5] rounded-2xl p-3 flex items-start gap-2.5">
                    <Leaf className="w-4 h-4 text-[#4A5D4E] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-[#4A5D4E] uppercase tracking-wider font-mono">
                        Circular Offset Score
                      </h4>
                      <p className="text-[#717171] text-[11px] font-light leading-relaxed mt-0.5">
                        Adopting this vintage item restores <strong className="font-medium text-[#2D2D2D]">{listing.co2Saved} kg of carbon</strong> emissions, matching the oxygen produced by 3 young saplings.
                      </p>
                    </div>
                  </div>

                  {/* Product Description */}
                  <div>
                    <h4 className="text-[10px] uppercase tracking-widest text-[#999] font-bold mb-1.5">
                      Provenance & Detail
                    </h4>
                    <p className="text-[#666] text-xs leading-relaxed font-light">
                      {listing.description}
                    </p>
                  </div>

                  {/* Donor details */}
                  <div className="grid grid-cols-2 gap-4 border-t border-[#EAEAEA] pt-3 text-[11px] text-[#717171]">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#999]" />
                      <span>Donor: <strong className="font-medium text-[#2D2D2D]">{listing.donorName}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#999]" />
                      <span>Shared: <strong className="font-medium text-[#2D2D2D]">{listing.date}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Claim CTA Section */}
                <div className="mt-6 md:mt-8 pt-4 border-t border-[#EAEAEA] shrink-0">
                  {isAlreadyClaimed ? (
                    <div className="w-full bg-[#F5F5F5] text-[#999] rounded-xl py-3 px-4 text-xs font-medium text-center border border-[#EAEAEA] flex items-center justify-center gap-2">
                      <Award className="w-4 h-4 text-[#BBB]" />
                      <span>This item has circularized to another home</span>
                    </div>
                  ) : isInsufficientFunds ? (
                    <div className="space-y-3">
                      <div className="text-xs text-rose-800 bg-rose-50 border border-rose-100 p-3 rounded-xl flex items-start gap-2.5">
                        <X className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <span className="font-semibold block">Insufficient Wallet Balance</span>
                          <p className="text-[#717171] leading-relaxed">
                            Your wallet has <strong className="font-semibold font-mono">${userBalance.toFixed(2)}</strong>, but this item is priced at <strong className="font-semibold font-mono">${listing.price.toFixed(2)}</strong>.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onClose();
                          onGoToDashboard();
                        }}
                        className="w-full bg-[#4A5D4E] text-white rounded-xl py-3 text-xs font-semibold tracking-wide hover:bg-[#3D4D40] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                        id="btn-goto-dashboard-topup"
                      >
                        <DollarSign className="w-4.5 h-4.5" />
                        <span>Go to Dashboard to Add Funds</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleClaimSubmit}
                      disabled={claimingState === 'processing'}
                      className="w-full bg-[#4A5D4E] text-white rounded-xl py-3 text-xs font-semibold tracking-wide hover:bg-[#3D4D40] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      id="btn-claim-item"
                    >
                      {claimingState === 'processing' ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Preparing Item Transfer...</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span>Claim Vintage and Support Causes • ${listing.price}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
