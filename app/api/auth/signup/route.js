import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '../../../../lib/prisma';

export async function POST(request) {
    try {
        const { email, password, name, pairCode: joinCode } = await request.json();

        // Validate inputs
        if (!email || !password || !name) {
            return NextResponse.json(
                { error: 'Email, password, and name are required' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json(
                { error: 'An account with this email already exists' },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Generate a 6-character pair code
        const generatedPairCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                pairCode: generatedPairCode,
            },
        });

        // If a join code was provided, try to pair immediately
        let couple = null;
        if (joinCode) {
            const partner = await prisma.user.findUnique({
                where: { pairCode: joinCode },
            });

            if (partner && partner.id !== user.id) {
                // Check if partner is already paired
                const existingCouple = await prisma.couple.findFirst({
                    where: {
                        OR: [
                            { partnerAId: partner.id },
                            { partnerBId: partner.id },
                        ],
                    },
                });

                if (!existingCouple) {
                    couple = await prisma.couple.create({
                        data: {
                            partnerAId: partner.id,
                            partnerBId: user.id,
                        },
                    });
                }
            }
        }

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                pairCode: user.pairCode,
            },
            paired: !!couple,
            coupleId: couple?.id || null,
        });
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        );
    }
}
