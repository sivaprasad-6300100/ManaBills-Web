import React, { useEffect, useState, useCallback } from "react";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../../services/businessService";
import { authAxios } from "../../services/api";
import "../../styles/business/Customers.css";





/* ─── Sync customers from invoices (background, best-effort) ─── */
const syncCustomersFromInvoices = async () => {
  try {
    const invoices = await authAxios.get("business/invoices/").then((r) => r.data);
    if (!invoices?.length) return;
    const existing = await getCustomers("");
    const seen = new Set(
      existing.map((c) => (c.mobile || "").replace(/\D/g, "").slice(-10)).filter(Boolean)
    );
    const dedup = new Set();
    for (const inv of invoices) {
      const name = (inv.customer_name || "").trim();
      const mobile = (inv.customer_mobile || "").replace(/\D/g, "").slice(-10);
      if (!name || !mobile || seen.has(mobile) || dedup.has(mobile)) continue;
      dedup.add(mobile);
      try {
        await createCustomer({
          name,
          mobile,
          email: inv.customer_email || "",
          gst_number: inv.customer_gst || "",
          address: inv.customer_address || "",
        });
      } catch {}
    }
  } catch {}
};

/* ── Helpers ── */
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const statusKey = (s) => ({ paid: 'paid', partial: 'partial' }[(s || '').toLowerCase()] ?? 'pending');
const BLANK = { name: '', mobile: '', email: '', address: '', gst_number: '' };

