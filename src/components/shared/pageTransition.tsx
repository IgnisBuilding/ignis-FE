'use client';
import { memo } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
}

// Simplified - no animation, just wrapper for consistency
const PageTransition = memo(({ children }: PageTransitionProps) => {
  return <>{children}</>;
});

PageTransition.displayName = 'PageTransition';
export default PageTransition;
