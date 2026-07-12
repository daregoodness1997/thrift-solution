import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, Leaf, Sparkles, Plus, Heart, 
  Check, Award, TrendingUp, Info, Users, 
  Search, UserPlus, PlusCircle, BookOpen, 
  ArrowRight, ShieldCheck, Zap
} from 'lucide-react';
import { UserAccount, Transaction, ThriftPlan, ActiveAccount } from '../types';

interface UserDashboardProps {
  account: UserAccount;
  onAddFunds: (amount: number) => void;
  onDirectContribution: (amount: number, cause: string) => boolean; // returns success
  plans: ThriftPlan[];
  activeAccounts: ActiveAccount[];
  onSwitchPlan: (planId: string) => { success: boolean; message: string };
  onAddThriftPlan: (newPlan: ThriftPlan) => void;
  onAddActiveAccount: (newAcc: ActiveAccount) => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  account,
  onAddFunds,
  onDirectContribution,
  plans,
  activeAccounts,
  onSwitchPlan,
  onAddThriftPlan,
  onAddActiveAccount
}) => {
  // Navigation Tabs
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'plans' | 'accounts'>('overview');

  // Wallet Funding State
  const [fundingAmount, setFundingAmount] = useState('');
  const [isFundingOpen, setIsFundingOpen] = useState(false);
  const [fundingSuccess, setFundingSuccess] = useState(false);

  // Cause Contribution State
  const [contributionAmount, setContributionAmount] = useState('25');
  const [selectedCause, setSelectedCause] = useState('Urban Greening & Composting');
  const [contributionSuccess, setContributionSuccess] = useState(false);
  const [causeErrorMsg, setCauseErrorMsg] = useState('');

  // Plan Switching Feedback States
  const [planSwitchSuccessMsg, setPlanSwitchSuccessMsg] = useState('');
  const [planSwitchErrorMsg, setPlanSwitchErrorMsg] = useState('');

  // Search filter for Neighbor accounts
  const [searchAccountQuery, setSearchAccountQuery] = useState('');

  // Custom Thrift Plan Builder Form States
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanTagline, setNewPlanTagline] = useState('');
  const [newPlanFee, setNewPlanFee] = useState('15');
  const [newPlanMultiplier, setNewPlanMultiplier] = useState('1.15');
  const [newPlanPerks, setNewPlanPerks] = useState('');
  const [newPlanDesc, setNewPlanDesc] = useState('');
  const [customPlanSuccess, setCustomPlanSuccess] = useState(false);

  // Custom Active Account Builder Form States
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccEmail, setNewAccEmail] = useState('');
  const [newAccPlanId, setNewAccPlanId] = useState('plan-free');
  const [newAccLevel, setNewAccLevel] = useState('1');
  const [newAccCO2, setNewAccCO2] = useState('15');
  const [newAccItems, setNewAccItems] = useState('2');
  const [customAccSuccess, setCustomAccSuccess] = useState(false);

  const currentPlan = plans.find((p) => p.id === account.currentPlanId) || plans[0];

  // Handlers
  const handleFundingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(fundingAmount);
    if (isNaN(amt) || amt <= 0) return;

    onAddFunds(amt);
    setFundingSuccess(true);
    setFundingAmount('');
    setTimeout(() => {
      setFundingSuccess(false);
      setIsFundingOpen(false);
    }, 1500);
  };

  const handlePresetFundingClick = (preset: number) => {
    setFundingAmount(preset.toString());
  };

  const handleCauseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(contributionAmount);
    if (isNaN(amt) || amt <= 0) return;

    if (account.balance < amt) {
      setCauseErrorMsg('Insufficient balance. Please fund your account wallet first.');
      return;
    }

    setCauseErrorMsg('');
    const success = onDirectContribution(amt, selectedCause);
    if (success) {
      setContributionSuccess(true);
      setTimeout(() => {
        setContributionSuccess(false);
      }, 2000);
    }
  };

  const handleSwitchPlanClick = (planId: string) => {
    setPlanSwitchSuccessMsg('');
    setPlanSwitchErrorMsg('');
    
    const result = onSwitchPlan(planId);
    if (result.success) {
      setPlanSwitchSuccessMsg(result.message);
      setTimeout(() => setPlanSwitchSuccessMsg(''), 4000);
    } else {
      setPlanSwitchErrorMsg(result.message);
      setTimeout(() => setPlanSwitchErrorMsg(''), 5000);
    }
  };

  const handleCreatePlanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName || !newPlanTagline || !newPlanDesc) return;

    const parsedFee = Number(newPlanFee) || 0;
    const parsedMultiplier = Number(newPlanMultiplier) || 1.0;
    const perksArray = newPlanPerks
      ? newPlanPerks.split(',').map((p) => p.trim()).filter(Boolean)
      : ['Exclusive local carbon badges', 'Bypass raw manufacturing retail'];

    const newPlan: ThriftPlan = {
      id: `plan-custom-${Date.now()}`,
      name: newPlanName,
      tagline: newPlanTagline,
      monthlyFee: parsedFee,
      co2Multiplier: parsedMultiplier,
      perks: perksArray,
      description: newPlanDesc
    };

    onAddThriftPlan(newPlan);
    setCustomPlanSuccess(true);
    
    // reset form
    setNewPlanName('');
    setNewPlanTagline('');
    setNewPlanFee('15');
    setNewPlanMultiplier('1.15');
    setNewPlanPerks('');
    setNewPlanDesc('');

    setTimeout(() => {
      setCustomPlanSuccess(false);
      setIsAddingPlan(false);
    }, 2000);
  };

  const handleCreateAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName || !newAccEmail) return;

    const avatarColors = [
      'bg-emerald-100 text-emerald-800 border-emerald-200',
      'bg-amber-100 text-amber-800 border-amber-200',
      'bg-indigo-100 text-indigo-800 border-indigo-200',
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-sky-100 text-sky-800 border-sky-200',
      'bg-rose-100 text-rose-800 border-rose-200'
    ];
    const randomColor = avatarColors[Math.floor(Math.random() * avatarColors.length)];

    const newAcc: ActiveAccount = {
      id: `acc-custom-${Date.now()}`,
      name: newAccName,
      email: newAccEmail,
      level: Number(newAccLevel) || 1,
      totalCO2Saved: Number(newAccCO2) || 0,
      itemsCircularized: Number(newAccItems) || 0,
      planId: newAccPlanId,
      avatarColor: randomColor
    };

    onAddActiveAccount(newAcc);
    setCustomAccSuccess(true);

    // reset form
    setNewAccName('');
    setNewAccEmail('');
    setNewAccPlanId('plan-free');
    setNewAccLevel('1');
    setNewAccCO2('15');
    setNewAccItems('2');

    setTimeout(() => {
      setCustomAccSuccess(false);
      setIsAddingAccount(false);
    }, 2000);
  };

  // Predefined causes for direct donations
  const causes = [
    { name: 'Urban Greening & Composting', desc: 'Sponsors community garden beds and organic scrap collection bins.' },
    { name: 'Circular Arts & Textile Workshops', desc: 'Provides sewing machines and tutoring to repair weathered apparel.' },
    { name: 'Carbon Forestry Reserve', desc: 'Direct funding to buy native saplings for local public parks.' }
  ];

  // Milestones tracking
  const milestones = [
    { name: 'Carbon Preserver', target: 50, current: account.totalCO2Saved, unit: 'kg', icon: Leaf },
    { name: 'Green Patron', target: 100, current: account.totalContributed, unit: '$', icon: Heart },
    { name: 'Circular Catalyst', target: 5, current: account.itemsDonated + account.itemsClaimed, unit: 'items', icon: Award }
  ];

  // Filtered active accounts
  const filteredAccounts = activeAccounts.filter((acc) => {
    const q = searchAccountQuery.toLowerCase();
    const matchesQuery = acc.name.toLowerCase().includes(q) || acc.email.toLowerCase().includes(q);
    return matchesQuery;
  });

  return (
    <div className="space-y-8 animate-fade-in" id="user-dashboard-view">
      
      {/* Dashboard Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#EAEAEA] pb-6">
        <div className="space-y-1">
          <span className="text-[#4A5D4E] uppercase tracking-widest text-[10px] font-bold block">
            Neighbor Portal
          </span>
          <h2 className="text-3xl font-light text-[#1A1A1A] tracking-tight">
            Welcome back, <span className="italic font-serif text-[#4A5D4E] font-medium">daregoodness</span>
          </h2>
          <p className="text-xs text-[#717171] font-light">
            Logged in securely as <strong className="font-semibold text-[#4A5D4E]">{account.email}</strong> • Member since July 2026
          </p>
        </div>

        {/* Global Level & Active Plan Indicators */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Current Thrift Plan Label */}
          <div className="flex items-center gap-2.5 bg-[#FAF9F5] rounded-2xl px-4 py-2.5 shadow-3xs">
            <div className="w-8 h-8 rounded-full bg-[#8A7D73] text-white flex items-center justify-center">
              <Zap className="w-4.5 h-4.5 fill-white/10" />
            </div>
            <div>
              <span className="text-[9px] text-[#8A7D73] font-bold uppercase tracking-wider block">Thrift Tier</span>
              <span className="text-xs font-semibold text-[#2D2D2D]">{currentPlan.name}</span>
            </div>
          </div>

          {/* Level Indicator */}
          <div className="flex items-center gap-2.5 bg-[#F5F7F5] rounded-2xl px-4 py-2.5 shadow-3xs">
            <div className="w-8 h-8 rounded-full bg-[#4A5D4E] text-white flex items-center justify-center text-xs font-mono font-bold">
              Lvl 2
            </div>
            <div>
              <span className="text-[9px] text-[#4A5D4E] font-bold uppercase tracking-wider block">Active Badge</span>
              <span className="text-xs font-semibold text-[#2D2D2D] flex items-center gap-1">
                Eco Guard <Sparkles className="w-3 h-3 text-[#4A5D4E]" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Sub Navigation (Tabs) */}
      <div className="flex border-b border-[#EAEAEA] gap-8">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`pb-3 text-sm font-medium tracking-wide transition-all cursor-pointer relative ${
            activeSubTab === 'overview' ? 'text-[#4A5D4E] font-bold' : 'text-[#717171] hover:text-[#1A1A1A]'
          }`}
          id="btn-subtab-overview"
        >
          Overview & Ledger
          {activeSubTab === 'overview' && (
            <motion.div layoutId="activeSubTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4A5D4E]" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('plans')}
          className={`pb-3 text-sm font-medium tracking-wide transition-all cursor-pointer relative ${
            activeSubTab === 'plans' ? 'text-[#4A5D4E] font-bold' : 'text-[#717171] hover:text-[#1A1A1A]'
          }`}
          id="btn-subtab-plans"
        >
          Thrift Plans Explorer ({plans.length})
          {activeSubTab === 'plans' && (
            <motion.div layoutId="activeSubTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4A5D4E]" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('accounts')}
          className={`pb-3 text-sm font-medium tracking-wide transition-all cursor-pointer relative ${
            activeSubTab === 'accounts' ? 'text-[#4A5D4E] font-bold' : 'text-[#717171] hover:text-[#1A1A1A]'
          }`}
          id="btn-subtab-accounts"
        >
          All Active Accounts ({activeAccounts.length})
          {activeSubTab === 'accounts' && (
            <motion.div layoutId="activeSubTabIndicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4A5D4E]" />
          )}
        </button>
      </div>

      {/* SUB TAB VIEWS */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: OVERVIEW & LEDGER */}
        {activeSubTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Bento Grid: Metrics and Wallet */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Wallet & Funding Card */}
              <div className="bg-white rounded-3xl p-6 flex flex-col justify-between shadow-xs relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#F5F7F5] rounded-full blur-2xl pointer-events-none"></div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[#999] uppercase tracking-widest text-[9px] font-bold block">Account Wallet</span>
                      <span className="text-3xl font-bold text-[#1A1A1A] font-mono tracking-tight" id="dashboard-wallet-balance">
                        ${account.balance.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-9 h-9 bg-[#F5F7F5] border border-[#E1E8E1] rounded-xl flex items-center justify-center text-[#4A5D4E] shadow-2xs">
                      <Wallet className="w-4 h-4" />
                    </div>
                  </div>

                  <p className="text-[#717171] text-[11px] font-light leading-relaxed">
                    Use your wallet balance to quickly claim unique vintage treasures instantly with zero credit card transaction latency.
                  </p>
                </div>

                <div className="mt-6">
                  <AnimatePresence mode="wait">
                    {!isFundingOpen ? (
                      <button
                        onClick={() => setIsFundingOpen(true)}
                        className="w-full bg-[#4A5D4E] text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-[#3D4D40] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                        id="btn-open-wallet-funding"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Fund Wallet Balance</span>
                      </button>
                    ) : (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleFundingSubmit}
                        className="space-y-3 pt-3 border-t border-[#F0F0F0]"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase tracking-widest text-[#999] font-bold">Top-up amount ($)</span>
                        </div>
                        
                        {/* Presets */}
                        <div className="grid grid-cols-4 gap-1.5">
                          {[10, 25, 50, 100].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handlePresetFundingClick(preset)}
                              className="py-1 bg-neutral-50 hover:bg-[#F5F7F5] hover:text-[#4A5D4E] border border-[#EAEAEA] rounded-md text-[10px] font-medium font-mono text-[#717171] transition-colors cursor-pointer"
                            >
                              +${preset}
                            </button>
                          ))}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="number"
                            required
                            min="1"
                            placeholder="Custom amount"
                            value={fundingAmount}
                            onChange={(e) => setFundingAmount(e.target.value)}
                            className="flex-1 bg-neutral-50 border border-[#EAEAEA] rounded-lg px-3 py-1.5 text-xs text-[#2D2D2D] outline-none focus:border-[#4A5D4E] font-mono"
                            id="input-fund-amount"
                          />
                          <button
                            type="submit"
                            disabled={fundingSuccess}
                            className="bg-[#4A5D4E] text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#3D4D40] transition-all cursor-pointer shadow-xs shrink-0 flex items-center justify-center"
                            id="btn-confirm-funding"
                          >
                            {fundingSuccess ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <span>Add</span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsFundingOpen(false)}
                            className="bg-transparent border border-[#EAEAEA] text-[#717171] hover:text-[#2D2D2D] px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Sustainability Carbon Offset Card */}
              <div className="bg-[#FAF9F5] rounded-3xl p-6 flex flex-col justify-between shadow-xs">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#8A7D73] uppercase tracking-widest text-[9px] font-bold block">Carbon Impact</span>
                        {currentPlan.co2Multiplier > 1 && (
                          <span className="bg-[#8A7D73]/10 text-[#8A7D73] px-1.5 py-0.5 rounded-sm text-[8px] font-bold font-mono">
                            {currentPlan.co2Multiplier}x Active
                          </span>
                        )}
                      </div>
                      <span className="text-3xl font-bold text-[#1A1A1A] font-mono tracking-tight" id="dashboard-total-co2">
                        {account.totalCO2Saved.toFixed(1)} kg
                      </span>
                    </div>
                    <div className="w-9 h-9 bg-white border border-[#EDEAE3] rounded-xl flex items-center justify-center text-[#4A5D4E] shadow-2xs">
                      <Leaf className="w-4 h-4" />
                    </div>
                  </div>

                  <p className="text-[#717171] text-[11px] font-light leading-relaxed">
                    Your circular swaps bypass high-resource raw manufacturing. That carbon offset is equivalent to the oxygen output of <strong className="font-medium text-[#2D2D2D]">{Math.round(account.totalCO2Saved / 22)} young saplings</strong>.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#EDEAE3]/40 mt-4">
                  <div className="flex justify-between items-center text-[10px] text-[#8A7D73] font-mono">
                    <span>Items Circularized</span>
                    <span className="font-bold">{account.itemsDonated + account.itemsClaimed} items</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-[#8A7D73] font-mono mt-1">
                    <span>Items Donated</span>
                    <span className="font-bold">{account.itemsDonated}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-[#8A7D73] font-mono mt-1">
                    <span>Items Claimed</span>
                    <span className="font-bold">{account.itemsClaimed}</span>
                  </div>
                </div>
              </div>

              {/* Total Financial Contribution */}
              <div className="bg-[#F5F7F5] rounded-3xl p-6 flex flex-col justify-between shadow-xs">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[#4A5D4E] uppercase tracking-widest text-[9px] font-bold block">Total Contribution</span>
                      <span className="text-3xl font-bold text-[#4A5D4E] font-mono tracking-tight" id="dashboard-total-contributed">
                        ${account.totalContributed.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-9 h-9 bg-white border border-[#E1E8E1] rounded-xl flex items-center justify-center text-[#4A5D4E] shadow-2xs">
                      <Heart className="w-4 h-4" />
                    </div>
                  </div>

                  <p className="text-[#666] text-[11px] font-light leading-relaxed">
                    100% of thrift transactions, subscription plan fees, and direct contributions finance local composting, native forests, and recycling centers.
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E1E8E1] mt-4 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#4A5D4E]" />
                  <span className="text-[10px] text-[#4A5D4E] font-mono font-medium uppercase tracking-wider">Circular Leaderboard Patron</span>
                </div>
              </div>

            </div>

            {/* Main Grid: Direct Cause Donation (Left) & Active Milestones (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Cause Contribution Form */}
              <div className="col-span-12 lg:col-span-7 bg-white rounded-3xl p-6 flex flex-col justify-between shadow-xs">
                <div className="space-y-4">
                  <div>
                    <span className="text-[#4A5D4E] uppercase tracking-widest text-[9px] font-bold block">Thrift Fund Contribution</span>
                    <h3 className="text-lg font-medium text-[#1A1A1A]">Direct Cause Contribution</h3>
                    <p className="text-xs text-[#717171] font-light mt-0.5">
                      Support regional green efforts instantly. Choose a designated cause below.
                    </p>
                  </div>

                  <form onSubmit={handleCauseSubmit} className="space-y-4 pt-2">
                    {/* Cause selection list */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">
                        Select Cause
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {causes.map((c) => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => { setSelectedCause(c.name); setContributionSuccess(false); }}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex justify-between items-center gap-3 ${
                              selectedCause === c.name
                                ? 'bg-[#F5F7F5] border-[#4A5D4E] text-[#4A5D4E]'
                                : 'bg-white border-[#EAEAEA] text-[#717171] hover:border-[#CCC]'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <span className="text-xs font-semibold block">{c.name}</span>
                              <span className="text-[10px] font-light text-[#717171]/90 block">{c.desc}</span>
                            </div>
                            {selectedCause === c.name && (
                              <div className="w-5 h-5 rounded-full bg-[#4A5D4E] text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Amount Selection & Input */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block mb-1.5">
                          Select Donation Preset ($)
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[10, 25, 50, 100].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => { setContributionAmount(preset.toString()); setCauseErrorMsg(''); }}
                              className={`py-2 text-xs font-semibold font-mono rounded-xl border transition-all cursor-pointer ${
                                contributionAmount === preset.toString()
                                  ? 'bg-[#4A5D4E] text-white border-[#4A5D4E]'
                                  : 'bg-white border-[#EAEAEA] text-[#717171] hover:border-[#CCC]'
                              }`}
                            >
                              ${preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="custom-donation-input" className="text-[10px] uppercase tracking-widest text-[#999] font-bold block mb-1.5">
                          Or Enter Custom Amount ($)
                        </label>
                        <input
                          id="custom-donation-input"
                          type="number"
                          min="1"
                          placeholder="Custom amount"
                          value={contributionAmount}
                          onChange={(e) => { setContributionAmount(e.target.value); setCauseErrorMsg(''); }}
                          className="w-full bg-neutral-50 border border-[#EAEAEA] rounded-xl px-4 py-2.5 text-xs text-[#2D2D2D] outline-none focus:border-[#4A5D4E] font-mono transition-all"
                        />
                      </div>
                    </div>

                    {causeErrorMsg && (
                      <p className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
                        {causeErrorMsg}
                      </p>
                    )}

                    {contributionSuccess && (
                      <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl flex items-center gap-2">
                        <Check className="w-4 h-4 shrink-0" />
                        <span>Successfully contributed ${contributionAmount} directly to <strong>{selectedCause}</strong>! Thank you for backing regional restoration.</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={contributionSuccess || !contributionAmount}
                      className="w-full bg-[#4A5D4E] text-white py-3 rounded-xl text-xs font-semibold tracking-wide hover:bg-[#3D4D40] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs disabled:opacity-50"
                      id="btn-submit-dashboard-contribution"
                    >
                      <Heart className="w-4 h-4 fill-white/10" />
                      <span>Publish Fund Contribution • ${contributionAmount}</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Milestones Tracker */}
              <div className="col-span-12 lg:col-span-5 bg-white rounded-3xl p-6 flex flex-col justify-between shadow-xs">
                <div className="space-y-4">
                  <div>
                    <span className="text-[#8A7D73] uppercase tracking-widest text-[9px] font-bold block">Circular Milestones</span>
                    <h3 className="text-lg font-medium text-[#1A1A1A]">My Green Achievements</h3>
                    <p className="text-xs text-[#717171] font-light mt-0.5">
                      Earn verified badges as your active circular weight grows.
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    {milestones.map((m) => {
                      const percentage = Math.min(100, Math.round((m.current / m.target) * 100));
                      const IconComp = m.icon;

                      return (
                        <div key={m.name} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2 text-[#2D2D2D] font-medium">
                              <div className={`p-1.5 rounded-lg border ${percentage === 100 ? 'bg-[#F5F7F5] border-[#E1E8E1] text-[#4A5D4E]' : 'bg-neutral-50 border-[#EAEAEA] text-[#717171]'}`}>
                                <IconComp className="w-3.5 h-3.5" />
                              </div>
                              <span>{m.name}</span>
                            </div>
                            <span className="text-[10px] font-mono text-[#717171]">
                              {m.current.toFixed(0)}/{m.target} {m.unit} ({percentage}%)
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#4A5D4E] rounded-full transition-all duration-500" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          {percentage === 100 && (
                            <span className="text-[8px] uppercase tracking-widest font-bold text-[#4A5D4E] font-mono flex items-center gap-1 mt-0.5">
                              <Check className="w-2.5 h-2.5" /> Achievement Unlocked
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-[#FAF9F5] rounded-2xl p-3 flex items-start gap-2.5 mt-6">
                  <Info className="w-4 h-4 text-[#8A7D73] shrink-0 mt-0.5" />
                  <p className="text-[10px] text-[#717171] font-light leading-relaxed">
                    <strong>Sustainability Leaderboards:</strong> We do not publish individual transactions, respecting privacy. Cumulative metrics are reported anonymously on the <em className="underline cursor-pointer">Circular Index Report</em>.
                  </p>
                </div>
              </div>

            </div>

            {/* Transaction History Ledger */}
            <div className="bg-white rounded-3xl p-6 shadow-xs overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F0F0F0] pb-4 mb-4">
                <div>
                  <span className="text-[#999] uppercase tracking-widest text-[9px] font-bold block">Verified Ledger</span>
                  <h3 className="text-lg font-medium text-[#1A1A1A]">My Direct Activity Ledger</h3>
                </div>
                <div className="text-[10px] text-[#717171] font-mono">
                  Total Ledger Entries: {account.transactions.length}
                </div>
              </div>

              <div className="overflow-x-auto">
                {account.transactions.length > 0 ? (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-100 text-[#999] uppercase tracking-wider font-mono text-[9px]">
                        <th className="pb-3 font-semibold">Activity Date</th>
                        <th className="pb-3 font-semibold">Type</th>
                        <th className="pb-3 font-semibold">Description / Program</th>
                        <th className="pb-3 font-semibold text-right">Resource Impact</th>
                        <th className="pb-3 font-semibold text-right">Transaction Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {account.transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="py-3 font-mono text-[#717171]">{t.date}</td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold tracking-wider uppercase font-mono ${
                              t.type === 'funding' 
                                ? 'bg-[#F5F7F5] text-[#4A5D4E] border border-[#E1E8E1]'
                                : t.type === 'purchase'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                            }`}>
                              {t.type}
                            </span>
                          </td>
                          <td className="py-3 font-medium text-[#2D2D2D]">{t.description}</td>
                          <td className="py-3 text-right font-mono text-[#4A5D4E] font-medium">
                            {t.co2Saved ? `-${t.co2Saved}kg CO₂` : '—'}
                          </td>
                          <td className={`py-3 text-right font-mono font-semibold ${t.type === 'funding' ? 'text-emerald-700' : 'text-[#2D2D2D]'}`}>
                            {t.type === 'funding' ? '+' : '-'}${t.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-12 text-center text-[#999] font-light">
                    No circular history logs registered on this ledger. Claim items or donate to initialize activities!
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: THRIFT PLANS EXPLORER & BUILDER */}
        {activeSubTab === 'plans' && (
          <motion.div
            key="plans"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Header section with add plan action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-light text-[#1A1A1A]">Thrift & Auto-Contribution Plans</h3>
                <p className="text-xs text-[#717171] font-light mt-1">
                  Enrolling automatically finances green restoration programs while multiplying your carbon preservation score.
                </p>
              </div>

              <button
                onClick={() => setIsAddingPlan(!isAddingPlan)}
                className="bg-[#4A5D4E] hover:bg-[#3D4D40] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start cursor-pointer transition-colors shadow-2xs"
                id="btn-trigger-add-plan"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Custom Plan</span>
              </button>
            </div>

            {/* Custom Plan creation Form */}
            <AnimatePresence>
              {isAddingPlan && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#FBFBFA] rounded-3xl p-6 overflow-hidden"
                  id="custom-plan-form-container"
                >
                  <h4 className="text-sm font-semibold text-[#2D2D2D] mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#4A5D4E]" />
                    <span>Design a New Community Thrift Plan</span>
                  </h4>

                  <form onSubmit={handleCreatePlanSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">
                          Plan Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Coastal Cleanup Advocate"
                          value={newPlanName}
                          onChange={(e) => setNewPlanName(e.target.value)}
                          className="w-full bg-white border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#4A5D4E] transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">
                          Tagline / Summary
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Combats ocean plastics & funds regional bins"
                          value={newPlanTagline}
                          onChange={(e) => setNewPlanTagline(e.target.value)}
                          className="w-full bg-white border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#4A5D4E] transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">
                          Monthly Fee ($)
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={newPlanFee}
                          onChange={(e) => setNewPlanFee(e.target.value)}
                          className="w-full bg-white border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-[#4A5D4E] transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">
                          CO2 Offset Modifier Multiplier
                        </label>
                        <input
                          type="number"
                          required
                          step="0.05"
                          min="1"
                          max="3"
                          value={newPlanMultiplier}
                          onChange={(e) => setNewPlanMultiplier(e.target.value)}
                          className="w-full bg-white border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-[#4A5D4E] transition-all"
                        />
                      </div>

                      <div className="space-y-1 font-sans">
                        <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">
                          Key Perks (comma separated)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Early alert alerts, 1.3x multiplier, badges"
                          value={newPlanPerks}
                          onChange={(e) => setNewPlanPerks(e.target.value)}
                          className="w-full bg-white border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#4A5D4E] transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">
                        Detailed Description
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Provide details on where funds are routed and the structural impact of this thrift sub-tier."
                        value={newPlanDesc}
                        onChange={(e) => setNewPlanDesc(e.target.value)}
                        className="w-full bg-white border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#4A5D4E] transition-all"
                      />
                    </div>

                    {customPlanSuccess && (
                      <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl">
                        Thrift Plan created successfully! It is now listed below for any neighbor to enroll.
                      </p>
                    )}

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsAddingPlan(false)}
                        className="bg-transparent border border-[#EAEAEA] text-[#717171] hover:text-[#2D2D2D] px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-[#4A5D4E] hover:bg-[#3D4D40] text-white px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        Publish Plan
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Current Active Plan Detail Panel */}
            <div className="bg-[#FAF9F5] rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 bg-[#4A5D4E]/10 text-[#4A5D4E] px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>My Current Thrift Plan</span>
                  </div>
                  <h3 className="text-2xl font-semibold text-[#1A1A1A] tracking-tight">{currentPlan.name}</h3>
                  <p className="text-xs text-[#717171] italic font-light max-w-xl">{currentPlan.tagline}</p>
                  <p className="text-xs text-[#717171] font-light leading-relaxed max-w-2xl">{currentPlan.description}</p>
                </div>

                <div className="bg-white rounded-2xl p-5 shrink-0 text-center min-w-[180px] space-y-2">
                  <span className="text-[10px] text-[#8A7D73] font-bold uppercase tracking-widest block">Monthly Auto-Contribution</span>
                  <span className="text-3xl font-extrabold text-[#1A1A1A] font-mono block">${currentPlan.monthlyFee.toFixed(2)}</span>
                  <span className="text-[10px] text-[#4A5D4E] font-mono bg-[#F5F7F5] border border-[#E1E8E1] px-2 py-0.5 rounded-md inline-block">
                    {currentPlan.co2Multiplier}x Carbon Modifier
                  </span>
                </div>
              </div>

              {/* Current perks bullets */}
              <div className="border-t border-[#EDEAE3] mt-5 pt-5">
                <h4 className="text-[10px] uppercase tracking-widest text-[#8A7D73] font-bold mb-3">Active Benefits & Perks</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currentPlan.perks.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-[#2D2D2D] font-light">
                      <div className="w-4 h-4 bg-emerald-50 text-emerald-800 rounded-full flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 font-bold" />
                      </div>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Error and Success notifications for Plan changes */}
            {planSwitchSuccessMsg && (
              <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{planSwitchSuccessMsg}</span>
              </div>
            )}
            {planSwitchErrorMsg && (
              <div className="text-xs text-rose-800 bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{planSwitchErrorMsg}</span>
              </div>
            )}

            {/* Grid of all plans */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {plans.map((p) => {
                const isActive = p.id === account.currentPlanId;
                return (
                  <div 
                    key={p.id}
                    className={`bg-white rounded-3xl p-6 flex flex-col justify-between transition-all relative ${
                      isActive 
                        ? 'shadow-sm ring-1 ring-[#4A5D4E]/20' 
                        : 'shadow-2xs'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-4 right-4 bg-[#4A5D4E] text-white text-[8px] font-bold tracking-widest uppercase px-2 py-1 rounded-md">
                        Enrolled
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] font-mono text-[#4A5D4E] font-bold bg-[#F5F7F5] border border-[#E1E8E1] px-2 py-0.5 rounded-md inline-block mb-2">
                          {p.co2Multiplier}x Modifier
                        </span>
                        <h4 className="text-lg font-semibold text-[#1A1A1A]">{p.name}</h4>
                        <p className="text-[11px] text-[#717171] font-light italic mt-0.5">{p.tagline}</p>
                      </div>

                      <p className="text-xs text-[#717171] font-light leading-relaxed">{p.description}</p>

                      <div className="space-y-2 pt-2 border-t border-neutral-100">
                        <span className="text-[9px] uppercase tracking-widest text-[#999] font-bold block">Included Perks</span>
                        <ul className="space-y-1">
                          {p.perks.slice(0, 3).map((perk, i) => (
                            <li key={i} className="text-[11px] text-[#2D2D2D] font-light flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-[#4A5D4E] rounded-full shrink-0"></span>
                              <span>{perk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[9px] text-[#999] uppercase tracking-wider block">Contribution Fee</span>
                        <span className="text-lg font-bold text-[#1A1A1A] font-mono">
                          {p.monthlyFee === 0 ? 'Free' : `$${p.monthlyFee.toFixed(2)}/mo`}
                        </span>
                      </div>

                      <button
                        onClick={() => handleSwitchPlanClick(p.id)}
                        disabled={isActive}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1 shrink-0 ${
                          isActive
                            ? 'bg-neutral-50 text-neutral-400 border border-neutral-100 cursor-not-allowed'
                            : 'bg-[#4A5D4E] text-white hover:bg-[#3D4D40] shadow-xs'
                        }`}
                      >
                        {isActive ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Active Plan</span>
                          </>
                        ) : (
                          <>
                            <span>Enroll Plan</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* TAB 3: NEIGHBOR DIRECTORY (ALL ACTIVE ACCOUNTS) */}
        {activeSubTab === 'accounts' && (
          <motion.div
            key="accounts"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Title with account adder */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-light text-[#1A1A1A]">Circular Economy Neighbors</h3>
                <p className="text-xs text-[#717171] font-light mt-1">
                  Connect with local peers swapping goods, supporting urban greening, and building circular resilience.
                </p>
              </div>

              <button
                onClick={() => setIsAddingAccount(!isAddingAccount)}
                className="bg-[#4A5D4E] hover:bg-[#3D4D40] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start cursor-pointer transition-colors shadow-2xs"
                id="btn-trigger-add-account"
              >
                <UserPlus className="w-4 h-4" />
                <span>Register Neighbor Profile</span>
              </button>
            </div>

            {/* Custom Account / Neighbor Profile builder Form */}
            <AnimatePresence>
              {isAddingAccount && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#FBFBFA] rounded-3xl p-6 overflow-hidden"
                  id="custom-account-form-container"
                >
                  <h4 className="text-sm font-semibold text-[#2D2D2D] mb-4 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-[#4A5D4E]" />
                    <span>Register New Neighbor on Ledger</span>
                  </h4>

                  <form onSubmit={handleCreateAccountSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Liam Vance"
                          value={newAccName}
                          onChange={(e) => setNewAccName(e.target.value)}
                          className="w-full bg-white border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#4A5D4E] transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">
                          Secure Email Address
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. liam.vance@circle.org"
                          value={newAccEmail}
                          onChange={(e) => setNewAccEmail(e.target.value)}
                          className="w-full bg-white border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#4A5D4E] transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">
                          Active Thrift Plan
                        </label>
                        <select
                          value={newAccPlanId}
                          onChange={(e) => setNewAccPlanId(e.target.value)}
                          className="w-full bg-white border border-[#EAEAEA] rounded-xl px-2 py-2 text-xs outline-none focus:border-[#4A5D4E]"
                        >
                          {plans.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">
                          Experience Level (1-10)
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="10"
                          value={newAccLevel}
                          onChange={(e) => setNewAccLevel(e.target.value)}
                          className="w-full bg-white border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#4A5D4E]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">
                          CO2 Offset Saved (kg)
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={newAccCO2}
                          onChange={(e) => setNewAccCO2(e.target.value)}
                          className="w-full bg-white border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#4A5D4E]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">
                          Items Swapped / Donated
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={newAccItems}
                          onChange={(e) => setNewAccItems(e.target.value)}
                          className="w-full bg-white border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#4A5D4E]"
                        />
                      </div>
                    </div>

                    {customAccSuccess && (
                      <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl">
                        Neighbor profile registered successfully! They are now added to the secure community listing directory.
                      </p>
                    )}

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsAddingAccount(false)}
                        className="bg-transparent border border-[#EAEAEA] text-[#717171] hover:text-[#2D2D2D] px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-[#4A5D4E] hover:bg-[#3D4D40] text-white px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        Register Profile
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search and Filters */}
            <div className="flex items-center gap-3 bg-white border border-[#EAEAEA] rounded-2xl px-4 py-3 shadow-3xs max-w-md">
              <Search className="w-4 h-4 text-[#717171]" />
              <input
                type="text"
                placeholder="Search active neighbors by name or email..."
                value={searchAccountQuery}
                onChange={(e) => setSearchAccountQuery(e.target.value)}
                className="w-full bg-transparent text-xs text-[#2D2D2D] outline-none placeholder-[#999]"
              />
            </div>

            {/* Accounts Directory Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Include User's Own Account at the start for a real fully interactive feel! */}
              {account.email.toLowerCase().includes(searchAccountQuery.toLowerCase()) && (
                <div className="bg-[#FAF9F5] rounded-3xl p-5 flex flex-col justify-between shadow-2xs relative">
                  <div className="absolute top-4 right-4 bg-[#4A5D4E] text-white text-[7px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded">
                    You
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#4A5D4E] text-white flex items-center justify-center font-bold text-xs shadow-3xs">
                        DG
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-bold text-[#1A1A1A] truncate">daregoodness</h4>
                        <span className="text-[10px] text-[#717171] truncate block">{account.email}</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-[#EDEAE3]">
                      <div className="flex justify-between items-center text-[10px] text-[#717171]">
                        <span>Circular Level</span>
                        <span className="font-mono font-semibold text-[#1A1A1A]">Lvl 2 (Eco Guard)</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-[#717171]">
                        <span>CO₂ Saved Offset</span>
                        <span className="font-mono font-semibold text-[#4A5D4E]">{account.totalCO2Saved.toFixed(1)} kg</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-[#717171]">
                        <span>Ledger Swaps</span>
                        <span className="font-mono font-semibold text-[#1A1A1A]">{account.itemsDonated + account.itemsClaimed} items</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#EDEAE3] flex items-center justify-between">
                    <span className="text-[9px] text-[#8A7D73] font-bold uppercase tracking-wider">Active Plan</span>
                    <span className="text-[10px] font-semibold text-[#8A7D73]">{currentPlan.name}</span>
                  </div>
                </div>
              )}

              {/* Loop other accounts */}
              {filteredAccounts.map((acc) => {
                const associatedPlan = plans.find((p) => p.id === acc.planId) || plans[0];
                const initials = acc.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase();

                return (
                  <div 
                    key={acc.id}
                    className="bg-white rounded-3xl p-5 flex flex-col justify-between hover:border-[#BBB] transition-all shadow-2xs"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-semibold text-xs shrink-0 ${acc.avatarColor}`}>
                          {initials}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-bold text-[#1A1A1A] truncate">{acc.name}</h4>
                          <span className="text-[10px] text-[#717171] truncate block">{acc.email}</span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-3 border-t border-neutral-100">
                        <div className="flex justify-between items-center text-[10px] text-[#717171]">
                          <span>Circular Level</span>
                          <span className="font-mono font-semibold text-[#1A1A1A]">Lvl {acc.level}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-[#717171]">
                          <span>CO₂ Saved Offset</span>
                          <span className="font-mono font-semibold text-[#4A5D4E]">{acc.totalCO2Saved.toFixed(1)} kg</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-[#717171]">
                          <span>Ledger Swaps</span>
                          <span className="font-mono font-semibold text-[#1A1A1A]">{acc.itemsCircularized} items</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
                      <span className="text-[9px] text-[#999] uppercase tracking-wider">Active Plan</span>
                      <span className="text-[10px] font-semibold text-[#4A5D4E]">{associatedPlan.name}</span>
                    </div>
                  </div>
                );
              })}

              {filteredAccounts.length === 0 && !account.email.toLowerCase().includes(searchAccountQuery.toLowerCase()) && (
                <div className="col-span-full py-12 text-center text-[#999] font-light border border-dashed border-[#EAEAEA] rounded-3xl">
                  No neighbors found matching "{searchAccountQuery}". Register Liam or Amelia now!
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
