'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function ChatPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/auth');
        if (status === 'authenticated' && !session?.user?.coupleId) router.push('/dashboard');
    }, [status, session, router]);

    // Load initial messages
    useEffect(() => {
        if (session?.user?.coupleId) {
            loadMessages();
        }
    }, [session]);

    // Poll for new messages every 3 seconds
    useEffect(() => {
        if (!session?.user?.coupleId) return;
        const interval = setInterval(() => {
            if (messages.length > 0) {
                const lastMsg = messages[messages.length - 1];
                loadMessages(lastMsg.createdAt);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [session, messages]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadMessages = async (after = null) => {
        try {
            const url = after
                ? `/api/messages?after=${encodeURIComponent(after)}`
                : '/api/messages';
            const res = await fetch(url);
            const data = await res.json();

            if (data.messages) {
                if (after) {
                    // Append new messages (avoid duplicates)
                    setMessages((prev) => {
                        const existingIds = new Set(prev.map((m) => m.id));
                        const newMessages = data.messages.filter((m) => !existingIds.has(m.id));
                        return newMessages.length > 0 ? [...prev, ...newMessages] : prev;
                    });
                } else {
                    setMessages(data.messages);
                }
            }
        } catch (err) {
            console.error('Failed to load messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        const text = input.trim();
        if (!text || sending) return;

        setInput('');
        setSending(true);

        // Optimistic UI: show user message immediately
        const userRole = session?.user?.role || 'PARTNER_A';
        const tempUserMsg = {
            id: 'temp-user-' + Date.now(),
            senderRole: userRole,
            content: text,
            createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempUserMsg]);

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
            });

            const data = await res.json();

            if (data.response) {
                const aiRole = userRole === 'PARTNER_A' ? 'AI_TO_A' : 'AI_TO_B';
                const aiMsg = {
                    id: data.messageId || 'ai-' + Date.now(),
                    senderRole: aiRole,
                    content: data.response,
                    createdAt: new Date().toISOString(),
                    safety: data.safety,
                };
                setMessages((prev) => [...prev, aiMsg]);
            }
        } catch (err) {
            console.error('Failed to send message:', err);
            const errorMsg = {
                id: 'error-' + Date.now(),
                senderRole: 'AI_TO_A',
                content: 'Sorry, I couldn\'t process your message right now. Please try again.',
                createdAt: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (dateStr) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isUserMessage = (msg) => {
        return msg.senderRole === 'PARTNER_A' || msg.senderRole === 'PARTNER_B';
    };

    if (status === 'loading' || loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="chat-page">
            {/* Header */}
            <div className="chat-header">
                <div className="chat-header-left">
                    <button className="back-btn" onClick={() => router.push('/dashboard')}>
                        ←
                    </button>
                    <div>
                        <h1>
                            <span className="status-dot"></span>
                            AI Counselor
                        </h1>
                    </div>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Private & Confidential
                </span>
            </div>

            {/* Messages */}
            <div className="chat-messages">
                {messages.length === 0 && (
                    <div className="welcome-message">
                        <div className="welcome-icon">💞</div>
                        <h2>Welcome to Your Safe Space</h2>
                        <p>
                            I&apos;m here to listen, support, and help you communicate with
                            empathy. Everything you share is private — your partner won&apos;t
                            see your messages. How are you feeling today?
                        </p>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id}>
                        <div
                            className={`message-bubble ${isUserMessage(msg)
                                    ? 'message-user'
                                    : msg.safety === 'CRISIS' || msg.safety === 'ABUSE'
                                        ? 'message-safety'
                                        : 'message-ai'
                                }`}
                        >
                            {msg.content}
                            <div className="message-time">{formatTime(msg.createdAt)}</div>
                        </div>
                    </div>
                ))}

                {sending && (
                    <div className="typing-indicator">
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                        <div className="typing-dot"></div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-area">
                <div className="chat-input-wrapper">
                    <textarea
                        ref={inputRef}
                        className="chat-input"
                        placeholder="Share what's on your mind..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        disabled={sending}
                    />
                    <button
                        className="send-btn"
                        onClick={handleSend}
                        disabled={sending || !input.trim()}
                        title="Send message"
                    >
                        ↑
                    </button>
                </div>
            </div>
        </div>
    );
}
