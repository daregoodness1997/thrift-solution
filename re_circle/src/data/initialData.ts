import { Listing, ContributionGroup, AppNotification, ChatMessage } from '../types';

export const INITIAL_LISTINGS: Listing[] = [
  {
    id: '1',
    title: '80s Wool Overcoat',
    category: 'Clothing',
    condition: 'Gently Used',
    size: 'L',
    price: 75,
    tag: 'VINTAGE',
    co2Saved: 25,
    donorName: 'Evelyn Gray',
    date: '2026-07-01',
    description: 'A beautiful, warm wool overcoat from the mid-80s. Crafted from 100% heavy wool with detailed stitch seams and an elegant inner lining. Gently used and meticulously cared for.',
    status: 'Available',
    image: 'fabric-wool'
  },
  {
    id: '2',
    title: 'Mid-Century Table Lamp',
    category: 'Furniture',
    condition: 'Excellent',
    price: 120,
    tag: 'RARE',
    co2Saved: 18,
    donorName: 'Arthur Pendelton',
    date: '2026-07-03',
    description: 'Classic mid-century modern aesthetic featuring a solid brass-weighted base and an original oatmeal textured fabric shade. Fully re-wired for modern safety standards.',
    status: 'Available',
    image: 'brass-lamp'
  },
  {
    id: '3',
    title: 'Classic Denim Vest',
    category: 'Clothing',
    condition: 'Distressed',
    size: 'M',
    price: 34,
    tag: 'VINTAGE',
    co2Saved: 12,
    donorName: 'Chloe Jenkins',
    date: '2026-07-04',
    description: 'Light-wash denim vest featuring high-contrast metal button fastenings and authentic fringe distressing on the pockets. Softened by years of gentle wear.',
    status: 'Available',
    image: 'denim-blue'
  },
  {
    id: '4',
    title: 'Ceramic Pitcher',
    category: 'Home Goods',
    condition: 'New',
    price: 28,
    tag: 'HANDMADE',
    co2Saved: 6,
    donorName: 'Julian Finch',
    date: '2026-07-05',
    description: 'An artisanal stoneware pitcher thrown by hand. Coated in a gorgeous dual-tone satin glaze of cobalt blue and sand. Perfect for cold spring water or holding dry wildflowers.',
    status: 'Available',
    image: 'ceramic-blue'
  },
  {
    id: '5',
    title: 'Leather Saddle Bag',
    category: 'Accessories',
    condition: 'Excellent',
    price: 65,
    tag: 'UNIQUE',
    co2Saved: 14,
    donorName: 'Sienna Ross',
    date: '2026-07-05',
    description: 'Beautifully tanned bridle leather with hand-stitched details and heavy-duty brass locks. Offers a spacious primary compartment and adjustable shoulder strap.',
    status: 'Available',
    image: 'leather-tan'
  },
  {
    id: '6',
    title: 'Hardwood Accent Chair',
    category: 'Furniture',
    condition: 'Gently Used',
    price: 95,
    tag: 'ESSENTIAL',
    co2Saved: 42,
    donorName: 'Lucas Thorne',
    date: '2026-07-06',
    description: 'Constructed from premium white oak, this minimalistic lounge chair provides an elegant outline and robust support. Suitable as an entrance highlight or corner reading chair.',
    status: 'Available',
    image: 'wood-oak'
  }
];

export const INITIAL_METRICS = {
  itemsDonated: 1284,
  co2Saved: 4120,
  fundsRaised: 12400
};

export const INITIAL_PLANS = [
  {
    id: 'plan-free',
    name: 'Circular Citizen (Free)',
    tagline: 'Standard zero-fee neighborhood exchange',
    monthlyFee: 0,
    co2Multiplier: 1.0,
    perks: ['Standard circularization ledger', 'Bypass raw manufacturing retail', 'Eco Guard basic levels'],
    description: 'Perfect for casual neighbors looking to swap, donate, and circularize vintage assets with zero ongoing commitments.'
  },
  {
    id: 'plan-seedling',
    name: 'Eco Seedling',
    tagline: 'Micro-saver & steady direct restorer',
    monthlyFee: 8.00,
    co2Multiplier: 1.1,
    perks: ['1.1x extra CO₂ impact score', 'Dedicated Urban Greening funding contribution', 'Seedling digital badge on profile'],
    description: 'Directs $8 every month automatically to regional compost systems, boosting your personal carbon offset tally with a 1.1x bonus modifier.'
  },
  {
    id: 'plan-sapling',
    name: 'Carbon Sapling',
    tagline: 'Active neighborhood circular catalyst',
    monthlyFee: 20.00,
    co2Multiplier: 1.25,
    perks: ['1.25x extra CO₂ impact score', 'Direct carbon forestry reserve donation', 'Free repair workshop tutoring', 'Sapling verified badge'],
    description: 'Our most popular plan. Directs $20 monthly to purchase and nurture native tree saplings. Grants priority access to clothing repair clinics.'
  },
  {
    id: 'plan-forest',
    name: 'Forest Guard',
    tagline: 'Elite carbon-offset champion',
    monthlyFee: 45.00,
    co2Multiplier: 1.5,
    perks: ['1.50x elite CO₂ offset multiplier', 'VIP priority alerts on rare collectibles', 'Unlimited zero-commission vintage swaps', 'Forest Guard Golden Medal badge'],
    description: 'The ultimate badge of regional honor. Auto-finances both urban composting grids and professional park sapling plantings with premium status.'
  }
];

