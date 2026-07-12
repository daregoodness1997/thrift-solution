import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, SlidersHorizontal, Check } from 'lucide-react';
import { Listing, ImpactMetrics, ListingCategory, UserAccount, Transaction, ThriftPlan, ActiveAccount, ContributionGroup, AppNotification, ChatMessage } from './types';
import { INITIAL_LISTINGS, INITIAL_METRICS, INITIAL_PLANS, INITIAL_ACTIVE_ACCOUNTS, INITIAL_GROUPS, INITIAL_NOTIFICATIONS, INITIAL_CHAT_MESSAGES } from './data/initialData';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ItemCard } from './components/ItemCard';
import { ItemDetailModal } from './components/ItemDetailModal';
import { DonationModal } from './components/DonationModal';
import { SecondaryViews } from './components/SecondaryViews';
import { UserDashboard } from './components/UserDashboard';
import { ContributionGroups } from './components/ContributionGroups';
import { PeerChat } from './components/PeerChat';
import { ReportsView } from './components/ReportsView';
import { AdminCenter } from './components/AdminCenter';

const INITIAL_ACCOUNT: UserAccount = {
  email: 'daregoodness@gmail.com',
  balance: 150.00, // Pre-funded trial wallet credit for immediate neighborhood exchange
  totalCO2Saved: 38.0,
  itemsDonated: 2,
  itemsClaimed: 1,
  totalContributed: 45.00,
  transactions: [
    {
      id: 'tx-init-credit',
      type: 'funding',
      amount: 100.00,
      date: '2026-07-02',
      description: 'Initial Wallet Setup Credit'
    },
    {
      id: 'tx-bonus-credit',
      type: 'funding',
      amount: 70.00,
      date: '2026-07-04',
      description: 'Circular Economy Neighbor Trial Bonus'
    },
    {
      id: 'tx-init-donation',
      type: 'direct_donation',
      amount: 25.00,
      date: '2026-07-05',
      description: 'Contribution to Carbon Forestry Reserve'
    }
  ],
  currentPlanId: 'plan-seedling' // Eco Seedling trial
};

