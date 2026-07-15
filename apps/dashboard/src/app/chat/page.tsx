"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";
import Pagination from "@/components/Pagination";

const fallback = config;
const LIMIT = 20;
const MESSAGES_LIMIT = 50;

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  lastMessage?: {
    id: string;
    text: string;
    senderName: string;
    timestamp: string;
  } | null;
  updatedAt: string;
}

export default function ChatPage() {
  const { user, token } = useAuth();
  const [cfg, setCfg] = useState<BrandConfig>(fallback);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEnd = useRef<HTMLDivElement>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; email: string }[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [convPage, setConvPage] = useState(1);
  const [convTotalPages, setConvTotalPages] = useState(1);
  const [convTotal, setConvTotal] = useState(0);
  const [msgPage, setMsgPage] = useState(1);
  const [msgTotalPages, setMsgTotalPages] = useState(1);
  const [msgTotal, setMsgTotal] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isMobile) setShowSidebar(true);
    else setShowSidebar(true);
  }, [isMobile]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`${API_URL}/api/chat/conversations?page=${convPage}&limit=${LIMIT}${searchParam}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setContacts(data.data.items || []);
        setConvTotalPages(data.data.totalPages || 1);
        setConvTotal(data.data.total || 0);
      }
    } catch {}
    setLoading(false);
  }, [token, API_URL, convPage, search]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchConversations(), 300);
    return () => clearTimeout(timeout);
  }, [fetchConversations, convPage, search]);

  const fetchMessages = useCallback(async (conversationId: string, page: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/chat/conversations/${conversationId}/messages?page=${page}&limit=${MESSAGES_LIMIT}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data.items || []);
        setMsgTotalPages(data.data.totalPages || 1);
        setMsgTotal(data.data.total || 0);
      }
    } catch {}
  }, [token, API_URL]);

  useEffect(() => {
    setMsgPage(1);
  }, [activeContact]);

  useEffect(() => {
    if (!activeContact) return;
    fetchMessages(activeContact.id, msgPage);
    const interval = setInterval(() => fetchMessages(activeContact.id, msgPage), 5000);
    return () => clearInterval(interval);
  }, [activeContact, fetchMessages, msgPage]);

  const searchUsers = useCallback(async (q: string) => {
    if (!token || q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await fetch(`${API_URL}/api/chat/users/search?q=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setSearchResults(data.data || []);
    } catch {}
  }, [token, API_URL]);

  useEffect(() => {
    const timeout = setTimeout(() => searchUsers(search), 300);
    return () => clearTimeout(timeout);
  }, [search, searchUsers]);

  async function sendMessage() {
    if (!input.trim() || !activeContact || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/chat/conversations/${activeContact.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: input.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.data]);
        setInput("");
      }
    } catch {}
    setSending(false);
  }

  async function startConversation(targetUserId: string) {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/chat/conversations/dm/${targetUserId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const conv = data.data;
        const existing = contacts.find((c) => c.id === conv.id);
        if (!existing) {
          const newContact: Contact = {
            id: conv.id,
            name: conv.members.find((m: { id: string }) => m.id !== user?.id)?.name || conv.name || "Unknown",
            email: conv.members.find((m: { id: string }) => m.id !== user?.id)?.email || "",
            lastMessage: null,
            updatedAt: new Date().toISOString(),
          };
          setContacts((prev) => [newContact, ...prev]);
          setActiveContact(newContact);
        } else {
          setActiveContact(existing);
        }
        setShowSearch(false);
        setSearch("");
        setSearchResults([]);
        if (isMobile) setShowSidebar(false);
      }
    } catch {}
  }

  function selectContact(c: Contact) {
    setActiveContact(c);
    if (isMobile) setShowSidebar(false);
  }

  const filteredContacts = contacts;

  const getInitials = (name: string) => (name || "").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  return (
    <div className="mx-auto flex h-full max-w-[1280px] flex-col p-[clamp(1rem,3vw,2rem)]">
      <PageHeader
        badgeLabel="Circle Chat"
        heading="Member"
        accentText="Chat"
        description="Connect with fellow circle members in real time."
      />

      <div className="flex-1 grid gap-0 overflow-hidden rounded-3xl" style={{ gridTemplateColumns: isMobile ? "1fr" : "280px 1fr", minHeight: isMobile ? "400px" : "500px" }}>
        {showSidebar && (
          <div className="bg-gray-50" style={{ borderRight: isMobile ? "none" : "1px solid #EAEAEA", ...(isMobile ? { position: "absolute", inset: 0, zIndex: 10, borderRadius: "1.5rem" } : {}) }}>
            {isMobile && (
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <span className="text-xs font-semibold text-[#2D2D2D]">Contacts</span>
                <button onClick={() => setShowSidebar(false)} className="cursor-pointer border-0 bg-none text-gray-500">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            )}
            <div className="border-b border-gray-200 p-4">
              <div className="flex gap-2">
                <input placeholder="Search members..." value={search} onChange={(e) => { setSearch(e.target.value); setShowSearch(e.target.value.length >= 2); }}
                  className="min-w-0 flex-1 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] text-[#2D2D2D] outline-none" />
                <button onClick={() => setShowSearch(!showSearch)} className="flex-shrink-0 cursor-pointer rounded-full border-0 px-3 py-1.5 text-[10px] font-semibold text-white" style={{ backgroundColor: cfg.colors.primary }}>New</button>
              </div>
              {showSearch && searchResults.length > 0 && (
                <div className="mt-2 max-h-[150px] overflow-y-auto rounded-xl border border-gray-200 bg-white">
                  {searchResults.map((u) => (
                    <div key={u.id} onClick={() => startConversation(u.id)} className="cursor-pointer border-b border-[#F5F5F5] px-3 py-2 transition-colors hover:bg-gray-50">
                      <span className="block text-[11px] font-semibold text-[#2D2D2D]">{u.name}</span>
                      <span className="text-[10px] text-gray-400">{u.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-[11px] text-gray-400">Loading...</div>
              ) : filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-[11px] text-gray-400">
                  No conversations yet.<br />Click &quot;New&quot; to start chatting.
                </div>
              ) : (
                filteredContacts.map((c) => (
                  <div key={c.id} onClick={() => selectContact(c)} className="cursor-pointer p-3 transition-all" style={{ backgroundColor: activeContact?.id === c.id ? "#ffffff" : "transparent", borderRight: activeContact?.id === c.id ? `2px solid ${cfg.colors.primary}` : "2px solid transparent" }}>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: cfg.colors.primary }}>{getInitials(c.name)}</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-[#2D2D2D]">{c.name}</span>
                        <span className="block truncate text-[10px] font-light text-gray-400">{c.lastMessage?.text || "Start a conversation"}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {!loading && filteredContacts.length > 0 && (
              <div className="px-4">
                <Pagination page={convPage} totalPages={convTotalPages} total={convTotal} limit={LIMIT} onPageChange={setConvPage} loading={loading} />
              </div>
            )}
          </div>
        )}

        {!showSidebar && (
          <div className="relative flex flex-col bg-white">
            <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
              {isMobile && (
                <button onClick={() => setShowSidebar(true)} className="flex-shrink-0 cursor-pointer border-0 bg-none text-gray-500">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 19l-7-7 7-7" /></svg>
                </button>
              )}
              <div className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: cfg.colors.primary }}>{activeContact ? getInitials(activeContact.name) : "?"}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-[#2D2D2D]">{activeContact?.name || "Select a conversation"}</span>
                <span className="block text-[10px] text-gray-400">Member</span>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              {messages.length === 0 && (
                <div className="flex flex-1 items-center justify-center text-[12px] text-gray-400">
                  No messages yet. Say hello!
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} style={{ display: "flex", justifyContent: m.senderId === user?.id ? "flex-end" : "flex-start" }}>
                  <div className="max-w-[70%]">
                    {m.senderId !== user?.id && <span className="mb-0.5 block pl-2 text-[9px] font-semibold text-gray-400">{m.senderName}</span>}
                    <div className="px-3.5 py-2.5 text-xs leading-[1.6]" style={{ borderRadius: m.senderId === user?.id ? "0.875rem 0.875rem 0.125rem 0.875rem" : "0.875rem 0.875rem 0.875rem 0.125rem", backgroundColor: m.senderId === user?.id ? cfg.colors.primary : "#F3F4F6", color: m.senderId === user?.id ? "#ffffff" : "#2D2D2D" }}>{m.text}</div>
                    <span className="mt-0.5 block pl-2 font-mono text-[9px] text-gray-400">{formatTime(m.timestamp)}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEnd} />
            </div>
            {activeContact && msgTotal > 0 && (
              <div className="px-4">
                <Pagination page={msgPage} totalPages={msgTotalPages} total={msgTotal} limit={MESSAGES_LIMIT} onPageChange={setMsgPage} loading={loading} />
              </div>
            )}

            <div className="flex gap-2 border-t border-gray-200 px-4 py-3">
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Type a message..." className="min-w-0 flex-1 rounded-full border border-gray-200 bg-gray-100 px-4 py-2 text-xs text-[#2D2D2D] outline-none" />
              <button onClick={sendMessage} disabled={sending || !input.trim()} className="flex-shrink-0 cursor-pointer rounded-full border-0 px-5 py-2 text-xs font-semibold text-white" style={{ backgroundColor: cfg.colors.primary, cursor: sending || !input.trim() ? "not-allowed" : "pointer", opacity: sending || !input.trim() ? 0.5 : 1 }}>{sending ? "..." : "Send"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
