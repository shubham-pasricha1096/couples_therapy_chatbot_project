import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '../../../lib/prisma';

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const { searchParams } = new URL(request.url);
        const after = searchParams.get('after');

        // Find the couple
        const couple = await prisma.couple.findFirst({
            where: {
                OR: [{ partnerAId: userId }, { partnerBId: userId }],
                isActive: true,
            },
        });

        if (!couple) {
            return NextResponse.json({ messages: [] });
        }

        const role = couple.partnerAId === userId ? 'PARTNER_A' : 'PARTNER_B';
        const aiRole = role === 'PARTNER_A' ? 'AI_TO_A' : 'AI_TO_B';

        // Only return this partner's messages and AI responses to them
        const whereClause = {
            coupleId: couple.id,
            senderRole: { in: [role, aiRole] },
        };

        if (after) {
            whereClause.createdAt = { gt: new Date(after) };
        }

        const messages = await prisma.message.findMany({
            where: whereClause,
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                senderRole: true,
                content: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ messages });
    } catch (error) {
        console.error('Messages error:', error);
        return NextResponse.json(
            { error: 'Something went wrong.' },
            { status: 500 }
        );
    }
}
