import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import TopBar from '@/components/layout/TopBar';
import LoadingOverlay from '@/components/shared/LoadingOverlay';
import GlobalLoadingWrapper from '@/components/layout/GlobalLoadingWrapper';

export const metadata: Metadata = {
  title: 'VGLog',
  description: 'Video game library tracker',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        <Providers>
          <TopBar />
          <GlobalLoadingWrapper>
            <main className="mx-auto max-w-screen-2xl px-6 py-6">
              {children}
            </main>
          </GlobalLoadingWrapper>
        </Providers>
      </body>
    </html>
  );
}
