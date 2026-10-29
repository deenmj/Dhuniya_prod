"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Factory,
  FileText,
  LayoutDashboard,
  Menu,
  Package,
  Plus,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Product = {
  name: string;
  total: number;
  orders: { customer: string; quantity: number; note?: string }[];
  tone: string;
  icon: string;
};

const initialProducts: Product[] = [
  {
    name: "Motichoor Ladoo",
    total: 18.5,
    tone: "bg-[#fff0e5] text-[#d66b32]",
    icon: "ML",
    orders: [
      { customer: "Sharma Sweets", quantity: 8, note: "Extra saffron" },
      { customer: "Anita Caterers", quantity: 6.5 },
      { customer: "Ramesh Kumar", quantity: 4 },
    ],
  },
  {
    name: "Kaju Katli",
    total: 12,
    tone: "bg-[#fdf0f4] text-[#ce6884]",
    icon: "KK",
    orders: [
      { customer: "The Grand Hotel", quantity: 7 },
      { customer: "Priya Events", quantity: 5, note: "Gift boxes" },
    ],
  },
  {
    name: "Besan Barfi",
    total: 8.75,
    tone: "bg-[#fff7d9] text-[#b28a23]",
    icon: "BB",
    orders: [
      { customer: "Rajasthan Bhoj", quantity: 5.25 },
      { customer: "Neha Gupta", quantity: 3.5 },
    ],
  },
];

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Orders", icon: ClipboardList, count: 12 },
  { label: "Products", icon: Package },
  { label: "Billing", icon: FileText },
];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function Home() {
  const [selectedDate, setSelectedDate] = useState("2024-06-12");
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [expanded, setExpanded] = useState<string | null>("Motichoor Ladoo");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products] = useState(initialProducts);

  const dateLabel = useMemo(() => formatDate(new Date(`${selectedDate}T12:00:00`)), [selectedDate]);
  const totalKg = products.reduce((sum, product) => sum + product.total, 0);
  const totalCustomers = products.reduce((sum, product) => sum + product.orders.length, 0);

  return (
    <div className="min-h-screen bg-[#fbfaf8] text-[#312d2a]">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-[258px] flex-col border-r border-[#eee9e4] bg-white px-5 py-6 transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#ef8051] text-white shadow-sm shadow-[#ef8051]/20"><Sparkles className="size-5" /></div>
            <div><p className="font-serif text-[21px] font-semibold leading-none tracking-tight">Mithaas</p><p className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-[#aaa19a]">Production desk</p></div>
          </div>
          <button className="text-[#a59d96] lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X className="size-5" /></button>
        </div>

        <div className="mt-11 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b8afa8]">Workspace</div>
        <nav className="mt-3 flex flex-col gap-1.5">
          {navItems.map(({ label, icon: Icon, count }) => (
            <button key={label} onClick={() => { setActiveNav(label); setSidebarOpen(false); }} className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${activeNav === label ? "bg-[#fff1eb] text-[#df7040]" : "text-[#766e68] hover:bg-[#faf6f2]"}`}>
              <Icon className="size-[18px]" strokeWidth={1.8} /> <span>{label}</span>{count && <span className="ml-auto rounded-full bg-[#f8e5da] px-2 py-0.5 text-[11px] font-semibold text-[#d9784b]">{count}</span>}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-[#fff7f2] p-4"><div className="flex items-center gap-2 text-[#df7040]"><TrendingUp className="size-4" /><span className="text-xs font-semibold">This week</span></div><p className="mt-2 text-[13px] leading-5 text-[#8c8179]">You&apos;ve planned <strong className="font-semibold text-[#5e554f]">86.4 kg</strong> of production so far.</p></div>
        <button className="mt-5 flex items-center gap-3 px-3 text-sm font-medium text-[#766e68] hover:text-[#df7040]"><Settings className="size-[18px]" strokeWidth={1.8} /> Settings</button>
        <div className="mt-6 flex items-center gap-3 border-t border-[#f0ece9] pt-5"><div className="flex size-9 items-center justify-center rounded-full bg-[#ead6c9] text-xs font-semibold text-[#8a5c47]">AK</div><div className="min-w-0"><p className="truncate text-sm font-medium">Aarav Kapoor</p><p className="truncate text-xs text-[#aaa19a]">Owner</p></div><ChevronDown className="ml-auto size-4 text-[#b4aaa3]" /></div>
      </aside>
      {sidebarOpen && <button className="fixed inset-0 z-20 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close navigation overlay" />}

      <main className="min-h-screen lg:ml-[258px]">
        <header className="flex h-[76px] items-center justify-between border-b border-[#eee9e4] bg-white/80 px-5 backdrop-blur sm:px-8 lg:px-10">
          <div className="flex items-center gap-3"><button className="text-[#766e68] lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu className="size-5" /></button><div><p className="text-xs font-medium text-[#aaa19a]">Wednesday, June 12, 2024</p><h1 className="mt-0.5 font-serif text-xl font-semibold sm:text-[22px]">Good morning, Aarav</h1></div></div>
          <div className="flex items-center gap-2 sm:gap-4">{searchOpen && <div className="hidden items-center gap-2 rounded-lg border border-[#e6dfd9] bg-white px-3 py-2 sm:flex"><Search className="size-4 text-[#b0a8a1]" /><input autoFocus className="w-40 bg-transparent text-sm outline-none" placeholder="Search orders..." /></div>}<button onClick={() => setSearchOpen(!searchOpen)} className="flex size-9 items-center justify-center rounded-full text-[#817872] hover:bg-[#faf5f1]" aria-label="Search"><Search className="size-[18px]" /></button><button className="relative flex size-9 items-center justify-center rounded-full text-[#817872] hover:bg-[#faf5f1]" aria-label="Notifications"><Bell className="size-[18px]" /><span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-[#ef8051]" /></button><Button className="hidden rounded-lg bg-[#e97847] px-3.5 text-xs font-semibold text-white shadow-sm shadow-[#e97847]/20 hover:bg-[#d96839] sm:flex"><Plus data-icon="inline-start" /> New order</Button></div>
        </header>

        <div className="mx-auto max-w-[1250px] px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="flex items-center gap-2 text-sm font-medium text-[#e97847]"><Factory className="size-4" /> Production overview</div><h2 className="mt-2 font-serif text-[31px] font-semibold tracking-tight sm:text-[36px]">Today&apos;s sweet list</h2><p className="mt-1 text-sm text-[#968d86]">Plan your kitchen output and keep every order on track.</p></div><div className="flex items-center gap-2 rounded-xl border border-[#e5ddd7] bg-white px-3 py-2 shadow-sm shadow-black/[0.02]"><span className="text-xs font-medium text-[#aaa19a]">Date</span><input aria-label="Production date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-transparent text-sm font-semibold text-[#554d47] outline-none" /></div></div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-[#f0e8e2] bg-[#fff5ee] p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[0.13em] text-[#bb8060]">Total to produce</span><div className="rounded-lg bg-white/70 p-2 text-[#e97847]"><Factory className="size-4" /></div></div><div className="mt-4 flex items-end gap-2"><span className="font-serif text-3xl font-semibold">{totalKg}</span><span className="mb-1.5 text-sm text-[#ad8b7b]">kg</span></div><p className="mt-1 text-xs text-[#ae8d7d]">Across {products.length} products</p></div><div className="rounded-2xl border border-[#eee4e7] bg-[#fff5f7] p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[0.13em] text-[#be7c8e]">Active products</span><div className="rounded-lg bg-white/70 p-2 text-[#d67691]"><Package className="size-4" /></div></div><div className="mt-4 flex items-end gap-2"><span className="font-serif text-3xl font-semibold">{products.length}</span><span className="mb-1.5 text-sm text-[#b98c98]">items</span></div><p className="mt-1 text-xs text-[#b28f99]">All products are confirmed</p></div><div className="rounded-2xl border border-[#eee9d8] bg-[#fffbed] p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[0.13em] text-[#ae9550]">Customer orders</span><div className="rounded-lg bg-white/70 p-2 text-[#c09b36]"><ClipboardList className="size-4" /></div></div><div className="mt-4 flex items-end gap-2"><span className="font-serif text-3xl font-semibold">{totalCustomers}</span><span className="mb-1.5 text-sm text-[#ad9e75]">orders</span></div><p className="mt-1 text-xs text-[#ad9e75]">Ready for production today</p></div></div>

          <div className="mt-9 flex items-center justify-between"><div><h3 className="font-serif text-xl font-semibold">Product breakdown</h3><p className="mt-1 text-sm text-[#9c938c]">{dateLabel}</p></div><button className="hidden items-center gap-1.5 text-xs font-semibold text-[#e97847] sm:flex">View all orders <ChevronRight className="size-4" /></button></div>
          <div className="mt-4 flex flex-col gap-3">{products.map((product) => { const isExpanded = expanded === product.name; return <div key={product.name} className={`overflow-hidden rounded-2xl border bg-white transition-shadow ${isExpanded ? "border-[#eaded6] shadow-sm shadow-[#cbb9ad]/10" : "border-[#eee9e4]"}`}><button onClick={() => setExpanded(isExpanded ? null : product.name)} className="flex w-full items-center gap-4 p-4 text-left sm:p-5"><div className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${product.tone}`}>{product.icon}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h4 className="truncate text-sm font-semibold text-[#49413c]">{product.name}</h4><span className="rounded-full bg-[#f7f3f0] px-2 py-0.5 text-[10px] font-medium text-[#a49a92]">{product.orders.length} orders</span></div><p className="mt-1 text-xs text-[#a49e98]">{isExpanded ? "Click to collapse details" : "Click to see customer details"}</p></div><div className="mr-2 text-right"><p className="font-serif text-2xl font-semibold text-[#49413c]">{product.total}<span className="ml-1 text-sm font-normal text-[#a49e98]">kg</span></p><p className="text-[10px] font-medium uppercase tracking-wider text-[#b0a59d]">required</p></div><ChevronDown className={`size-4 text-[#b2a8a0] transition-transform ${isExpanded ? "rotate-180" : ""}`} /></button>{isExpanded && <div className="border-t border-[#f3eeeb] bg-[#fdfbf9] px-5 pb-5 pt-3 sm:px-[76px]"><div className="grid grid-cols-[1fr_auto_auto] gap-3 border-b border-[#eee7e2] px-0 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#b2a9a2]"><span>Customer</span><span>Quantity</span><span className="w-5" /></div>{product.orders.map((order) => <div key={order.customer} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-[#f3eeeb] py-3 text-sm last:border-0"><div><p className="font-medium text-[#655c55]">{order.customer}</p>{order.note && <p className="mt-0.5 text-xs text-[#b09b8d]">{order.note}</p>}</div><span className="font-semibold text-[#655c55]">{order.quantity} kg</span><button className="flex size-7 items-center justify-center rounded-md text-[#b8aca3] hover:bg-white hover:text-[#e97847]" aria-label={`Open ${order.customer} order`}><ChevronRight className="size-4" /></button></div>)}<div className="mt-2 flex items-center justify-between border-t border-[#e9e1dc] pt-3"><span className="text-xs font-semibold text-[#887c74]">Product total</span><span className="font-semibold text-[#e97847]">{product.total} kg</span></div></div>}</div>; })}</div>
          <div className="mt-8 flex items-center justify-between rounded-2xl border border-dashed border-[#e6dcd5] bg-[#fffdfb] p-4 sm:p-5"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-lg bg-[#fff0e8] text-[#e97847]"><Plus className="size-4" /></div><div><p className="text-sm font-semibold">Need to add another product?</p><p className="mt-0.5 text-xs text-[#a39a93]">Keep your product list up to date.</p></div></div><Button variant="outline" className="rounded-lg border-[#eaded5] text-xs font-semibold text-[#d66e3f] hover:bg-[#fff6f0]">Manage products</Button></div>
        </div>
      </main>
    </div>
  );
}
