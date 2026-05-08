import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '../../../lib/prisma';
import { EXERCISE_TEMPLATES } from '../../../lib/ai';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        const couple = await prisma.couple.findFirst({
            where: {
                OR: [{ partnerAId: userId }, { partnerBId: userId }],
                isActive: true,
            },
        });

        if (!couple) {
            return NextResponse.json({ exercises: [], templates: EXERCISE_TEMPLATES });
        }

        const exercises = await prisma.exercise.findMany({
            where: { coupleId: couple.id },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ exercises, templates: EXERCISE_TEMPLATES });
    } catch (error) {
        console.error('Exercises GET error:', error);
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const { templateIndex, action, exerciseId } = await request.json();

        const couple = await prisma.couple.findFirst({
            where: {
                OR: [{ partnerAId: userId }, { partnerBId: userId }],
                isActive: true,
            },
        });

        if (!couple) {
            return NextResponse.json(
                { error: 'You need to pair with a partner first' },
                { status: 400 }
            );
        }

        // Update exercise status
        if (action && exerciseId) {
            const statusMap = {
                accept: 'ACCEPTED',
                complete: 'COMPLETED',
                skip: 'SKIPPED',
            };

            if (!statusMap[action]) {
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
            }

            const exercise = await prisma.exercise.update({
                where: { id: exerciseId },
                data: { status: statusMap[action] },
            });

            return NextResponse.json({ exercise });
        }

        // Add a new exercise from template
        if (templateIndex !== undefined && EXERCISE_TEMPLATES[templateIndex]) {
            const template = EXERCISE_TEMPLATES[templateIndex];
            const exercise = await prisma.exercise.create({
                data: {
                    coupleId: couple.id,
                    title: template.title,
                    prompt: template.prompt,
                    category: template.category,
                },
            });

            return NextResponse.json({ exercise });
        }

        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    } catch (error) {
        console.error('Exercises POST error:', error);
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }
}
