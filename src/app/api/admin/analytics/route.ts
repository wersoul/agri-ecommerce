import { NextRequest, NextResponse } from "next/server";
export const runtime = "edge";
import { getDB } from "@/lib/db";
import { verifyAdmin } from "@/lib/api-auth";

// GET /api/admin/analytics?from=2026-01-01&to=2026-12-31&bucket=day
// bucket: "day" | "month" (default: "day" if range ≤ 90 days, else "month")
export async function GET(req: NextRequest) {
  const denied = await verifyAdmin(req);
  if (denied) return denied;

  const url = new URL(req.url);
  const today = new Date();
  const isoDate = (d: Date) => d.toISOString().slice(0, 10);

  // default range: last 30 days
  let from = url.searchParams.get("from") || isoDate(new Date(today.getTime() - 30 * 86400_000));
  let to = url.searchParams.get("to") || isoDate(today);
  const preset = url.searchParams.get("preset"); // today | week | month | year | all

  if (preset === "today") {
    from = isoDate(today);
    to = isoDate(today);
  } else if (preset === "week") {
    from = isoDate(new Date(today.getTime() - 6 * 86400_000));
    to = isoDate(today);
  } else if (preset === "month") {
    from = isoDate(new Date(today.getTime() - 29 * 86400_000));
    to = isoDate(today);
  } else if (preset === "year") {
    from = isoDate(new Date(today.getTime() - 364 * 86400_000));
    to = isoDate(today);
  } else if (preset === "all") {
    from = "1970-01-01";
    to = isoDate(today);
  }

  const fromTs = from + " 00:00:00";
  const toTs = to + " 23:59:59";

  // Decide bucket
  const days = Math.max(1, Math.round((new Date(toTs).getTime() - new Date(fromTs).getTime()) / 86400_000));
  const bucket = url.searchParams.get("bucket") || (days <= 90 ? "day" : "month");

  const dateFormat = bucket === "month" ? "%Y-%m" : "%Y-%m-%d";

  const db = getDB();

  // 1) Summary
  const summary = await db
    .prepare(
      `SELECT
         COUNT(*) AS total_orders,
         COALESCE(SUM(total), 0) AS total_revenue,
         COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) AS net_revenue,
         COALESCE(SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END), 0) AS completed_revenue,
         COUNT(DISTINCT customer_email) AS unique_customers,
         COALESCE(AVG(CASE WHEN status != 'cancelled' THEN total END), 0) AS avg_order_value
       FROM orders
       WHERE created_at >= ? AND created_at <= ?`
    )
    .bind(fromTs, toTs)
    .first();
  const summaryData = summary || {};

  // 2) Series (revenue + orders per period)
  const seriesRes = await db
    .prepare(
      `SELECT
         strftime('${dateFormat}', created_at) AS period,
         COUNT(*) AS orders,
         COALESCE(SUM(total), 0) AS revenue,
         COALESCE(SUM(CASE WHEN status = 'completed' THEN total ELSE 0 END), 0) AS completed_revenue
       FROM orders
       WHERE created_at >= ? AND created_at <= ?
       GROUP BY period
       ORDER BY period ASC`
    )
    .bind(fromTs, toTs)
    .all();
  const series = seriesRes.results || [];

  // 3) Status breakdown
  const statusRes = await db
    .prepare(
      `SELECT status, COUNT(*) AS count, COALESCE(SUM(total), 0) AS revenue
       FROM orders
       WHERE created_at >= ? AND created_at <= ?
       GROUP BY status`
    )
    .bind(fromTs, toTs)
    .all();
  const statusBreakdown = statusRes.results || [];

  // 4) Top products by quantity
  const topProductsRes = await db
    .prepare(
      `SELECT
         oi.product_id,
         oi.product_name,
         SUM(oi.quantity) AS total_qty,
         SUM(oi.subtotal) AS total_revenue,
         COUNT(DISTINCT oi.order_id) AS order_count
       FROM order_items oi
       INNER JOIN orders o ON o.id = oi.order_id
       WHERE o.created_at >= ? AND o.created_at <= ? AND o.status != 'cancelled'
       GROUP BY oi.product_id, oi.product_name
       ORDER BY total_revenue DESC
       LIMIT 10`
    )
    .bind(fromTs, toTs)
    .all();
  const topProducts = topProductsRes.results || [];

  // 5) Top customers
  const topCustomersRes = await db
    .prepare(
      `SELECT
         customer_id, customer_name, customer_email,
         COUNT(*) AS order_count,
         COALESCE(SUM(total), 0) AS total_spent
       FROM orders
       WHERE created_at >= ? AND created_at <= ? AND status != 'cancelled'
         AND customer_id IS NOT NULL
       GROUP BY customer_id, customer_name, customer_email
       ORDER BY total_spent DESC
       LIMIT 10`
    )
    .bind(fromTs, toTs)
    .all();
  const topCustomers = topCustomersRes.results || [];

  // 6) Daily comparison vs previous period (only meaningful for preset ranges)
  let comparison: any = null;
  if (preset && preset !== "all") {
    const rangeMs = new Date(toTs).getTime() - new Date(fromTs).getTime();
    const prevFromTs = new Date(new Date(fromTs).getTime() - rangeMs - 86400_000).toISOString().slice(0, 19).replace("T", " ");
    const prevToTs = new Date(new Date(fromTs).getTime() - 1).toISOString().slice(0, 19).replace("T", " ");
    const prev = await db
      .prepare(
        `SELECT
           COUNT(*) AS orders,
           COALESCE(SUM(total), 0) AS revenue
         FROM orders
         WHERE created_at >= ? AND created_at <= ? AND status != 'cancelled'`
      )
      .bind(prevFromTs, prevToTs)
      .first();
    const cur = summaryData.net_revenue || 0;
    const prevRev = (prev && (prev as any).revenue) || 0;
    comparison = {
      prev_orders: (prev && (prev as any).orders) || 0,
      prev_revenue: prevRev,
      cur_orders: summaryData.total_orders || 0,
      cur_revenue: cur,
      revenue_change_pct: prevRev > 0 ? ((cur - prevRev) / prevRev) * 100 : null,
    };
  }

  return NextResponse.json({
    range: { from, to, preset, bucket, days },
    summary: summaryData,
    series,
    status_breakdown: statusBreakdown,
    top_products: topProducts,
    top_customers: topCustomers,
    comparison,
  });
}