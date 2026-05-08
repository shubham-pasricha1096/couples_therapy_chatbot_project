import './globals.css';
import Providers from './providers';

export const metadata = {
  title: 'CoupleConnect — AI Relationship Counselor',
  description: 'A gender-neutral AI-powered couples therapy chatbot that helps partners communicate better, resolve conflicts, and strengthen their bond.',
  keywords: ['couples therapy', 'relationship counselor', 'AI therapy', 'communication'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
