"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ArrowRight,
  Bell,
  Calendar,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Download,
  Edit2,
  Factory,
  FileText,
  LayoutDashboard,
  Menu,
  Package,
  PackagePlus,
  Plus,
  Printer,
  Search,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// --- Types ---
type Product = {
  id: number;
  name: string;
  unit: string;
  price: number;
  active: boolean;
};

type Order = {
  id: string;
  date: string;
  deliveryDate: string;
  customer: string;
  productId: number;
  qty: number;
  rate?: number;
  status: string;
  notes?: string;
};

// --- Constants ---
const STATUS_OPTIONS = [
  "Pending",
  "Confirmed",
  "In Production",
  "Ready to Bill",
  "Completed",
  "Cancelled",
] as const;

type Status = (typeof STATUS_OPTIONS)[number];

const STATUS_STYLES: Record<Status, { bg: string; text: string; dot: string }> = {
  Pending: { bg: "bg-[#f4f0ed]", text: "text-[#756a62]", dot: "bg-[#b4a89e]" },
  Confirmed: { bg: "bg-[#e8f0fe]", text: "text-[#1a56bb]", dot: "bg-[#1a56bb]" },
  "In Production": { bg: "bg-[#fff7d7]", text: "text-[#a36f00]", dot: "bg-[#e9a000]" },
  "Ready to Bill": { bg: "bg-[#eaf7ef]", text: "text-[#29804a]", dot: "bg-[#29804a]" },
  Completed: { bg: "bg-[#e7f5ed]", text: "text-[#217346]", dot: "bg-[#217346]" },
  Cancelled: { bg: "bg-[#fbe9e7]", text: "text-[#b33a2b]", dot: "bg-[#b33a2b]" },
};

// --- Seed Data ---
const PRODUCTS_SEED: Product[] = [
  { id: 1, name: "Motichoor Ladoo", unit: "kg", price: 480, active: true },
  { id: 2, name: "Kaju Katli", unit: "kg", price: 920, active: true },
  { id: 3, name: "Gulab Jamun", unit: "kg", price: 360, active: true },
];

const ORDERS_SEED: Order[] = [
  { id: "ORD-1048", date: "2026-10-30", deliveryDate: "2026-10-31", customer: "Sharma Sweets", productId: 1, qty: 8, status: "Confirmed", notes: "Extra saffron" },
  { id: "ORD-1047", date: "2026-10-30", deliveryDate: "2026-10-31", customer: "Anita Caterers", productId: 1, qty: 6.5, status: "In Production" },
  { id: "ORD-1046", date: "2026-10-30", deliveryDate: "2026-11-01", customer: "Ramesh Kumar", productId: 1, qty: 4, status: "Confirmed" },
  { id: "ORD-1045", date: "2026-10-30", deliveryDate: "2026-10-30", customer: "The Grand Hotel", productId: 2, qty: 7, status: "Ready to Bill" },
  { id: "ORD-1044", date: "2026-10-30", deliveryDate: "2026-10-30", customer: "Priya Events", productId: 2, qty: 5, status: "Ready to Bill", notes: "Gift boxes" },
  { id: "ORD-1043", date: "2026-10-30", deliveryDate: "2026-11-02", customer: "Rajasthan Bhoj", productId: 3, qty: 5.25, status: "Confirmed" },
  { id: "ORD-1042", date: "2026-10-30", deliveryDate: "2026-11-03", customer: "Neha Gupta", productId: 3, qty: 3.5, status: "Pending" },
  { id: "ORD-1041", date: "2026-10-29", deliveryDate: "2026-10-30", customer: "Meera Banquets", productId: 2, qty: 12, status: "Ready to Bill" },
];

// --- Helpers ---
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const money = (v: number) => `₹${v.toLocaleString("en-IN")}`;
const dateLabel = (v: string) => {
  if (!v) return "";
  const parts = v.split("-");
  if (parts.length === 3) {
    const day = parseInt(parts[2], 10);
    const m = parseInt(parts[1], 10);
    const month = MONTHS[m - 1] ?? parts[1];
    return `${day} ${month} ${parts[0]}`;
  }
  return v;
};

const getTodayStr = () => {
  if (typeof window !== "undefined") {
    try {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } catch {}
  }
  return "2026-10-30";
};

let nextOrderNum = 1049;
const genOrderId = () => `ORD-${nextOrderNum++}`;

const getHandoverBadge = (deliveryDateStr: string) => {
  if (!deliveryDateStr) return null;
  const today = getTodayStr();
  if (deliveryDateStr === today) {
    return { label: "Handover Today", style: "bg-[#fbe9e7] text-[#b33a2b] border-[#f4c7c3]" };
  }
  try {
    const todayDate = new Date(today);
    const delDate = new Date(deliveryDateStr);
    const diffTime = delDate.getTime() - todayDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays === 1) {
      return { label: "Tomorrow", style: "bg-[#fff7d7] text-[#946200] border-[#fae498]" };
    } else if (diffDays < 0) {
      return { label: `${Math.abs(diffDays)}d Overdue`, style: "bg-[#fbe9e7] text-[#b33a2b] border-[#f4c7c3]" };
    } else if (diffDays <= 3) {
      return { label: `In ${diffDays} days`, style: "bg-[#e8f0fe] text-[#1a56bb] border-[#c2d7fc]" };
    }
  } catch {}
  return null;
};

// --- Shared UI ---
function Badge({ status }: { status: string }) {
  const s = STATUS_STYLES[status as Status] ?? STATUS_STYLES.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.bg} ${s.text}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

function StatusDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const s = STATUS_STYLES[value as Status] ?? STATUS_STYLES.Pending;
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none cursor-pointer rounded-full pl-3 pr-7 py-1 text-[11px] font-semibold border-0 outline-none focus:ring-2 focus:ring-[#e85d04]/30 ${s.bg} ${s.text}`}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown className={`pointer-events-none absolute right-1.5 size-3 ${s.text}`} />
    </div>
  );
}

