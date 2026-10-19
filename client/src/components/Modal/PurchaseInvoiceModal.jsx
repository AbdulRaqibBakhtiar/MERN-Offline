import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Banknote, CreditCard, MapPin, Store } from 'lucide-react';

const optionStyle = selected => ({
  display: 'flex', alignItems: 'flex-start', gap: 11, padding: '12px 13px', borderRadius: 12,
  border: `1px solid ${selected ? '#2d7965' : 'var(--border-color, #e2e8f0)'}`,
  background: selected ? 'rgba(45,121,101,.08)' : 'var(--bg-card, #fff)',
  color: 'var(--text-primary, #0f172a)', cursor: 'pointer'
});

function PurchaseInvoiceModal({ isOpen, onClose, product, user, initialQuantity = 1, checkoutError = '', onCompletePurchase, isSubmitting = false }) {
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [deliveryMethod, setDeliveryMethod] = useState('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [formError, setFormError] = useState('');
  const [demoCard, setDemoCard] = useState({ name: '', number: '', expiry: '', securityCode: '' });
  const [demoBank, setDemoBank] = useState({ bankName: '', accountName: '', accountNumber: '', reference: '' });

  useEffect(() => {
    if (!isOpen) return;
    setOrderQuantity(Math.max(1, Number(initialQuantity) || 1));
    setPaymentMethod(['cash_on_delivery', 'card_to_seller', 'bank_transfer'].includes(user?.preferredPaymentMethod) ? user.preferredPaymentMethod : 'cash_on_delivery');
    setDeliveryMethod('delivery');
    setFormError('');
    setDemoCard({ name: '', number: '', expiry: '', securityCode: '' });
    setDemoBank({ bankName: '', accountName: '', accountNumber: '', reference: '' });
    const address = user?.shippingAddress || {};
    setDeliveryAddress([address.street, address.city, address.state, address.postalCode, address.country].filter(Boolean).join(', '));
  }, [isOpen, user, initialQuantity]);

  if (!isOpen || !product) return null;

  const handleCheckoutSubmit = event => {
    event.preventDefault();
    if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
      setFormError('Add a delivery address or choose “Arrange pickup” to continue.');
      return;
    }
    setFormError('');
    onCompletePurchase?.(orderQuantity, { paymentMethod, deliveryMethod, deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress.trim() : '' });
  };
  const unitPrice = Number(product.price || 0);
  const subtotal = unitPrice * orderQuantity;
  const maxAvailableStock = Number.parseInt(product.quantity || 0, 10);
  const inputStyle = { width: '100%', padding: '11px 12px', border: '1px solid var(--border-color, #cbd5e1)', borderRadius: 10, background: 'var(--bg-main, #fff)', color: 'var(--text-primary, #0f172a)', font: 'inherit', boxSizing: 'border-box' };

  return ReactDOM.createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.62)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999999, padding: 16, boxSizing: 'border-box' }}>
      <section role="dialog" aria-modal="true" aria-labelledby="checkout-title" style={{ width: '100%', maxWidth: 540, maxHeight: 'min(92vh, 820px)', overflowY: 'auto', background: 'var(--bg-card, #fff)', padding: '24px clamp(18px, 4vw, 30px)', borderRadius: 18, boxSizing: 'border-box', boxShadow: '0 25px 70px rgba(0,0,0,.28)', border: '1px solid var(--border-color, transparent)', color: 'var(--text-primary, #0f172a)' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, paddingBottom: 16, borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
          <div><span style={{ color: '#31806b', fontSize: 10, fontWeight: 800, letterSpacing: '.14em' }}>CHECKOUT</span><h2 id="checkout-title" style={{ margin: '5px 0', fontSize: 23, letterSpacing: '-.03em' }}>Review your order</h2><p style={{ margin: 0, color: 'var(--text-muted, #64748b)', fontSize: 13 }}>Choose how you’d like to pay and receive it.</p></div>
          <button type="button" onClick={onClose} aria-label="Close checkout" style={{ border: 0, background: 'var(--bg-main, #f1f5f9)', borderRadius: 9, width: 34, height: 34, fontSize: 22, cursor: 'pointer', color: 'var(--text-muted, #64748b)' }}>×</button>
        </header>

        <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingTop: 18 }}>
          {(formError || checkoutError) && <p role="alert" style={{ margin: 0, padding: '11px 13px', borderRadius: 10, border: '1px solid #f0b8b8', background: 'rgba(185,28,28,.08)', color: '#b4232f', fontSize: 13 }}>{formError || checkoutError}</p>}
          <div style={{ padding: 15, borderRadius: 13, background: 'var(--bg-main, #f8fafc)', border: '1px solid var(--border-color, #e2e8f0)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}><div style={{ minWidth: 0 }}><strong style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</strong><small style={{ color: 'var(--text-muted, #64748b)' }}>${unitPrice.toFixed(2)} per item</small></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}><button type="button" aria-label="Decrease quantity" disabled={orderQuantity <= 1} onClick={() => setOrderQuantity(value => Math.max(1, value - 1))} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border-color, #d5dde5)', background: 'var(--bg-card, #fff)', color: 'inherit', cursor: 'pointer' }}>−</button><span aria-live="polite" style={{ minWidth: 20, textAlign: 'center', fontWeight: 700 }}>{orderQuantity}</span><button type="button" aria-label="Increase quantity" disabled={orderQuantity >= maxAvailableStock} onClick={() => setOrderQuantity(value => Math.min(maxAvailableStock, value + 1))} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border-color, #d5dde5)', background: 'var(--bg-card, #fff)', color: 'inherit', cursor: 'pointer' }}>+</button></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, borderTop: '1px solid var(--border-color, #e2e8f0)', marginTop: 13, paddingTop: 12 }}><span style={{ color: 'var(--text-muted, #64748b)', fontSize: 13 }}>Items subtotal</span><strong style={{ fontSize: 19 }}>${subtotal.toFixed(2)}</strong></div>
            <small style={{ display: 'block', marginTop: 4, color: 'var(--text-muted, #64748b)' }}>Delivery fees, if any, are confirmed with the seller.</small>
          </div>

          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ marginBottom: 9, fontSize: 14, fontWeight: 750 }}>Payment preference</legend>
            <div style={{ display: 'grid', gap: 8 }}>
              <label style={optionStyle(paymentMethod === 'cash_on_delivery')}><input type="radio" name="paymentMethod" value="cash_on_delivery" checked={paymentMethod === 'cash_on_delivery'} onChange={event => setPaymentMethod(event.target.value)} /><Banknote size={18} /><span><strong style={{ display: 'block', fontSize: 13 }}>Cash on delivery</strong><small style={{ color: 'var(--text-muted, #64748b)' }}>Pay the seller when you receive the order.</small></span></label>
              <label style={optionStyle(paymentMethod === 'card_to_seller')}><input type="radio" name="paymentMethod" value="card_to_seller" checked={paymentMethod === 'card_to_seller'} onChange={event => setPaymentMethod(event.target.value)} /><CreditCard size={18} /><span><strong style={{ display: 'block', fontSize: 13 }}>Debit or credit card</strong><small style={{ color: 'var(--text-muted, #64748b)' }}>Arrange payment securely with the seller after confirmation.</small></span></label>
              <label style={optionStyle(paymentMethod === 'bank_transfer')}><input type="radio" name="paymentMethod" value="bank_transfer" checked={paymentMethod === 'bank_transfer'} onChange={event => setPaymentMethod(event.target.value)} /><Banknote size={18} /><span><strong style={{ display: 'block', fontSize: 13 }}>Bank transfer</strong><small style={{ color: 'var(--text-muted, #64748b)' }}>The seller will provide payment instructions.</small></span></label>
            </div>
            {paymentMethod === 'card_to_seller' && <div style={{ marginTop: 10, padding: 13, border: '1px dashed var(--border-color, #cbd5e1)', borderRadius: 11, background: 'var(--bg-main, #f8fafc)' }}>
              <strong style={{ display: 'block', marginBottom: 3, fontSize: 12 }}>Demo card form</strong><small style={{ display: 'block', marginBottom: 10, color: 'var(--text-muted, #64748b)' }}>Portfolio preview only. Do not enter real card details. Use sample data; these fields stay in this page and are never sent or saved.</small>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input aria-label="Demo cardholder name" autoComplete="off" placeholder="Cardholder name" value={demoCard.name} onChange={event => setDemoCard(current => ({ ...current, name: event.target.value }))} style={inputStyle} />
                <input aria-label="Demo card number" autoComplete="off" inputMode="numeric" placeholder="Card number" value={demoCard.number} onChange={event => setDemoCard(current => ({ ...current, number: event.target.value }))} style={inputStyle} />
                <input aria-label="Demo card expiration" autoComplete="off" placeholder="MM/YY" value={demoCard.expiry} onChange={event => setDemoCard(current => ({ ...current, expiry: event.target.value }))} style={inputStyle} />
                <input aria-label="Demo card security code" autoComplete="off" inputMode="numeric" placeholder="Security code" value={demoCard.securityCode} onChange={event => setDemoCard(current => ({ ...current, securityCode: event.target.value }))} style={inputStyle} />
              </div>
              <button type="button" onClick={() => setDemoCard({ name: 'Demo Buyer', number: '4242 4242 4242 4242', expiry: '12/30', securityCode: '123' })} style={{ marginTop: 8, padding: '6px 9px', border: '1px solid var(--border-color, #cbd5e1)', borderRadius: 7, background: 'var(--bg-card, #fff)', color: 'var(--text-primary, #0f172a)', fontSize: 11, fontWeight: 650, cursor: 'pointer' }}>Fill sample card</button>
            </div>}
            {paymentMethod === 'bank_transfer' && <div style={{ marginTop: 10, padding: 13, border: '1px dashed var(--border-color, #cbd5e1)', borderRadius: 11, background: 'var(--bg-main, #f8fafc)' }}>
              <strong style={{ display: 'block', marginBottom: 3, fontSize: 12 }}>Demo bank form</strong><small style={{ display: 'block', marginBottom: 10, color: 'var(--text-muted, #64748b)' }}>Preview only. Do not enter real bank details. Enter sample data; these fields are never sent or saved.</small>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input aria-label="Demo bank name" autoComplete="off" placeholder="Bank name" value={demoBank.bankName} onChange={event => setDemoBank(current => ({ ...current, bankName: event.target.value }))} style={inputStyle} />
                <input aria-label="Demo account holder" autoComplete="off" placeholder="Account holder" value={demoBank.accountName} onChange={event => setDemoBank(current => ({ ...current, accountName: event.target.value }))} style={inputStyle} />
                <input aria-label="Demo account number" autoComplete="off" inputMode="numeric" placeholder="Account number" value={demoBank.accountNumber} onChange={event => setDemoBank(current => ({ ...current, accountNumber: event.target.value }))} style={inputStyle} />
                <input aria-label="Demo payment reference" autoComplete="off" placeholder="Payment reference" value={demoBank.reference} onChange={event => setDemoBank(current => ({ ...current, reference: event.target.value }))} style={inputStyle} />
              </div>
              <button type="button" onClick={() => setDemoBank({ bankName: 'Bazzar Demo Bank', accountName: 'Demo Buyer', accountNumber: '000123456789', reference: 'DEMO-ORDER' })} style={{ marginTop: 8, padding: '6px 9px', border: '1px solid var(--border-color, #cbd5e1)', borderRadius: 7, background: 'var(--bg-card, #fff)', color: 'var(--text-primary, #0f172a)', fontSize: 11, fontWeight: 650, cursor: 'pointer' }}>Fill sample bank details</button>
            </div>}
            <p style={{ margin: '8px 0 0', color: 'var(--text-muted, #64748b)', fontSize: 11 }}>Only your payment preference is included in the order request. Bazzar does not process online payments.</p>
          </fieldset>

          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend style={{ marginBottom: 9, fontSize: 14, fontWeight: 750 }}>Delivery</legend>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <label style={optionStyle(deliveryMethod === 'delivery')}><input type="radio" name="deliveryMethod" value="delivery" checked={deliveryMethod === 'delivery'} onChange={event => setDeliveryMethod(event.target.value)} /><MapPin size={17} /><strong style={{ fontSize: 13 }}>Request delivery</strong></label>
              <label style={optionStyle(deliveryMethod === 'pickup')}><input type="radio" name="deliveryMethod" value="pickup" checked={deliveryMethod === 'pickup'} onChange={event => setDeliveryMethod(event.target.value)} /><Store size={17} /><strong style={{ fontSize: 13 }}>Arrange pickup</strong></label>
            </div>
            {deliveryMethod === 'delivery' && <label style={{ display: 'block', marginTop: 10, fontSize: 12, fontWeight: 700 }}>Delivery address<textarea value={deliveryAddress} onChange={event => { setDeliveryAddress(event.target.value); if (event.target.value.trim()) setFormError(''); }} maxLength={500} rows={2} placeholder="Enter the address where you’d like to receive the order" style={{ ...inputStyle, display: 'block', marginTop: 6, resize: 'vertical' }} />{!deliveryAddress.trim() && <small style={{ display: 'block', marginTop: 5, color: 'var(--text-muted, #64748b)', fontWeight: 400 }}>Required for delivery. You can save a default in Account Info.</small>}</label>}
          </fieldset>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={isSubmitting || maxAvailableStock < 1 || orderQuantity > maxAvailableStock} style={{ flex: 1, minHeight: 46, padding: '11px 14px', background: '#28735f', color: '#fff', border: 0, borderRadius: 10, fontWeight: 750, cursor: isSubmitting ? 'wait' : 'pointer', opacity: isSubmitting || maxAvailableStock < 1 ? .6 : 1 }}>{isSubmitting ? 'Sending request…' : 'Send order request'}</button>
            <button type="button" onClick={onClose} disabled={isSubmitting} style={{ padding: '11px 16px', background: 'var(--bg-card, #fff)', color: 'var(--text-primary, #0f172a)', border: '1px solid var(--border-color, #cbd5e1)', borderRadius: 10, fontWeight: 650, cursor: 'pointer' }}>Cancel</button>
          </div>
          <small style={{ textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>The seller confirms availability, payment, and delivery details before finalizing.</small>
        </form>
      </section>
    </div>,
    document.body
  );
}

export default PurchaseInvoiceModal;
