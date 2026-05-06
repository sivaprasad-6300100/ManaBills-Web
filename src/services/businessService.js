// ─────────────────────────────────────────────────────────────
// ADDITIONS TO: src/services/businessService.js
// Add these functions to your existing businessService.js file
// ─────────────────────────────────────────────────────────────

import { authAxios } from "./api";

const BASE = "business/";   // adjust to match your URL prefix

/* ── Dashboard stats ─────────────────────────────────────── */
export const getDashboardStats = async () => {
  const res = await authAxios.get(`${BASE}dashboard/`);
  return res.data;
};

/* ── Shop Profile ────────────────────────────────────────── */
export const getShopProfile = async () => {
  const res = await authAxios.get(`${BASE}shop-profile/`);
  return res.data;
};

export const saveShopProfile = async (data) => {
  const res = await authAxios.post(`${BASE}shop-profile/`, data);
  return res.data;
};

export const deleteShopProfile = async () => {
  await authAxios.delete(`${BASE}shop-profile/`);
};

/* ── Customers ───────────────────────────────────────────── */
export const getCustomers = async (search = "") => {
  const params = search ? { search } : {};
  const res = await authAxios.get(`${BASE}customers/`, { params });
  return res.data;
};

export const createCustomer = async (data) => {
  const res = await authAxios.post(`${BASE}customers/`, data);
  return res.data;
};

export const updateCustomer = async (id, data) => {
  const res = await authAxios.patch(`${BASE}customers/${id}/`, data);
  return res.data;
};

export const deleteCustomer = async (id) => {
  await authAxios.delete(`${BASE}customers/${id}/`);
};

/* ── Products / Stock ────────────────────────────────────── */
export const getProducts = async () => {
  const res = await authAxios.get(`${BASE}products/`);
  return res.data;
};

export const addProduct = async (data) => {
  const res = await authAxios.post(`${BASE}products/`, data);
  return res.data;
};

export const updateProduct = async (id, data) => {
  const res = await authAxios.patch(`${BASE}products/${id}/`, data);
  return res.data;
};

export const deleteProduct = async (id) => {
  await authAxios.delete(`${BASE}products/${id}/`);
};

export const searchProducts = async (query) => {
  const res = await authAxios.get(`${BASE}products/search/`, { params: { q: query } });
  return res.data;
};

export const getLowStockProducts = async () => {
  const res = await authAxios.get(`${BASE}products/low-stock/`);
  return res.data;
};

export const getProductStats = async () => {
  const res = await authAxios.get(`${BASE}products/stats/`);
  return res.data;
};

/* ── Invoices ────────────────────────────────────────────── */
export const getInvoices = async (params = {}) => {
  const res = await authAxios.get(`${BASE}invoices/`, { params });
  return res.data;
};

export const getInvoiceById = async (id) => {
  const res = await authAxios.get(`${BASE}invoices/${id}/`);
  return res.data;
};

export const createInvoice = async (data) => {
  const res = await authAxios.post(`${BASE}invoices/`, data);
  return res.data;
};

/**
 * UPDATE invoice — PATCH /api/business/invoices/<id>/
 * Accepts: customer_name, customer_mobile, customer_gst,
 *          payment, advance, discount, status
 */
export const updateInvoice = async (id, data) => {
  const res = await authAxios.patch(`${BASE}invoices/${id}/`, data);
  return res.data;
};

/**
 * MARK PAID — PATCH /api/business/invoices/<id>/mark-paid/
 * Sets advance = total, auto-calculates status + balance
 */
export const markInvoicePaid = async (id) => {
  const res = await authAxios.patch(`${BASE}invoices/${id}/mark-paid/`);
  return res.data;
};

export const deleteInvoice = async (id) => {
  await authAxios.delete(`${BASE}invoices/${id}/`);
};

/* ── GST Reports ─────────────────────────────────────────── */
export const getGstReports = async (year, view = "monthly") => {
  const res = await authAxios.get(`${BASE}gst-reports/`, { params: { year, view } });
  return res.data;
};

export const updateInvoiceItems = (id, data) =>
  authAxios.patch(`${BASE}invoices/${id}/`, data).then((r) => r.data);

/* ── Jobs ────────────────────────────────────────────────── */
export const getJobs   = () => authAxios.get(`${BASE}jobs/`).then(r => r.data);
export const createJob = (data) => authAxios.post(`${BASE}jobs/`, data).then(r => r.data);
export const deleteJob = (id) => authAxios.delete(`${BASE}jobs/${id}/`);