/* ═══════════════════════════════════
   VISIT ITEM
═══════════════════════════════════ */
const VisitItem = ({ inv }) => {
  const d = new Date(inv.date);
  const sk = statusKey(inv.status);
  return (
    <div className="vd-visit">
      <div className={`vd-dot ${sk}`} />
      <div className="vd-meta">
        <div className="vd-visit-top">
          <span className="vd-visit-date">
            {d.getDate()} {MONTHS_SHORT[d.getMonth()]} {d.getFullYear()}
          </span>
          <span className="vd-visit-id">{inv.invoice_id || '—'}</span>
        </div>
        {inv.items?.length > 0 && (
          <div className="vd-visit-items">{inv.items.map((it) => it.name).join(', ')}</div>
        )}
        <div className="vd-visit-row">
          <span className="vd-amt">{fmt(inv.total)}</span>
          <span className={`vd-badge ${sk}`}>{inv.status || 'Pending'}</span>
          {Number(inv.balance || 0) > 0 && (
            <span className="vd-bal">Due {fmt(inv.balance)}</span>
          )}
          {inv.payment && <span className="vd-pay">· {inv.payment}</span>}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════
   SPARK BARS
═══════════════════════════════════ */
const SparkBars = ({ invoices }) => {
  const monthly = Array(12).fill(0);
  invoices.forEach((inv) => {
    const m = new Date(inv.date).getMonth();
    monthly[m] += Number(inv.total || 0);
  });
  const mx = Math.max(...monthly, 1);
  return (
    <div className="vd-spark-section">
      <div className="vd-spark-lbl">Monthly spend pattern</div>
      <div className="vd-spark-bars">
        {monthly.map((v, i) => (
          <div
            key={i}
            className={`vd-bar${v > 0 ? ' has-data' : ''}`}
            style={{ height: `${Math.max(5, Math.round((v / mx) * 36))}px` }}
            title={`${MONTHS_SHORT[i]}: ${fmt(v)}`}
          />
        ))}
      </div>
      <div className="vd-spark-months">
        {MONTHS_SHORT.filter((_, i) => i % 3 === 0).map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════
   VISIT DRAWER
═══════════════════════════════════ */
const VisitDrawer = ({ customer, onClose }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yearTab, setYearTab] = useState('All');
  const [bodyTab, setBodyTab] = useState('history');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await authAxios
          .get('business/invoices/', { params: { search: customer.mobile } })
          .then((r) => r.data);
        const normalised = (data || []).map((inv) => ({
          ...inv,
          items: inv.items || inv.invoice_items || [],
        }));
        setInvoices(normalised.sort((a, b) => new Date(b.date) - new Date(a.date)));
      } catch {
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [customer.mobile]);

  const totalSpent = invoices.reduce((s, i) => s + Number(i.total || 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + Number(i.advance || 0), 0);
  const totalBal = invoices.reduce((s, i) => s + Number(i.balance || 0), 0);
  const years = [...new Set(invoices.map((i) => i.date?.split('-')[0]).filter(Boolean))].sort(
    (a, b) => b - a
  );
  const filtered =
    yearTab === 'All' ? invoices : invoices.filter((i) => i.date?.startsWith(yearTab));

  const initials = customer.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const renderVisits = () => {
    if (loading) return <div className="vd-empty">Loading visits…</div>;
    if (!filtered.length) return <div className="vd-empty">No visits in this period.</div>;

    if (yearTab !== 'All') {
      const byMonth = {};
      filtered.forEach((inv) => {
        const mk = new Date(inv.date).getMonth();
        (byMonth[mk] = byMonth[mk] || []).push(inv);
      });
      return Object.keys(byMonth)
        .sort((a, b) => b - a)
        .map((mk) => (
          <div key={mk} className="vd-month-group">
            <div className="vd-month-lbl">{MONTHS_FULL[mk]}</div>
            {byMonth[mk].map((inv) => (
              <VisitItem key={inv.id} inv={inv} />
            ))}
          </div>
        ));
    } else {
      const byYear = {};
      filtered.forEach((inv) => {
        const yr = inv.date?.split('-')[0];
        (byYear[yr] = byYear[yr] || []).push(inv);
      });
      return Object.keys(byYear)
        .sort((a, b) => b - a)
        .map((yr) => (
          <div key={yr} className="vd-year-group">
            <div className="vd-year-lbl">{yr}</div>
            {byYear[yr].map((inv) => (
              <VisitItem key={inv.id} inv={inv} />
            ))}
          </div>
        ));
    }
  };

  const renderInfo = () => (
    <>
      <div className="vd-info-grid">
        <div className="vd-info-item">
          <div className="vd-info-lbl">Mobile</div>
          <div className="vd-info-val" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.80rem' }}>
            {customer.mobile}
          </div>
        </div>
        <div className="vd-info-item">
          <div className="vd-info-lbl">GST Number</div>
          <div className="vd-info-val" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
            {customer.gst_number || '—'}
          </div>
        </div>
        <div className="vd-info-item">
          <div className="vd-info-lbl">Email</div>
          <div className="vd-info-val" style={{ fontSize: '0.78rem' }}>{customer.email || '—'}</div>
        </div>
        <div className="vd-info-item">
          <div className="vd-info-lbl">Customer Since</div>
          <div className="vd-info-val">
            {new Date(customer.created_at).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </div>
        </div>
      </div>
      {customer.address && (
        <div className="vd-info-item" style={{ marginBottom: 14 }}>
          <div className="vd-info-lbl">Address</div>
          <div className="vd-info-val" style={{ fontSize: '0.80rem', lineHeight: 1.55 }}>
            {customer.address}
          </div>
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div className="vd-info-item">
          <div className="vd-info-lbl">Avg Invoice</div>
          <div className="vd-info-val">
            {invoices.length ? fmt(Math.round(totalSpent / invoices.length)) : '—'}
          </div>
        </div>
        <div className="vd-info-item">
          <div className="vd-info-lbl">Last Visit</div>
          <div className="vd-info-val" style={{ fontSize: '0.78rem' }}>
            {invoices[0]
              ? new Date(invoices[0].date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </div>
        </div>
        <div className="vd-info-item">
          <div className="vd-info-lbl">Paid %</div>
          <div className="vd-info-val" style={{ color: '#34d399' }}>
            {totalSpent ? Math.round((totalPaid / totalSpent) * 100) + '%' : '—'}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="vd-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="vd-panel">

        {/* Hero header */}
        <div className="vd-hero">
          <div className="vd-head-row">
            <div className="vd-info">
              <div className="vd-avatar">{initials}</div>
              <div className="vd-name-block">
                <div className="vd-name">{customer.name}</div>
                <div className="vd-phone">📱 {customer.mobile}</div>
              </div>
            </div>
            <button className="vd-close" onClick={onClose}>✕</button>
          </div>

          {/* KPIs */}
          <div className="vd-kpis">
            <div className="vd-kpi">
              <div className="vd-kpi-val">{loading ? '…' : invoices.length}</div>
              <div className="vd-kpi-lbl">Visits</div>
            </div>
            <div className="vd-kpi">
              <div className="vd-kpi-val" style={{ fontSize: totalSpent >= 100000 ? '0.85rem' : '1.1rem' }}>
                {loading ? '…' : fmt(totalSpent)}
              </div>
              <div className="vd-kpi-lbl">Total</div>
            </div>
            <div className="vd-kpi">
              <div className="vd-kpi-val" style={{ fontSize: totalPaid >= 100000 ? '0.85rem' : '1.1rem' }}>
                {loading ? '…' : fmt(totalPaid)}
              </div>
              <div className="vd-kpi-lbl">Paid</div>
            </div>
            <div className="vd-kpi">
              <div
                className="vd-kpi-val"
                style={{
                  color: totalBal > 0 ? '#fb7185' : '#34d399',
                  fontSize: totalBal >= 100000 ? '0.85rem' : '1.1rem',
                }}
              >
                {loading ? '…' : fmt(totalBal)}
              </div>
              <div className="vd-kpi-lbl">Balance</div>
            </div>
          </div>
        </div>

        {/* Spark chart */}
        {!loading && invoices.length > 0 && <SparkBars invoices={invoices} />}

        {/* Year tabs */}
        {!loading && years.length > 0 && (
          <div className="vd-tabs">
            {['All', ...years].map((y) => (
              <button
                key={y}
                className={`vd-tab${yearTab === y ? ' active' : ''}`}
                onClick={() => setYearTab(y)}
              >
                {y}
              </button>
            ))}
          </div>
        )}

        {/* Body tabs */}
        <div className="vd-body-tabs">
          <div
            className={`vd-body-tab${bodyTab === 'history' ? ' active' : ''}`}
            onClick={() => setBodyTab('history')}
          >
            Purchase History
          </div>
          <div
            className={`vd-body-tab${bodyTab === 'info' ? ' active' : ''}`}
            onClick={() => setBodyTab('info')}
          >
            Customer Info
          </div>
        </div>

        {/* Scrollable content */}
        <div className="vd-body">
          {bodyTab === 'history' ? (
            <>
              <div className="vd-section-lbl">
                Visit history{filtered.length > 0 ? ` · ${filtered.length} invoices` : ''}
              </div>
              {renderVisits()}
            </>
          ) : (
            <>
              <div className="vd-section-lbl">Customer details</div>
              {renderInfo()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════
   CUSTOMER CARD
═══════════════════════════════════ */
const CustomerCard = ({ c, index, onEdit, onDelete, onView }) => {
  const initials = c.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="cp-card" onClick={() => onView(c)}>
      <div className="cp-card-accent" />
      <div className="cp-card-body">
        <div className="cp-card-top">
          <div className="cp-avatar">{initials}</div>
          <div className="cp-card-name-block">
            <div className="cp-card-name">{c.name}</div>
            <div className="cp-card-phone">{c.mobile}</div>
            <div className="cp-card-gst">
              {c.gst_number ? `GST · ${c.gst_number}` : 'No GST registered'}
            </div>
          </div>
        </div>

        <div className="cp-card-fields">
          {c.email && (
            <div className="cp-card-field">
              <span className="cp-field-icon">✉</span>
              <span className="cp-field-text">{c.email}</span>
            </div>
          )}
          {c.address && (
            <div className="cp-card-field">
              <span className="cp-field-icon">📍</span>
              <span className="cp-field-text">{c.address}</span>
            </div>
          )}
          <div className="cp-card-field">
            <span className="cp-field-icon">🗓</span>
            <span className="cp-field-text">
              Since{' '}
              {new Date(c.created_at).toLocaleDateString('en-IN', {
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      <div className="cp-card-foot">
        <button
          className="cp-act-btn view"
          onClick={(e) => { e.stopPropagation(); onView(c); }}
        >
        History
        </button>
        <button
          className="cp-act-btn edit"
          onClick={(e) => { e.stopPropagation(); onEdit(c); }}
        >
          Edit
        </button>
        <button
          className="cp-act-btn del"
          onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════
   STAT CARD
═══════════════════════════════════ */
const StatCard = ({ cls, icon, label, value, sub }) => (
  <div className={`stat-card ${cls}`}>
    <div className="stat-card-icon">{icon}</div>
    <div className="stat-lbl">{label}</div>
    <div className="stat-val">{value}</div>
    {sub && <div className="stat-sub">{sub}</div>}
  </div>
);

/* ═══════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════ */
const Customers = () => {
  const [bizStats, setBizStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showForm, setShowForm] = useState(false);
  const [drawerCust, setDrawerCust] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth()); // 0-indexed
  const [filterYear, setFilterYear]   = useState(now.getFullYear());
  const [monthStats, setMonthStats]   = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
  authAxios.get("business/dashboard/")
    .then(r => setBizStats(r.data))
    .catch(() => setBizStats({}));
}, []);



  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadCustomers = useCallback(async (q = '') => {
    try {
      const data = await getCustomers(q);
      setCustomers(data || []);
    } catch {
      showToast('Failed to load customers.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setSyncing(true);
      await syncCustomersFromInvoices();
      setSyncing(false);
      await loadCustomers();
    };
    init();
  }, [loadCustomers]);

  useEffect(() => {
    const t = setTimeout(() => loadCustomers(search), 300);
    return () => clearTimeout(t);
  }, [search, loadCustomers]);



  useEffect(() => {
  const fetchMonthStats = async () => {
    setStatsLoading(true);
    try {
      const res = await authAxios.get("business/invoices/", {
        params: {
          // No date filter on backend? Filter on frontend:
        }
      });
      const all = res.data || [];
      // Filter by selected month + year on frontend
      const filtered = all.filter((inv) => {
        const d = new Date(inv.created_at || inv.date);
        return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
      });
      const revenue  = filtered.reduce((s, i) => s + Number(i.total   || 0), 0);
      const paid     = filtered.reduce((s, i) => s + Number(i.advance || 0), 0);
      const balance  = filtered.reduce((s, i) => s + Number(i.balance || 0), 0);
      setMonthStats({ count: filtered.length, revenue, paid, balance });
    } catch {
      setMonthStats(null);
    } finally {
      setStatsLoading(false);
    }
  };
  fetchMonthStats();
}, [filterMonth, filterYear]);




  /* ── Sort ── */
  const sorted = [...customers].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    return 0;
  });

  /* ── Form handlers ── */
  const openAdd = () => { setEditId(null); setForm(BLANK); setShowForm(true); };
  const cancelForm = () => { setShowForm(false); setEditId(null); setForm(BLANK); };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.mobile.trim()) {
      showToast('Name and mobile are required.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editId !== null) {
        const updated = await updateCustomer(editId, form);
        setCustomers((prev) => prev.map((c) => (c.id === editId ? updated : c)));
        showToast('Customer updated ✓');
        setEditId(null);
      } else {
        const created = await createCustomer(form);
        setCustomers((prev) => [created, ...prev]);
        showToast('Customer saved ✓');
      }
      setForm(BLANK);
      setShowForm(false);
    } catch {
      showToast('Failed to save customer.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (c) => {
    setEditId(c.id);
    setForm({
      name: c.name,
      mobile: c.mobile || '',
      email: c.email || '',
      address: c.address || '',
      gst_number: c.gst_number || '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await deleteCustomer(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      showToast('Customer deleted.');
    } catch {
      showToast('Failed to delete.', 'error');
    }
  };

  /* ── Stats ── */
  const totalCustomers = customers.length;

  /* ── Render ── */
  return (
    <>
      <div className="cp">
        {/* Toast */}
        {toast && (
          <div className={`cp-toast${toast.type === 'error' ? ' error' : ''}`}>{toast.msg}</div>
        )}

        {/* Header */}
        <div className="cp-header">
          <div>
            <div className="cp-title">Customers</div>
            <div className="cp-subtitle">
              {syncing
                ? '⟳ Syncing from invoices…'
                : `${totalCustomers} client${totalCustomers !== 1 ? 's' : ''} · all time`}
            </div>
          </div>
          {!showForm && (
            <button className="cp-add-btn" onClick={openAdd}>
              <span style={{ fontSize: 16 }}>＋</span> Add Customer
            </button>
          )}
        </div>

      
        {/* Month/Year filter row */}
        <div className="cp-month-filter">
          <span className="cp-filter-label">📅 Monthly stats</span>
          <select
            className="cp-month-sel"
            value={filterMonth}
            onChange={(e) => setFilterMonth(Number(e.target.value))}
          >
            {['January','February','March','April','May','June','July',
              'August','September','October','November','December']
              .map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select
            className="cp-month-sel"
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {(filterMonth !== now.getMonth() || filterYear !== now.getFullYear()) && (
            <button
              className="cp-reset-btn"
              onClick={() => { setFilterMonth(now.getMonth()); setFilterYear(now.getFullYear()); }}
            >
              ↩ Current month
            </button>
          )}
          <span className="cp-month-badge">
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][filterMonth]} {filterYear}
          </span>
        </div>
        
        {/* Stats strip */}
        <div className="cp-stats">
          <StatCard
            cls="s1"
            icon="👥"
            label="Total Clients"
            value={totalCustomers}
            sub="registered customers"
          />
          <StatCard
            cls="s2"
            icon="📋"
            label="Pending Balance"
            value={statsLoading ? '…' : fmt(monthStats?.balance ?? 0)}
            sub={`${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][filterMonth]} dues`}
          />
          <StatCard
            cls="s3"
            icon="✅"
            label="Collected"
            value={statsLoading ? '…' : fmt(monthStats?.paid ?? 0)}
            sub={`${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][filterMonth]} received`}
          />
          <StatCard
            cls="s4"
            icon="🧾"
            label="Invoices"
            value={statsLoading ? '…' : (monthStats?.count ?? '—')}
            sub={`₹${Number(monthStats?.revenue ?? 0).toLocaleString('en-IN')} billed`}
          />
        </div>   
        
        
        

        {/* Add / Edit Form */}
        {showForm && (
          <div className="cp-form">
            <div className="cp-form-title">{editId ? '✏ Edit Customer' : '＋ New Customer'}</div>
            <div className="cp-form-grid">
              <div className="cp-field">
                <label className="cp-label">Full Name *</label>
                <input
                  className="cp-input"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Customer full name"
                />
              </div>
              <div className="cp-field">
                <label className="cp-label">Mobile Number *</label>
                <input
                  className="cp-input"
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  placeholder="10-digit mobile"
                  maxLength={10}
                />
              </div>
              <div className="cp-field">
                <label className="cp-label">Email Address</label>
                <input
                  className="cp-input"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                />
              </div>
              <div className="cp-field">
                <label className="cp-label">GST Number</label>
                <input
                  className="cp-input"
                  name="gst_number"
                  value={form.gst_number}
                  onChange={handleChange}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
              <div className="cp-field full">
                <label className="cp-label">Address</label>
                <textarea
                  className="cp-textarea"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Full address"
                />
              </div>
            </div>
            <div className="cp-form-btns">
              <button className="cp-save-btn" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving…' : editId ? 'Update Customer' : 'Save Customer'}
              </button>
              <button className="cp-cancel-btn" onClick={cancelForm}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="cp-toolbar">
          <div className="cp-search-wrap">
            <span className="cp-search-icon">⌕</span>
            <input
              placeholder="Search by name or mobile…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="cp-sort-sel"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>

        {/* Customer Grid */}
        <div className="cp-grid">
          {loading ? (
            <div className="cp-spinner">
              {syncing ? '⟳ Syncing customers from invoices…' : '⟳ Loading customers…'}
            </div>
          ) : sorted.length === 0 ? (
            <div className="cp-empty">
              <div className="cp-empty-ico">◎</div>
              <p>{search ? 'No customers match your search.' : 'No customers yet.'}</p>
              <small>
                {search ? 'Try a different search term.' : 'Click Add Customer to get started.'}
              </small>
            </div>
          ) : (
            sorted.map((c, i) => (
              <CustomerCard
                key={c.id}
                c={c}
                index={i}
                onEdit={startEdit}
                onDelete={handleDelete}
                onView={setDrawerCust}
              />
            ))
          )}
        </div>
      </div>

      {/* Visit Drawer */}
      {drawerCust && (
        <VisitDrawer customer={drawerCust} onClose={() => setDrawerCust(null)} />
      )}
    </>
  );
};

export default Customers;
