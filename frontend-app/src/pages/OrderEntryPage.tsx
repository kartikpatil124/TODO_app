import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight, Save, Package,
  Weight, Hash, DollarSign
} from 'lucide-react';
import { useAppStore, Order, OrderItem, PricingType } from '../store/store';

const uid = () => Math.random().toString(36).substr(2, 9);

const PRODUCT_SUGGESTIONS = [
  'MS Angle', 'MS Plate 6mm', 'MS Plate 8mm', 'Truss', 'GI Sheet', 'Channel 100mm',
  'Channel 75mm', 'TMT Bar 8mm', 'TMT Bar 10mm', 'TMT Bar 12mm', 'Flat Bar', 'Round Bar',
  'MS Pipe', 'GI Pipe', 'Square Pipe', 'Beam ISMB', 'MS Sheet', 'Chequered Plate'
];

interface Props {
  onBack: () => void;
}

export default function OrderEntryPage({ onBack }: Props) {
  const { addOrder } = useAppStore();
  const [partyName, setPartyName] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [notes, setNotes] = useState('');

  // Current item being added
  const [product, setProduct] = useState('');
  const [pricingType, setPricingType] = useState<PricingType>('per_kg');
  const [price, setPrice] = useState<number>(0);
  const [weight, setWeight] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const filteredSuggestions = PRODUCT_SUGGESTIONS.filter(p =>
    p.toLowerCase().includes(product.toLowerCase()) && product.length > 0
  );

  const calculateTotal = () => {
    if (pricingType === 'per_kg') return price * weight * quantity;
    return price * quantity;
  };

  const addItem = () => {
    if (!product.trim() || price <= 0) return;
    const newItem: OrderItem = {
      id: uid(),
      product: product.trim(),
      type: pricingType,
      price,
      weight: pricingType === 'per_kg' ? weight : 0,
      quantity,
      total: calculateTotal(),
    };
    setItems([...items, newItem]);
    // Reset input
    setProduct(''); setPrice(0); setWeight(0); setQuantity(1);
    setPricingType('per_kg');
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const grandTotal = items.reduce((sum, i) => sum + i.total, 0);

  const handleSave = () => {
    if (!partyName.trim() || items.length === 0) return;
    const order: Order = {
      _id: uid(),
      partyName: partyName.trim(),
      items,
      status: 'pending',
      totalAmount: grandTotal,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addOrder(order);
    onBack();
  };

  const toggleItemExpand = (id: string) => {
    const next = new Set(expandedItems);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedItems(next);
  };

  return (
    <div className="page-padding max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <button onClick={onBack} className="btn-ghost p-2" style={{ minWidth: '44px', minHeight: '44px' }}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">New Order</h1>
          <p className="text-sm text-slate-500">Tally-style order entry</p>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* Party Name */}
        <div className="card">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 block">Party Details</label>
          <input
            autoFocus
            type="text"
            placeholder="Enter party / customer name"
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            className="input-base text-base font-medium"
          />
        </div>

        {/* Added Items */}
        {items.length > 0 && (
          <div className="card">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 block">
              Items ({items.length})
            </label>
            <div className="space-y-2">
              <AnimatePresence>
                {items.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="flex items-center gap-2 md:gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] active:bg-white/[0.06] transition-colors cursor-pointer group"
                      onClick={() => toggleItemExpand(item.id)}
                    >
                      <div className="flex items-center gap-1 text-slate-600 shrink-0">
                        {expandedItems.has(item.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>

                      {/* Item Summary — responsive wrapping */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap text-sm">
                          <span className="font-medium text-slate-200">{item.product}</span>
                          <span className="text-slate-600 hidden xs:inline">|</span>
                          <span className="text-slate-400 text-xs">₹{item.price}/{item.type === 'per_kg' ? 'kg' : 'pc'}</span>
                          {item.type === 'per_kg' && (
                            <>
                              <span className="text-slate-600 hidden xs:inline">|</span>
                              <span className="text-slate-400 text-xs">{item.weight}kg</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-500">Qty: {item.quantity}</span>
                          <span className="font-semibold text-white text-sm">₹{item.total.toLocaleString()}</span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                        className="touch-action-btn text-slate-700 hover:text-rose-400 transition p-1 shrink-0"
                        style={{ minWidth: '28px', minHeight: '28px' }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Expanded Detail */}
                    {expandedItems.has(item.id) && (
                      <div className="ml-6 md:ml-8 mt-1 p-3 rounded-lg bg-white/[0.02] text-xs text-slate-400 space-y-1">
                        <p><strong className="text-slate-300">Product:</strong> {item.product}</p>
                        <p><strong className="text-slate-300">Pricing:</strong> ₹{item.price} {item.type === 'per_kg' ? 'per kg' : 'per piece'}</p>
                        {item.type === 'per_kg' && <p><strong className="text-slate-300">Weight:</strong> {item.weight} kg</p>}
                        <p><strong className="text-slate-300">Quantity:</strong> {item.quantity}</p>
                        <p><strong className="text-slate-300">Total:</strong> ₹{item.total.toLocaleString()}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Grand Total */}
            <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">Grand Total</span>
              <span className="text-xl font-bold text-white">₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Add Item Form */}
        <div className="card border-dashed border-indigo-500/20">
          <label className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-4 block flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Item
          </label>

          <div className="space-y-4">
            {/* Product Name with Autocomplete */}
            <div className="relative">
              <div className="relative">
                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Product name"
                  value={product}
                  onChange={(e) => { setProduct(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  className="input-base pl-10 text-sm"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-white/[0.1] rounded-xl shadow-2xl z-20 py-1 max-h-48 overflow-y-auto">
                  {filteredSuggestions.map(s => (
                    <button
                      key={s}
                      onMouseDown={() => { setProduct(s); setShowSuggestions(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-white/[0.06] hover:text-white active:bg-white/[0.08] transition flex items-center gap-2"
                      style={{ minHeight: '44px' }}
                    >
                      <Package className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing Type */}
            <div>
              <label className="text-xs font-medium text-slate-500 mb-2 block">Pricing Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPricingType('per_kg')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                    pricingType === 'per_kg'
                      ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                      : 'bg-white/[0.04] text-slate-500 hover:bg-white/[0.08] border border-transparent'
                  }`}
                  style={{ minHeight: '44px' }}
                >
                  <Weight className="w-4 h-4" /> Per KG
                </button>
                <button
                  type="button"
                  onClick={() => setPricingType('per_piece')}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                    pricingType === 'per_piece'
                      ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                      : 'bg-white/[0.04] text-slate-500 hover:bg-white/[0.08] border border-transparent'
                  }`}
                  style={{ minHeight: '44px' }}
                >
                  <Hash className="w-4 h-4" /> Per Piece
                </button>
              </div>
            </div>

            {/* Price, Weight, Quantity — responsive grid */}
            <div className={`grid ${pricingType === 'per_kg' ? 'grid-cols-1 xs:grid-cols-3' : 'grid-cols-1 xs:grid-cols-2'} gap-3`}>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Price (₹)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={price || ''}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="input-base text-sm"
                  min={0}
                />
              </div>
              {pricingType === 'per_kg' && (
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1.5 block flex items-center gap-1">
                    <Weight className="w-3 h-3" /> Weight (kg)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={weight || ''}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="input-base text-sm"
                    min={0}
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1.5 block flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Quantity
                </label>
                <input
                  type="number"
                  placeholder="1"
                  value={quantity || ''}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="input-base text-sm"
                  min={1}
                />
              </div>
            </div>

            {/* Auto-calculated Total */}
            {(price > 0) && (
              <div className="p-3 rounded-xl bg-indigo-500/[0.06] border border-indigo-500/[0.1] flex items-center justify-between">
                <span className="text-xs text-indigo-300">Item Total</span>
                <span className="text-lg font-bold text-indigo-400">₹{calculateTotal().toLocaleString()}</span>
              </div>
            )}

            {/* Add Item Button */}
            <button
              type="button"
              onClick={addItem}
              disabled={!product.trim() || price <= 0}
              className="w-full btn-secondary flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 block">Notes (optional)</label>
          <textarea
            placeholder="Any additional notes for this order..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-base text-sm resize-none h-20"
          />
        </div>

        {/* Save Order */}
        <button
          onClick={handleSave}
          disabled={!partyName.trim() || items.length === 0}
          className="w-full btn-primary flex items-center justify-center gap-2 text-base py-4"
        >
          <Save className="w-5 h-5" /> Save Order
        </button>
      </div>
    </div>
  );
}
