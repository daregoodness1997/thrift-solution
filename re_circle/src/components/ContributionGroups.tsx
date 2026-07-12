import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, PlusCircle, Check, Users, Leaf, ArrowRight, ShieldCheck, HeartHandshake, HelpCircle, Plus } from 'lucide-react';
import { ContributionGroup, UserAccount, Transaction } from '../types';

interface ContributionGroupsProps {
  groups: ContributionGroup[];
  onBackGroup: (groupId: string, amount: number) => { success: boolean; message: string };
  onAddGroup: (newGroup: ContributionGroup) => void;
  userBalance: number;
}

export const ContributionGroups: React.FC<ContributionGroupsProps> = ({
  groups,
  onBackGroup,
  onAddGroup,
  userBalance
}) => {
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [selectedGroupToBack, setSelectedGroupToBack] = useState<string | null>(null);
  const [backAmount, setBackAmount] = useState('25');
  const [backSuccessMsg, setBackSuccessMsg] = useState('');
  const [backErrorMsg, setBackErrorMsg] = useState('');

  // Group creation form state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupTarget, setNewGroupTarget] = useState('800');
  const [newGroupCO2, setNewGroupCO2] = useState('250');
  const [newGroupCat, setNewGroupCat] = useState<'Composting' | 'Workshop' | 'Forestry' | 'Energy'>('Composting');
  const [newGroupTags, setNewGroupTags] = useState('');
  const [groupCreateSuccess, setGroupCreateSuccess] = useState(false);

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName || !newGroupDesc) return;

    const newGroup: ContributionGroup = {
      id: `group-custom-${Date.now()}`,
      name: newGroupName,
      description: newGroupDesc,
      creatorId: 'acc-primary',
      creatorName: 'Dare (You)',
      targetAmount: parseFloat(newGroupTarget) || 500,
      currentAmount: 0,
      co2Target: parseFloat(newGroupCO2) || 100,
      category: newGroupCat,
      membersCount: 1,
      tags: newGroupTags ? newGroupTags.split(',').map(s => s.trim().toUpperCase()) : ['NEIGHBORHOOD']
    };

    onAddGroup(newGroup);
    setGroupCreateSuccess(true);
    setNewGroupName('');
    setNewGroupDesc('');
    setNewGroupTags('');

    setTimeout(() => {
      setGroupCreateSuccess(false);
      setIsAddingGroup(false);
    }, 3000);
  };

  const handleBackGroupSubmit = (groupId: string, e: React.FormEvent) => {
    e.preventDefault();
    setBackSuccessMsg('');
    setBackErrorMsg('');
    const amt = parseFloat(backAmount);
    if (isNaN(amt) || amt <= 0) {
      setBackErrorMsg('Please specify a positive contribution amount.');
      return;
    }

    const res = onBackGroup(groupId, amt);
    if (res.success) {
      setBackSuccessMsg(res.message);
      setSelectedGroupToBack(null);
      setBackAmount('25');
      setTimeout(() => setBackSuccessMsg(''), 5000);
    } else {
      setBackErrorMsg(res.message);
    }
  };

  return (
    <div className="space-y-8 py-4" id="view-contribution-groups">
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAEAEA] pb-5">
        <div>
          <span className="text-[#4A5D4E] uppercase tracking-widest text-[9px] font-bold block">
            Collective Community Challenges
          </span>
          <h2 className="text-2xl font-light text-[#1A1A1A] tracking-tight">
            Active <span className="italic font-serif text-[#4A5D4E] font-medium">Contribution Groups</span>
          </h2>
          <p className="text-xs text-[#717171] font-light mt-1">
            Pool funding and resource allocations with neighbors to reach shared compost, forest, and sewing clinic goals.
          </p>
        </div>

        <button
          onClick={() => setIsAddingGroup(!isAddingGroup)}
          className="bg-[#4A5D4E] hover:bg-[#3D4D40] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start cursor-pointer transition-colors shadow-2xs"
          id="btn-trigger-add-group"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Launch Campaign Group</span>
        </button>
      </div>

      {/* Campaign Form slider */}
      <AnimatePresence>
        {isAddingGroup && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#FBFBFA] rounded-3xl p-6 overflow-hidden"
            id="campaign-group-form-container"
          >
            <h4 className="text-sm font-semibold text-[#2D2D2D] mb-4 flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-[#4A5D4E]" />
              <span>Initiate a Circular Economy Challenge Group</span>
            </h4>

            <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">Group Campaign Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. South End solar charger post"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full bg-white border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#4A5D4E] transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">Tags (comma split)</label>
                  <input
                    type="text"
                    placeholder="e.g. SOLAR, ENERGY, PUBLIC_GRID"
                    value={newGroupTags}
                    onChange={(e) => setNewGroupTags(e.target.value)}
                    className="w-full bg-white border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#4A5D4E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">Target Fund Goal ($)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newGroupTarget}
                    onChange={(e) => setNewGroupTarget(e.target.value)}
                    className="w-full bg-white border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs font-mono outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">CO2 Offsets Target (kg)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newGroupCO2}
                    onChange={(e) => setNewGroupCO2(e.target.value)}
                    className="w-full bg-white border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs font-mono outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">Program Category</label>
                  <select
                    value={newGroupCat}
                    onChange={(e) => setNewGroupCat(e.target.value as any)}
                    className="w-full bg-white border border-[#EAEAEA] rounded-xl px-2 py-2 text-xs outline-none focus:border-[#4A5D4E]"
                  >
                    <option value="Composting">Composting Nodes</option>
                    <option value="Workshop">Repair Workshops</option>
                    <option value="Forestry">Urban Forestry</option>
                    <option value="Energy">Clean Energy</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-widest text-[#999] font-bold block">Detailed Purpose Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Elaborate on how this campaign will direct pooled resources and local ecological impact."
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  className="w-full bg-white border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs outline-none focus:border-[#4A5D4E]"
                />
              </div>

              {groupCreateSuccess && (
                <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl">
                  Challenge Group launched successfully! It is now listed below for neighbors to back.
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingGroup(false)}
                  className="bg-transparent border border-[#EAEAEA] text-[#717171] hover:text-[#2D2D2D] px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#4A5D4E] hover:bg-[#3D4D40] text-white px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Launch Campaign
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Feedbacks */}
      {backSuccessMsg && (
        <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{backSuccessMsg}</span>
        </div>
      )}
      {backErrorMsg && (
        <div className="text-xs text-rose-800 bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-2">
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span>{backErrorMsg}</span>
        </div>
      )}

      {/* Core groups listing layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="contribution-groups-grid">
        {groups.map((g) => {
          const percent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
          const isBackingThis = selectedGroupToBack === g.id;

          return (
            <div 
              key={g.id}
              className="bg-white rounded-3xl p-6 shadow-2xs flex flex-col justify-between transition-all"
            >
              <div className="space-y-4">
                {/* Upper tags & metrics */}
                <div className="flex justify-between items-start gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[9px] uppercase font-mono tracking-wider font-bold bg-[#F5F7F5] text-[#4A5D4E] border border-[#E1E8E1] px-2 py-0.5 rounded-md">
                      {g.category}
                    </span>
                    {g.tags.slice(0, 2).map((t, idx) => (
                      <span key={idx} className="text-[9px] font-mono tracking-widest text-[#999] px-1 font-semibold uppercase">
                        #{t}
                      </span>
                    ))}
                  </div>

                  <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-100 font-mono font-bold px-2 py-0.5 rounded-md shrink-0">
                    -{g.co2Target}kg CO₂ Target
                  </span>
                </div>

                {/* Info titles */}
                <div>
                  <h3 className="text-base font-semibold text-[#1A1A1A]">{g.name}</h3>
                  <span className="text-[10px] text-[#999] block italic mt-0.5">Campaign host: {g.creatorName}</span>
                </div>

                <p className="text-xs text-[#717171] leading-relaxed font-light">{g.description}</p>

                {/* Progress bar info */}
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-[#2D2D2D] font-bold">${g.currentAmount} raised <span className="text-[#999] font-light">of ${g.targetAmount}</span></span>
                    <span className="text-[#4A5D4E] font-bold">{percent}% funded</span>
                  </div>

                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#4A5D4E] rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-[#999] font-mono mt-1">
                    <Users className="w-3 h-3 text-[#717171]" />
                    <span>{g.membersCount} local backers participating</span>
                  </div>
                </div>
              </div>

              {/* Bottom funding trigger */}
              <div className="mt-6 pt-4 border-t border-[#F0F0F0]">
                <AnimatePresence mode="wait">
                  {!isBackingThis ? (
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-[10px] text-[#999] font-mono">
                        Available Balance: <strong className="text-neutral-700">${userBalance.toFixed(2)}</strong>
                      </div>
                      <button
                        onClick={() => { setSelectedGroupToBack(g.id); setBackErrorMsg(''); }}
                        className="bg-[#4A5D4E] hover:bg-[#3D4D40] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        id={`btn-open-back-${g.id}`}
                      >
                        <span>Back Campaign</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={(e) => handleBackGroupSubmit(g.id, e)}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-[#999]">Contribute to this campaign:</span>
                        <span className="text-[#4A5D4E] font-bold">Limit: ${userBalance.toFixed(2)}</span>
                      </div>

                      {/* Presets */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {[10, 25, 50, 100].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setBackAmount(preset.toString())}
                            className={`py-1 rounded border text-[10px] font-mono font-bold transition-all cursor-pointer ${
                              backAmount === preset.toString()
                                ? 'bg-[#4A5D4E] text-white border-[#4A5D4E]'
                                : 'bg-neutral-50 border-[#EAEAEA] text-[#717171] hover:bg-neutral-100'
                            }`}
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
                          max={userBalance}
                          placeholder="Amount ($)"
                          value={backAmount}
                          onChange={(e) => setBackAmount(e.target.value)}
                          className="flex-1 bg-neutral-50 border border-[#EAEAEA] rounded-xl px-3 py-1.5 text-xs text-[#2D2D2D] outline-none font-mono focus:border-[#4A5D4E]"
                          id={`input-back-amt-${g.id}`}
                        />
                        <button
                          type="submit"
                          className="bg-[#4A5D4E] text-white px-4 py-1.5 rounded-xl text-xs font-semibold hover:bg-[#3D4D40] transition-colors cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedGroupToBack(null)}
                          className="bg-transparent border border-[#EAEAEA] text-[#717171] px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
