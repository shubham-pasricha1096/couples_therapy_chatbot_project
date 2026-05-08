'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const [pairCode, setPairCode] = useState('');
    const [pairError, setPairError] = useState('');
    const [pairSuccess, setPairSuccess] = useState('');
    const [pairing, setPairing] = useState(false);
    const [coupleInfo, setCoupleInfo] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth');
        }
    }, [status, router]);

    useEffect(() => {
        if (session?.user?.coupleId) {
            setCoupleInfo({ id: session.user.coupleId, role: session.user.role });
        }
    }, [session]);

    const handlePair = async () => {
        if (!pairCode.trim()) return;
        setPairing(true);
        setPairError('');
        setPairSuccess('');

        try {
            const res = await fetch('/api/pair', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pairCode: pairCode.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                setPairError(data.error);
            } else {
                setPairSuccess('Successfully paired! 🎉');
                setCoupleInfo({ id: data.coupleId, role: data.role });
                // Update the session with new couple info
                await update({ coupleId: data.coupleId, role: data.role });
            }
        } catch (err) {
            setPairError('Something went wrong. Please try again.');
        } finally {
            setPairing(false);
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(session?.user?.pairCode || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (status === 'loading') {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="dashboard">
            <div className="dash-header">
                <h1>💞 CoupleConnect</h1>
                <div className="user-info">
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {session.user.name}
                    </span>
                    <div className="user-avatar">
                        {session.user.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <button
                        className="btn btn-secondary btn-small"
                        onClick={() => signOut({ callbackUrl: '/' })}
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            <div className="dash-content">
                {/* Pairing Section */}
                <div className="pair-section glass-card">
                    {coupleInfo ? (
                        <>
                            <h2>✅ You&apos;re Paired!</h2>
                            <div className="paired-status">
                                <span>🟢</span>
                                <span>Connected with your partner as {coupleInfo.role === 'PARTNER_A' ? 'Partner A' : 'Partner B'}</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <h2>🔗 Connect with Your Partner</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                                Share your code with your partner, or enter theirs to connect.
                            </p>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                                    Your Pair Code
                                </label>
                                <div className="pair-code-display">
                                    <span className="pair-code">{session.user.pairCode || '------'}</span>
                                    <button className="btn btn-secondary btn-small" onClick={copyCode}>
                                        {copied ? '✓ Copied' : '📋 Copy'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                                    Enter Partner&apos;s Code
                                </label>
                                <div className="pair-input-row">
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="ABC123"
                                        value={pairCode}
                                        onChange={(e) => { setPairCode(e.target.value.toUpperCase()); setPairError(''); }}
                                        maxLength={6}
                                    />
                                    <button
                                        className="btn btn-primary"
                                        onClick={handlePair}
                                        disabled={pairing || !pairCode.trim()}
                                    >
                                        {pairing ? 'Pairing...' : 'Pair'}
                                    </button>
                                </div>
                                {pairError && <div className="error-msg" style={{ marginTop: '12px' }}>{pairError}</div>}
                                {pairSuccess && <div className="success-msg" style={{ marginTop: '12px' }}>{pairSuccess}</div>}
                            </div>
                        </>
                    )}
                </div>

                {/* Navigation Cards */}
                <div className="nav-cards">
                    <Link
                        href={coupleInfo ? '/chat' : '#'}
                        className={`nav-card glass-card ${!coupleInfo ? 'disabled-card' : ''}`}
                        onClick={(e) => { if (!coupleInfo) { e.preventDefault(); setPairError('Please pair with your partner first'); } }}
                    >
                        <div className="nav-icon">💬</div>
                        <h3>Start Chatting</h3>
                        <p>Talk with your AI counselor in a private, safe space.</p>
                    </Link>

                    <Link
                        href={coupleInfo ? '/exercises' : '#'}
                        className={`nav-card glass-card ${!coupleInfo ? 'disabled-card' : ''}`}
                        onClick={(e) => { if (!coupleInfo) { e.preventDefault(); setPairError('Please pair with your partner first'); } }}
                    >
                        <div className="nav-icon">📝</div>
                        <h3>Exercises</h3>
                        <p>Guided activities to strengthen your bond together.</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
