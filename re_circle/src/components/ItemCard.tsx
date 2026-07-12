import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ShoppingBag } from 'lucide-react';
import { Listing } from '../types';
import { ItemImage } from './ItemImage';

interface ItemCardProps {
  listing: Listing;
  onClick: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ listing, onClick }) => {
  const isClaimed = listing.status === 'Claimed';

  const getTagStyles = () => {
    switch (listing.tag) {
      case 'RARE':
        return 'bg-[#4A5D4E] text-white';
      case 'VINTAGE':
        return 'bg-white text-[#2D2D2D] border border-[#EAEAEA]';
      case 'HANDMADE':
        return 'bg-[#EAE8E4] text-[#4A5D4E] border border-[#E1E8E1]';
      default:
        return 'bg-white text-[#717171] border border-[#EAEAEA]';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className="group cursor-pointer flex flex-col h-full"
      id={`item-card-${listing.id}`}
    >
      <div className="aspect-[4/5] bg-[#F3F3F3] rounded-2xl mb-3 overflow-hidden flex items-center justify-center relative transition-all duration-300 group-hover:shadow-sm">
        {/* Dynamic Image / Minimalist vector */}
        <ItemImage category={listing.category} image={listing.image} title={listing.title} />

        {/* Dynamic Highlight Tag */}
        {listing.tag && !isClaimed && (
          <div className={`absolute top-3 left-3 px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase shadow-xs ${getTagStyles()}`}>
            {listing.tag}
          </div>
        )}

        {/* Environmental impact tag visible on hover */}
        <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs px-2 py-1 rounded-md text-[8px] font-mono font-medium text-[#4A5D4E] tracking-tight opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-xs">
          -{listing.co2Saved}kg CO₂
        </div>

        {/* Claimed overlay */}
        {isClaimed && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
            <div className="w-10 h-10 bg-[#4A5D4E]/10 rounded-full flex items-center justify-center text-[#4A5D4E] mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold tracking-widest text-[#4A5D4E] uppercase">
              Second Life Found
            </span>
            <span className="text-[9px] text-[#717171] mt-0.5 font-light font-mono">
              Claimed by local donor
            </span>
          </div>
        )}

        {/* Hover action button (Claim Quick-view overlay) */}
        {!isClaimed && (
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-white text-[#2D2D2D] text-xs font-semibold py-2 px-4 rounded-full shadow-md transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Inspect Details</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-start px-1 shrink-0">
        <div className="max-w-[75%]">
          <h4 className="text-sm font-medium text-[#1A1A1A] group-hover:text-[#4A5D4E] transition-colors truncate">
            {listing.title}
          </h4>
          <p className="text-xs text-[#999] mt-0.5 font-light truncate">
            {listing.size ? `Size ${listing.size} • ` : ''}{listing.condition}
          </p>
        </div>
        <span className="text-sm font-semibold text-[#2D2D2D] font-mono">
          ${listing.price}
        </span>
      </div>
    </motion.div>
  );
};
