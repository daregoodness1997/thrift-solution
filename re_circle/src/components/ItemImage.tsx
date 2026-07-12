import React from 'react';
import { ListingCategory } from '../types';

interface ItemImageProps {
  image?: string;
  category: ListingCategory;
  title: string;
  className?: string;
}

export const ItemImage: React.FC<ItemImageProps> = ({ image, category, title, className = '' }) => {
  // Check if image is an actual uploaded image (base64, URL, etc.)
  const isRealImage = image && (
    image.startsWith('data:') || 
    image.startsWith('blob:') || 
    image.startsWith('http') || 
    image.startsWith('/')
  );

  if (isRealImage) {
    return (
      <img
        src={image}
        alt={title}
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${className}`}
        id={`item-img-${title.replace(/\s+/g, '-').toLowerCase()}`}
      />
    );
  }

  // Otherwise, render a custom, highly styled, minimalistic visual vector
  const getMinimalistIllustration = () => {
    switch (image) {
      case 'fabric-wool':
        return (
          <div className="w-full h-full bg-[#EAE8E4] flex flex-col items-center justify-center relative overflow-hidden p-6 text-center">
            {/* Subtle elegant pattern background */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4A5D4E_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div className="w-20 h-28 bg-[#9E978E] rounded-b-xl rounded-t-sm shadow-sm relative flex flex-col justify-between p-2">
              <div className="w-full h-1 bg-[#4A5D4E] rounded-full"></div>
              <div className="w-full border-t border-dashed border-[#F3F3F3] opacity-30 my-1"></div>
              <div className="flex justify-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[#7A746D] mt-3 font-medium">Fine Wool Overcoat</span>
          </div>
        );
      case 'brass-lamp':
        return (
          <div className="w-full h-full bg-[#F4EFEB] flex flex-col items-center justify-center relative overflow-hidden p-6 text-center">
            {/* Soft lamp light gradient glowing behind */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-40 h-40 bg-[radial-gradient(circle_at_center,rgba(253,224,71,0.25)_0%,transparent_60%)]"></div>
            <div className="flex flex-col items-center relative z-10">
              {/* Lamp shade */}
              <div className="w-16 h-10 bg-[#DFD9D3] rounded-t-2xl border-b-2 border-[#D1C2A5] shadow-sm"></div>
              {/* Lamp neck */}
              <div className="w-1 h-14 bg-[#C2A36B]"></div>
              {/* Lamp base */}
              <div className="w-10 h-2 bg-[#A38245] rounded-full shadow-sm"></div>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[#8A7D73] mt-3 font-medium">MCM Accent Light</span>
          </div>
        );
      case 'denim-blue':
        return (
          <div className="w-full h-full bg-[#E3E8ED] flex flex-col items-center justify-center relative overflow-hidden p-6 text-center">
            {/* Denim weave grid pattern */}
            <div className="absolute inset-0 opacity-15 bg-[linear-gradient(45deg,#3B5266_25%,transparent_25%),linear-gradient(-45deg,#3B5266_25%,transparent_25%)] [background-size:8px_8px]"></div>
            <div className="w-24 h-24 bg-[#566B7E] rounded-xl shadow-md flex flex-col justify-between p-3 relative">
              {/* Stitches */}
              <div className="absolute inset-1.5 border border-dashed border-[#E3E8ED]/30 rounded-lg"></div>
              <div className="flex justify-between items-center z-10">
                <div className="w-3 h-3 rounded-full bg-[#BFA37E]"></div>
                <div className="w-3 h-3 rounded-full bg-[#BFA37E]"></div>
              </div>
              <div className="w-full h-1 bg-[#4A545F] rounded z-10"></div>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[#546270] mt-3 font-medium">Distressed Denim</span>
          </div>
        );
      case 'ceramic-blue':
        return (
          <div className="w-full h-full bg-[#ECEBE7] flex flex-col items-center justify-center relative overflow-hidden p-6 text-center">
            {/* Shadow beneath ceramic */}
            <div className="absolute bottom-8 w-16 h-2.5 bg-black/5 rounded-full blur-sm"></div>
            <div className="flex flex-col items-center relative">
              {/* Pitcher lip */}
              <div className="w-8 h-2 bg-[#5A7C8E] rounded-full border border-black/5"></div>
              {/* Pitcher neck & body */}
              <div className="w-14 h-20 bg-[#426477] rounded-3xl relative flex items-center justify-center overflow-hidden">
                {/* Two-tone glaze gradient */}
                <div className="absolute top-1/2 left-0 right-0 bottom-0 bg-[#E0D7C6]/90 border-t border-black/10"></div>
                {/* Handle */}
                <div className="absolute -left-3 top-4 w-6 h-10 border-4 border-[#426477] rounded-l-full"></div>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[#69747A] mt-3 font-medium">Handmade Stoneware</span>
          </div>
        );
      case 'leather-tan':
        return (
          <div className="w-full h-full bg-[#EFECE8] flex flex-col items-center justify-center relative overflow-hidden p-6 text-center">
            <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:10px_10px]"></div>
            <div className="w-22 h-18 bg-[#A67C52] rounded-2xl relative shadow-md flex items-center justify-center">
              {/* Stitching */}
              <div className="absolute inset-1 border border-dashed border-white/20 rounded-xl"></div>
              {/* Brass flap lock */}
              <div className="w-3 h-6 bg-[#D1A15B] rounded-sm absolute bottom-0 left-1/2 -translate-x-1/2 shadow-inner"></div>
              <div className="w-1 h-8 bg-[#805D3A] rounded-full absolute -top-8 left-1/2 -translate-x-1/2"></div>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[#8A7156] mt-3 font-medium">Bridle Saddle Bag</span>
          </div>
        );
      case 'wood-oak':
        return (
          <div className="w-full h-full bg-[#FAF5EE] flex flex-col items-center justify-center relative overflow-hidden p-6 text-center">
            {/* Vertical timber pattern lines */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#B5A695_1px,transparent_1px)] [background-size:24px_100%]"></div>
            <div className="flex flex-col items-center relative">
              {/* Backrest */}
              <div className="w-16 h-8 border-2 border-[#8E7E70] rounded-t-lg bg-[#FAF5EE]/90 z-10"></div>
              {/* Support bars */}
              <div className="flex justify-between w-12 h-3 border-x border-[#8E7E70]"></div>
              {/* Seat */}
              <div className="w-18 h-3 bg-[#A69585] rounded-md shadow-sm z-10"></div>
              {/* Legs */}
              <div className="flex justify-between w-14 h-12 px-1">
                <div className="w-1.5 h-full bg-[#8E7E70] origin-top rotate-3"></div>
                <div className="w-1.5 h-full bg-[#8E7E70] origin-top -rotate-3"></div>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[#857B72] mt-3 font-medium">White Oak Furniture</span>
          </div>
        );
      default:
        // Category fallback icons if no matches
        return getCategoryFallback(category);
    }
  };

  const getCategoryFallback = (cat: ListingCategory) => {
    switch (cat) {
      case 'Clothing':
        return (
          <div className="w-full h-full bg-[#F5F5F5] flex flex-col items-center justify-center p-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[#717171] stroke-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
            </svg>
            <span className="text-[10px] uppercase tracking-widest text-[#999] mt-2 font-mono">CLOTHING</span>
          </div>
        );
      case 'Furniture':
        return (
          <div className="w-full h-full bg-[#F5F5F5] flex flex-col items-center justify-center p-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[#717171] stroke-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21V9a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v12" />
              <path d="M5 11h14" />
              <path d="M5 15h14" />
              <path d="M12 3a3 3 0 0 0-3 3h6a3 3 0 0 0-3-3z" />
            </svg>
            <span className="text-[10px] uppercase tracking-widest text-[#999] mt-2 font-mono">FURNITURE</span>
          </div>
        );
      case 'Accessories':
        return (
          <div className="w-full h-full bg-[#F5F5F5] flex flex-col items-center justify-center p-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[#717171] stroke-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <span className="text-[10px] uppercase tracking-widest text-[#999] mt-2 font-mono">ACCESSORY</span>
          </div>
        );
      case 'Home Goods':
        return (
          <div className="w-full h-full bg-[#F5F5F5] flex flex-col items-center justify-center p-6 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[#717171] stroke-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22a7 7 0 0 0 7-7c0-4.3-7-11-7-11S5 10.7 5 15a7 7 0 0 0 7 7z" />
            </svg>
            <span className="text-[10px] uppercase tracking-widest text-[#999] mt-2 font-mono">HOME GOODS</span>
          </div>
        );
      default:
        return (
          <div className="w-full h-full bg-[#F5F5F5] flex flex-col items-center justify-center p-6 text-center">
            <div className="text-[#CCC] uppercase tracking-widest text-[10px]">Product Preview</div>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full bg-[#F3F3F3] flex items-center justify-center relative overflow-hidden">
      {getMinimalistIllustration()}
    </div>
  );
};
