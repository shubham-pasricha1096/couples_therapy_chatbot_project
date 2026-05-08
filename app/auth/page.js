'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLogin, setIsLogin] = useState(searchParams.get('mode') === 'login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [form, setForm] = useState({
        email: '',
        password: '',
        name: '',
        pairCode: '',
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (isLogin) {
                const result = await signIn('credentials', {
                    email: form.email,
                    password: form.password,
                    redirect: false,
                });

                if (result?.error) {
                    setError('Invalid email or password');
                } else {
                    router.push('/dashboard');
                }
            } else {
                // Signup
                const res = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                });

                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || 'Signup failed');
                } else {
                    // Auto-login after signup
                    const loginResult = await signIn('credentials', {
                        email: form.email,
                        password: form.password,
                        redirect: false,
                    });

                    if (loginResult?.error) {
                        setSuccess('Account created! Please log in.');
                        setIsLogin(true);
                    } else {
                        router.push('/dashboard');
                    }
                }
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container glass-card">
                <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                <p className="auth-subtitle">
                    {isLogin
                        ? 'Sign in to continue your journey'
                        : 'Start building a stronger relationship together'}
                </p>

                {error && <div className="error-msg">{error}</div>}
                {success && <div className="success-msg">{success}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div className="input-group">
                            <label htmlFor="name">Your Name</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                className="input-field"
                                placeholder="How should we address you?"
                                value={form.name}
                                onChange={handleChange}
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className="input-field"
                            placeholder="your@email.com"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            className="input-field"
                            placeholder={isLogin ? 'Enter your password' : 'At least 8 characters'}
                            value={form.password}
                            onChange={handleChange}
                            required
                            minLength={isLogin ? undefined : 8}
                        />
                    </div>

                    {!isLogin && (
                        <div className="input-group">
                            <label htmlFor="pairCode">Partner&apos;s Pair Code (optional)</label>
                            <input
                                id="pairCode"
                                name="pairCode"
                                type="text"
                                className="input-field"
                                placeholder="Enter your partner's code to pair now"
                                value={form.pairCode}
                                onChange={handleChange}
                                maxLength={6}
                                style={{ textTransform: 'uppercase', letterSpacing: '3px' }}
                            />
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-toggle">
                    {isLogin ? "Don't have an account? " : 'Already have an account? '}
                    <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}>
                        {isLogin ? 'Sign up' : 'Sign in'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={<div className="loading-screen"><div className="spinner"></div></div>}>
            <AuthContent />
        </Suspense>
    );
}
