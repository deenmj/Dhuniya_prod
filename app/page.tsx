"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
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

const STATUS_STYLES: Record<Status, { bg: string; text: string; dot: string; border: string }> = {
  Pending: { bg: "bg-slate-100", text: "text-slate-700", dot: "bg-slate-400", border: "border-slate-200" },
  Confirmed: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-600", border: "border-blue-200" },
  "In Production": { bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-500", border: "border-amber-200" },
  "Ready to Bill": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-600", border: "border-emerald-200" },
  Completed: { bg: "bg-teal-50", text: "text-teal-800", dot: "bg-teal-600", border: "border-teal-200" },
  Cancelled: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500", border: "border-rose-200" },
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
  { id: "ORD-1044", date: "2026-10-30", deliveryDate: "2026-10-30", customer: "Priya Events", productId: 2, qty: 5, status: "Ready to Bill", notes: "Gift packaging" },
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
    return { label: "Handover Today", style: "bg-rose-50 text-rose-700 border-rose-200" };
  }
  try {
    const todayDate = new Date(today);
    const delDate = new Date(deliveryDateStr);
    const diffTime = delDate.getTime() - todayDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

    if (diffDays === 1) {
      return { label: "Tomorrow", style: "bg-amber-50 text-amber-700 border-amber-200" };
    } else if (diffDays < 0) {
      return { label: `${Math.abs(diffDays)}d Overdue`, style: "bg-red-50 text-red-700 border-red-200 font-bold" };
    } else if (diffDays <= 3) {
      return { label: `In ${diffDays} days`, style: "bg-blue-50 text-blue-700 border-blue-200" };
    }
  } catch {}
  return null;
};

