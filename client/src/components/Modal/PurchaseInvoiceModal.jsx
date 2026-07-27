import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

function PurchaseInvoiceModal({ isOpen, onClose, product, onCompletePurchase }) {
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [poNumber, setPoNumber] = useState('');

  useEffect(() => {
    if (isOpen) {
      setOrderQuantity(1);
      setPoNumber(`SM-${Math.floor(100000 + Math.random() * 900000)}`);
    }
  }, [isOpen]);

  // If hidden, render nothing to free up thread resources
  if (!isOpen || !product) return null;

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (typeof onCompletePurchase === 'function') {
      onCompletePurchase(orderQuantity);
    }
  };

  const itemPrice = parseFloat(product.price || 0);
  const maxAvailableStock = parseInt(product.quantity || 0);
  const subtotal = itemPrice * orderQuantity;
  const freightTax = subtotal * 0.085;
  const finalSettlement = subtotal + freightTax;

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', WebkitBackdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999999, fontFamily: 'sans-serif', padding: '20px', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: '450px', background: 'var(--bg-card, #ffffff)', padding: '30px', borderRadius: '16px', boxSizing: 'border-box', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.1)', border: '1px solid var(--border-color, transparent)' }} className="modal-content-box">
        
        {/* Invoice Title Deck */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--border-color, #cbd5e1)', paddingBottom: '14px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary, #0f172a)' }}>Transaction Invoice</h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted, #64748b)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              PO NUMBER: {poNumber}
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted, #64748b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
        </div>

        {/* Financial Line Ledger Matrix */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-main, #f8fafc)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color, #e2e8f0)', marginBottom: '20px' }} className="invoice-ledger">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
            <span style={{ color: 'var(--text-muted, #64748b)' }}>Item Description:</span>
            <strong style={{ color: 'var(--text-primary, #0f172a)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
            <span style={{ color: 'var(--text-muted, #64748b)' }}>Unit Cost:</span>
            <span style={{ color: 'var(--text-primary, #0f172a)', fontWeight: '500' }}>${itemPrice.toFixed(2)} each</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
            <span style={{ color: 'var(--text-muted, #64748b)' }}>Subtotal Threshold:</span>
            <span style={{ color: 'var(--text-primary, #0f172a)', fontWeight: '500' }}>${subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
            <span style={{ color: 'var(--text-muted, #64748b)' }}>Freight / Tax (8.5%):</span>
            <span style={{ color: 'var(--text-primary, #0f172a)', fontWeight: '500' }}>${freightTax.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', borderTop: '1px dashed var(--border-color, #cbd5e1)', paddingTop: '10px', marginTop: '4px' }}>
            <strong style={{ color: 'var(--text-primary, #0f172a)' }}>Total Final Settlement:</strong>
            <strong style={{ color: '#16a34a', fontSize: '1.25rem' }}>${finalSettlement.toFixed(2)}</strong>
          </div>
        </div>
        <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Micro-Adjustment Stock Volume Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary, #475569)' }}>Modify Order Volume:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-main, #f1f5f9)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
              <button type="button" disabled={orderQuantity <= 1} onClick={() => setOrderQuantity(q => Math.max(1, q - 1))} style={{ width: '28px', height: '28px', border: 'none', background: 'var(--bg-card, #ffffff)', color: 'var(--text-primary, inherit)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
              <span style={{ width: '36px', textAlign: 'center', fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary, #0f172a)' }}>{orderQuantity}</span>
              <button type="button" disabled={orderQuantity >= maxAvailableStock} onClick={() => setOrderQuantity(q => Math.min(maxAvailableStock, q + 1))} style={{ width: '28px', height: '28px', border: 'none', background: 'var(--bg-card, #ffffff)', color: 'var(--text-primary, inherit)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="submit" style={{ width: '100%', padding: '14px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', flex: 2, boxShadow: '0 4px 12px rgba(22,163,74,0.15)' }}>
              Authorize Purchase 🚀
            </button>
            <button type="button" onClick={onClose} style={{ background: 'var(--bg-card, #ffffff)', color: 'var(--text-primary, #0f172a)', border: '1px solid var(--border-color, #cbd5e1)', borderRadius: '8px', flex: 1, padding: '12px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default PurchaseInvoiceModal;
