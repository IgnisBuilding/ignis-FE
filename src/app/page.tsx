import PageTransition from '@/components/shared/pageTransition';
import Hero from '@/components/dashboard/Hero';
import StatsCards from '@/components/dashboard/StatsCard';
import QuickNav from '@/components/dashboard/QuickNav';

export default function Dashboard() {
  return (
    <PageTransition>
      <div className="min-h-screen cream-gradient py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <Hero />
            
            <section>
              <h2 className="text-2xl font-bold text-dark-green-800 mb-6">
                Overview
              </h2>
              <StatsCards />
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark-green-800 mb-6">
                Quick Access
              </h2>
              <QuickNav />
            </section>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}