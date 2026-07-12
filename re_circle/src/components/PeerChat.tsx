import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Users, ShieldCheck, Heart, User, Sparkles, MessageCircle, Info } from 'lucide-react';
import { ChatMessage, ActiveAccount } from '../types';

interface PeerChatProps {
  activeAccounts: ActiveAccount[];
  messages: ChatMessage[];
  onSendMessage: (receiverId: string, text: string) => void;
}

export const PeerChat: React.FC<PeerChatProps> = ({
  activeAccounts,
  messages,
  onSendMessage
}) => {
  const [selectedNeighborId, setSelectedNeighborId] = useState<string>(activeAccounts[0]?.id || 'acc-1');
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedNeighbor = activeAccounts.find((a) => a.id === selectedNeighborId) || activeAccounts[0];

  // Scroll to bottom when message log changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedNeighborId]);

  const handleSendSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    onSendMessage(selectedNeighborId, messageInput.trim());
    setMessageInput('');
  };

  // Filter messages for current selected neighbor thread
  const activeThreadMessages = messages.filter(
    (m) => m.senderId === selectedNeighborId || (m.senderId === 'me' && messages.find(other => other.id === m.id)) // We will pass standard list or tag them
  );

  return (
    <div className="h-[calc(100vh-14rem)] min-h-[480px] bg-white rounded-3xl overflow-hidden flex shadow-xs" id="view-peer-chat">
      
      {/* Sidebar: Neighbor directory */}
      <div className="w-1/3 border-r border-[#F0F0F0] flex flex-col justify-between bg-[#FCFCFB] shrink-0">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-[#F0F0F0] shrink-0">
            <span className="text-[9px] uppercase tracking-widest text-[#4A5D4E] font-bold block mb-1">Peer Ledger Directory</span>
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Circular Neighbors</h3>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#F5F5F4] p-2 space-y-1">
            {activeAccounts.map((acc) => {
              const isSelected = acc.id === selectedNeighborId;
              
              // Get last message in thread
              const threadMsg = messages.filter(m => m.senderId === acc.id || (m.senderId === 'me' && messages.indexOf(m) > -1));
              const lastMsg = threadMsg[threadMsg.length - 1];

              return (
                <button
                  key={acc.id}
                  onClick={() => setSelectedNeighborId(acc.id)}
                  className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex gap-3 items-center ${
                    isSelected 
                      ? 'bg-white border border-[#EAEAEA] shadow-2xs' 
                      : 'border border-transparent hover:bg-white/40'
                  }`}
                >
                  {/* Custom elegant circular avatar */}
                  <div className={`w-9 h-9 rounded-full ${acc.avatarColor} flex items-center justify-center font-bold text-xs border shrink-0 shadow-2xs`}>
                    {acc.name.split(' ').map(n => n[0]).join('')}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#2D2D2D] truncate block">{acc.name}</span>
                      <span className="bg-[#4A5D4E]/10 text-[#4A5D4E] text-[8px] font-bold font-mono px-1 rounded-sm">
                        Lvl {acc.level}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#717171] font-light truncate block">
                      {lastMsg ? lastMsg.text : 'Active on ledger • ' + acc.totalCO2Saved + 'kg CO₂'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status indicator */}
        <div className="p-3 border-t border-[#F0F0F0] bg-white shrink-0 text-center">
          <div className="inline-flex items-center gap-1.5 text-[9px] text-[#4A5D4E] font-mono font-bold uppercase tracking-widest">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            <span>Channel Secure</span>
          </div>
        </div>
      </div>

      {/* Main chat viewport */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedNeighbor ? (
          <>
            {/* Thread Header */}
            <div className="h-14 border-b border-[#F0F0F0] px-6 flex items-center justify-between shrink-0 bg-[#FCFCFB]/60 backdrop-blur-xs">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full ${selectedNeighbor.avatarColor} flex items-center justify-center font-bold text-xs border shadow-2xs`}>
                  {selectedNeighbor.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#1A1A1A] leading-tight">{selectedNeighbor.name}</h4>
                  <span className="text-[10px] text-[#999] block font-light">Verified Carbon Patron • level {selectedNeighbor.level}</span>
                </div>
              </div>

              {/* Stats badges */}
              <div className="hidden xs:flex items-center gap-1.5">
                <span className="bg-[#FAF9F5] border border-[#EDEAE3] text-[#8A7D73] text-[9px] font-bold font-mono px-2 py-0.5 rounded-md">
                  -{selectedNeighbor.totalCO2Saved}kg CO₂ Saved
                </span>
                <span className="bg-[#F5F7F5] border border-[#E1E8E1] text-[#4A5D4E] text-[9px] font-bold font-mono px-2 py-0.5 rounded-md">
                  {selectedNeighbor.itemsCircularized} Swapped
                </span>
              </div>
            </div>

            {/* Conversation Window */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-neutral-50/20">
              {activeThreadMessages.length > 0 ? (
                activeThreadMessages.map((msg, index) => {
                  const isMe = msg.senderId === 'me';
                  
                  return (
                    <div 
                      key={msg.id}
                      className={`flex gap-2.5 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      {/* Avatar */}
                      {!isMe && (
                        <div className={`w-7 h-7 rounded-full ${selectedNeighbor.avatarColor} flex items-center justify-center font-bold text-[10px] border shrink-0 mt-1 shadow-2xs`}>
                          {selectedNeighbor.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}

                      <div className="space-y-1">
                        {/* Bubble */}
                        <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isMe 
                            ? 'bg-[#4A5D4E] text-white rounded-tr-none shadow-2xs' 
                            : 'bg-white border border-[#EAEAEA] text-[#2D2D2D] rounded-tl-none shadow-3xs'
                        }`}>
                          <p className="font-light">{msg.text}</p>
                        </div>
                        
                        {/* Stamp */}
                        <span className={`text-[8px] text-[#999] font-mono block ${isMe ? 'text-right' : 'text-left ml-1'}`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-16 space-y-2 text-center text-[#999] select-none">
                  <MessageCircle className="w-8 h-8 text-[#CCC]" />
                  <span className="text-xs font-light">Secure peer messaging channel opened with {selectedNeighbor.name}</span>
                  <span className="text-[10px] font-light max-w-xs">Coordinate vintage pick-ups, circular repairs, or general composting inquiries instantly.</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input box */}
            <div className="p-4 border-t border-[#F0F0F0] bg-white shrink-0">
              <form onSubmit={handleSendSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Write a message to ${selectedNeighbor.name}...`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 bg-neutral-50 border border-[#EAEAEA] rounded-xl px-4 py-2 text-xs outline-none focus:border-[#4A5D4E] transition-all text-[#2D2D2D]"
                  id="chat-message-input-box"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="bg-[#4A5D4E] text-white p-2.5 rounded-xl hover:bg-[#3D4D40] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center shadow-2xs disabled:opacity-50 shrink-0"
                  id="chat-submit-btn"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <div className="flex items-center gap-1 text-[9px] text-[#999] font-mono mt-2">
                <Info className="w-3 h-3 text-[#717171]" />
                <span>Avoid exchanging personal bank details. All transaction backing payments execute via your Re:Circle secure wallet balance.</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center py-12 text-[#999]">
            <Users className="w-8 h-8 text-[#CCC]" />
            <span className="text-xs font-semibold mt-2">No active neighbors selected</span>
          </div>
        )}
      </div>

    </div>
  );
};