function PageHeader({ title, onMenu, action }: { title: string; onMenu: () => void; action?: React.ReactNode }) {
  const [headerDate, setHeaderDate] = useState("Wednesday, October 30, 2026");

  useEffect(() => {
    try {
      const now = new Date();
      setHeaderDate(
        new Intl.DateTimeFormat("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(now)
      );
    } catch {}
  }, []);

  return (
    <header className="flex min-h-[76px] items-center justify-between border-b border-[#eadfd7] bg-white/90 backdrop-blur-sm px-5 sm:px-8 lg:px-10 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button className="text-[#766e68] lg:hidden" onClick={onMenu} aria-label="Open navigation">
          <Menu className="size-5" />
        </button>
        <div>
          <p className="text-xs font-medium text-[#aaa19a]">{headerDate}</p>
          <h1 className="mt-0.5 font-serif text-xl font-semibold">{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative flex size-9 items-center justify-center rounded-full text-[#817872] hover:bg-[#fff4ed]" aria-label="Notifications">
          <Bell className="size-[18px]" />
          <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#e85d04]" />
        </button>
        {action}
      </div>
    </header>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex size-12 items-center justify-center rounded-full bg-[#fbe9e7] mx-auto">
          <Trash2 className="size-5 text-[#b33a2b]" />
        </div>
        <h3 className="mt-4 text-center font-serif text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-center text-sm text-[#968d86]">{message}</p>
        <div className="mt-6 flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-[#eadfd7] py-2.5 text-sm font-semibold text-[#766e68] hover:bg-[#faf5f1]">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-[#b33a2b] py-2.5 text-sm font-semibold text-white hover:bg-[#9a2f22]">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ active, setActive, open, setOpen, orderCount }: {
  active: string; setActive: (v: string) => void; open: boolean; setOpen: (v: boolean) => void; orderCount: number;
}) {
  const items = [
    { label: "Dashboard", Icon: LayoutDashboard },
    { label: "Orders", Icon: ClipboardList },
    { label: "Products", Icon: Package },
  ] as const;

  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-[258px] flex-col border-r border-[#eadfd7] bg-white px-5 py-6 transition-transform duration-200 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-2.5 px-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#e85d04] text-white">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="font-serif text-[21px] font-semibold leading-none">Dhuniya</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#aaa19a]">Production desk</p>
          </div>
        </div>
        <p className="mt-11 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8afa8]">Workspace</p>
        <nav className="mt-3 flex flex-col gap-1.5">
          {items.map(({ label, Icon }) => (
            <button
              key={label}
              onClick={() => { setActive(label); setOpen(false); }}
              className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${active === label ? "bg-[#fff0e6] text-[#e85d04]" : "text-[#766e68] hover:bg-[#faf5f1]"}`}
            >
              <Icon className="size-[18px]" />
              <span>{label}</span>
              {label === "Orders" && (
                <span className="ml-auto rounded-full bg-[#ffe3d2] px-2 py-0.5 text-[11px] font-semibold text-[#c65016]">
                  {orderCount}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-[#fff7f1] p-4">
          <div className="flex items-center gap-2 text-[#e85d04]">
            <Factory className="size-4" />
            <span className="text-xs font-semibold">Eastern Traditional Sweets</span>
          </div>
          <p className="mt-2 text-[13px] leading-5 text-[#8c8179]">
            Dhuniya products · KDS/1597
          </p>
        </div>
      </aside>
    </>
  );
}

// --- Invoice ---
function Invoice({ order, product, rate, onClose }: {
  order: Order; product: Product; rate: number; onClose: () => void;
}) {
  const total = order.qty * rate;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#2c211b]/40 p-4 backdrop-blur-sm">
      <div className="mx-auto my-5 max-w-[760px] rounded-2xl border border-[#eadfd7] bg-white shadow-2xl">
        <div className="border-b border-[#f0e8e2] px-6 py-5">
          <p className="font-serif text-2xl font-semibold text-[#312d2a]">Dhuniya products</p>
          <p className="mt-1 text-xs text-[#766e68]">Eastern Traditional Sweet</p>
          <p className="mt-2 text-[11px] leading-5 text-[#968d86]">
            Registration: KDS/1597 · Mobile: 0756656135 · 138, France City, Maruthamunai
          </p>
        </div>
        <div className="flex items-center justify-between border-b border-[#f0e8e2] px-6 py-5 print:hidden">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e85d04]">Invoice preview</p>
            <h2 className="font-serif text-xl font-semibold">Bill for {order.id}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer data-icon="inline-start" /> Print Bill
            </Button>
            <Button onClick={() => window.print()} className="bg-[#e85d04] text-white hover:bg-[#c94f05]">
              <Download data-icon="inline-start" /> Download PDF
            </Button>
            <button onClick={onClose} className="ml-2 rounded-lg p-2 text-[#9d928a] hover:bg-[#fff4ed]" aria-label="Close invoice">
              <X className="size-4" />
            </button>
          </div>
        </div>
        <article className="p-8 sm:p-12">
          <div className="flex flex-col justify-between gap-6 border-b border-[#eadfd7] pb-8 sm:flex-row">
            <div>
              <div className="flex items-center gap-2 text-[#e85d04]">
                <Sparkles className="size-5" />
                <span className="font-serif text-3xl font-semibold text-[#312d2a]">Dhuniya</span>
              </div>
              <p className="mt-2 text-sm text-[#8d8178]">Eastern traditional sweets</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a18f84]">Invoice</p>
              <p className="mt-1 font-serif text-2xl font-semibold">{order.id}</p>
              <p className="mt-1 text-sm text-[#8d8178]">{dateLabel(order.date)}</p>
            </div>
          </div>
          <div className="grid gap-5 border-b border-[#eadfd7] py-8 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a18f84]">Billed to</p>
              <p className="mt-2 text-lg font-semibold">{order.customer}</p>
              <p className="mt-1 text-sm text-[#8d8178]">Customer order · {order.id}</p>
              {order.notes && <p className="mt-1 text-sm text-[#8d8178]">Note: {order.notes}</p>}
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a18f84]">Order date</p>
              <p className="mt-2 text-lg font-semibold">{dateLabel(order.date)}</p>
              <p className="mt-1 text-sm text-[#8d8178]">Delivery: {dateLabel(order.deliveryDate)}</p>
              <p className="mt-1 text-sm text-[#8d8178]">Payment due on receipt</p>
            </div>
          </div>
          <table className="mt-8 w-full text-left text-sm">
            <thead className="border-b border-[#eadfd7] text-[11px] uppercase tracking-[0.12em] text-[#a18f84]">
              <tr>
                <th className="pb-3">Product</th>
                <th className="pb-3 text-right">Quantity ({product.unit})</th>
                <th className="pb-3 text-right">Rate</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#f2ece7]">
                <td className="py-5 font-semibold">{product.name}</td>
                <td className="py-5 text-right">{order.qty}</td>
                <td className="py-5 text-right">{money(rate)}</td>
                <td className="py-5 text-right font-semibold">{money(total)}</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-[260px] border-t-2 border-[#312d2a] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Grand Total</span>
                <span className="font-serif text-2xl font-semibold text-[#e85d04]">{money(total)}</span>
              </div>
            </div>
          </div>
          <p className="mt-14 border-t border-[#eadfd7] pt-5 text-center text-xs text-[#a18f84]">
            Thank you for choosing Dhuniya. We appreciate your order.
          </p>
        </article>
      </div>
    </div>
  );
}

// --- Products Page ---
type ProductFormData = { name: string; unit: string; price: string; active: boolean };

function ProductModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Product;
  onSave: (data: ProductFormData) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ProductFormData>({
    name: initial?.name ?? "",
    unit: initial?.unit ?? "kg",
    price: initial?.price?.toString() ?? "",
    active: initial?.active ?? true,
  });
  const [errors, setErrors] = useState<Partial<ProductFormData>>({});

  const validate = () => {
    const e: Partial<ProductFormData> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = "Valid price required";
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#eadfd7] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e85d04]">{initial ? "Edit" : "New"} Product</p>
            <h3 className="mt-1 font-serif text-lg font-semibold">{initial ? "Update product details" : "Add to catalog"}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[#9d928a] hover:bg-[#fff4ed]"><X className="size-4" /></button>
        </div>
        <div className="space-y-4 px-6 py-6">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#4f463f]">Product Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Motichoor Ladoo"
              className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[#e85d04] focus:ring-2 focus:ring-[#e85d04]/20 ${errors.name ? "border-[#b33a2b]" : "border-[#eadfd7]"}`}
            />
            {errors.name && <p className="mt-1 text-xs text-[#b33a2b]">{errors.name}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#4f463f]">Unit</label>
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full rounded-xl border border-[#eadfd7] px-3 py-2.5 text-sm outline-none focus:border-[#e85d04] focus:ring-2 focus:ring-[#e85d04]/20"
            >
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="pcs">pcs</option>
              <option value="box">box</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#4f463f]">Selling Price (₹ per unit) *</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="e.g. 480"
              min="0"
              className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[#e85d04] focus:ring-2 focus:ring-[#e85d04]/20 ${errors.price ? "border-[#b33a2b]" : "border-[#eadfd7]"}`}
            />
            {errors.price && <p className="mt-1 text-xs text-[#b33a2b]">{errors.price}</p>}
          </div>
          <div className="flex items-center justify-between rounded-xl border border-[#eadfd7] px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Active</p>
              <p className="text-xs text-[#968d86]">Show in order dropdown</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, active: !form.active })}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.active ? "bg-[#e85d04]" : "bg-[#d6cfc9]"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.active ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>
        <div className="flex gap-3 border-t border-[#eadfd7] px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-[#eadfd7] py-2.5 text-sm font-semibold text-[#766e68] hover:bg-[#faf5f1]">Cancel</button>
          <button onClick={submit} className="flex-1 rounded-xl bg-[#e85d04] py-2.5 text-sm font-semibold text-white hover:bg-[#c94f05]">
            {initial ? "Update Product" : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductsPage({
  products,
  orders,
  onAdd,
  onEdit,
  onDelete,
  onViewProductOrders,
}: {
  products: Product[];
  orders: Order[];
  onAdd: (data: ProductFormData) => void;
  onEdit: (id: number, data: ProductFormData) => void;
  onDelete: (id: number) => void;
  onViewProductOrders: (productId: number) => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  return (
    <>
      <PageHeader
        title="Products"
        onMenu={() => {}}
        action={
          <Button
            onClick={() => setShowModal(true)}
            className="bg-[#e85d04] text-white hover:bg-[#c94f05] gap-1.5"
          >
            <Plus className="size-4" /> New Product
          </Button>
        }
      />
      <div className="mx-auto max-w-[1250px] px-5 py-9 sm:px-8 lg:px-10">
        <p className="text-sm font-medium text-[#e85d04]">Sweet catalog</p>
        <h2 className="mt-2 font-serif text-[32px] font-semibold">Products</h2>
        <p className="mt-1 text-sm text-[#968d86]">Manage sweet catalog, view active order demand, and handover schedules.</p>

        {products.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#eadfd7] bg-white py-20 text-center">
            <PackagePlus className="size-10 text-[#e85d04]" />
            <p className="mt-4 font-serif text-xl font-semibold">No products yet</p>
            <p className="mt-2 text-sm text-[#968d86]">Add your first sweet to get started.</p>
            <button onClick={() => setShowModal(true)} className="mt-6 rounded-xl bg-[#e85d04] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c94f05]">
              Add Product
            </button>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-2xl border border-[#eadfd7] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-[#eee5df] bg-[#fffaf6] text-[11px] uppercase tracking-[0.12em] text-[#a18f84]">
                  <tr>
                    <th className="px-5 py-4">Product</th>
                    <th className="px-5 py-4">Unit</th>
                    <th className="px-5 py-4">Selling Price</th>
                    <th className="px-5 py-4">Active Demand & Handover</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const activeOrders = orders.filter(
                      (o) => o.productId === p.id && !["Completed", "Cancelled"].includes(o.status)
                    );
                    const totalOrderedKg = activeOrders.reduce((sum, o) => sum + o.qty, 0);

                    return (
                      <tr key={p.id} className="border-b border-[#f2ece7] last:border-0 hover:bg-[#fffaf6] transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#fff0e6] text-xs font-bold text-[#c65016]">
                              {p.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                            </div>
                            <span className="font-semibold">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[#766e68]">{p.unit}</td>
                        <td className="px-5 py-4 font-serif font-semibold">
                          {money(p.price)}
                          <span className="ml-1 text-xs font-sans font-normal text-[#a79a91]">/ {p.unit}</span>
                        </td>
                        <td className="px-5 py-4">
                          {activeOrders.length > 0 ? (
                            <div>
                              <p className="font-semibold text-[#312d2a]">
                                {totalOrderedKg.toFixed(2)} {p.unit}
                              </p>
                              <button
                                onClick={() => onViewProductOrders(p.id)}
                                className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#e85d04] hover:underline"
                              >
                                {activeOrders.length} order{activeOrders.length !== 1 ? "s" : ""} · See who ordered & handover →
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-[#a59a92]">No active orders</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${p.active ? "bg-[#eaf7ef] text-[#29804a]" : "bg-[#f4f0ed] text-[#756a62]"}`}>
                            <span className={`size-1.5 rounded-full ${p.active ? "bg-[#29804a]" : "bg-[#b4a89e]"}`} />
                            {p.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditProduct(p)}
                              className="rounded-lg border border-[#eadfd7] p-2 text-[#766e68] hover:bg-[#fff0e6] hover:text-[#e85d04] hover:border-[#e85d04] transition-colors"
                              title="Edit product"
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteId(p.id)}
                              className="rounded-lg border border-[#eadfd7] p-2 text-[#766e68] hover:bg-[#fbe9e7] hover:text-[#b33a2b] hover:border-[#b33a2b] transition-colors"
                              title="Delete product"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {(showModal || editProduct) && (
        <ProductModal
          initial={editProduct ?? undefined}
          onSave={(data) => {
            if (editProduct) { onEdit(editProduct.id, data); setEditProduct(null); }
            else { onAdd(data); setShowModal(false); }
          }}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
        />
      )}
      {deleteId !== null && (
        <ConfirmDialog
          title="Delete product?"
          message="This product will be removed. Orders linked to it will keep their data."
          onConfirm={() => { onDelete(deleteId); setDeleteId(null); }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  );
}

// --- Order Form Modal ---
type OrderFormData = {
  customer: string;
  productId: string;
  qty: string;
  deliveryDate: string;
  rate: string;
  notes: string;
};

function OrderModal({
  initial,
  products,
  onSave,
  onClose,
}: {
  initial?: Order;
  products: Product[];
  onSave: (data: OrderFormData) => void;
  onClose: () => void;
}) {
  const activeProducts = products.filter((p) => p.active);
  const [form, setForm] = useState<OrderFormData>({
    customer: initial?.customer ?? "",
    productId: initial?.productId?.toString() ?? (activeProducts[0]?.id?.toString() ?? ""),
    qty: initial?.qty?.toString() ?? "",
    deliveryDate: initial?.deliveryDate ?? "2026-10-30",
    rate: initial?.rate?.toString() ?? "",
    notes: initial?.notes ?? "",
  });
  const [errors, setErrors] = useState<Partial<OrderFormData>>({});

  const validate = () => {
    const e: Partial<OrderFormData> = {};
    if (!form.customer.trim()) e.customer = "Customer name required";
    if (!form.productId) e.productId = "Select a product";
    if (!form.qty || isNaN(Number(form.qty)) || Number(form.qty) <= 0) e.qty = "Valid quantity required";
    if (!form.deliveryDate) e.deliveryDate = "Delivery date required";
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
  };

  const selectedProduct = products.find((p) => p.id === Number(form.productId));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm p-4">
      <div className="mx-auto my-6 w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#eadfd7] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e85d04]">{initial ? "Edit" : "New"} Order</p>
            <h3 className="mt-1 font-serif text-lg font-semibold">{initial ? "Update order details" : "Create a new order"}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[#9d928a] hover:bg-[#fff4ed]"><X className="size-4" /></button>
        </div>
        <div className="space-y-4 px-6 py-6">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#4f463f]">Customer Name *</label>
            <input
              value={form.customer}
              onChange={(e) => setForm({ ...form, customer: e.target.value })}
              placeholder="e.g. Sharma Sweets"
              className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[#e85d04] focus:ring-2 focus:ring-[#e85d04]/20 ${errors.customer ? "border-[#b33a2b]" : "border-[#eadfd7]"}`}
            />
            {errors.customer && <p className="mt-1 text-xs text-[#b33a2b]">{errors.customer}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#4f463f]">Product *</label>
            <select
              value={form.productId}
              onChange={(e) => { setForm({ ...form, productId: e.target.value, rate: "" }); }}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[#e85d04] focus:ring-2 focus:ring-[#e85d04]/20 ${errors.productId ? "border-[#b33a2b]" : "border-[#eadfd7]"}`}
            >
              <option value="">Select a product…</option>
              {activeProducts.map((p) => (
                <option key={p.id} value={p.id}>{p.name} — {money(p.price)}/{p.unit}</option>
              ))}
            </select>
            {errors.productId && <p className="mt-1 text-xs text-[#b33a2b]">{errors.productId}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#4f463f]">Quantity ({selectedProduct?.unit ?? "kg"}) *</label>
              <input
                type="number"
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: e.target.value })}
                placeholder="e.g. 5"
                min="0"
                step="0.25"
                className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[#e85d04] focus:ring-2 focus:ring-[#e85d04]/20 ${errors.qty ? "border-[#b33a2b]" : "border-[#eadfd7]"}`}
              />
              {errors.qty && <p className="mt-1 text-xs text-[#b33a2b]">{errors.qty}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#4f463f]">Rate/kg (optional)</label>
              <input
                type="number"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                placeholder={selectedProduct ? `Default: ${selectedProduct.price}` : "Auto from product"}
                min="0"
                className="w-full rounded-xl border border-[#eadfd7] px-3 py-2.5 text-sm outline-none focus:border-[#e85d04] focus:ring-2 focus:ring-[#e85d04]/20"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#4f463f]">Delivery Date *</label>
            <input
              type="date"
              value={form.deliveryDate}
              onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:border-[#e85d04] focus:ring-2 focus:ring-[#e85d04]/20 ${errors.deliveryDate ? "border-[#b33a2b]" : "border-[#eadfd7]"}`}
            />
            {errors.deliveryDate && <p className="mt-1 text-xs text-[#b33a2b]">{errors.deliveryDate}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[#4f463f]">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Extra saffron, gift boxes…"
              rows={2}
              className="w-full rounded-xl border border-[#eadfd7] px-3 py-2.5 text-sm outline-none focus:border-[#e85d04] focus:ring-2 focus:ring-[#e85d04]/20 resize-none"
            />
          </div>
          {form.productId && form.qty && (
            <div className="rounded-xl bg-[#fff7f1] px-4 py-3">
              <p className="text-xs font-semibold text-[#e85d04]">Estimated total</p>
              <p className="mt-1 font-serif text-xl font-semibold">
                {money((Number(form.rate) || selectedProduct?.price || 0) * Number(form.qty))}
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-3 border-t border-[#eadfd7] px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-xl border border-[#eadfd7] py-2.5 text-sm font-semibold text-[#766e68] hover:bg-[#faf5f1]">Cancel</button>
          <button onClick={submit} className="flex-1 rounded-xl bg-[#e85d04] py-2.5 text-sm font-semibold text-white hover:bg-[#c94f05]">
            {initial ? "Update Order" : "Create Order"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Orders Page ---
function OrdersPage({
  orders,
  products,
  onAdd,
  onEdit,
  onDelete,
  onStatusChange,
  onGenerate,
  initialProductFilter = null,
  onClearProductFilter,
}: {
  orders: Order[];
  products: Product[];
  onAdd: (data: OrderFormData) => void;
  onEdit: (id: string, data: OrderFormData) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onGenerate: (order: Order) => void;
  initialProductFilter?: number | null;
  onClearProductFilter?: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filterProductId, setFilterProductId] = useState<string>(
    initialProductFilter ? String(initialProductFilter) : "All"
  );
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    if (initialProductFilter !== null && initialProductFilter !== undefined) {
      setFilterProductId(String(initialProductFilter));
    }
  }, [initialProductFilter]);

  const activeFilteredProduct = useMemo(
    () => (filterProductId !== "All" ? products.find((p) => p.id === Number(filterProductId)) : null),
    [filterProductId, products]
  );

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchProduct = filterProductId === "All" || o.productId === Number(filterProductId);
      const matchQuery =
        o.customer.toLowerCase().includes(query.toLowerCase()) ||
        o.id.toLowerCase().includes(query.toLowerCase()) ||
        (o.notes && o.notes.toLowerCase().includes(query.toLowerCase())) ||
        (products.find((p) => p.id === o.productId)?.name ?? "").toLowerCase().includes(query.toLowerCase());
      const matchStatus = filterStatus === "All" || o.status === filterStatus;
      const matchDate = !filterDate || o.date === filterDate || o.deliveryDate === filterDate;
      return matchProduct && matchQuery && matchStatus && matchDate;
    });
  }, [orders, products, filterProductId, query, filterStatus, filterDate]);

  const totalFilteredKg = useMemo(() => {
    return filtered.reduce((sum, o) => sum + o.qty, 0);
  }, [filtered]);

  const getProduct = (id: number) => products.find((p) => p.id === id);

  return (
    <>
      <PageHeader
        title="Orders"
        onMenu={() => {}}
        action={
          <Button onClick={() => setShowModal(true)} className="bg-[#e85d04] text-white hover:bg-[#c94f05] gap-1.5">
            <Plus className="size-4" /> New Order
          </Button>
        }
      />
      <div className="mx-auto max-w-[1250px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
        <p className="text-sm font-medium text-[#e85d04]">Order management</p>
        <h2 className="mt-2 font-serif text-[32px] font-semibold">All orders</h2>
        <p className="mt-1 text-sm text-[#968d86]">Track customer orders, check handover deadlines, and update status.</p>

        {/* Highlighted Banner when filtered by Product */}
        {activeFilteredProduct && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-[#e85d04] bg-[#fff8f3] p-5 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="flex size-12 items-center justify-center rounded-xl bg-[#e85d04] text-white shadow-sm">
                <Package className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#e85d04]">Filtered by sweet</span>
                  <span className="rounded-full bg-[#fae8dc] px-2.5 py-0.5 text-[11px] font-semibold text-[#8a4a1f]">
                    {filtered.length} customer order{filtered.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#312d2a]">{activeFilteredProduct.name}</h3>
                <p className="mt-0.5 text-xs text-[#766e68]">
                  Showing everyone who ordered {activeFilteredProduct.name} and their exact handover delivery dates.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#968d86]">Total to Produce</p>
                <p className="font-serif text-2xl font-bold text-[#e85d04]">
                  {totalFilteredKg.toFixed(2)} <span className="text-sm font-normal text-[#766e68]">{activeFilteredProduct.unit}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setFilterProductId("All");
                  onClearProductFilter?.();
                }}
                className="flex items-center gap-1.5 rounded-xl border border-[#eadfd7] bg-white px-3.5 py-2 text-xs font-semibold text-[#766e68] hover:bg-[#faf5f1] hover:text-[#312d2a] transition-colors shadow-sm"
              >
                <X className="size-3.5" /> Show All Sweets
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#eadfd7] bg-white p-4">
          <label className="flex flex-1 min-w-[200px] items-center gap-2 rounded-xl border border-[#eee5df] px-3">
            <Search className="size-4 shrink-0 text-[#b4a79f]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customer, order ID, notes…"
              className="w-full bg-transparent py-2 text-sm outline-none"
            />
          </label>
          <select
            value={filterProductId}
            onChange={(e) => {
              setFilterProductId(e.target.value);
              if (e.target.value === "All") onClearProductFilter?.();
            }}
            className="rounded-xl border border-[#eadfd7] bg-[#fffaf6] px-3 py-2 text-sm font-medium outline-none focus:border-[#e85d04]"
          >
            <option value="All">All Sweets ({products.length})</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-[#eadfd7] bg-[#fffaf6] px-3 py-2 text-sm outline-none focus:border-[#e85d04]"
          >
            <option value="All">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-xl border border-[#eadfd7] bg-[#fffaf6] px-3 py-2 text-sm outline-none focus:border-[#e85d04]"
            title="Filter by delivery or order date"
          />
          {(query || filterProductId !== "All" || filterStatus !== "All" || filterDate) && (
            <button
              onClick={() => {
                setQuery("");
                setFilterProductId("All");
                setFilterStatus("All");
                setFilterDate("");
                onClearProductFilter?.();
              }}
              className="rounded-xl border border-[#eadfd7] px-3 py-2 text-sm font-medium text-[#766e68] hover:bg-[#faf5f1]"
            >
              Clear all
            </button>
          )}
          <span className="ml-auto text-xs font-semibold text-[#a18f84]">
            {filtered.length} order{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Orders Table */}
        {filtered.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#eadfd7] bg-white py-20 text-center">
            <ClipboardList className="size-10 text-[#e85d04]" />
            <p className="mt-4 font-serif text-xl font-semibold">No orders found</p>
            <p className="mt-2 text-sm text-[#968d86]">
              {orders.length === 0 ? "Create your first order to get started." : "Try adjusting your search or filters."}
            </p>
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-2xl border border-[#eadfd7] bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="border-b border-[#eee5df] bg-[#fffaf6] text-[11px] uppercase tracking-[0.12em] text-[#a18f84]">
                  <tr>
                    <th className="px-5 py-4">Customer (Who Ordered)</th>
                    <th className="px-5 py-4">Sweet Product</th>
                    <th className="px-5 py-4">Quantity</th>
                    <th className="px-5 py-4">Handover / Delivery Date</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => {
                    const prod = getProduct(order.productId);
                    const rate = order.rate ?? prod?.price ?? 0;
                    const total = order.qty * rate;
                    const badge = getHandoverBadge(order.deliveryDate);

                    return (
                      <tr key={order.id} className="border-b border-[#f2ece7] last:border-0 hover:bg-[#fffaf6] transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#fff0e6] text-xs font-bold text-[#c65016]">
                              {order.customer.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-[#312d2a]">{order.customer}</p>
                              <div className="flex items-center gap-1.5 text-xs text-[#a59a92]">
                                <span className="font-mono">{order.id}</span>
                                {order.notes && (
                                  <>
                                    <span>·</span>
                                    <span className="italic text-[#766e68] max-w-[180px] truncate" title={order.notes}>
                                      "{order.notes}"
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-[#312d2a]">{prod?.name ?? "—"}</p>
                          <p className="text-xs text-[#a59a92]">{money(rate)} / {prod?.unit ?? "kg"}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-serif text-base font-semibold text-[#e85d04]">{order.qty}</span>
                          <span className="ml-1 text-xs text-[#766e68]">{prod?.unit ?? "kg"}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="size-3.5 text-[#e85d04]" />
                              <span className="font-semibold text-sm text-[#312d2a]">{dateLabel(order.deliveryDate)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {badge && (
                                <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${badge.style}`}>
                                  {badge.label}
                                </span>
                              )}
                              <span className="text-[11px] text-[#a59a92]">Placed: {dateLabel(order.date)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-serif font-semibold text-[#312d2a]">{money(total)}</td>
                        <td className="px-5 py-4">
                          <StatusDropdown value={order.status} onChange={(v) => onStatusChange(order.id, v)} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onGenerate(order)}
                              className="border-[#f1d6c5] text-[#c65016] hover:bg-[#fff0e6]"
                            >
                              <FileText className="size-3.5" data-icon="inline-start" /> Bill
                            </Button>
                            <button
                              onClick={() => setEditOrder(order)}
                              className="rounded-lg border border-[#eadfd7] p-2 text-[#766e68] hover:bg-[#fff0e6] hover:text-[#e85d04] hover:border-[#e85d04] transition-colors"
                              title="Edit order"
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteId(order.id)}
                              className="rounded-lg border border-[#eadfd7] p-2 text-[#766e68] hover:bg-[#fbe9e7] hover:text-[#b33a2b] hover:border-[#b33a2b] transition-colors"
                              title="Delete order"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {(showModal || editOrder) && (
        <OrderModal
          initial={editOrder ?? undefined}
          products={products}
          onSave={(data) => {
            if (editOrder) { onEdit(editOrder.id, data); setEditOrder(null); }
            else { onAdd(data); setShowModal(false); }
          }}
          onClose={() => { setShowModal(false); setEditOrder(null); }}
        />
      )}
      {deleteId !== null && (
        <ConfirmDialog
          title="Delete order?"
          message={`Order ${deleteId} will be permanently removed.`}
          onConfirm={() => { onDelete(deleteId); setDeleteId(null); }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  );
}

// --- Dashboard ---
function Dashboard({ orders, products, setActive, onViewProductOrders }: {
  orders: Order[]; products: Product[]; setActive: (v: string) => void;
  onViewProductOrders: (productId: number) => void;
}) {
  const [expandCustomers, setExpandCustomers] = useState(false);
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);

  const activeOrders = orders.filter((o) => !["Completed", "Cancelled"].includes(o.status));

  const totalKg = activeOrders.reduce((sum, o) => sum + o.qty, 0);
  const activeProductCount = products.filter((p) => p.active).length;

  // Per-product breakdown with full order list
  const productBreakdown = products.map((p) => {
    const orderList = activeOrders
      .filter((o) => o.productId === p.id)
      .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate));
    const kg = orderList.reduce((sum, o) => sum + o.qty, 0);
    return { product: p, kg, count: orderList.length, orders: orderList };
  }).filter((b) => b.count > 0);

  // Status summary
  const statusCounts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  // Unique customers with pending/active orders
  const customerMap = new Map<string, { orders: number; kg: number }>();
  activeOrders.forEach((o) => {
    const existing = customerMap.get(o.customer) ?? { orders: 0, kg: 0 };
    customerMap.set(o.customer, { orders: existing.orders + 1, kg: existing.kg + o.qty });
  });
  const customers = Array.from(customerMap.entries());

  return (
    <>
      <PageHeader title="Dashboard" onMenu={() => {}} />
      <div className="mx-auto max-w-[1250px] px-5 py-9 sm:px-8 lg:px-10">
        <div className="flex items-center gap-2 text-sm font-medium text-[#e85d04]">
          <Factory className="size-4" /> Production overview
        </div>
        <h2 className="mt-2 font-serif text-[36px] font-semibold">Today&apos;s sweet list</h2>
        <p className="mt-1 text-sm text-[#968d86]">Keep every order moving smoothly.</p>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total kg (active orders)", value: totalKg.toFixed(2), suffix: "kg" },
            { label: "Active products", value: activeProductCount.toString(), suffix: "items" },
            { label: "Active orders", value: activeOrders.length.toString(), suffix: "orders" },
          ].map(({ label, value, suffix }) => (
            <div key={label} className="rounded-2xl border border-[#eadfd7] bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#a18e82]">{label}</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="font-serif text-3xl font-semibold">{value}</span>
                <span className="mb-1.5 text-sm text-[#a18f85]">{suffix}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Product breakdown — clickable to show order details */}
        {productBreakdown.length > 0 && (
          <div className="mt-8">
            <h3 className="font-serif text-xl font-semibold">Production breakdown</h3>
            <p className="mt-1 text-sm text-[#9c938c]">Click a product to see who ordered and delivery schedule.</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-[#eadfd7] bg-white">
              {productBreakdown.map(({ product, kg, count, orders: productOrders }) => {
                const isExpanded = expandedProductId === product.id;
                return (
                  <div key={product.id} className="border-b border-[#f2ece7] last:border-0">
                    {/* Clickable product row */}
                    <button
                      onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                      className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-[#fffaf6] ${isExpanded ? "bg-[#fffaf6]" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#fff0e6] text-xs font-bold text-[#c65016]">
                          {product.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-xs text-[#a59a92]">{count} order{count !== 1 ? "s" : ""} · Click to view details</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-serif text-xl font-semibold">{kg.toFixed(2)}</p>
                          <p className="text-xs text-[#a59a92]">{product.unit}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewProductOrders(product.id);
                          }}
                          className="rounded-lg border border-[#eadfd7] bg-white px-2.5 py-1 text-xs font-semibold text-[#e85d04] hover:bg-[#fff0e6] hover:border-[#e85d04] transition-colors shadow-xs"
                          title="View customer orders and handover dates"
                        >
                          Orders →
                        </button>
                        <ChevronRight className={`size-4 text-[#a18f84] transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      </div>
                    </button>

                    {/* Expanded order details */}
                    {isExpanded && (
                      <div className="border-t border-[#f2ece7] bg-[#fefbf8]">
                        {/* Column header */}
                        <div className="grid grid-cols-[1fr_80px_130px_110px] gap-2 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a18f84] border-b border-[#f2ece7]">
                          <span>Customer (Who Ordered)</span>
                          <span className="text-right">Qty</span>
                          <span className="text-right">Handover Date</span>
                          <span className="text-right">Status</span>
                        </div>
                        {/* Order rows */}
                        {productOrders.map((o) => {
                          const badge = getHandoverBadge(o.deliveryDate);
                          return (
                            <div
                              key={o.id}
                              className="grid grid-cols-[1fr_80px_130px_110px] gap-2 items-center px-5 py-3 border-b border-[#f5f0ec] last:border-0 hover:bg-[#fff7f1] transition-colors"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#fff0e6] text-[10px] font-bold text-[#c65016]">
                                  {o.customer.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold truncate text-[#312d2a]">{o.customer}</p>
                                  <p className="text-[11px] text-[#a59a92]">{o.id}{o.notes ? ` · "${o.notes}"` : ""}</p>
                                </div>
                              </div>
                              <p className="text-sm font-semibold text-right text-[#e85d04]">{o.qty} {product.unit}</p>
                              <div className="text-right">
                                <div className="inline-flex items-center gap-1 text-sm justify-end">
                                  <Calendar className="size-3 text-[#e85d04]" />
                                  <span className="font-semibold text-[#312d2a]">{dateLabel(o.deliveryDate)}</span>
                                </div>
                                {badge && (
                                  <div className="mt-0.5">
                                    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.2 text-[9px] font-bold ${badge.style}`}>
                                      {badge.label}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <Badge status={o.status} />
                              </div>
                            </div>
                          );
                        })}
                        {/* Footer with View in Orders action */}
                        <div className="flex items-center justify-between border-t border-[#eadfd7] bg-[#fffaf6] px-5 py-3">
                          <p className="text-xs text-[#968d86]">
                            Total: <strong className="text-[#312d2a]">{kg.toFixed(2)} {product.unit}</strong> across {count} order{count !== 1 ? "s" : ""}
                          </p>
                          <button
                            onClick={(e) => { e.stopPropagation(); onViewProductOrders(product.id); }}
                            className="flex items-center gap-1.5 rounded-lg bg-[#e85d04] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#c94f05] transition-colors"
                          >
                            View all in Orders <ArrowRight className="size-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status summary */}
        <div className="mt-8">
          <h3 className="font-serif text-xl font-semibold">Order status summary</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {STATUS_OPTIONS.filter((s) => statusCounts[s] > 0).map((s) => {
              const style = STATUS_STYLES[s];
              return (
                <div key={s} className={`flex items-center justify-between rounded-xl px-4 py-3 ${style.bg}`}>
                  <span className={`text-sm font-semibold ${style.text}`}>{s}</span>
                  <span className={`font-serif text-xl font-semibold ${style.text}`}>{statusCounts[s]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Customer list */}
        {customers.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setExpandCustomers(!expandCustomers)}
              className="flex w-full items-center justify-between"
            >
              <div>
                <h3 className="font-serif text-xl font-semibold">Active customers</h3>
                <p className="mt-1 text-sm text-[#9c938c]">{customers.length} customer{customers.length !== 1 ? "s" : ""} with active orders</p>
              </div>
              <ChevronRight className={`size-5 text-[#a18f84] transition-transform ${expandCustomers ? "rotate-90" : ""}`} />
            </button>
            {expandCustomers && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-[#eadfd7] bg-white">
                {customers.map(([name, { orders: cnt, kg }]) => (
                  <div key={name} className="flex items-center justify-between border-b border-[#f2ece7] px-5 py-4 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#fff0e6] text-xs font-bold text-[#c65016]">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{name}</p>
                        <p className="text-xs text-[#a59a92]">{cnt} order{cnt !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <p className="font-serif font-semibold">{kg.toFixed(2)} kg</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick actions */}
        <div className="mt-10 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl font-semibold">Quick actions</h3>
            <p className="mt-1 text-sm text-[#9c938c]">Jump into the work that needs attention.</p>
          </div>
          <button onClick={() => setActive("Orders")} className="text-xs font-semibold text-[#e85d04]">
            View all orders →
          </button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <button
            onClick={() => setActive("Orders")}
            className="group rounded-2xl border border-[#eadfd7] bg-white p-5 text-left hover:border-[#e85d04] transition-colors"
          >
            <ClipboardList className="size-5 text-[#e85d04]" />
            <p className="mt-4 font-semibold">Manage orders</p>
            <p className="mt-1 text-sm text-[#968d86]">Review customer requests, update status, and generate bills.</p>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#e85d04] opacity-0 group-hover:opacity-100 transition-opacity">
              Open Orders <ChevronRight className="size-3" />
            </div>
          </button>
          <button
            onClick={() => setActive("Products")}
            className="group rounded-2xl border border-[#eadfd7] bg-white p-5 text-left hover:border-[#e85d04] transition-colors"
          >
            <Package className="size-5 text-[#e85d04]" />
            <p className="mt-4 font-semibold">Manage products</p>
            <p className="mt-1 text-sm text-[#968d86]">Add, edit, and manage your sweet catalog and pricing.</p>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#e85d04] opacity-0 group-hover:opacity-100 transition-opacity">
              Open Products <ChevronRight className="size-3" />
            </div>
          </button>
        </div>
      </div>
    </>
  );
}

// --- Root ---
export default function Home() {
  const [active, setActive] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(PRODUCTS_SEED);
  const [orders, setOrders] = useState<Order[]>(ORDERS_SEED);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [nextProductId, setNextProductId] = useState(4);
  const [initialProductFilter, setInitialProductFilter] = useState<number | null>(null);

  // Navigate to Orders filtered by a specific product (from Dashboard)
  const viewProductOrders = (productId: number) => {
    setInitialProductFilter(productId);
    setActive("Orders");
  };

  // Product CRUD
  const addProduct = (data: ProductFormData) => {
    setProducts((prev) => [
      ...prev,
      { id: nextProductId, name: data.name, unit: data.unit, price: Number(data.price), active: data.active },
    ]);
    setNextProductId((n) => n + 1);
  };
  const editProduct = (id: number, data: ProductFormData) => {
    setProducts((prev) =>
      prev.map((p) => p.id === id ? { ...p, name: data.name, unit: data.unit, price: Number(data.price), active: data.active } : p)
    );
  };
  const deleteProduct = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Order CRUD
  const addOrder = (data: OrderFormData) => {
    const newOrder: Order = {
      id: genOrderId(),
      date: getTodayStr(),
      deliveryDate: data.deliveryDate,
      customer: data.customer,
      productId: Number(data.productId),
      qty: Number(data.qty),
      rate: data.rate ? Number(data.rate) : undefined,
      status: "Pending",
      notes: data.notes || undefined,
    };
    setOrders((prev) => [newOrder, ...prev]);
  };
  const editOrder = (id: string, data: OrderFormData) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              customer: data.customer,
              productId: Number(data.productId),
              qty: Number(data.qty),
              rate: data.rate ? Number(data.rate) : undefined,
              deliveryDate: data.deliveryDate,
              notes: data.notes || undefined,
            }
          : o
      )
    );
  };
  const deleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };
  const updateStatus = (id: string, status: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const generateInvoice = (order: Order) => setInvoiceOrder(order);

  const invoiceProduct = invoiceOrder ? (products.find((p) => p.id === invoiceOrder.productId) ?? products[0]) : null;
  const invoiceRate = invoiceOrder ? (invoiceOrder.rate ?? invoiceProduct?.price ?? 0) : 0;

  return (
    <div className="min-h-screen bg-[#fffaf6] text-[#312d2a]">
      <Sidebar
        active={active}
        setActive={setActive}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        orderCount={orders.filter((o) => !["Completed", "Cancelled"].includes(o.status)).length}
      />
      <main className="min-h-screen lg:ml-[258px]">
        {active === "Dashboard" && (
          <Dashboard orders={orders} products={products} setActive={setActive} onViewProductOrders={viewProductOrders} />
        )}
        {active === "Orders" && (
          <OrdersPage
            orders={orders}
            products={products}
            onAdd={addOrder}
            onEdit={editOrder}
            onDelete={deleteOrder}
            onStatusChange={updateStatus}
            onGenerate={generateInvoice}
            initialProductFilter={initialProductFilter}
            onClearProductFilter={() => setInitialProductFilter(null)}
          />
        )}
        {active === "Products" && (
          <ProductsPage
            products={products}
            orders={orders}
            onAdd={addProduct}
            onEdit={editProduct}
            onDelete={deleteProduct}
            onViewProductOrders={viewProductOrders}
          />
        )}
      </main>
      {invoiceOrder && invoiceProduct && (
        <Invoice
          order={invoiceOrder}
          product={invoiceProduct}
          rate={invoiceRate}
          onClose={() => setInvoiceOrder(null)}
        />
      )}
    </div>
  );
}
