import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Database, Send, Check, Play, RefreshCw, Trash2, ArrowUpRight, Code, ListFilter, Plus, Sparkles, UserPlus } from 'lucide-react';
import { Listing, ThriftPlan, ActiveAccount, UserAccount, ImpactMetrics, Transaction } from '../types';

interface AdminCenterProps {
  listings: Listing[];
  onDeleteListing: (id: string) => void;
  onToggleListingStatus: (id: string) => void;
  plans: ThriftPlan[];
  onAddThriftPlan: (newPlan: ThriftPlan) => void;
  activeAccounts: ActiveAccount[];
  onAddActiveAccount: (newAcc: ActiveAccount) => void;
  onModifyActiveAccountBalance: (id: string, amountToAdd: number) => void;
  account: UserAccount;
  metrics: ImpactMetrics;
  onSetAccount: React.Dispatch<React.SetStateAction<UserAccount>>;
  onSetMetrics: React.Dispatch<React.SetStateAction<ImpactMetrics>>;
}

export const AdminCenter: React.FC<AdminCenterProps> = ({
  listings,
  onDeleteListing,
  onToggleListingStatus,
  plans,
  onAddThriftPlan,
  activeAccounts,
  onAddActiveAccount,
  onModifyActiveAccountBalance,
  account,
  metrics,
  onSetAccount,
  onSetMetrics
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'stats' | 'listings' | 'plans' | 'users' | 'api'>('stats');
  
  // API Playground State
  const [selectedEndpoint, setSelectedEndpoint] = useState<'listings' | 'plans' | 'accounts' | 'metrics'>('listings');
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST'>('GET');
  const [apiResponse, setApiResponse] = useState<string>('');
  const [apiLoading, setApiLoading] = useState(false);
  const [apiRequestBody, setApiRequestBody] = useState<string>('');

  // Forms in Admin State
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanTag, setNewPlanTag] = useState('');
  const [newPlanFee, setNewPlanFee] = useState('15');
  const [newPlanMultiplier, setNewPlanMultiplier] = useState('1.2');
  const [newPlanPerks, setNewPlanPerks] = useState('');
  const [newPlanDesc, setNewPlanDesc] = useState('');
  const [planSuccess, setPlanSuccess] = useState(false);

  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserCO2, setNewUserCO2] = useState('45');
  const [newUserItems, setNewUserItems] = useState('4');
  const [newUserPlan, setNewUserPlan] = useState('plan-seedling');
  const [userSuccess, setUserSuccess] = useState(false);

  const [adjustAmount, setAdjustAmount] = useState<{ [key: string]: string }>({});

  // Emulate REST API requests on active React states
  const handleSendApiRequest = () => {
    setApiLoading(true);
    setApiResponse('');

    setTimeout(() => {
      setApiLoading(false);
      if (apiMethod === 'GET') {
        switch (selectedEndpoint) {
          case 'listings':
            setApiResponse(JSON.stringify(listings, null, 2));
            break;
          case 'plans':
            setApiResponse(JSON.stringify(plans, null, 2));
            break;
          case 'accounts':
            setApiResponse(JSON.stringify(activeAccounts, null, 2));
            break;
          case 'metrics':
            setApiResponse(JSON.stringify(metrics, null, 2));
            break;
          default:
            setApiResponse('{"status": 404, "error": "Endpoint Not Found"}');
        }
      } else {
        // POST Emulation
        try {
          const parsed = JSON.parse(apiRequestBody);
          setApiResponse(JSON.stringify({
            status: 201,
            message: 'Resource Created Successfully',
            timestamp: new Date().toISOString(),
            data: parsed
          }, null, 2));
        } catch (err: any) {
          setApiResponse(JSON.stringify({
            status: 400,
            error: 'Bad Request',
            reason: 'Invalid JSON request payload body: ' + err.message
          }, null, 2));
        }
      }
    }, 450);
  };

  // Pre-fill requests
  React.useEffect(() => {
    if (apiMethod === 'POST') {
      if (selectedEndpoint === 'listings') {
        setApiRequestBody(JSON.stringify({
          title: 'Artisanal Stoneware Pot',
          category: 'Home Goods',
          condition: 'Excellent',
          price: 32.00,
          donorName: 'Dare',
          co2Saved: 8.5,
          tag: 'UNIQUE',
          description: 'High-fire stoneware pot with textured details and earthen green glaze. Crafted locally.'
        }, null, 2));
      } else if (selectedEndpoint === 'plans') {
        setApiRequestBody(JSON.stringify({
          name: 'Compost Ranger',
          tagline: 'Active backyard carbon warrior',
          monthlyFee: 12.00,
          co2Multiplier: 1.15,
          perks: ['Free organic fertilizer bins', '1.15x carbon multiplier'],
          description: 'A custom tier designed to directly source soil and compost grids.'
        }, null, 2));
      } else {
        setApiRequestBody(JSON.stringify({
          name: 'Marcus Vance',
          email: 'marcus.v@circle.org',
          level: 4,
          totalCO2Saved: 160.0,
          itemsCircularized: 12,
          planId: 'plan-sapling'
        }, null, 2));
      }
    } else {
      setApiRequestBody('');
    }
  }, [selectedEndpoint, apiMethod]);

  const handleAdminAddPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName || !newPlanDesc) return;

    const newPlan: ThriftPlan = {
      id: `plan-custom-${Date.now()}`,
      name: newPlanName,
      tagline: newPlanTag || 'Custom community-crafted subscription',
      monthlyFee: parseFloat(newPlanFee) || 0,
      co2Multiplier: parseFloat(newPlanMultiplier) || 1.0,
      perks: newPlanPerks ? newPlanPerks.split(',').map(s => s.trim()) : ['Community Support badge', 'Direct Green Contribution'],
      description: newPlanDesc
    };

    onAddThriftPlan(newPlan);
    setPlanSuccess(true);
    setNewPlanName('');
    setNewPlanTag('');
    setNewPlanDesc('');
    setNewPlanPerks('');

    setTimeout(() => setPlanSuccess(false), 4000);
  };

  const handleAdminAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;

    const newUser: ActiveAccount = {
      id: `acc-custom-${Date.now()}`,
      name: newUserName,
      email: newUserEmail,
      level: 1,
      totalCO2Saved: parseFloat(newUserCO2) || 0,
      itemsCircularized: parseInt(newUserItems) || 0,
      planId: newUserPlan,
      avatarColor: 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };

    onAddActiveAccount(newUser);
    setUserSuccess(true);
    setNewUserName('');
    setNewUserEmail('');

    setTimeout(() => setUserSuccess(false), 4000);
  };

  const handleAdjustUserBalance = (userId: string) => {
    const amountStr = adjustAmount[userId];
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount)) return;

    onModifyActiveAccountBalance(userId, amount);
    setAdjustAmount(prev => ({ ...prev, [userId]: '' }));
  };

  const handleTriggerAuditReset = () => {
    if (confirm('Are you sure you want to run live diagnostic auditing? This resets platform metrics to default.')) {
      onSetMetrics({
        itemsDonated: 1284,
        co2Saved: 4120.0,
        fundsRaised: 12400.00
      });
      alert('Diagnostic metrics audited and re-aligned with public ledger.');
    }
  };

  return (
    <div className="space-y-8 py-4" id="view-admin-center">
      {/* Intro Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EAEAEA] pb-5">
        <div>
          <span className="text-[#4A5D4E] uppercase tracking-widest text-[9px] font-bold block">
            System Administrator Interface
          </span>
          <h2 className="text-2xl font-light text-[#1A1A1A] tracking-tight">
            Platform <span className="italic font-serif text-[#4A5D4E] font-medium">Control Center</span> & REST API
          </h2>
          <p className="text-xs text-[#717171] font-light mt-1">
            Perform catalog listings moderation, update community subscription tiers, seed accounts, and debug live API payloads.
          </p>
        </div>

        {/* Diagnostic Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleTriggerAuditReset}
            className="bg-[#F5F7F5] border border-[#E1E8E1] hover:bg-[#EAEAEA] text-[#4A5D4E] px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5"
            title="Recalculate entire database aggregates"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Diagnostic Audit</span>
          </button>
        </div>
      </div>

      {/* Admin sub-menu tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#F0F0F0] pb-2">
        {[
          { id: 'stats', label: 'Platform Stats' },
          { id: 'listings', label: 'Moderate Listings' },
          { id: 'plans', label: 'Subscription Plans' },
          { id: 'users', label: 'Neighbor Accounts' },
          { id: 'api', label: 'REST API Playground' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeSubTab === tab.id
                ? 'bg-[#4A5D4E] text-white'
                : 'bg-transparent text-[#717171] hover:text-[#2D2D2D]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Interactive views */}
      <AnimatePresence mode="wait">
        {/* TAB 1: PLATFORM STATS */}
        {activeSubTab === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-2xs">
                <span className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">Items Circularized</span>
                <span className="text-2xl font-bold font-mono text-[#2D2D2D] block mt-1">{(listings.length + metrics.itemsDonated).toLocaleString()}</span>
                <span className="text-[10px] text-emerald-700 font-medium block mt-1">+{(listings.length)} live in catalog</span>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-2xs">
                <span className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">Carbon Impact Saved</span>
                <span className="text-2xl font-bold font-mono text-[#2D2D2D] block mt-1">{(metrics.co2Saved).toFixed(1)} kg</span>
                <span className="text-[10px] text-emerald-700 font-medium block mt-1">Equivalent to 187 annual pine trees</span>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-2xs">
                <span className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">Auto-Contribution Ledger</span>
                <span className="text-2xl font-bold font-mono text-emerald-800 block mt-1">${(metrics.fundsRaised).toFixed(2)}</span>
                <span className="text-[10px] text-[#717171] block mt-1">100% routed to regional composting</span>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-2xs">
                <span className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">Active Registrars</span>
                <span className="text-2xl font-bold font-mono text-[#2D2D2D] block mt-1">{(activeAccounts.length + 1)} users</span>
                <span className="text-[10px] text-[#717171] block mt-1">Standard & premium eco plans</span>
              </div>
            </div>

            {/* Platform Health and Diagnostics */}
            <div className="bg-[#FAF9F5] rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
              <div className="space-y-1">
                <span className="text-[#8A7D73] uppercase tracking-widest text-[9px] font-bold block">System Status</span>
                <h3 className="text-lg font-medium text-[#1A1A1A]">Ledger Infrastructure Integrity</h3>
                <p className="text-xs text-[#717171] leading-relaxed max-w-xl font-light">
                  Our circular transaction ledger is fully active. All peer-to-peer vintage swaps, wallet top-ups, cause backing donations, and plan debits write live state outputs directly to the browser local database container.
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl space-y-2 text-center min-w-[200px]">
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-semibold uppercase tracking-wider font-mono">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>System Healthy</span>
                </div>
                <div className="text-[10px] text-[#999] font-mono leading-none">
                  Port: <strong className="text-neutral-700">3000 (Ingress Active)</strong>
                </div>
                <div className="text-[10px] text-[#999] font-mono leading-none mt-1">
                  Database: <strong className="text-neutral-700">Local Ledger Engine</strong>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: MODERATE LISTINGS */}
        {activeSubTab === 'listings' && (
          <motion.div
            key="listings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-[#2D2D2D]">Currently Active Marketplace Catalog Listings</h3>
              <span className="text-[11px] font-mono text-[#717171]">{listings.length} item(s) on-sale</span>
            </div>

            <div className="bg-white rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#F0F0F0] text-[#999] uppercase font-mono text-[9px] bg-neutral-50/50">
                      <th className="p-3">ID</th>
                      <th className="p-3">Listing Title</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Condition</th>
                      <th className="p-3">Price</th>
                      <th className="p-3">Donor Name</th>
                      <th className="p-3">CO₂ Saved</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {listings.map((item) => (
                      <tr key={item.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="p-3 font-mono text-[#717171]">{item.id}</td>
                        <td className="p-3 font-medium text-[#2D2D2D]">{item.title}</td>
                        <td className="p-3 text-[#717171]">{item.category}</td>
                        <td className="p-3">
                          <span className="bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded text-[10px] font-medium font-sans">
                            {item.condition}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-[#2D2D2D] font-mono">${item.price}</td>
                        <td className="p-3 text-[#717171]">{item.donorName}</td>
                        <td className="p-3 font-mono font-bold text-emerald-800">-{item.co2Saved} kg</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => onToggleListingStatus(item.id)}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider cursor-pointer border ${
                              item.status === 'Available'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                                : 'bg-rose-50 text-rose-800 border-rose-100'
                            }`}
                          >
                            {item.status.toUpperCase()}
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onDeleteListing(item.id)}
                            className="text-rose-600 hover:text-rose-800 font-semibold text-xs cursor-pointer inline-flex items-center gap-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: SUBSCRIPTION PLANS */}
        {activeSubTab === 'plans' && (
          <motion.div
            key="plans"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left: Add Plan Form */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-2xs self-start">
              <h3 className="text-sm font-semibold text-[#2D2D2D] mb-4">Launch New Subscription Plan</h3>
              <form onSubmit={handleAdminAddPlan} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">Plan Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eco Guardian Supreme"
                    value={newPlanName}
                    onChange={(e) => setNewPlanName(e.target.value)}
                    className="w-full bg-neutral-50 border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#4A5D4E] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">Tagline</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Absolute zero emissions master"
                    value={newPlanTag}
                    onChange={(e) => setNewPlanTag(e.target.value)}
                    className="w-full bg-neutral-50 border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#4A5D4E] transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">Monthly Fee ($)</label>
                    <input
                      type="number"
                      required
                      value={newPlanFee}
                      onChange={(e) => setNewPlanFee(e.target.value)}
                      className="w-full bg-neutral-50 border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs font-mono outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">CO2 Multiplier</label>
                    <input
                      type="number"
                      step="0.05"
                      required
                      value={newPlanMultiplier}
                      onChange={(e) => setNewPlanMultiplier(e.target.value)}
                      className="w-full bg-neutral-50 border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1 font-sans">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">Perks (Comma split)</label>
                  <input
                    type="text"
                    placeholder="e.g. 1.25x extra CO2, repaired sewing tutoring"
                    value={newPlanPerks}
                    onChange={(e) => setNewPlanPerks(e.target.value)}
                    className="w-full bg-neutral-50 border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">Detailed Description</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Describe where funds are routed and plan characteristics."
                    value={newPlanDesc}
                    onChange={(e) => setNewPlanDesc(e.target.value)}
                    className="w-full bg-neutral-50 border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#4A5D4E] transition-all"
                  />
                </div>

                {planSuccess && (
                  <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl">
                    New Thrift Plan successfully published on community catalog!
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#4A5D4E] hover:bg-[#3D4D40] text-white py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                >
                  Publish Plan Tier
                </button>
              </form>
            </div>

            {/* Right: Active Plans Ledger */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-2xs self-start space-y-4">
              <h3 className="text-sm font-semibold text-[#2D2D2D]">Currently Registered Thrift Subscription Plans</h3>
              <div className="space-y-3.5 max-h-96 overflow-y-auto">
                {plans.map((p) => (
                  <div key={p.id} className="p-3.5 hover:border-[#DDD] rounded-2xl flex items-start justify-between gap-4 transition-all bg-[#FAF9F6]/40">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#2D2D2D]">{p.name}</span>
                        <span className="bg-[#4A5D4E]/10 text-[#4A5D4E] text-[8px] font-bold font-mono px-1 rounded-sm">
                          {p.co2Multiplier}x Mult
                        </span>
                      </div>
                      <p className="text-[11px] text-[#717171] font-light leading-relaxed">{p.tagline}</p>
                      <p className="text-[10px] text-[#999] font-light">{p.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold font-mono block text-[#2D2D2D]">
                        {p.monthlyFee === 0 ? 'Free' : `$${p.monthlyFee.toFixed(2)}/mo`}
                      </span>
                      <span className="text-[9px] text-[#999] block font-mono">ID: {p.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 4: NEIGHBOR ACCOUNTS */}
        {activeSubTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* Left: Register Custom User profile */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-2xs self-start">
              <h3 className="text-sm font-semibold text-[#2D2D2D] mb-4">Register Custom Neighbor</h3>
              <form onSubmit={handleAdminAddUser} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">Neighbor Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Samuel Bennett"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full bg-neutral-50 border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#4A5D4E] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. sam.b@circle.net"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full bg-neutral-50 border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#4A5D4E] transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">CO2 Saved (kg)</label>
                    <input
                      type="number"
                      required
                      value={newUserCO2}
                      onChange={(e) => setNewUserCO2(e.target.value)}
                      className="w-full bg-neutral-50 border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs font-mono outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">Items Circularized</label>
                    <input
                      type="number"
                      required
                      value={newUserItems}
                      onChange={(e) => setNewUserItems(e.target.value)}
                      className="w-full bg-neutral-50 border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs font-mono outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">Subscription Plan</label>
                  <select
                    value={newUserPlan}
                    onChange={(e) => setNewUserPlan(e.target.value)}
                    className="w-full bg-neutral-50 border border-[#EAEAEA] rounded-xl px-2.5 py-2 text-xs outline-none focus:border-[#4A5D4E]"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {userSuccess && (
                  <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl">
                    Neighbor profile registered on local ledger node successfully.
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#4A5D4E] hover:bg-[#3D4D40] text-white py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                >
                  Register Neighbor Node
                </button>
              </form>
            </div>

            {/* Right: User accounts balance adjustment ledger */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-2xs self-start space-y-4">
              <h3 className="text-sm font-semibold text-[#2D2D2D]">Ledger Active Account Registry</h3>
              <div className="space-y-3.5 max-h-[420px] overflow-y-auto">
                {/* Always show Dare (Primary User account) */}
                <div className="p-3.5 bg-[#F5F7F5]/30 rounded-2xl flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-[#2D2D2D]">Dare (You)</span>
                      <span className="bg-[#4A5D4E] text-white text-[7px] font-bold tracking-widest uppercase px-1 rounded-sm">PRIMARY</span>
                    </div>
                    <p className="text-[10px] text-[#717171] font-mono">{account.email}</p>
                    <p className="text-[10px] text-emerald-800 font-bold font-mono">Wallet balance: ${account.balance.toFixed(2)}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-semibold text-[#2D2D2D] block">Circular Level 4</span>
                    <span className="text-[9px] text-[#999] block font-mono">{account.totalCO2Saved} kg Saved</span>
                  </div>
                </div>

                {activeAccounts.map((acc) => (
                  <div key={acc.id} className="p-3.5 hover:border-[#DDD] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-[#2D2D2D]">{acc.name}</span>
                        <span className="text-[9px] text-[#717171] font-mono">ID: {acc.id}</span>
                      </div>
                      <p className="text-[10px] text-[#717171] font-mono">{acc.email}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#717171]">
                        <span>Level: <strong className="font-semibold text-[#2D2D2D]">{acc.level}</strong></span>
                        <span>•</span>
                        <span>CO₂ Saved: <strong className="font-bold text-emerald-700">{acc.totalCO2Saved}kg</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <input
                        type="number"
                        placeholder="Add $/CO2"
                        value={adjustAmount[acc.id] || ''}
                        onChange={(e) => setAdjustAmount(prev => ({ ...prev, [acc.id]: e.target.value }))}
                        className="w-20 bg-neutral-50 border border-[#EAEAEA] rounded-lg px-2 py-1 text-[11px] text-[#2D2D2D] font-mono outline-none focus:border-[#4A5D4E]"
                      />
                      <button
                        onClick={() => handleAdjustUserBalance(acc.id)}
                        className="bg-neutral-100 hover:bg-[#F5F7F5] hover:text-[#4A5D4E] border border-[#EAEAEA] text-[#717171] px-2.5 py-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-colors"
                      >
                        Adjust
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 5: REST API PLAYGROUND */}
        {activeSubTab === 'api' && (
          <motion.div
            key="api"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Request Builder Console */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-2xs space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[#4A5D4E]">
                    <Code className="w-4 h-4" />
                    <h3 className="text-sm font-semibold">API Request Builder</h3>
                  </div>
                  <p className="text-[11px] text-[#717171] font-light">
                    Formulate mock-REST HTTP requests and run them synchronously over our local ledger database state.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {/* Method */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-[#999] font-bold block">HTTP METHOD</label>
                    <div className="flex gap-2">
                      {['GET', 'POST'].map((m) => (
                        <button
                          key={m}
                          onClick={() => setApiMethod(m as any)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all ${
                            apiMethod === m
                              ? 'bg-[#4A5D4E] text-white'
                              : 'bg-neutral-50 text-[#717171] border border-[#EAEAEA] hover:border-[#CCC]'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Route Endpoint */}
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-[#999] font-bold block">RESOURCE ENDPOINT</label>
                    <select
                      value={selectedEndpoint}
                      onChange={(e) => setSelectedEndpoint(e.target.value as any)}
                      className="w-full bg-neutral-50 border border-[#EAEAEA] rounded-xl px-2.5 py-2 text-xs font-mono outline-none"
                    >
                      <option value="listings">/api/listings</option>
                      <option value="plans">/api/plans</option>
                      <option value="accounts">/api/accounts</option>
                      <option value="metrics">/api/metrics</option>
                    </select>
                  </div>

                  {/* Body Payload for POST */}
                  {apiMethod === 'POST' && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[9px] uppercase tracking-widest text-[#999] font-bold">REQUEST BODY (JSON)</label>
                        <span className="text-[8px] uppercase tracking-widest font-mono text-[#4A5D4E]">Writable Payload</span>
                      </div>
                      <textarea
                        rows={6}
                        value={apiRequestBody}
                        onChange={(e) => setApiRequestBody(e.target.value)}
                        className="w-full bg-neutral-900 text-neutral-100 rounded-xl p-3 text-[10px] font-mono outline-none border-none leading-relaxed"
                      />
                    </div>
                  )}

                  {/* Send Action */}
                  <button
                    onClick={handleSendApiRequest}
                    disabled={apiLoading}
                    className="w-full bg-[#4A5D4E] hover:bg-[#3D4D40] text-white py-2.5 rounded-xl text-xs font-bold font-sans tracking-wide cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    {apiLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Request ({apiMethod})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Response Viewer Console */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-2xs flex flex-col justify-between">
                <div className="space-y-3 flex-1 flex flex-col">
                  <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-2">
                    <div className="flex items-center gap-1.5 text-[#2D2D2D]">
                      <Database className="w-4 h-4 text-[#717171]" />
                      <h3 className="text-xs font-bold font-mono uppercase tracking-wider">REST Response Terminal</h3>
                    </div>
                    <span className="text-[9px] text-[#999] font-mono">HTTP/1.1 200 OK</span>
                  </div>

                  {/* Terminal console */}
                  <div className="bg-neutral-950 text-[#A2B5A5] p-4 rounded-2xl font-mono text-[10px] leading-relaxed flex-1 overflow-auto max-h-[380px] min-h-[220px] shadow-inner select-all relative">
                    <div className="absolute top-2 right-2 bg-neutral-800 text-neutral-300 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded select-none">
                      JSON
                    </div>
                    {apiLoading ? (
                      <div className="flex flex-col items-center justify-center h-full space-y-2 py-12">
                        <RefreshCw className="w-5 h-5 text-neutral-400 animate-spin" />
                        <span className="text-neutral-400 text-[10px]">Executing query over secure ledger...</span>
                      </div>
                    ) : apiResponse ? (
                      <pre className="whitespace-pre-wrap">{apiResponse}</pre>
                    ) : (
                      <div className="text-neutral-600 h-full flex flex-col justify-center items-center py-12 space-y-1.5 select-none">
                        <Code className="w-8 h-8 text-neutral-800" />
                        <span className="text-[10px]">No request dispatched yet. Click "Send Request" to invoke query.</span>
                        <span className="text-[9px] font-sans text-neutral-700 italic">Queries live React state nodes instantly</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#F0F0F0] mt-4 flex justify-between items-center text-[9px] text-[#999] font-mono leading-none">
                  <span>API Service: active (Port 3000)</span>
                  <span className="text-emerald-700 font-bold uppercase">SSL Encrypted</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