// --- Shared UI ---
function Badge({ status }: { status: string }) {
  const s = STATUS_STYLES[status as Status] ?? STATUS_STYLES.Pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${s.bg} ${s.text} ${s.border}`}>
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
        className={`appearance-none cursor-pointer rounded-full pl-3 pr-7 py-1 text-[11px] font-semibold border outline-none focus:ring-2 focus:ring-amber-500/30 transition-all ${s.bg} ${s.text} ${s.border}`}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown className={`pointer-events-none absolute right-2 size-3 ${s.text}`} />
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
    <header className="flex min-h-[72px] items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-5 sm:px-8 lg:px-10 sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-3">
        <button
          className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden transition-colors"
          onClick={onMenu}
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{headerDate}</p>
          <h1 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">{title}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">Dhuniya Production Live</span>
        </div>
        <button
          className="relative flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="size-[17px]" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-amber-500 ring-2 ring-white" />
        </button>
        {action}
      </div>
    </header>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex size-12 items-center justify-center rounded-full bg-rose-50 border border-rose-100 mx-auto">
          <Trash2 className="size-5 text-rose-600" />
        </div>
        <h3 className="mt-4 text-center text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-1.5 text-center text-sm text-slate-500">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 transition-colors shadow-xs"
          >
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
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-800 bg-[#0f172a] text-slate-200 px-5 py-6 transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-1">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-500/20">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="text-[19px] font-bold tracking-tight text-white leading-tight">Dhuniya Products</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-400">Eastern Traditional Sweets</p>
          </div>
        </div>

        {/* Section title */}
        <p className="mt-9 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Workspace</p>

        {/* Navigation */}
        <nav className="mt-3 flex flex-col gap-1.5">
          {items.map(({ label, Icon }) => {
            const isActive = active === label;
            return (
              <button
                key={label}
                onClick={() => { setActive(label); setOpen(false); }}
                className={`flex h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/70"
                }`}
              >
                <Icon className={`size-[18px] ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{label}</span>
                {label === "Orders" && (
                  <span
                    className={`ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      isActive
                        ? "bg-amber-700 text-white"
                        : "bg-slate-800 text-amber-300 border border-slate-700"
                    }`}
                  >
                    {orderCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom card */}
        <div className="mt-auto rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
          <div className="flex items-center gap-2 text-amber-400">
            <Factory className="size-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Dhuniya Products</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Eastern Traditional Sweets · KDS/1597
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            138, France City, Maruthamunai
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-xs flex items-center justify-center">
      <div className="my-5 w-full max-w-[760px] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-5 bg-slate-50 flex items-center justify-between print:hidden">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Official Bill</p>
            <h2 className="text-lg font-bold text-slate-900">Invoice for {order.id}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.print()} className="border-slate-300 text-slate-700">
              <Printer className="size-4" /> Print Bill
            </Button>
            <Button onClick={() => window.print()} className="bg-amber-600 text-white hover:bg-amber-700">
              <Download className="size-4" /> Download PDF
            </Button>
            <button onClick={onClose} className="ml-1 rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700" aria-label="Close invoice">
              <X className="size-4" />
            </button>
          </div>
        </div>
        <article className="p-8 sm:p-12">
          {/* Header */}
          <div className="flex flex-col justify-between gap-6 border-b border-slate-200 pb-8 sm:flex-row">
            <div>
              <div className="flex items-center gap-2 text-amber-600">
                <Sparkles className="size-6" />
                <span className="text-2xl font-bold tracking-tight text-slate-900">Dhuniya Products</span>
              </div>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-amber-700">Eastern Traditional Sweets</p>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Registration: KDS/1597 · Mobile: 0756656135<br />
                138, France City, Maruthamunai
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-block rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-amber-800">
                Customer Invoice
              </span>
              <p className="mt-2 text-2xl font-mono font-bold text-slate-900">{order.id}</p>
              <p className="mt-1 text-xs text-slate-500">Date: {dateLabel(order.date)}</p>
            </div>
          </div>

          {/* Details */}
          <div className="grid gap-6 border-b border-slate-200 py-8 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Billed To</p>
              <p className="mt-1.5 text-lg font-bold text-slate-900">{order.customer}</p>
              <p className="mt-1 text-sm text-slate-600">Order ID: {order.id}</p>
              {order.notes && <p className="mt-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 inline-block">Note: {order.notes}</p>}
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Handover Schedule</p>
              <p className="mt-1.5 text-lg font-bold text-slate-900">{dateLabel(order.deliveryDate)}</p>
              <p className="mt-1 text-sm text-slate-500">Order Status: <span className="font-semibold text-slate-800">{order.status}</span></p>
              <p className="mt-1 text-xs text-slate-400">Payment Due on Receipt</p>
            </div>
          </div>

          {/* Table */}
          <table className="mt-8 w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="pb-3">Sweet Product</th>
                <th className="pb-3 text-right">Quantity ({product.unit})</th>
                <th className="pb-3 text-right">Rate per {product.unit}</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-4 font-semibold text-slate-900">{product.name}</td>
                <td className="py-4 text-right font-medium text-slate-700">{order.qty} {product.unit}</td>
                <td className="py-4 text-right text-slate-700">{money(rate)}</td>
                <td className="py-4 text-right font-bold text-slate-900">{money(total)}</td>
              </tr>
            </tbody>
          </table>

          {/* Total */}
          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-[260px] border-t-2 border-slate-900 pt-4">
              <div className="flex items-center justify-between text-base font-bold text-slate-900">
                <span>Grand Total:</span>
                <span className="text-2xl text-amber-600">{money(total)}</span>
              </div>
            </div>
          </div>

          <p className="mt-12 border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
            Thank you for choosing Dhuniya Products. We take pride in authentic eastern sweets.
          </p>
        </article>
      </div>
    </div>
  );
}

