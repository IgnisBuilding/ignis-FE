export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-background">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 green-gradient rounded-2xl flex items-center justify-center shadow-lg">
          <svg className="w-8 h-8 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
          </svg>
        </div>
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-700 dark:text-foreground font-medium">Loading Command Center...</p>
      </div>
    </div>
  );
}