export const INITIAL_ACTIVE_ACCOUNTS = [
  {
    id: 'acc-1',
    name: 'Evelyn Gray',
    email: 'evelyn.gray@outlook.com',
    level: 5,
    totalCO2Saved: 232.0,
    itemsCircularized: 18,
    planId: 'plan-forest',
    avatarColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  {
    id: 'acc-2',
    name: 'Arthur Pendelton',
    email: 'arthur.p@gmail.com',
    level: 3,
    totalCO2Saved: 118.5,
    itemsCircularized: 9,
    planId: 'plan-sapling',
    avatarColor: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  {
    id: 'acc-3',
    name: 'Chloe Jenkins',
    email: 'chloe.j@yahoo.com',
    level: 2,
    totalCO2Saved: 48.0,
    itemsCircularized: 5,
    planId: 'plan-seedling',
    avatarColor: 'bg-sky-100 text-sky-800 border-sky-200'
  },
  {
    id: 'acc-4',
    name: 'Julian Finch',
    email: 'julian.f@stoneware.org',
    level: 1,
    totalCO2Saved: 12.0,
    itemsCircularized: 2,
    planId: 'plan-free',
    avatarColor: 'bg-stone-100 text-stone-800 border-stone-200'
  }
];

export const INITIAL_GROUPS: ContributionGroup[] = [
  {
    id: 'group-1',
    name: 'Northside Organic Composter',
    description: 'We are fundraising to procure industrial vermicomposting bins for the Northside Public Allotment. Together, we will divert organic garbage from local landfill sites, converting food waste directly into rich community garden soil.',
    creatorId: 'acc-1',
    creatorName: 'Evelyn Gray',
    targetAmount: 600,
    currentAmount: 420,
    co2Target: 180,
    category: 'Composting',
    membersCount: 8,
    tags: ['NEIGHBORHOOD', 'COMPOSTING', 'SOIL_RENEWAL']
  },
  {
    id: 'group-2',
    name: 'Green Textile Guild & Loom',
    description: 'Procuring heavy-duty repair sewing machines and wooden weaving looms. We run weekend clothing rescue clinics, tutoring teens in vintage mending, patch artistry, and sewing. Lets save garments from entering high-carbon landfills!',
    creatorId: 'acc-2',
    creatorName: 'Arthur Pendelton',
    targetAmount: 1200,
    currentAmount: 850,
    co2Target: 500,
    category: 'Workshop',
    membersCount: 14,
    tags: ['REPAIR', 'UPCYCLING', 'WORKSHOP_SERIES']
  },
  {
    id: 'group-3',
    name: 'High-Density Sapling Reserve',
    description: 'Financing the acquisition and continuous hydration of 150 native oak, maple, and birch saplings to construct a mini urban-cooler forest adjacent to the public playground. Combats heat islands and purifies local air quality.',
    creatorId: 'acc-3',
    creatorName: 'Chloe Jenkins',
    targetAmount: 2000,
    currentAmount: 1100,
    co2Target: 1200,
    category: 'Forestry',
    membersCount: 22,
    tags: ['FORESTRY', 'URBAN_GREENING', 'CARBON_SINK']
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Acquisition Successful',
    message: 'Your acquire order for Arthur\'s "Mid-Century Table Lamp" is successfully processed. $120.00 was transferred from your wallet.',
    timestamp: '2026-07-06 14:32',
    read: false,
    type: 'success'
  },
  {
    id: 'notif-2',
    title: 'Carbon Milestone Achieved',
    message: 'Excellent! Your local swaps have saved a total of 38.0 kg CO₂. You have unlocked the "Green Seedling" digital badge.',
    timestamp: '2026-07-05 09:15',
    read: true,
    type: 'success'
  },
  {
    id: 'notif-3',
    title: 'Composting Challenge Update',
    message: 'The "Northside Organic Composter" group just reached 70% of its fundraising goal. Only $180 remains to secure the biobins!',
    timestamp: '2026-07-04 18:00',
    read: true,
    type: 'info'
  }
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    senderId: 'acc-1',
    senderName: 'Evelyn Gray',
    text: 'Hi Dare! Thank you for donating the Wool Overcoat. Is it possible for me to pick it up tomorrow afternoon around 3 PM?',
    timestamp: '2026-07-06 16:45'
  },
  {
    id: 'msg-2',
    senderId: 'me',
    senderName: 'Dare',
    text: 'Hi Evelyn! Yes, tomorrow at 3 PM works perfectly. I will leave it on the porch in a reusable garment bag for clean handoff.',
    timestamp: '2026-07-06 17:02'
  },
  {
    id: 'msg-3',
    senderId: 'acc-1',
    senderName: 'Evelyn Gray',
    text: 'Brilliant, thank you so much! Looking forward to it.',
    timestamp: '2026-07-06 17:15'
  }
];


