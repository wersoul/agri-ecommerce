import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-6xl font-bold text-primary-700 mb-4">404</h1>
      <p className="text-2xl mb-4">ไม่พบหน้าที่คุณต้องการ</p>
      <p className="text-gray-600 mb-6">หน้าที่คุณกำลังมองหาอาจถูกลบหรือย้ายไปแล้ว</p>
      <Link href="/" className="btn-primary">
        กลับหน้าแรก
      </Link>
    </div>
  );
}