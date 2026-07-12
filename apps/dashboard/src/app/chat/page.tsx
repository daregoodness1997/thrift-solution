"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { config, BrandConfig } from "@thrift/config";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/PageHeader";

const fallback = config;

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
      const res = await fetch(`${API_URL}/api/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setContacts(data.data || []);
    } catch {}
    setLoading(false);
  }, [token, API_URL]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/chat/conversations/${conversationId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setMessages(data.data || []);
    } catch {}
  }, [token, API_URL]);

  useEffect(() => {
    if (!activeContact) return;
    fetchMessages(activeContact.id);
    const interval = setInterval(() => fetchMessages(activeContact.id), 5000);
    return () => clearInterval(interval);
  }, [activeContact, fetchMessages]);

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

  const filteredContacts = contacts.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "clamp(1rem, 3vw, 2rem)", height: "100%", display: "flex", flexDirection: "column" }}>
      <PageHeader
        badgeLabel="Circle Chat"
        heading="Member"
        accentText="Chat"
        description="Connect with fellow circle members in real time."
      />

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "280px 1fr", gap: "0", borderRadius: "1.5rem", overflow: "hidden", flex: 1, minHeight: isMobile ? "400px" : "500px" }}>
        {showSidebar && (
          <div style={{ borderRight: isMobile ? "none" : "1px solid #EAEAEA", backgroundColor: "#FAFAFA", ...(isMobile ? { position: "absolute", inset: 0, zIndex: 10, borderRadius: "1.5rem" } : {}) }}>
            {isMobile && (
              <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #EAEAEA", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D" }}>Contacts</span>
                <button onClick={() => setShowSidebar(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#717171" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            )}
            <div style={{ padding: "1rem", borderBottom: "1px solid #EAEAEA" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input placeholder="Search members..." value={search} onChange={(e) => { setSearch(e.target.value); setShowSearch(e.target.value.length >= 2); }}
                  style={{ flex: 1, backgroundColor: "#ffffff", border: "1px solid #EAEAEA", borderRadius: "9999px", padding: "0.375rem 0.75rem", fontSize: "11px", color: "#2D2D2D", outline: "none", minWidth: 0 }} />
                <button onClick={() => setShowSearch(!showSearch)} style={{ padding: "0.375rem 0.75rem", borderRadius: "9999px", border: "none", backgroundColor: cfg.colors.primary, color: "#ffffff", fontSize: "10px", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>New</button>
              </div>
              {showSearch && searchResults.length > 0 && (
                <div style={{ marginTop: "0.5rem", backgroundColor: "#ffffff", borderRadius: "0.75rem", border: "1px solid #EAEAEA", maxHeight: "150px", overflowY: "auto" }}>
                  {searchResults.map((u) => (
                    <div key={u.id} onClick={() => startConversation(u.id)} style={{ padding: "0.5rem 0.75rem", cursor: "pointer", borderBottom: "1px solid #F5F5F5", transition: "background 0.15s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#F9FAFB"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "#2D2D2D", display: "block" }}>{u.name}</span>
                      <span style={{ fontSize: "10px", color: "#999" }}>{u.email}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ overflowY: "auto" }}>
              {loading ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "#999", fontSize: "11px" }}>Loading...</div>
              ) : filteredContacts.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "#999", fontSize: "11px" }}>
                  No conversations yet.<br />Click &quot;New&quot; to start chatting.
                </div>
              ) : (
                filteredContacts.map((c) => (
                  <div key={c.id} onClick={() => selectContact(c)} style={{ padding: "0.75rem 1rem", cursor: "pointer", backgroundColor: activeContact?.id === c.id ? "#ffffff" : "transparent", borderRight: activeContact?.id === c.id ? `2px solid ${cfg.colors.primary}` : "2px solid transparent", transition: "all 0.15s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ position: "relative" }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: cfg.colors.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700 }}>{getInitials(c.name)}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D", display: "block" }}>{c.name}</span>
                        <span style={{ fontSize: "10px", color: "#999", fontWeight: 300, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{c.lastMessage?.text || "Start a conversation"}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {!showSidebar && (
          <div style={{ display: "flex", flexDirection: "column", backgroundColor: "#ffffff", position: "relative" }}>
            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #EAEAEA", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {isMobile && (
                <button onClick={() => setShowSidebar(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#717171", flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M15 19l-7-7 7-7" /></svg>
                </button>
              )}
              <div style={{ position: "relative" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", backgroundColor: cfg.colors.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700 }}>{activeContact ? getInitials(activeContact.name) : "?"}</div>
              </div>
              <div>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#2D2D2D" }}>{activeContact?.name || "Select a conversation"}</span>
                <span style={{ fontSize: "10px", color: "#999", display: "block" }}>Member</span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {messages.length === 0 && (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: "12px" }}>
                  No messages yet. Say hello!
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} style={{ display: "flex", justifyContent: m.senderId === user?.id ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "70%" }}>
                    {m.senderId !== user?.id && <span style={{ fontSize: "9px", color: "#999", fontWeight: 600, display: "block", marginBottom: "0.125rem", paddingLeft: "0.5rem" }}>{m.senderName}</span>}
                    <div style={{ padding: "0.625rem 0.875rem", borderRadius: m.senderId === user?.id ? "0.875rem 0.875rem 0.125rem 0.875rem" : "0.875rem 0.875rem 0.875rem 0.125rem", backgroundColor: m.senderId === user?.id ? cfg.colors.primary : "#F3F4F6", color: m.senderId === user?.id ? "#ffffff" : "#2D2D2D", fontSize: "12px", lineHeight: 1.6 }}>{m.text}</div>
                    <span style={{ fontSize: "9px", color: "#999", fontFamily: "'JetBrains Mono', monospace", display: "block", marginTop: "0.125rem", paddingLeft: "0.5rem" }}>{formatTime(m.timestamp)}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEnd} />
            </div>

            <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid #EAEAEA", display: "flex", gap: "0.5rem" }}>
              <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Type a message..." style={{ flex: 1, backgroundColor: "#F3F4F6", border: "1px solid #EAEAEA", borderRadius: "9999px", padding: "0.5rem 1rem", fontSize: "12px", color: "#2D2D2D", outline: "none", minWidth: 0 }} />
              <button onClick={sendMessage} disabled={sending || !input.trim()} style={{ padding: "0.5rem 1.25rem", borderRadius: "9999px", border: "none", backgroundColor: cfg.colors.primary, color: "#ffffff", fontSize: "12px", fontWeight: 600, cursor: sending || !input.trim() ? "not-allowed" : "pointer", opacity: sending || !input.trim() ? 0.5 : 1, flexShrink: 0 }}>{sending ? "..." : "Send"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
