'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function HomePage() {
    const { data: session } = useSession();

    return (
        <main className="landing">
            <div className="landing-logo">💞</div>
            <h1>CoupleConnect</h1>
            <p className="subtitle">
                A safe, private AI counselor that helps you and your partner communicate
                better, resolve conflicts with empathy, and grow stronger together.
            </p>

            <div className="cta-group">
                {session ? (
                    <Link href="/dashboard" className="btn btn-primary">
                        Go to Dashboard →
                    </Link>
                ) : (
                    <>
                        <Link href="/auth" className="btn btn-primary">
                            Get Started — It&apos;s Free
                        </Link>
                        <Link href="/auth?mode=login" className="btn btn-secondary">
                            I Have an Account
                        </Link>
                    </>
                )}
            </div>

            <div className="features">
                <div className="feature-card glass-card">
                    <div className="feature-icon">🔒</div>
                    <h3>Private & Confidential</h3>
                    <p>Each partner has their own private chat. The AI never shares what one partner says with the other.</p>
                </div>
                <div className="feature-card glass-card">
                    <div className="feature-icon">⚖️</div>
                    <h3>Always Neutral</h3>
                    <p>The AI never takes sides, assigns blame, or makes judgments. It uses proven therapeutic techniques to guide you.</p>
                </div>
                <div className="feature-card glass-card">
                    <div className="feature-icon">🌈</div>
                    <h3>For All Couples</h3>
                    <p>Gender-neutral language, inclusive by design. Every relationship is valued and supported equally.</p>
                </div>
                <div className="feature-card glass-card">
                    <div className="feature-icon">🛡️</div>
                    <h3>Safety-First AI</h3>
                    <p>Built-in crisis detection provides immediate resources if abuse or self-harm is mentioned.</p>
                </div>
                <div className="feature-card glass-card">
                    <div className="feature-icon">📝</div>
                    <h3>Guided Exercises</h3>
                    <p>Evidence-based exercises for active listening, gratitude, conflict resolution, and deeper bonding.</p>
                </div>
                <div className="feature-card glass-card">
                    <div className="feature-icon">💬</div>
                    <h3>Therapeutic Approach</h3>
                    <p>Powered by Gottman Method, NVC, and Emotionally Focused Therapy techniques used by real counselors.</p>
                </div>
            </div>
        </main>
    );
}
