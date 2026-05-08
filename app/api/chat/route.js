import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '../../../lib/prisma';
import { analyzeSafety } from '../../../lib/safety';
import { buildContext, generateResponse } from '../../../lib/ai';

const MAX_CONTEXT_MESSAGES = 50;

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { message } = await request.json();
        if (!message?.trim()) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        const userId = session.user.id;

        // Find the couple
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

        const role = couple.partnerAId === userId ? 'PARTNER_A' : 'PARTNER_B';
        const aiRole = role === 'PARTNER_A' ? 'AI_TO_A' : 'AI_TO_B';

        // Safety check
        const safetyResult = analyzeSafety(message);

        // Save user message (flag if inflammatory)
        await prisma.message.create({
            data: {
                coupleId: couple.id,
                senderId: userId,
                senderRole: role,
                content: message,
                flagged: safetyResult.type === 'INFLAMMATORY',
            },
        });

        let aiContent;

        if (!safetyResult.isSafe) {
            // Crisis or abuse detected — use safety response instead of AI
            aiContent = safetyResult.response;
        } else {
            // Get conversation history (lightweight: last N messages)
            const messages = await prisma.message.findMany({
                where: { coupleId: couple.id },
                orderBy: { createdAt: 'asc' },
                take: MAX_CONTEXT_MESSAGES,
            });

            // Build context and generate AI response
            const contextMessages = buildContext(messages, role);
            aiContent = await generateResponse(contextMessages);
        }

        // Save AI response
        const aiMessage = await prisma.message.create({
            data: {
                coupleId: couple.id,
                senderId: null,
                senderRole: aiRole,
                content: aiContent,
                flagged: !safetyResult.isSafe,
            },
        });

        return NextResponse.json({
            response: aiContent,
            messageId: aiMessage.id,
            safety: safetyResult.type,
        });
    } catch (error) {
        console.error('Chat error:', error);
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        );
    }
}
