import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from '../../../../lib/prisma';

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'Email',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    include: {
                        coupleAsA: true,
                        coupleAsB: true,
                    },
                });

                if (!user) return null;

                const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
                if (!isValid) return null;

                const couple = user.coupleAsA || user.coupleAsB;
                const role = user.coupleAsA ? 'PARTNER_A' : user.coupleAsB ? 'PARTNER_B' : null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    pairCode: user.pairCode,
                    coupleId: couple?.id || null,
                    role: role,
                };
            },
        }),
    ],
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.userId = user.id;
                token.pairCode = user.pairCode;
                token.coupleId = user.coupleId;
                token.role = user.role;
            }
            // Allow session update to refresh couple info
            if (trigger === 'update' && session) {
                token.coupleId = session.coupleId;
                token.role = session.role;
            }
            return token;
        },
        async session({ session, token }) {
            session.user.id = token.userId;
            session.user.pairCode = token.pairCode;
            session.user.coupleId = token.coupleId;
            session.user.role = token.role;
            return session;
        },
    },
    pages: {
        signIn: '/auth',
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
