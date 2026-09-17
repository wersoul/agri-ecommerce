"use client";

interface CheckoutFormProps {
  form: any;
  setForm: (form: any) => void;
}

export default function CheckoutForm({ form, setForm }: CheckoutFormProps) {
  return (
    <div className="space-y-4 bg-white rounded-lg shadow p-6">
      <h2 className="font-bold text-xl mb-2">ข้อมูลผู้สั่งซื้อ</h2>
      <div>
        <label className="block text-sm font-medium mb-1">ชื่อ-นามสกุล *</label>
        <input
          required
          value={form.customer_name}
          onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">เบอร์โทรศัพท์ *</label>
        <input
          required
          type="tel"
          value={form.customer_phone}
          onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">อีเมล</label>
        <input
          type="email"
          value={form.customer_email}
          onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">ที่อยู่จัดส่ง *</label>
        <textarea
          required
          value={form.customer_address}
          onChange={(e) => setForm({ ...form, customer_address: e.target.value })}
          className="input-field"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">จังหวัด</label>
          <input
            value={form.customer_province}
            onChange={(e) => setForm({ ...form, customer_province: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">รหัสไปรษณีย์</label>
          <input
            value={form.customer_postcode}
            onChange={(e) => setForm({ ...form, customer_postcode: e.target.value })}
            className="input-field"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">หมายเหตุ</label>
        <textarea
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          className="input-field"
          rows={2}
          placeholder="เช่น ขอใบเสร็จ, ขอจัดส่งแบบพัสดุด่วน ฯลฯ"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          ข้อมูลเพิ่มเติม <span className="text-xs text-gray-500">(ระบุรายละเอียดสินค้า เช่น ขนาด สี รุ่นที่ต้องการ)</span>
        </label>
        <textarea
          value={form.extra_info || ""}
          onChange={(e) => setForm({ ...form, extra_info: e.target.value })}
          className="input-field"
          rows={3}
          placeholder="เช่น ต้องการใบมีดขนาด 12 นิ้ว สีแดง จำนวน 2 ชิ้น, ต้องการสปริงแบบเหล็ก ฯลฯ"
        />
      </div>
    </div>
  );
}