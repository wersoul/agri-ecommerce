// แปลง SQLite/D1 error เป็นข้อความภาษาไทยที่ admin อ่านเข้าใจ
// ใช้ใน API routes เพื่อห่อหุ้ม try/catch ที่จับ err จาก db.prepare(...).run()
//
// D1 (Cloudflare) คืน SQLite error code ที่ขึ้นต้นด้วย "D1_ERROR" แล้วตามด้วย:
//   - UNIQUE constraint failed: products.sku
//   - FOREIGN KEY constraint failed
//   - NOT NULL constraint failed: products.name
//   - CHECK constraint failed: ...
//   - SQLITE_CONSTRAINT_UNIQUE / SQLITE_CONSTRAINT_FOREIGNKEY / SQLITE_CONSTRAINT_NOTNULL

export interface FriendlyDbError {
  message: string;
  code: string;
  status: number; // HTTP status code (400 = user-fixable, 409 = conflict, 500 = server)
}

export function friendlyDbError(err: any): FriendlyDbError {
  const raw = String(err?.message || err || "");
  const lc = raw.toLowerCase();

  // UNIQUE constraint
  if (
    lc.includes("unique constraint failed") ||
    lc.includes("sqlite_constraint_unique")
  ) {
    // ดึงชื่อ column ออกมา เช่น "products.sku"
    const m = raw.match(/UNIQUE constraint failed:\s*([\w."`]+)/i);
    const col = m ? m[1].replace(/[`"]/g, "") : "ข้อมูล";
    const friendlyCol = col.endsWith(".sku")
      ? "SKU"
      : col.endsWith(".slug")
      ? "slug"
      : col.endsWith(".email")
      ? "อีเมล"
      : col.endsWith(".username")
      ? "ชื่อผู้ใช้"
      : col.endsWith(".order_number")
      ? "เลขที่คำสั่งซื้อ"
      : col.split(".").pop() || col;
    return {
      code: "UNIQUE_VIOLATION",
      message: `${friendlyCol} นี้ถูกใช้แล้วในระบบ กรุณาเปลี่ยนเป็นค่าอื่น`,
      status: 409,
    };
  }

  // FOREIGN KEY constraint
  if (
    lc.includes("foreign key constraint failed") ||
    lc.includes("sqlite_constraint_foreignkey")
  ) {
    return {
      code: "FK_VIOLATION",
      message: "ไม่สามารถลบ/แก้ไขได้ เนื่องจากมีข้อมูลอื่นอ้างอิงอยู่",
      status: 409,
    };
  }

  // NOT NULL constraint
  if (
    lc.includes("not null constraint failed") ||
    lc.includes("sqlite_constraint_notnull")
  ) {
    const m = raw.match(/NOT NULL constraint failed:\s*([\w."`]+)/i);
    const col = m ? m[1].replace(/[`"]/g, "") : "ข้อมูลที่จำเป็น";
    return {
      code: "NOTNULL_VIOLATION",
      message: `กรุณากรอก${col.split(".").pop()}ให้ครบถ้วน`,
      status: 400,
    };
  }

  // CHECK constraint
  if (
    lc.includes("check constraint failed") ||
    lc.includes("sqlite_constraint_check")
  ) {
    return {
      code: "CHECK_VIOLATION",
      message: "ค่าที่ส่งมาไม่ผ่านเงื่อนไขของระบบ",
      status: 400,
    };
  }

  // Default: ส่งข้อความเดิมกลับไป แต่ห่อด้วย status 500
  return {
    code: "DB_ERROR",
    message: raw || "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
    status: 500,
  };
}