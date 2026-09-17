export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
      <p className="mt-4 text-gray-600">กำลังโหลด...</p>
    </div>
  );
}