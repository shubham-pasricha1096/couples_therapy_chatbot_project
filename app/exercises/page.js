'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const CATEGORY_BADGES = {
    COMMUNICATION: { class: 'badge-communication', label: '💬 Communication' },
    GRATITUDE: { class: 'badge-gratitude', label: '🙏 Gratitude' },
    CONFLICT_RESOLUTION: { class: 'badge-conflict', label: '🕊️ Conflict Resolution' },
    EMPATHY: { class: 'badge-empathy', label: '💚 Empathy' },
    BONDING: { class: 'badge-bonding', label: '💞 Bonding' },
    WEEKLY_CHECKIN: { class: 'badge-checkin', label: '📋 Weekly Check-In' },
};

export default function ExercisesPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [exercises, setExercises] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/auth');
        if (status === 'authenticated' && !session?.user?.coupleId) router.push('/dashboard');
    }, [status, session, router]);

    useEffect(() => {
        if (session?.user?.coupleId) loadExercises();
    }, [session]);

    const loadExercises = async () => {
        try {
            const res = await fetch('/api/exercises');
            const data = await res.json();
            setExercises(data.exercises || []);
            setTemplates(data.templates || []);
        } catch (err) {
            console.error('Failed to load exercises:', err);
        } finally {
            setLoading(false);
        }
    };

    const addExercise = async (index) => {
        setActionLoading(`add-${index}`);
        try {
            const res = await fetch('/api/exercises', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateIndex: index }),
            });
            const data = await res.json();
            if (data.exercise) {
                setExercises((prev) => [data.exercise, ...prev]);
            }
        } catch (err) {
            console.error('Failed to add exercise:', err);
        } finally {
            setActionLoading(null);
        }
    };

    const updateExercise = async (exerciseId, action) => {
        setActionLoading(`${action}-${exerciseId}`);
        try {
            const res = await fetch('/api/exercises', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exerciseId, action }),
            });
            const data = await res.json();
            if (data.exercise) {
                setExercises((prev) =>
                    prev.map((e) => (e.id === exerciseId ? data.exercise : e))
                );
            }
        } catch (err) {
            console.error('Failed to update exercise:', err);
        } finally {
            setActionLoading(null);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
            </div>
        );
    }

    const activeExercises = exercises.filter((e) => e.status !== 'COMPLETED' && e.status !== 'SKIPPED');
    const completedExercises = exercises.filter((e) => e.status === 'COMPLETED');

    return (
        <div className="exercises-page">
            <div className="exercises-header">
                <button className="back-btn" onClick={() => router.push('/dashboard')}>
                    ←
                </button>
                <h1>📝 Exercises</h1>
            </div>

            <div className="exercises-content">
                {/* Active Exercises */}
                {activeExercises.length > 0 && (
                    <div className="exercises-section">
                        <h2>Your Active Exercises</h2>
                        {activeExercises.map((exercise) => {
                            const badge = CATEGORY_BADGES[exercise.category] || {};
                            return (
                                <div key={exercise.id} className="exercise-card glass-card">
                                    <h3>
                                        {exercise.title}
                                        <span className={`exercise-badge ${badge.class}`}>{badge.label}</span>
                                    </h3>
                                    <p>{exercise.prompt}</p>
                                    <div className="exercise-actions">
                                        {exercise.status === 'SUGGESTED' && (
                                            <>
                                                <button
                                                    className="btn btn-primary btn-small"
                                                    onClick={() => updateExercise(exercise.id, 'accept')}
                                                    disabled={actionLoading === `accept-${exercise.id}`}
                                                >
                                                    ✓ Accept
                                                </button>
                                                <button
                                                    className="btn btn-secondary btn-small"
                                                    onClick={() => updateExercise(exercise.id, 'skip')}
                                                    disabled={actionLoading === `skip-${exercise.id}`}
                                                >
                                                    Skip
                                                </button>
                                            </>
                                        )}
                                        {exercise.status === 'ACCEPTED' && (
                                            <button
                                                className="btn btn-primary btn-small"
                                                onClick={() => updateExercise(exercise.id, 'complete')}
                                                disabled={actionLoading === `complete-${exercise.id}`}
                                            >
                                                ✓ Mark as Done
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Completed Exercises */}
                {completedExercises.length > 0 && (
                    <div className="exercises-section">
                        <h2>Completed 🎉</h2>
                        {completedExercises.map((exercise) => {
                            const badge = CATEGORY_BADGES[exercise.category] || {};
                            return (
                                <div key={exercise.id} className="exercise-card glass-card" style={{ opacity: 0.7 }}>
                                    <h3>
                                        ✅ {exercise.title}
                                        <span className={`exercise-badge ${badge.class}`}>{badge.label}</span>
                                    </h3>
                                    <p>{exercise.prompt}</p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Exercise Library */}
                <div className="exercises-section">
                    <h2>Exercise Library</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                        Browse and add exercises to work on together with your partner.
                    </p>
                    {templates.map((template, index) => {
                        const badge = CATEGORY_BADGES[template.category] || {};
                        return (
                            <div key={index} className="exercise-card glass-card">
                                <h3>
                                    {template.title}
                                    <span className={`exercise-badge ${badge.class}`}>{badge.label}</span>
                                </h3>
                                <p>{template.prompt}</p>
                                <div className="exercise-actions">
                                    <button
                                        className="btn btn-primary btn-small"
                                        onClick={() => addExercise(index)}
                                        disabled={actionLoading === `add-${index}`}
                                    >
                                        {actionLoading === `add-${index}` ? 'Adding...' : '+ Add to My Exercises'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
