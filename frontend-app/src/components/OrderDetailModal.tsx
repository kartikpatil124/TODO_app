import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, CheckCircle2, Clock, Printer } from 'lucide-react';
import { useAppStore } from '../store/store';
import { format } from 'date-fns';

export default function OrderDetailModal() {
  const { selectedOrderId, setSelectedOrderId, orders, updateOrder } = useAppStore();
  const order = orders.find(o => o._id === selectedOrderId);
  if (!order) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center md:p-4" onClick={() => setSelectedOrderId(null)}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          className="relative w-full max-w-xl bg-slate-900 border border-white/[0.1] rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-white/[0.06] p-4 md:p-5 flex items-center justify-between z-10">
            <div className="min-w-0 flex-1 mr-3">
              <h2 className="text-lg font-semibold text-white truncate">{order.partyName}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{format(new Date(order.createdAt), 'MMM d, yyyy · h:mm a')}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={order.status === 'pending' ? 'status-pending' : 'status-completed'}>
                {order.status === 'pending' ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                {order.status}
              </span>
              <button onClick={() => setSelectedOrderId(null)} className="p-2 rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-white transition" style={{ minWidth: '36px', minHeight: '36px' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 md:p-5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 block">Items ({order.items.length})</label>

            {/* Desktop Table */}
            <div className="hidden md:block rounded-xl border border-white/[0.06] overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-white/[0.03] text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                <div className="col-span-4">Product</div><div className="col-span-2">Rate</div>
                <div className="col-span-2">{order.items.some(i => i.type === 'per_kg') ? 'Weight' : ''}</div>
                <div className="col-span-2">Qty</div><div className="col-span-2 text-right">Total</div>
              </div>
              {order.items.map((item, i) => (
                <div key={item.id} className={`grid grid-cols-12 gap-2 px-4 py-3 text-sm items-center ${i % 2 === 0 ? 'bg-white/[0.01]' : ''} border-t border-white/[0.04]`}>
                  <div className="col-span-4 flex items-center gap-2"><Package className="w-3.5 h-3.5 text-slate-600 shrink-0" /><span className="text-slate-200 font-medium truncate">{item.product}</span></div>
                  <div className="col-span-2 text-slate-400">₹{item.price}/{item.type === 'per_kg' ? 'kg' : 'pc'}</div>
                  <div className="col-span-2 text-slate-400">{item.type === 'per_kg' ? `${item.weight}kg` : '-'}</div>
                  <div className="col-span-2 text-slate-400">{item.quantity}</div>
                  <div className="col-span-2 text-right font-semibold text-white">₹{item.total.toLocaleString()}</div>
                </div>
              ))}
              <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-indigo-500/[0.05] border-t border-indigo-500/20">
                <div className="col-span-10 text-right text-sm font-bold text-indigo-300">Grand Total</div>
                <div className="col-span-2 text-right text-lg font-bold text-white">₹{order.totalAmount.toLocaleString()}</div>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-sm font-semibold text-white flex-1 truncate">{item.product}</span>
                    <span className="text-sm font-bold text-white shrink-0">₹{item.total.toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><p className="text-slate-600 mb-0.5">Rate</p><p className="text-slate-300">₹{item.price}/{item.type === 'per_kg' ? 'kg' : 'pc'}</p></div>
                    {item.type === 'per_kg' && <div><p className="text-slate-600 mb-0.5">Weight</p><p className="text-slate-300">{item.weight} kg</p></div>}
                    <div><p className="text-slate-600 mb-0.5">Qty</p><p className="text-slate-300">{item.quantity}</p></div>
                  </div>
                </div>
              ))}
              <div className="rounded-xl bg-indigo-500/[0.05] border border-indigo-500/20 p-4 flex items-center justify-between">
                <span className="text-sm font-bold text-indigo-300">Grand Total</span>
                <span className="text-xl font-bold text-white">₹{order.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {order.notes && (
              <div className="mt-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
                <p className="text-sm text-slate-300">{order.notes}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              {order.status === 'pending' && (
                <button onClick={() => { updateOrder(order._id, { status: 'completed' }); setSelectedOrderId(null); }} className="flex-1 btn-primary flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Mark Completed
                </button>
              )}
              <button onClick={() => window.print()} className="btn-secondary flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> Print
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