// --- Product Modal ---
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 bg-slate-50 rounded-t-2xl">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">{initial ? "Edit" : "New"} Sweet</p>
            <h3 className="mt-0.5 text-lg font-bold text-slate-900">{initial ? "Update Sweet Details" : "Add Sweet to Catalog"}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-200"><X className="size-4" /></button>
        </div>
        <div className="space-y-4 px-6 py-6">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">Sweet Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Motichoor Ladoo"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 transition-all ${
                errors.name ? "border-rose-400 bg-rose-50/30" : "border-slate-300"
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">Unit of Measurement</label>
            <select
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20"
            >
              <option value="kg">kg (Kilogram)</option>
              <option value="g">g (Gram)</option>
              <option value="pcs">pcs (Pieces)</option>
              <option value="box">box (Standard Box)</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">Selling Price (₹ per {form.unit}) *</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="480"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 transition-all ${
                errors.price ? "border-rose-400 bg-rose-50/30" : "border-slate-300"
              }`}
            />
            {errors.price && <p className="mt-1 text-xs text-rose-600">{errors.price}</p>}
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <p className="text-sm font-bold text-slate-800">Active Status</p>
              <p className="text-xs text-slate-500">Enable this sweet in new order dropdowns</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, active: !form.active })}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.active ? "bg-amber-600" : "bg-slate-300"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.active ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>
        <div className="flex gap-3 border-t border-slate-200 px-6 py-4 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white">Cancel</button>
          <button onClick={submit} className="flex-1 rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 shadow-xs">
            {initial ? "Update Sweet" : "Add Sweet"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Products Page ---
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
            className="bg-amber-600 text-white hover:bg-amber-700 gap-1.5 shadow-sm"
          >
            <Plus className="size-4" /> New Sweet Product
          </Button>
        }
      />
      <div className="mx-auto max-w-[1250px] px-5 py-8 sm:px-8 lg:px-10">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Sweet Catalog</span>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Products & Production Demand</h2>
          <p className="mt-1 text-sm text-slate-500">Manage sweet catalog, standard rates, and live customer orders in production.</p>
        </div>

        {products.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
            <PackagePlus className="size-12 text-amber-600" />
            <p className="mt-4 text-lg font-bold text-slate-800">No sweet products in catalog</p>
            <p className="mt-1 text-sm text-slate-500">Add your first sweet to start taking orders.</p>
            <button onClick={() => setShowModal(true)} className="mt-5 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 shadow-sm">
              Add Sweet Product
            </button>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Sweet Product</th>
                    <th className="px-6 py-4">Unit</th>
                    <th className="px-6 py-4">Standard Rate</th>
                    <th className="px-6 py-4">Active Production Demand</th>
                    <th className="px-6 py-4">Catalog Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => {
                    const activeOrders = orders.filter(
                      (o) => o.productId === p.id && !["Completed", "Cancelled"].includes(o.status)
                    );
                    const totalOrderedKg = activeOrders.reduce((sum, o) => sum + o.qty, 0);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold text-xs">
                              {p.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                            </div>
                            <span className="font-bold text-slate-900">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600">{p.unit}</td>
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {money(p.price)}
                          <span className="ml-1 text-xs font-normal text-slate-400">/ {p.unit}</span>
                        </td>
                        <td className="px-6 py-4">
                          {activeOrders.length > 0 ? (
                            <div>
                              <p className="font-bold text-slate-900">
                                {totalOrderedKg.toFixed(2)} {p.unit}
                              </p>
                              <button
                                onClick={() => onViewProductOrders(p.id)}
                                className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 hover:underline"
                              >
                                {activeOrders.length} order{activeOrders.length !== 1 ? "s" : ""} · See who ordered & handover →
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">No active orders</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
                            p.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}>
                            <span className={`size-1.5 rounded-full ${p.active ? "bg-emerald-500" : "bg-slate-400"}`} />
                            {p.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditProduct(p)}
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                              title="Edit sweet"
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteId(p.id)}
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                              title="Delete sweet"
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
          title="Delete Sweet Product?"
          message="This product will be removed from your catalog. Previous orders will remain intact."
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
    deliveryDate: initial?.deliveryDate ?? getTodayStr(),
    rate: initial?.rate?.toString() ?? "",
    notes: initial?.notes ?? "",
  });
  const [errors, setErrors] = useState<Partial<OrderFormData>>({});

  const validate = () => {
    const e: Partial<OrderFormData> = {};
    if (!form.customer.trim()) e.customer = "Customer name is required";
    if (!form.productId) e.productId = "Please select a sweet product";
    if (!form.qty || isNaN(Number(form.qty)) || Number(form.qty) <= 0) e.qty = "Valid quantity is required";
    if (!form.deliveryDate) e.deliveryDate = "Delivery / handover date required";
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
  };

  const selectedProduct = products.find((p) => p.id === Number(form.productId));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 backdrop-blur-xs p-4 flex items-center justify-center">
      <div className="my-6 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 bg-slate-50">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">{initial ? "Edit" : "New"} Order</p>
            <h3 className="mt-0.5 text-lg font-bold text-slate-900">{initial ? "Update Customer Order" : "Place New Customer Order"}</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-200"><X className="size-4" /></button>
        </div>
        <div className="space-y-4 px-6 py-6">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">Customer Name *</label>
            <input
              value={form.customer}
              onChange={(e) => setForm({ ...form, customer: e.target.value })}
              placeholder="e.g. Sharma Sweets, Grand Banquets"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 transition-all ${
                errors.customer ? "border-rose-400 bg-rose-50/30" : "border-slate-300"
              }`}
            />
            {errors.customer && <p className="mt-1 text-xs text-rose-600">{errors.customer}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">Sweet Product *</label>
              <select
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20"
              >
                {activeProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({money(p.price)}/{p.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Quantity ({selectedProduct?.unit ?? "kg"}) *
              </label>
              <input
                type="number"
                step="0.25"
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: e.target.value })}
                placeholder="e.g. 10"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 transition-all ${
                  errors.qty ? "border-rose-400 bg-rose-50/30" : "border-slate-300"
                }`}
              />
              {errors.qty && <p className="mt-1 text-xs text-rose-600">{errors.qty}</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">Handover / Delivery Date *</label>
              <input
                type="date"
                value={form.deliveryDate}
                onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 transition-all ${
                  errors.deliveryDate ? "border-rose-400 bg-rose-50/30" : "border-slate-300"
                }`}
              />
              {errors.deliveryDate && <p className="mt-1 text-xs text-rose-600">{errors.deliveryDate}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">Custom Rate (optional)</label>
              <input
                type="number"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: e.target.value })}
                placeholder={`Default: ₹${selectedProduct?.price ?? 0}`}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">Special Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Extra saffron, wedding gift boxes, morning handover…"
              rows={2}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 resize-none"
            />
          </div>
          {form.productId && form.qty && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Estimated Total Amount</p>
                <p className="text-xs text-amber-700">Based on {form.qty} {selectedProduct?.unit ?? "kg"}</p>
              </div>
              <p className="text-2xl font-bold text-amber-900">
                {money((Number(form.rate) || selectedProduct?.price || 0) * Number(form.qty))}
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-3 border-t border-slate-200 px-6 py-4 bg-slate-50">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white">Cancel</button>
          <button onClick={submit} className="flex-1 rounded-xl bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 shadow-xs">
            {initial ? "Update Order" : "Place Order"}
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
          <Button onClick={() => setShowModal(true)} className="bg-amber-600 text-white hover:bg-amber-700 gap-1.5 shadow-sm">
            <Plus className="size-4" /> New Order
          </Button>
        }
      />
      <div className="mx-auto max-w-[1250px] px-5 py-8 sm:px-8 lg:px-10">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Order Management</span>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Customer Orders & Dispatch</h2>
          <p className="mt-1 text-sm text-slate-500">Track who placed each order, handover deadlines, and status.</p>
        </div>

        {/* Highlighted Banner when filtered by Product */}
        {activeFilteredProduct && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-amber-500 bg-gradient-to-r from-amber-50 via-amber-50/60 to-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-amber-600 text-white shadow-md shadow-amber-600/20">
                <Package className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Filtered by Sweet Product</span>
                  <span className="rounded-full bg-amber-200/70 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                    {filtered.length} customer order{filtered.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{activeFilteredProduct.name}</h3>
                <p className="mt-0.5 text-xs text-slate-600">
                  Showing everyone who ordered {activeFilteredProduct.name} and when you need to hand over.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-right">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Demand to Produce</p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-600">
                  {totalFilteredKg.toFixed(2)} <span className="text-sm font-normal text-slate-600">{activeFilteredProduct.unit}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setFilterProductId("All");
                  onClearProductFilter?.();
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
              >
                <X className="size-3.5" /> Show All Sweets
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <label className="flex flex-1 min-w-[200px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-3">
            <Search className="size-4 shrink-0 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customer, order ID, notes…"
              className="w-full bg-transparent py-2 text-sm text-slate-900 outline-none"
            />
          </label>
          <select
            value={filterProductId}
            onChange={(e) => {
              setFilterProductId(e.target.value);
              if (e.target.value === "All") onClearProductFilter?.();
            }}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-amber-600"
          >
            <option value="All">All Sweet Products ({products.length})</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 outline-none focus:border-amber-600"
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-amber-600"
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
              className="rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              Clear filters
            </button>
          )}
          <span className="ml-auto text-xs font-bold text-slate-400">
            {filtered.length} order{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Orders Table */}
        {filtered.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-20 text-center">
            <ClipboardList className="size-12 text-amber-600" />
            <p className="mt-4 text-lg font-bold text-slate-800">No orders match criteria</p>
            <p className="mt-1 text-sm text-slate-500">
              {orders.length === 0 ? "Create your first order to get started." : "Try adjusting your search query or filters."}
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Customer (Who Ordered)</th>
                    <th className="px-6 py-4">Sweet Product</th>
                    <th className="px-6 py-4">Quantity</th>
                    <th className="px-6 py-4">Handover Schedule</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((order) => {
                    const prod = getProduct(order.productId);
                    const rate = order.rate ?? prod?.price ?? 0;
                    const total = order.qty * rate;
                    const badge = getHandoverBadge(order.deliveryDate);

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                              {order.customer.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{order.customer}</p>
                              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <span className="font-mono text-slate-500">{order.id}</span>
                                {order.notes && (
                                  <>
                                    <span>·</span>
                                    <span className="italic text-slate-600 max-w-[200px] truncate" title={order.notes}>
                                      "{order.notes}"
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{prod?.name ?? "—"}</p>
                          <p className="text-xs text-slate-400">{money(rate)} / {prod?.unit ?? "kg"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-base font-bold text-amber-600">{order.qty}</span>
                          <span className="ml-1 text-xs text-slate-500">{prod?.unit ?? "kg"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="size-3.5 text-amber-600" />
                              <span className="font-bold text-sm text-slate-900">{dateLabel(order.deliveryDate)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {badge && (
                                <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${badge.style}`}>
                                  {badge.label}
                                </span>
                              )}
                              <span className="text-[11px] text-slate-400">Placed: {dateLabel(order.date)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">{money(total)}</td>
                        <td className="px-6 py-4">
                          <StatusDropdown value={order.status} onChange={(v) => onStatusChange(order.id, v)} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onGenerate(order)}
                              className="border-amber-200 bg-amber-50/70 text-amber-800 hover:bg-amber-100 font-semibold"
                            >
                              <FileText className="size-3.5" data-icon="inline-start" /> Bill
                            </Button>
                            <button
                              onClick={() => setEditOrder(order)}
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                              title="Edit order"
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteId(order.id)}
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
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
          title="Delete Customer Order?"
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
      <div className="mx-auto max-w-[1250px] px-5 py-8 sm:px-8 lg:px-10">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600">
            <Factory className="size-4" /> Production Desk
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Today&apos;s Sweet Production & Orders</h2>
          <p className="mt-1 text-sm text-slate-500">Monitor daily production output, customer orders, and upcoming handovers.</p>
        </div>

        {/* Executive Stats Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 border-l-4 border-l-amber-500 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Production Demand</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{totalKg.toFixed(2)}</span>
              <span className="text-sm font-semibold text-slate-500">kg active</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">Across {activeOrders.length} customer orders in pipeline</p>
          </div>

          <div className="rounded-2xl border border-slate-200 border-l-4 border-l-blue-500 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Sweet Products</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{activeProductCount}</span>
              <span className="text-sm font-semibold text-slate-500">catalog items</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">{productBreakdown.length} sweets currently ordered</p>
          </div>

          <div className="rounded-2xl border border-slate-200 border-l-4 border-l-emerald-500 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Orders in Kitchen</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{activeOrders.length}</span>
              <span className="text-sm font-semibold text-slate-500">orders</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">{customers.length} unique customers waiting for sweets</p>
          </div>
        </div>

        {/* Product breakdown — Clickable drill-down */}
        {productBreakdown.length > 0 && (
          <div className="mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">Production Breakdown by Sweet</h3>
                <p className="text-sm text-slate-500">Click any sweet to see who ordered it and exact delivery deadlines.</p>
              </div>
              <span className="text-xs font-semibold text-amber-600">Click any sweet row below ↓</span>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {productBreakdown.map(({ product, kg, count, orders: productOrders }) => {
                const isExpanded = expandedProductId === product.id;
                return (
                  <div key={product.id} className="border-b border-slate-100 last:border-0">
                    {/* Clickable sweet row */}
                    <button
                      onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                      className={`flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-slate-50/80 ${
                        isExpanded ? "bg-amber-50/30" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold text-xs">
                          {product.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{product.name}</p>
                          <p className="text-xs text-slate-500">
                            {count} customer order{count !== 1 ? "s" : ""} · {isExpanded ? "Hide breakdown" : "Click to view customers & schedule"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xl font-bold text-slate-900">{kg.toFixed(2)}</p>
                          <p className="text-xs font-medium text-slate-400">{product.unit}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewProductOrders(product.id);
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-amber-600 hover:bg-amber-50 hover:border-amber-300 transition-colors shadow-xs"
                          title="Open filtered Orders"
                        >
                          Orders →
                        </button>
                        <ChevronRight className={`size-4 text-slate-400 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      </div>
                    </button>

                    {/* Expanded order details */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 bg-slate-50/60">
                        {/* Header */}
                        <div className="grid grid-cols-[1fr_80px_130px_110px] gap-2 px-6 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 bg-slate-100/60">
                          <span>Customer (Who Ordered)</span>
                          <span className="text-right">Quantity</span>
                          <span className="text-right">Handover Date</span>
                          <span className="text-right">Status</span>
                        </div>
                        {/* Rows */}
                        <div className="divide-y divide-slate-100">
                          {productOrders.map((o) => {
                            const badge = getHandoverBadge(o.deliveryDate);
                            return (
                              <div
                                key={o.id}
                                className="grid grid-cols-[1fr_80px_130px_110px] gap-2 items-center px-6 py-3 hover:bg-amber-50/40 transition-colors"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-800">
                                    {o.customer.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold truncate text-slate-900">{o.customer}</p>
                                    <p className="text-[11px] text-slate-400 font-mono">{o.id}{o.notes ? ` · "${o.notes}"` : ""}</p>
                                  </div>
                                </div>
                                <p className="text-sm font-bold text-right text-amber-600">{o.qty} {product.unit}</p>
                                <div className="text-right">
                                  <div className="inline-flex items-center gap-1 text-sm justify-end">
                                    <Calendar className="size-3 text-amber-600" />
                                    <span className="font-bold text-slate-800">{dateLabel(o.deliveryDate)}</span>
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
                        </div>
                        {/* Footer with action */}
                        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3">
                          <p className="text-xs text-slate-600">
                            Total for {product.name}: <strong className="text-slate-900 font-bold">{kg.toFixed(2)} {product.unit}</strong> across {count} customer order{count !== 1 ? "s" : ""}
                          </p>
                          <button
                            onClick={(e) => { e.stopPropagation(); onViewProductOrders(product.id); }}
                            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors shadow-xs"
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

        {/* Order Status Summary */}
        <div className="mt-8">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">Order Pipeline Status</h3>
          <div className="mt-3 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {STATUS_OPTIONS.map((s) => {
              const count = statusCounts[s] ?? 0;
              const style = STATUS_STYLES[s];
              return (
                <div key={s} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className={`size-2 rounded-full ${style.dot}`} />
                    <span className="text-xl font-bold text-slate-900">{count}</span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-600 truncate">{s}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Customers */}
        {customers.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setExpandCustomers(!expandCustomers)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:bg-slate-50 transition-colors"
            >
              <div>
                <h3 className="text-base font-bold text-slate-900">Active Customer Orders ({customers.length})</h3>
                <p className="text-xs text-slate-500">View customer list with active sweet requirements</p>
              </div>
              <ChevronRight className={`size-5 text-slate-400 transition-transform ${expandCustomers ? "rotate-90" : ""}`} />
            </button>
            {expandCustomers && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
                {customers.map(([name, { orders: cnt, kg }]) => (
                  <div key={name} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{name}</p>
                        <p className="text-xs text-slate-500">{cnt} order{cnt !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <p className="font-bold text-amber-600">{kg.toFixed(2)} kg</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Quick Navigation</h3>
            <button onClick={() => setActive("Orders")} className="text-xs font-bold text-amber-600 hover:text-amber-700">
              Go to Orders →
            </button>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => setActive("Orders")}
              className="group rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-amber-500 hover:shadow-sm transition-all"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <ClipboardList className="size-5" />
              </div>
              <p className="mt-3 font-bold text-slate-900">Manage Customer Orders</p>
              <p className="mt-1 text-xs text-slate-500">Track delivery deadlines, customer orders, and print bills.</p>
              <div className="mt-3 flex items-center gap-1 text-xs font-bold text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Open Orders Page <ChevronRight className="size-3" />
              </div>
            </button>

            <button
              onClick={() => setActive("Products")}
              className="group rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-amber-500 hover:shadow-sm transition-all"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Package className="size-5" />
              </div>
              <p className="mt-3 font-bold text-slate-900">Manage Sweet Catalog</p>
              <p className="mt-1 text-xs text-slate-500">Update sweets, pricing per kg, and catalog availability.</p>
              <div className="mt-3 flex items-center gap-1 text-xs font-bold text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Open Sweet Products <ChevronRight className="size-3" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// --- Root Component ---
export default function Home() {
  const [active, setActive] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(PRODUCTS_SEED);
  const [orders, setOrders] = useState<Order[]>(ORDERS_SEED);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [nextProductId, setNextProductId] = useState(4);
  const [initialProductFilter, setInitialProductFilter] = useState<number | null>(null);

  // Navigate to Orders filtered by a specific sweet
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
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      <Sidebar
        active={active}
        setActive={setActive}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        orderCount={orders.filter((o) => !["Completed", "Cancelled"].includes(o.status)).length}
      />
      <main className="min-h-screen lg:ml-[260px] pb-16">
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