export default function App() {
  // State for listings and metrics, persisting to localStorage
  const [listings, setListings] = useState<Listing[]>(() => {
    try {
      const saved = localStorage.getItem('recircle_listings_v1');
      return saved ? JSON.parse(saved) : INITIAL_LISTINGS;
    } catch {
      return INITIAL_LISTINGS;
    }
  });

  const [metrics, setMetrics] = useState<ImpactMetrics>(() => {
    try {
      const saved = localStorage.getItem('recircle_metrics_v1');
      return saved ? JSON.parse(saved) : INITIAL_METRICS;
    } catch {
      return INITIAL_METRICS;
    }
  });

  // Navigation and Filter States
  const [activeTab, setActiveTab] = useState<string>('marketplace');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ListingCategory>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available'>('All');

  // Modal States
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isDonationOpen, setIsDonationOpen] = useState(false);

  // State for user account, persisting to localStorage
  const [account, setAccount] = useState<UserAccount>(() => {
    try {
      const saved = localStorage.getItem('recircle_account_v1');
      return saved ? JSON.parse(saved) : INITIAL_ACCOUNT;
    } catch {
      return INITIAL_ACCOUNT;
    }
  });

  // State for custom/available thrift plans
  const [plans, setPlans] = useState<ThriftPlan[]>(() => {
    try {
      const saved = localStorage.getItem('recircle_plans_v1');
      return saved ? JSON.parse(saved) : INITIAL_PLANS;
    } catch {
      return INITIAL_PLANS;
    }
  });

  // State for community active accounts
  const [activeAccounts, setActiveAccounts] = useState<ActiveAccount[]>(() => {
    try {
      const saved = localStorage.getItem('recircle_active_accounts_v1');
      return saved ? JSON.parse(saved) : INITIAL_ACTIVE_ACCOUNTS;
    } catch {
      return INITIAL_ACTIVE_ACCOUNTS;
    }
  });

  // State for Contribution Groups
  const [groups, setGroups] = useState<ContributionGroup[]>(() => {
    try {
      const saved = localStorage.getItem('recircle_groups_v1');
      return saved ? JSON.parse(saved) : INITIAL_GROUPS;
    } catch {
      return INITIAL_GROUPS;
    }
  });

  // State for Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('recircle_notif_v1');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // State for Chat Messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('recircle_chats_v1');
      return saved ? JSON.parse(saved) : INITIAL_CHAT_MESSAGES;
    } catch {
      return INITIAL_CHAT_MESSAGES;
    }
  });

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('recircle_listings_v1', JSON.stringify(listings));
  }, [listings]);

  useEffect(() => {
    localStorage.setItem('recircle_metrics_v1', JSON.stringify(metrics));
  }, [metrics]);

  useEffect(() => {
    localStorage.setItem('recircle_account_v1', JSON.stringify(account));
  }, [account]);

  useEffect(() => {
    localStorage.setItem('recircle_plans_v1', JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem('recircle_active_accounts_v1', JSON.stringify(activeAccounts));
  }, [activeAccounts]);

  useEffect(() => {
    localStorage.setItem('recircle_groups_v1', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('recircle_notif_v1', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('recircle_chats_v1', JSON.stringify(chatMessages));
  }, [chatMessages]);


  // Helper to add notification
  const addNotification = (title: string, message: string, type: 'success' | 'info' | 'alert') => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      read: false,
      type
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleMarkNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Handle plan switching/subscribing
  const handleSwitchPlan = (planId: string): { success: boolean; message: string } => {
    const selectedPlan = plans.find((p) => p.id === planId);
    if (!selectedPlan) return { success: false, message: 'Plan not found.' };

    if (selectedPlan.monthlyFee > account.balance) {
      return { success: false, message: `Insufficient balance. Enrolling in this plan requires a $${selectedPlan.monthlyFee.toFixed(2)} first-month auto-contribution from your wallet.` };
    }

    setAccount((prev) => {
      const isPaid = selectedPlan.monthlyFee > 0;
      const newTx: Transaction = {
        id: `tx-plan-${Date.now()}`,
        type: isPaid ? 'purchase' : 'funding',
        amount: selectedPlan.monthlyFee,
        date: new Date().toISOString().split('T')[0],
        description: `Enrolled in ${selectedPlan.name} Thrift Plan`
      };

      return {
        ...prev,
        currentPlanId: planId,
        balance: isPaid ? prev.balance - selectedPlan.monthlyFee : prev.balance,
        totalContributed: isPaid ? prev.totalContributed + selectedPlan.monthlyFee : prev.totalContributed,
        transactions: [newTx, ...prev.transactions]
      };
    });

    if (selectedPlan.monthlyFee > 0) {
      setMetrics((prev) => ({
        ...prev,
        fundsRaised: prev.fundsRaised + selectedPlan.monthlyFee
      }));
    }

    addNotification(
      'Enrollment Active',
      `You enrolled in "${selectedPlan.name}" thrift plan. CO₂ Multiplier is now active.`,
      'success'
    );

    return { success: true, message: `Successfully enrolled in the ${selectedPlan.name}!` };
  };

  // Handle adding new thrift plans
  const handleAddThriftPlan = (newPlan: ThriftPlan) => {
    setPlans((prev) => [...prev, newPlan]);
    addNotification(
      'Plan Published',
      `New administrative Thrift Plan "${newPlan.name}" has been successfully added.`,
      'info'
    );
  };

  // Handle adding new active community accounts
  const handleAddActiveAccount = (newAcc: ActiveAccount) => {
    setActiveAccounts((prev) => [newAcc, ...prev]);
    addNotification(
      'Neighbor Registered',
      `New neighbor node registered: "${newAcc.name}". Welcome to Re:Circle!`,
      'info'
    );
  };

  // Handle funding wallet
  const handleAddFunds = (amount: number) => {
    const newTx: Transaction = {
      id: `tx-fund-${Date.now()}`,
      type: 'funding',
      amount,
      date: new Date().toISOString().split('T')[0],
      description: `Funded Account Wallet via Instant Transfer`
    };

    setAccount((prev) => ({
      ...prev,
      balance: prev.balance + amount,
      transactions: [newTx, ...prev.transactions]
    }));

    addNotification(
      'Wallet Funded',
      `Successfully added $${amount.toFixed(2)} to your Re:Circle balance ledger.`,
      'success'
    );
  };

  // Handle direct green cause contribution
  const handleDirectContribution = (amount: number, cause: string): boolean => {
    if (account.balance < amount) return false;

    const newTx: Transaction = {
      id: `tx-contrib-${Date.now()}`,
      type: 'direct_donation',
      amount,
      date: new Date().toISOString().split('T')[0],
      description: `Contributed to ${cause}`
    };

    setAccount((prev) => ({
      ...prev,
      balance: prev.balance - amount,
      totalContributed: prev.totalContributed + amount,
      transactions: [newTx, ...prev.transactions]
    }));

    // Direct cause contributions also increase global fundsRaised!
    setMetrics((prev) => ({
      ...prev,
      fundsRaised: prev.fundsRaised + amount
    }));

    addNotification(
      'Cause Supported',
      `You backed "${cause}" with a direct $${amount.toFixed(2)} auto-contribution!`,
      'success'
    );

    return true;
  };

  // Handle new donation listing added
  const handleAddListing = (newListing: Listing) => {
    setListings((prev) => [newListing, ...prev]);
    setMetrics((prev) => ({
      ...prev,
      itemsDonated: prev.itemsDonated + 1,
      co2Saved: prev.co2Saved + newListing.co2Saved
    }));

    const newTx: Transaction = {
      id: `tx-donate-${Date.now()}`,
      type: 'direct_donation',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      description: `Donated: "${newListing.title}" to Circular Pool`,
      co2Saved: newListing.co2Saved
    };

    setAccount((prev) => ({
      ...prev,
      itemsDonated: prev.itemsDonated + 1,
      totalCO2Saved: prev.totalCO2Saved + newListing.co2Saved,
      transactions: [newTx, ...prev.transactions]
    }));

    addNotification(
      'Donation Registered',
      `Your item "${newListing.title}" has been listed in the catalog. Resource offset: -${newListing.co2Saved}kg CO₂.`,
      'success'
    );
  };

  // Handle claiming of listing
  const handleClaimListing = (id: string) => {
    const claimedItem = listings.find((item) => item.id === id);
    if (!claimedItem) return;

    setListings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Claimed' as const } : item))
    );
    // Update selected listing in place so modal gets live updates
    setSelectedListing((prev) => (prev && prev.id === id ? { ...prev, status: 'Claimed' as const } : prev));
    
    setMetrics((prev) => ({
      ...prev,
      fundsRaised: prev.fundsRaised + claimedItem.price
    }));

    const newTx: Transaction = {
      id: `tx-claim-${Date.now()}`,
      type: 'purchase',
      amount: claimedItem.price,
      date: new Date().toISOString().split('T')[0],
      description: `Acquired vintage: "${claimedItem.title}"`,
      co2Saved: claimedItem.co2Saved
    };

    setAccount((prev) => ({
      ...prev,
      balance: prev.balance - claimedItem.price,
      itemsClaimed: prev.itemsClaimed + 1,
      totalCO2Saved: prev.totalCO2Saved + claimedItem.co2Saved,
      totalContributed: prev.totalContributed + claimedItem.price,
      transactions: [newTx, ...prev.transactions]
    }));

    addNotification(
      'Acquisition Logged',
      `You acquired "${claimedItem.title}" for $${claimedItem.price.toFixed(2)}. This offset -${claimedItem.co2Saved}kg CO₂.`,
      'success'
    );
  };

  // Backing a contribution group
  const handleBackGroup = (groupId: string, amount: number): { success: boolean; message: string } => {
    if (account.balance < amount) {
      return { success: false, message: `Insufficient balance. Your wallet has $${account.balance.toFixed(2)} available.` };
    }

    const targetedGroup = groups.find(g => g.id === groupId);
    if (!targetedGroup) {
      return { success: false, message: 'Group campaign not found.' };
    }

    // Deduct balance and record transaction
    const newTx: Transaction = {
      id: `tx-back-${Date.now()}`,
      type: 'direct_donation',
      amount,
      date: new Date().toISOString().split('T')[0],
      description: `Backed group campaign: "${targetedGroup.name}"`
    };

    setAccount(prev => ({
      ...prev,
      balance: prev.balance - amount,
      totalContributed: prev.totalContributed + amount,
      transactions: [newTx, ...prev.transactions]
    }));

    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          currentAmount: g.currentAmount + amount,
          membersCount: g.membersCount + 1
        };
      }
      return g;
    }));

    setMetrics(prev => ({
      ...prev,
      fundsRaised: prev.fundsRaised + amount
    }));

    addNotification(
      'Campaign Contribution',
      `You backed "${targetedGroup.name}" with a $${amount.toFixed(2)} contribution from your circular wallet.`,
      'success'
    );

    return { success: true, message: `Successfully backed "${targetedGroup.name}" with $${amount.toFixed(2)}!` };
  };

  const handleAddGroup = (newGroup: ContributionGroup) => {
    setGroups(prev => [newGroup, ...prev]);
    addNotification(
      'Campaign Launched',
      `You initiated the new community challenge group: "${newGroup.name}"!`,
      'info'
    );
  };

  // Chat message send & auto response
  const handleSendMessage = (receiverId: string, text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      senderId: 'me',
      senderName: 'Dare',
      text,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setChatMessages(prev => [...prev, userMsg]);

    const targetNeighbor = activeAccounts.find(a => a.id === receiverId);
    if (!targetNeighbor) return;

    // Simulated response dictionary based on keywords
    setTimeout(() => {
      let responseText = `Hi Dare! Thanks for reaching out. Let's coordinate this circular economy loop together!`;
      const lowercase = text.toLowerCase();
      if (lowercase.includes('pick up') || lowercase.includes('pickup') || lowercase.includes('collect') || lowercase.includes('meet')) {
        responseText = `That sounds perfect! Tomorrow afternoon works great for me. I can leave it on my porch or we can meet by the compost bins.`;
      } else if (lowercase.includes('compost') || lowercase.includes('bin') || lowercase.includes('organic')) {
        responseText = `Yes, the composting project is moving along super fast! Thanks for pooling your backing. Let me know if you want to join our weekend clinic.`;
      } else if (lowercase.includes('size') || lowercase.includes('fit') || lowercase.includes('wear')) {
        responseText = `It fits true to size! Very comfortable, premium fabric. You are welcome to try it or return it to the loop if it doesn't fit right.`;
      } else if (lowercase.includes('repair') || lowercase.includes('mend') || lowercase.includes('sewing')) {
        responseText = `Our repair clinics are on Saturday at 11 AM. Bring any fabrics or vintage garments, and we will get them restored together.`;
      } else if (lowercase.includes('table') || lowercase.includes('lamp') || lowercase.includes('furniture')) {
        responseText = `The mid-century piece is in stunning condition! Fully re-wired and safe. It will look beautiful in your space.`;
      }

      const neighborMsg: ChatMessage = {
        id: `msg-neigh-${Date.now()}`,
        senderId: receiverId,
        senderName: targetNeighbor.name,
        text: responseText,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };

      setChatMessages(prev => [...prev, neighborMsg]);
      addNotification(
        'New Message Received',
        `${targetNeighbor.name} sent you a message: "${responseText.substring(0, 40)}..."`,
        'info'
      );
    }, 1200);
  };

  // Admin moderation functions
  const handleDeleteListing = (id: string) => {
    setListings(prev => prev.filter(item => item.id !== id));
    addNotification(
      'Listing Moderated',
      `Admin action: Listing with ID #${id} was moderated and removed from the public catalog.`,
      'alert'
    );
  };

  const handleToggleListingStatus = (id: string) => {
    setListings(prev => prev.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'Available' ? 'Claimed' : 'Available';
        return { ...item, status: nextStatus };
      }
      return item;
    }));
  };

  const handleModifyActiveAccountBalance = (id: string, amount: number) => {
    setActiveAccounts(prev => prev.map(acc => {
      if (acc.id === id) {
        return {
          ...acc,
          totalCO2Saved: Math.max(0, acc.totalCO2Saved + amount),
          level: Math.min(10, Math.max(1, acc.level + (amount > 0 ? 1 : -1)))
        };
      }
      return acc;
    }));
    addNotification(
      'Account Ledger Adjusted',
      `Admin action: Adjusted metrics for neighbor node #${id} by ${amount} kg CO₂ offsets.`,
      'info'
    );
  };


  // Filter listings based on category, status, and search query
  const filteredListings = listings.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesStatus = statusFilter === 'All' || item.status === 'Available';
    const cleanSearch = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !cleanSearch ||
      item.title.toLowerCase().includes(cleanSearch) ||
      item.category.toLowerCase().includes(cleanSearch) ||
      item.donorName.toLowerCase().includes(cleanSearch) ||
      (item.tag && item.tag.toLowerCase().includes(cleanSearch)) ||
      item.description.toLowerCase().includes(cleanSearch);

    return matchesCategory && matchesStatus && matchesSearch;
  });

  return (
    <div className="w-full min-h-screen bg-[#FDFDFC] text-[#2D2D2D] font-sans flex flex-col overflow-x-hidden antialiased selection:bg-[#4A5D4E]/10 selection:text-[#4A5D4E]">
      
      {/* 1. Header Component */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onDonateClick={() => setIsDonationOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        notifications={notifications}
        onMarkNotificationsRead={handleMarkNotificationsRead}
        onClearNotification={handleClearNotification}
      />

      {/* 2. Main Area */}
      <main className="flex-1 flex flex-col p-5 md:p-8 max-w-7xl w-full mx-auto transition-all">
        {activeTab === 'marketplace' ? (
          /* MARKETPLACE TAB */
          <div className="flex-1 flex flex-col">
            
            {/* Real-time Hero stats panel */}
            <HeroSection
              metrics={metrics}
              onShopClick={() => {
                const element = document.getElementById('marketplace-anchor');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }}
              onLearnMoreClick={() => setActiveTab('impact')}
            />

            {/* Anchored Marketplace View */}
            <div id="marketplace-anchor" className="pt-4 flex-1 flex flex-col">
              
              {/* Category Toggles and Status Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-[#EAEAEA] pb-4">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-medium text-[#1A1A1A] tracking-tight">
                    Explore Secondhand Treasures
                  </h2>
                  <p className="text-xs text-[#999] font-light">
                    Direct hand-offs reducing textile extraction and transit emissions.
                  </p>
                </div>

                {/* Filter Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-[#F3F3F3] px-3 py-1.5 rounded-full text-xs text-[#717171] mr-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span className="font-medium">Filter</span>
                  </div>

                  {/* Available only quick toggle */}
                  <button
                    onClick={() => setStatusFilter((p) => (p === 'All' ? 'Available' : 'All'))}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all flex items-center gap-1 ${
                      statusFilter === 'Available'
                        ? 'bg-[#4A5D4E]/10 border-[#4A5D4E] text-[#4A5D4E]'
                        : 'bg-white border-[#EAEAEA] text-[#717171] hover:border-[#CCC]'
                    }`}
                    id="filter-toggle-available"
                  >
                    {statusFilter === 'Available' && <Check className="w-3 h-3" />}
                    <span>Available Only</span>
                  </button>
                </div>
              </div>

              {/* Minimal category navigation rail */}
              <div className="flex flex-wrap items-center gap-2 mb-8">
                {(['All', 'Clothing', 'Furniture', 'Accessories', 'Home Goods'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2 rounded-full text-xs font-medium tracking-wide cursor-pointer transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#4A5D4E] text-white shadow-xs'
                        : 'bg-white border border-[#EAEAEA] text-[#717171] hover:text-[#2D2D2D] hover:border-[#CCC]'
                    }`}
                    id={`filter-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Interactive listings grid */}
              <div className="flex-1">
                {filteredListings.length > 0 ? (
                  <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                    id="marketplace-grid"
                  >
                    <AnimatePresence mode="popLayout">
                      {filteredListings.map((item) => (
                        <ItemCard
                          key={item.id}
                          listing={item}
                          onClick={() => setSelectedListing(item)}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  /* Zero State */
                  <div 
                    className="py-16 text-center border border-dashed border-[#EAEAEA] rounded-3xl max-w-lg mx-auto bg-[#F9F9F9]/40 p-8"
                    id="listings-empty-state"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#F5F7F5] border border-[#E1E8E1] text-[#4A5D4E] flex items-center justify-center mx-auto mb-4">
                      <Filter className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-medium text-[#1A1A1A]">No matches discovered</h3>
                    <p className="text-xs text-[#717171] font-light max-w-sm mx-auto mt-1 leading-relaxed">
                      Try broadening your search keyword, selecting another category, or list a new item to help grow our circular marketplace!
                    </p>
                    <button
                      onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setStatusFilter('All'); }}
                      className="mt-6 text-xs font-semibold text-[#4A5D4E] underline underline-offset-4 cursor-pointer hover:text-[#2D2D2D]"
                    >
                      Clear search filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'groups' ? (
          /* CONTRIBUTION GROUPS TAB */
          <ContributionGroups
            groups={groups}
            onBackGroup={handleBackGroup}
            onAddGroup={handleAddGroup}
            userBalance={account.balance}
          />
        ) : activeTab === 'chat' ? (
          /* PEER CHAT TAB */
          <PeerChat
            activeAccounts={activeAccounts}
            messages={chatMessages}
            onSendMessage={handleSendMessage}
          />
        ) : activeTab === 'dashboard' ? (
          /* USER DASHBOARD */
          <UserDashboard
            account={account}
            onAddFunds={handleAddFunds}
            onDirectContribution={handleDirectContribution}
            plans={plans}
            activeAccounts={activeAccounts}
            onSwitchPlan={handleSwitchPlan}
            onAddThriftPlan={handleAddThriftPlan}
            onAddActiveAccount={handleAddActiveAccount}
          />
        ) : activeTab === 'impact' ? (
          /* AUDITS & REPORTS VIEW */
          <ReportsView
            metrics={metrics}
            activeAccounts={activeAccounts}
            account={account}
          />
        ) : activeTab === 'admin' ? (
          /* ADMIN & REST API EXPLORER */
          <AdminCenter
            listings={listings}
            onDeleteListing={handleDeleteListing}
            onToggleListingStatus={handleToggleListingStatus}
            plans={plans}
            onAddThriftPlan={handleAddThriftPlan}
            activeAccounts={activeAccounts}
            onAddActiveAccount={handleAddActiveAccount}
            onModifyActiveAccountBalance={handleModifyActiveAccountBalance}
            account={account}
            metrics={metrics}
            onSetAccount={setAccount}
            onSetMetrics={setMetrics}
          />
        ) : (
          /* HOW IT WORKS TABS */
          <SecondaryViews
            activeTab={activeTab as 'how-it-works'}
            metrics={metrics}
            onDonateClick={() => setIsDonationOpen(true)}
          />
        )}
      </main>

      {/* 3. Footer */}
      <footer className="h-16 md:h-14 border-t border-[#EAEAEA] flex flex-col md:flex-row items-center justify-between px-6 md:px-8 bg-white text-[10px] text-[#999] uppercase tracking-[0.2em] py-4 md:py-0 shrink-0 gap-3 md:gap-0">
        <div>&copy; 2026 RE:CIRCLE FOUNDATION</div>
        <div className="flex gap-6 md:gap-8">
          <a href="#" className="hover:text-[#4A5D4E] transition-colors">Terms of Use</a>
          <a href="#" className="hover:text-[#4A5D4E] transition-colors">Circular Index Report</a>
          <a href="#" className="hover:text-[#4A5D4E] transition-colors">Contact</a>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[#999] tracking-widest font-sans text-[9px]">Accepting Circular Donations</span>
        </div>
      </footer>

      {/* 4. Modals and Triggers */}
      <ItemDetailModal
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
        onClaim={handleClaimListing}
        userBalance={account.balance}
        onGoToDashboard={() => setActiveTab('dashboard')}
      />

      <DonationModal
        isOpen={isDonationOpen}
        onClose={() => setIsDonationOpen(false)}
        onAddListing={handleAddListing}
      />
    </div>
  );
}
