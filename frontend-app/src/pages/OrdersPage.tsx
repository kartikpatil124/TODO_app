import { useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Search, Plus, Eye, Trash2, CheckCircle2, Clock, Package
} from 'lucide-react';
import { useAppStore } from '../store/store';
import OrderEntryPage from './OrderEntryPage';

export default function OrdersPage() {
  const { orders, orderFilter, setOrderFilter, deleteOrder, updateOrder, setSelectedOrderId } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewOrder, setShowNewOrder] = useState(false);

  const filtered = orders.filter(o => {
    if (searchQuery && !o.partyName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (orderFilter !== 'all' && o.status !== orderFilter) return false;
    return true;
  });

  const totalPending = orders.filter(o => o.status === 'pending').reduce((s, o) => s + o.totalAmount, 0);
  const totalCompleted = orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.totalAmount, 0);

  if (showNewOrder) {
    return <OrderEntryPage onBack={() => setShowNewOrder(false)} />;
  }

  return (
    <div className="page-padding max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-amber-400" /> Orders
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{orders.length} total orders</p>
        </div>
        <button onClick={() => setShowNewOrder(true)} className="btn-primary text-sm flex items-center gap-2 justify-center w-full sm:w-auto">
          <Plus className="w-4 h-4" /> New Order
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 md:gap-4 mb-5 md:mb-6">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-500">Total Orders</span>
          </div>
          <p className="text-lg md:text-xl font-bold text-white">{orders.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-500">Pending Value</span>
          </div>
          <p className="text-lg md:text-xl font-bold text-amber-400">₹{totalPending.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-500">Completed Value</span>
          </div>
          <p className="text-lg md:text-xl font-bold text-emerald-400">₹{totalCompleted.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters — responsive */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 mb-5 md:mb-6">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by party name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base pl-10 py-2.5 text-sm"
          />
        </div>
        <div className="flex bg-white/[0.04] rounded-lg border border-white/[0.06] p-0.5 self-start">
          {(['all', 'pending', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setOrderFilter(f)}
              className={`px-3 md:px-4 py-1.5 rounded-md text-xs font-medium transition ${
                orderFilter === f ? 'bg-white/[0.1] text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
              style={{ minHeight: '36px' }}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Order List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((order, i) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ delay: i * 0.03 }}
              className="card-interactive group"
            >
              <div className="flex flex-col gap-3">
                {/* Top row — name, status, amount */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-base font-semibold text-white truncate">{order.partyName}</h3>
                      <span className={order.status === 'pending' ? 'status-pending' : 'status-completed'}>
                        {order.status === 'pending' ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>{format(new Date(order.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-white shrink-0">₹{order.totalAmount.toLocaleString()}</p>
                </div>

                {/* Item Preview */}
                <div className="flex flex-wrap gap-1.5">
                  {order.items.slice(0, 3).map(item => (
                    <span key={item.id} className="tag-chip text-[10px]">
                      {item.product} · ₹{item.total.toLocaleString()}
                    </span>
                  ))}
                  {order.items.length > 3 && (
                    <span className="tag-chip text-[10px]">+{order.items.length - 3} more</span>
                  )}
                </div>

                {/* Actions — always visible on mobile */}
                <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04] md:border-0 md:pt-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedOrderId(order._id); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/[0.06] active:bg-white/[0.06] text-slate-500 hover:text-white transition text-xs"
                    style={{ minHeight: '36px' }}
                  >
                    <Eye className="w-4 h-4" /> View
                  </button>
                  {order.status === 'pending' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); updateOrder(order._id, { status: 'completed' }); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-emerald-500/10 active:bg-emerald-500/10 text-slate-500 hover:text-emerald-400 transition text-xs"
                      style={{ minHeight: '36px' }}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Complete
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteOrder(order._id); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-rose-500/10 active:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition text-xs ml-auto"
                    style={{ minHeight: '36px' }}
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-600">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg mb-1">No orders found</p>
            <p className="text-sm">Create a new order to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
