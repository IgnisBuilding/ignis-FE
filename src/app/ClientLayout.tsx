'use client';

import { Suspense } from 'react';

import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from '@/providers/SettingsProvider';
import { LanguageProvider } from '@/providers/LanguageProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { TourProvider } from '@/providers/TourProvider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { WelcomeModal } from '@/components/tour';
import { ThemeSyncer } from '@/components/ThemeSyncer';
import { AiChatPanel } from '@/components/ai/AiChatPanel';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <LanguageProvider>
          <NotificationProvider>
            <SidebarProvider>
              <TourProvider>
                <ThemeSyncer />
                {children}
                <WelcomeModal />
                <Suspense fallback={null}>
                  <AiChatPanel />
                </Suspense>
                <Toaster />
              </TourProvider>
            </SidebarProvider>
          </NotificationProvider>
        </LanguageProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
