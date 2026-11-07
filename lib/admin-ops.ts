import { z } from "zod";

export type OpsUser = {
  id: string;
  phone: string | null;
  email: string | null;
  createdAt: string;
  note?: string;
};

export type AdminUserRow = {
  id: string;
  phone: string | null;
  email: string | null;
  createdAt: string;
  note: string;
  orderCount: number;
  redemptionCount: number;
};

export type PublicOrder = {
  id: string;
  userId: string | null;
  email: string;
  name: string;
  totalCents: number;
  status: "pending" | "paid" | "failed";
  createdAt: string;
  items: { title: string; qty: number }[];
};

export type PublicRedemption = {
  id: string;
  userId: string | null;
  orderId: string;
  label: string;
  maskedCode: string;
  createdAt: string;
};

export const adminUserId = /^user_[a-z0-9]{8,40}$/;

export function cleanNote(value: unknown): string | null {
  const parsed = z.string().max(500).safeParse(value);
  if (!parsed.success) return null;
  return parsed.data.trim();
}

export function buildUserRows(
  users: OpsUser[],
  orders: { userId: string | null }[],
  redemptions: { userId: string | null }[],
): AdminUserRow[] {
  return users
    .map((user) => ({
      id: user.id,
      phone: user.phone,
      email: user.email,
      createdAt: user.createdAt,
      note: user.note?.trim() ?? "",
      orderCount: orders.filter((order) => order.userId === user.id).length,
      redemptionCount: redemptions.filter((row) => row.userId === user.id).length,
    }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function searchUsers(rows: AdminUserRow[], query: string): AdminUserRow[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) => [row.id, row.phone ?? "", row.email ?? "", row.note].some((part) => part.toLowerCase().includes(needle)));
}

export function toPublicOrder(order: PublicOrder & Record<string, unknown>): PublicOrder {
  return {
    id: order.id,
    userId: order.userId,
    email: order.email,
    name: order.name,
    totalCents: order.totalCents,
    status: order.status,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({ title: item.title, qty: item.qty })),
  };
}

export function toPublicRedemption(row: PublicRedemption & Record<string, unknown>): PublicRedemption {
  return {
    id: row.id,
    userId: row.userId,
    orderId: row.orderId,
    label: row.label,
    maskedCode: row.maskedCode,
    createdAt: row.createdAt,
  };
}

export function sortNewest<T extends { createdAt: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function buildOverview(input: {
  users: number;
  orders: { status: "pending" | "paid" | "failed"; totalCents: number }[];
  redemptions: number;
  products: { published: boolean }[];
  soldUnits: number;
}) {
  const paid = input.orders.filter((order) => order.status === "paid");
  return {
    users: input.users,
    orders: input.orders.length,
    pendingOrders: input.orders.filter((order) => order.status === "pending").length,
    paidOrders: paid.length,
    failedOrders: input.orders.filter((order) => order.status === "failed").length,
    paidCents: paid.reduce((sum, order) => sum + order.totalCents, 0),
    redemptions: input.redemptions,
    products: input.products.length,
    publishedProducts: input.products.filter((product) => product.published).length,
    soldUnits: input.soldUnits,
  };
}

export function orderStatusLabel(status: PublicOrder["status"]): string {
  if (status === "paid") return "已支付";
  if (status === "failed") return "未成功";
  return "待支付";
}
