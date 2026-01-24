export default function Loading() {
  return (
    <div className="min-h-screen cream-gradient py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-12 bg-gray-300 rounded w-64 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-48"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="premium-card rounded-3xl p-7 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="h-10 bg-gray-300 rounded w-16 mb-3"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
