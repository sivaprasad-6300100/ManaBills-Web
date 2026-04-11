// ─────────────────────────────────────────────────────────────
//  businessService.js
//  Single source of truth for ALL Business Billing API calls.
//  Place this file in:  src/services/businessService.js
//
//  Every component imports from here — never calls authAxios directly.
// ─────────────────────────────────────────────────────────────

import { authAxios } from "./api";

const BASE = "business/";        // maps to  /api/business/  on the backend

// ═══════════════════════════════════════════════════════════
//   SHOP PROFILE
// ═══════════════════════════════════════════════════════════

/** GET  /api/business/shop-profile/ */
export const getShopProfile = () =>
  authAxios.get(`${BASE}shop-profile/`).then((r) => r.data);

/** POST /api/business/shop-profile/  (creates or updates — upsert) */
export const saveShopProfile = (data) =>
  authAxios.post(`${BASE}shop-profile/`, data).then((r) => r.data);

/** DELETE /api/business/shop-profile/ */
export const deleteShopProfile = () =>
  authAxios.delete(`${BASE}shop-profile/`).then((r) => r.data);


// ═══════════════════════════════════════════════════════════
//   CUSTOMERS
// ═══════════════════════════════════════════════════════════

/** GET  /api/business/customers/?search= */
export const getCustomers = (search = "") =>
  authAxios
    .get(`${BASE}customers/`, { params: search ? { search } : {} })
    .then((r) => r.data);

/** POST /api/business/customers/ */
export const createCustomer = (data) =>
  authAxios.post(`${BASE}customers/`, data).then((r) => r.data);

/** PATCH /api/business/customers/<id>/ */
export const updateCustomer = (id, data) =>
  authAxios.patch(`${BASE}customers/${id}/`, data).then((r) => r.data);

/** DELETE /api/business/customers/<id>/ */
export const deleteCustomer = (id) =>
  authAxios.delete(`${BASE}customers/${id}/`).then((r) => r.data);


// ═══════════════════════════════════════════════════════════
//   PRODUCTS  (Stock)
// ═══════════════════════════════════════════════════════════

/** GET  /api/business/products/?search=&category= */
export const getProducts = (params = {}) =>
  authAxios.get(`${BASE}products/`, { params }).then((r) => r.data);

/** GET  /api/business/products/search/?q=  — for invoice autocomplete */
export const searchProducts = (q) =>
  authAxios
    .get(`${BASE}products/search/`, { params: { q } })
    .then((r) => r.data);

/** GET  /api/business/products/low-stock/ */
export const getLowStockProducts = () =>
  authAxios.get(`${BASE}products/low-stock/`).then((r) => r.data);

/** GET  /api/business/products/stats/ */
export const getProductStats = () =>
  authAxios.get(`${BASE}products/stats/`).then((r) => r.data);

/** POST /api/business/products/  (auto-merges if same name) */
export const addProduct = (data) =>
  authAxios.post(`${BASE}products/`, data).then((r) => r.data);

/** PATCH /api/business/products/<id>/ */
export const updateProduct = (id, data) =>
  authAxios.patch(`${BASE}products/${id}/`, data).then((r) => r.data);

/** DELETE /api/business/products/<id>/  (soft delete) */
export const deleteProduct = (id) =>
  authAxios.delete(`${BASE}products/${id}/`).then((r) => r.data);


// ═══════════════════════════════════════════════════════════
//   INVOICES
// ═══════════════════════════════════════════════════════════

/**
 * GET /api/business/invoices/
 * params: { search, status, payment }
 */
export const getInvoices = (params = {}) =>
  authAxios.get(`${BASE}invoices/`, { params }).then((r) => r.data);

/**
 * POST /api/business/invoices/
 * Backend auto-deducts stock and sets status.
 *
 * payload shape:
 * {
 *   invoice_id, customer_name, customer_mobile, customer_gst,
 *   shop_name, shop_address, shop_gst,
 *   subtotal, gst_amt, discount, advance, total,
 *   is_gst, payment, date,
 *   items: [{ product, name, qty, price, unit, is_stock_item }]
 * }
 */
export const createInvoice = (data) =>
  authAxios.post(`${BASE}invoices/`, data).then((r) => r.data);

/** PATCH /api/business/invoices/<id>/mark-paid/ */
export const markInvoicePaid = (id) =>
  authAxios
    .patch(`${BASE}invoices/${id}/mark-paid/`)
    .then((r) => r.data);

/** DELETE /api/business/invoices/<id>/ */
export const deleteInvoice = (id) =>
  authAxios.delete(`${BASE}invoices/${id}/`).then((r) => r.data);


// ═══════════════════════════════════════════════════════════
//   GST REPORTS
// ═══════════════════════════════════════════════════════════

/** GET /api/business/gst-reports/?year=2025&view=monthly|quarterly */
export const getGstReports = (year, view = "monthly") =>
  authAxios
    .get(`${BASE}gst-reports/`, { params: { year, view } })
    .then((r) => r.data);


// ═══════════════════════════════════════════════════════════
//   DASHBOARD STATS
// ═══════════════════════════════════════════════════════════

/** GET /api/business/dashboard/ */
export const getDashboardStats = () =>
  authAxios.get(`${BASE}dashboard/`).then((r) => r.data);
