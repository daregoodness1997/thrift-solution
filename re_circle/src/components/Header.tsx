import React, { useState } from 'react';
import { Search, HeartHandshake, Bell, Check, Info, AlertTriangle, MessageSquare, Heart, ShieldCheck, HelpCircle } from 'lucide-react';
import { AppNotification } from '../types';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onDonateClick: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notifications: AppNotification[];
  onMarkNotificationsRead: () => void;
  onClearNotification: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onDonateClick,
  activeTab,
  setActiveTab,
  notifications,
  onMarkNotificationsRead,
  onClearNotification
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="border-b border-[#EAEAEA] bg-white sticky top-0 z-40 shadow-xs">
      {/* Primary Row */}
      <nav className="h-16 flex items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => { setActiveTab('marketplace'); setSearchQuery(''); }}
            className="text-2xl font-bold tracking-tighter text-[#4A5D4E] hover:opacity-95 transition-opacity cursor-pointer bg-transparent border-none p-0 focus:outline-none shrink-0"
            id="brand-logo"
          >
            RE:CIRCLE
          </button>
          
          {/* Search bar */}
          {activeTab === 'marketplace' && (
            <div className="relative hidden sm:block">
              <input
                type="text"
                placeholder="Search treasures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#F3F3F3] border-none rounded-full py-1.5 pl-9 pr-4 text-xs w-36 md:w-48 focus:ring-1 focus:ring-[#4A5D4E] outline-none text-[#2D2D2D] transition-all"
                id="header-search-input"
              />
              <Search className="w-3.5 h-3.5 text-[#999] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          )}
        </div>

        {/* Action Buttons & Profile */}
        <div className="flex items-center gap-2.5 md:gap-4 shrink-0">
          <button
            onClick={onDonateClick}
            className="bg-[#4A5D4E] text-white text-[11px] md:text-xs font-semibold px-3 md:px-5 py-2 rounded-full hover:bg-[#3D4D40] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            id="btn-donate-now"
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Donate Now</span>
          </button>

          {/* Interactive Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`p-2 rounded-full border transition-all cursor-pointer relative ${
                isNotifOpen
                  ? 'bg-[#F5F7F5] border-[#4A5D4E] text-[#4A5D4E]'
                  : 'bg-white border-[#EAEAEA] text-[#717171] hover:text-[#2D2D2D] hover:border-[#CCC]'
              }`}
              id="btn-notification-bell"
              title="Notifications Panel"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-bold font-mono h-4 w-4 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Card */}
            {isNotifOpen && (
              <div 
                className="absolute right-0 mt-2.5 w-80 md:w-96 bg-white rounded-2xl shadow-xl z-50 p-4 space-y-3"
                id="notification-dropdown"
              >
                <div className="flex items-center justify-between border-b border-[#F0F0F0] pb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-[#2D2D2D]">Neighborhood Notifications</span>
                    {unreadCount > 0 && (
                      <span className="bg-[#4A5D4E]/10 text-[#4A5D4E] text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-sm">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => { onMarkNotificationsRead(); }}
                      className="text-[10px] text-[#4A5D4E] font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-neutral-100 pr-1 space-y-0.5">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={`py-2.5 px-2 rounded-xl transition-colors flex gap-2.5 items-start relative group ${
                          !n.read ? 'bg-[#F5F7F5]/60' : 'hover:bg-neutral-50'
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          {n.type === 'success' ? (
                            <div className="p-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
                              <Check className="w-3 h-3" />
                            </div>
                          ) : n.type === 'alert' ? (
                            <div className="p-1 rounded-full bg-rose-50 text-rose-800 border border-rose-100">
                              <AlertTriangle className="w-3 h-3" />
                            </div>
                          ) : (
                            <div className="p-1 rounded-full bg-blue-50 text-blue-800 border border-blue-100">
                              <Info className="w-3 h-3" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className={`text-[11px] font-bold ${!n.read ? 'text-[#2D2D2D]' : 'text-[#717171]'}`}>{n.title}</span>
                            <span className="text-[8px] text-[#999] font-mono">{n.timestamp}</span>
                          </div>
                          <p className="text-[10px] text-[#717171] leading-relaxed font-light">{n.message}</p>
                        </div>

                        <button
                          onClick={() => onClearNotification(n.id)}
                          className="absolute right-1 top-2 text-[10px] text-[#CCC] hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-0.5 rounded"
                          title="Dismiss notification"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-[#999] text-[11px] font-light">
                      No notifications yet. Let's make some circular transactions!
                    </div>
                  )}
                </div>

                <div className="border-t border-[#F0F0F0] pt-2 flex justify-between items-center text-[9px] text-[#999] font-mono">
                  <span>Re:Circle Ledger Live</span>
                  <button onClick={() => setIsNotifOpen(false)} className="hover:text-[#4A5D4E] font-semibold uppercase">Close</button>
                </div>
              </div>
            )}
          </div>

          {/* Personalized user button for daregoodness@gmail.com */}
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold tracking-tighter cursor-pointer transition-all duration-200 hover:scale-105 focus:outline-none ${
              activeTab === 'dashboard'
                ? 'bg-[#4A5D4E] text-white border border-[#4A5D4E] shadow-sm'
                : 'bg-[#F5F7F5] text-[#4A5D4E] border border-[#E1E8E1]'
            }`}
            title="Go to My Dashboard"
            id="user-profile-icon"
          >
            DG
          </button>
        </div>
      </nav>

      {/* Secondary Row: Clean minimalist scrollable navigation tabs */}
      <div className="border-t border-[#F3F3F3] bg-[#FCFCFB]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 overflow-x-auto scrollbar-none flex items-center gap-1 text-xs font-semibold text-[#717171] h-11">
          {[
            { id: 'marketplace', label: 'Marketplace', icon: Heart },
            { id: 'groups', label: 'Contribution Groups', icon: HeartHandshake },
            { id: 'chat', label: 'Direct Chat', icon: MessageSquare },
            { id: 'dashboard', label: 'My Dashboard', icon: ShieldCheck },
            { id: 'impact', label: 'Reports & Impact', icon: Info },
            { id: 'admin', label: 'Admin & API', icon: ShieldCheck },
            { id: 'how-it-works', label: 'How It Works', icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 h-full border-b-2 whitespace-nowrap transition-all duration-200 cursor-pointer hover:text-[#2D2D2D] ${
                  isActive
                    ? 'text-[#2D2D2D] border-[#4A5D4E] bg-white/50'
                    : 'text-[#717171] border-transparent'
                }`}
                id={`nav-${tab.id}`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#4A5D4E]' : 'text-[#999]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
