import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prisma from '../../../lib/prisma';

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { pairCode } = await request.json();
        if (!pairCode) {
            return NextResponse.json({ error: 'Pair code is required' }, { status: 400 });
        }

        const userId = session.user.id;

        // Check if user is already paired
        const existingCouple = await prisma.couple.findFirst({
            where: {
                OR: [{ partnerAId: userId }, { partnerBId: userId }],
            },
        });

        if (existingCouple) {
            return NextResponse.json(
                { error: 'You are already paired with a partner' },
                { status: 400 }
            );
        }

        // Find the partner by pair code
        const partner = await prisma.user.findUnique({
            where: { pairCode: pairCode.toUpperCase() },
        });

        if (!partner) {
            return NextResponse.json(
                { error: 'No user found with this pair code' },
                { status: 404 }
            );
        }

        if (partner.id === userId) {
            return NextResponse.json(
                { error: 'You cannot pair with yourself' },
                { status: 400 }
            );
        }

        // Check if partner is already paired
        const partnerCouple = await prisma.couple.findFirst({
            where: {
                OR: [{ partnerAId: partner.id }, { partnerBId: partner.id }],
            },
        });

        if (partnerCouple) {
            return NextResponse.json(
                { error: 'This person is already paired with someone else' },
                { status: 400 }
            );
        }

        // Create the couple — the partner who created the code is Partner A
        const couple = await prisma.couple.create({
            data: {
                partnerAId: partner.id,
                partnerBId: userId,
            },
        });

        return NextResponse.json({
            success: true,
            coupleId: couple.id,
            role: 'PARTNER_B',
        });
    } catch (error) {
        console.error('Pair error:', error);
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        );
    }
}
