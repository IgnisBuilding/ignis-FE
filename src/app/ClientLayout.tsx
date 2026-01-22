'use client';

import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/providers/LanguageProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { TourProvider } from '@/providers/TourProvider';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toaster';
import { WelcomeModal } from '@/components/tour';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <NotificationProvider>
          <SidebarProvider>
            <TourProvider>
              {children}
              <WelcomeModal />
              <Toaster />
            </TourProvider>
          </SidebarProvider>
        </NotificationProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
