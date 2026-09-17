export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-4 gap-6">
        <aside className="md:col-span-1">
          <div className="bg-gray-200 animate-pulse rounded-lg h-64"></div>
        </aside>
        <div className="md:col-span-3">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-64"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}