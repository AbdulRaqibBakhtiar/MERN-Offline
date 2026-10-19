
import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ClipboardList,
  Package,
  RotateCw,
  ShoppingBag,
  Store,
  ShieldCheck,
} from 'lucide-react';
import { API_BASE_URL } from '../../api/config';

const terminalStatuses = new Set([
  'delivered',
  'fulfilled',
  'cancelled',
]);

export default function HomeMarketplacePanel({
  itemList = [],
  user,
  onOpenMarketplace,
}) {
  const [orders, setOrders] = useState({
    incoming: 0,
    active: 0,
    loading: true,
  });

  const myListings = useMemo(
    () =>
      itemList.filter(
        item =>
          String(item.createdBy?._id || item.createdBy) ===
          String(user?._id || user?.id)
      ),
    [itemList, user]
  );

  const outOfStock = myListings.filter(
    item => Number(item.quantity) <= 0
  ).length;

  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('token');

    if (!token) {
      setOrders({ incoming: 0, active: 0, loading: false });
      return () => {
        mounted = false;
      };
    }

    const requestOrders = endpoint =>
      fetch(`${API_BASE_URL}/inventory/orders/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(async response => {
        const data = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error(data.error || 'Could not load orders.');
        }
        return Array.isArray(data) ? data : [];
      });

    Promise.allSettled([
      requestOrders('selling'),
      requestOrders('buying'),
    ]).then(([selling, buying]) => {
      if (!mounted) return;

      const incomingOrders =
        selling.status === 'fulfilled' ? selling.value : [];
      const buyingOrders =
        buying.status === 'fulfilled' ? buying.value : [];

      setOrders({
        incoming: incomingOrders.filter(
          order => order.status === 'pending'
        ).length,
        active: buyingOrders.filter(
          order => !terminalStatuses.has(order.status)
        ).length,
        loading: false,
      });
    });

    return () => {
      mounted = false;
    };
  }, [user?._id, user?.id]);

  const open = view => onOpenMarketplace?.(view);

  const stats = [
    {
      label: 'My listings',
      value: myListings.length,
      icon: Store,
      color: '#2563eb',
      background: '#eff6ff',
    },
    {
      label: 'Out of stock',
      value: outOfStock,
      icon: Package,
      color: outOfStock ? '#d97706' : '#059669',
      background: outOfStock ? '#fffbeb' : '#ecfdf5',
    },
    {
      label: 'Requests to review',
      value: orders.loading ? '—' : orders.incoming,
      icon: ClipboardList,
      color: '#7c3aed',
      background: '#f5f3ff',
    },
    {
      label: 'Active orders',
      value: orders.loading ? '—' : orders.active,
      icon: RotateCw,
      color: '#0891b2',
      background: '#ecfeff',
    },
  ];

  const styles = {
    section: {
      width: '100%',
      boxSizing: 'border-box',
      marginTop: '14px',
      padding: '16px',
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '14px',
      boxShadow: '0 4px 16px rgba(15,23,42,0.045)',
      color: '#0f172a',
      fontFamily: 'inherit',
    },
    heading: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '14px',
    },
    headingIcon: {
      width: '36px',
      height: '36px',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '10px',
      background: '#2563eb',
      color: '#fff',
    },
    eyebrow: {
      display: 'block',
      marginBottom: '2px',
      color: '#2563eb',
      fontSize: '9px',
      fontWeight: 800,
      letterSpacing: '1.2px',
    },
    title: {
      margin: 0,
      fontSize: '17px',
      lineHeight: 1.3,
      fontWeight: 750,
      letterSpacing: '-0.3px',
      color: '#0f172a',
    },
    subtitle: {
      margin: '3px 0 0',
      fontSize: '11px',
      lineHeight: 1.4,
      color: '#64748b',
    },
    stats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))',
      gap: '8px',
      marginBottom: '14px',
    },
    stat: {
      minWidth: 0,
      boxSizing: 'border-box',
      padding: '11px',
      border: '1px solid #e8edf4',
      borderRadius: '10px',
      background: '#fff',
    },
    statTop: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '5px',
      marginBottom: '8px',
    },
    statLabel: {
      fontSize: '10px',
      lineHeight: 1.35,
      fontWeight: 650,
      color: '#64748b',
    },
    statIcon: {
      width: '27px',
      height: '27px',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
    },
    statValue: {
      display: 'block',
      fontSize: '23px',
      lineHeight: 1.15,
      fontWeight: 800,
      letterSpacing: '-0.5px',
      color: '#0f172a',
    },
    actionsHeading: {
      margin: '0 0 8px',
      fontSize: '11px',
      fontWeight: 750,
      color: '#334155',
    },
    actions: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '7px',
      marginBottom: '12px',
    },
    primaryButton: {
      minHeight: '36px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '7px',
      padding: '0 12px',
      border: '1px solid #2563eb',
      borderRadius: '8px',
      background: '#2563eb',
      color: '#fff',
      fontFamily: 'inherit',
      fontSize: '11px',
      fontWeight: 700,
      cursor: 'pointer',
    },
    secondaryButton: {
      minHeight: '36px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '7px',
      padding: '0 11px',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      background: '#fff',
      color: '#334155',
      fontFamily: 'inherit',
      fontSize: '11px',
      fontWeight: 650,
      cursor: 'pointer',
    },
    note: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
      padding: '9px 11px',
      border: '1px solid #dbeafe',
      borderRadius: '9px',
      background: '#f8fbff',
      color: '#475569',
      fontSize: '10px',
      lineHeight: 1.5,
    },
    noteIcon: {
      flexShrink: 0,
      marginTop: '1px',
      color: '#2563eb',
    },
    noteTitle: {
      display: 'block',
      marginBottom: '1px',
      fontSize: '10px',
      fontWeight: 750,
      color: '#1e40af',
    },
  };

  return (
    <section
      style={styles.section}
      aria-labelledby="home-marketplace-panel-title"
    >
      <div style={styles.heading}>
        <div style={styles.headingIcon}>
          <ShoppingBag size={19} />
        </div>

        <div style={{ minWidth: 0 }}>
          <span style={styles.eyebrow}>YOUR MARKETPLACE</span>
          <h3
            id="home-marketplace-panel-title"
            style={styles.title}
          >
            Marketplace desk
          </h3>
          <p style={styles.subtitle}>
            Your listings, requests, and orders at a glance.
          </p>
        </div>
      </div>

      <div style={styles.stats}>
        {stats.map(({ label, value, icon: Icon, color, background }) => (
          <div key={label} style={styles.stat}>
            <div style={styles.statTop}>
              <span style={styles.statLabel}>{label}</span>
              <span style={{
                ...styles.statIcon,
                color,
                background,
              }}>
                <Icon size={15} />
              </span>
            </div>
            <strong style={styles.statValue}>{value}</strong>
          </div>
        ))}
      </div>

      <h4 style={styles.actionsHeading}>Quick actions</h4>

      <div style={styles.actions}>
        <button
          type="button"
          style={styles.primaryButton}
          onClick={() => open('browse')}
        >
          <ShoppingBag size={14} />
          Browse listings
          <ArrowRight size={14} />
        </button>

        <button
          type="button"
          style={styles.secondaryButton}
          onClick={() => open('sell')}
        >
          <Store size={14} />
          Manage listings
        </button>

        <button
          type="button"
          style={styles.secondaryButton}
          onClick={() => open('orders')}
        >
          <ClipboardList size={14} />
          My orders
        </button>
      </div>

      <div style={styles.note}>
        <span style={styles.noteIcon}>
          <ShieldCheck size={15} />
        </span>
        <div>
          <strong style={styles.noteTitle}>
            Direct buyer–seller payments
          </strong>
          Orders are requests between buyers and sellers. Payment is
          arranged directly with the seller.
        </div>
      </div>
    </section>
  );
}
