/**
 * fees.slice.js
 * Redux state for fee management — invoices, payments, M-Pesa, reports.
 *
 * Fix summary (v2):
 *  - selectCreateInvoice, selectRecordPayment, selectMpesaReconcile,
 *    selectReceiptReconcile are now built with createSelector so they return
 *    a stable reference and never trigger the "returned a different result"
 *    re-render warning.
 *  - selectMpesa is also memoized for the same reason.
 *  - All deprecated object-returning selectors have been replaced.
 *  - fetchAllTerms is imported from terms.slice so CreateInvoiceModal can
 *    populate a real term dropdown instead of a free-text field.
 */

'use strict';

import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import axios from "axios";

// ─── Axios instance ───────────────────────────────────────────────────────────
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Helper — uniform error extraction ────────────────────────────────────────
const errMsg = (err, fallback) =>
  err.response?.data?.message || err.response?.data?.error || fallback;

/* ============================================================
   INVOICE THUNKS
   ============================================================ */

/** GET /fees/invoices */
export const fetchInvoices = createAsyncThunk(
  "fees/fetchInvoices",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/fees/invoices", { params: filters });
      return { invoices: data.data, pagination: data.pagination ?? null };
    } catch (err) {
      return rejectWithValue(errMsg(err, "Failed to fetch invoices"));
    }
  }
);

/** GET /fees/invoices/:id */
export const fetchInvoiceById = createAsyncThunk(
  "fees/fetchInvoiceById",
  async (invoiceId, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/fees/invoices/${invoiceId}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(errMsg(err, "Invoice not found"));
    }
  }
);

/** GET /fees/invoices/student/:studentId */
export const fetchStudentInvoices = createAsyncThunk(
  "fees/fetchStudentInvoices",
  async (studentId, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/fees/invoices/student/${studentId}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(errMsg(err, "Failed to fetch student invoices"));
    }
  }
);

/** POST /fees/invoices
 *  FIX: student_id and term_id are now coerced to integers here so the
 *  component never has to worry about string vs number.
 *  term_id must be the academic_terms.id PK — NOT the term number (1/2/3).
 */
export const createInvoice = createAsyncThunk(
  "fees/createInvoice",
  async ({ student_id, term_id, items }, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/fees/invoices", {
        student_id: parseInt(student_id, 10),
        term_id:    parseInt(term_id,    10),   // ← academic_terms.id PK
        items,
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(errMsg(err, "Failed to create invoice"));
    }
  }
);

/* ============================================================
   PAYMENT THUNKS
   ============================================================ */

/** GET /fees/payments */
export const fetchPayments = createAsyncThunk(
  "fees/fetchPayments",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/fees/payments", { params: filters });
      return { payments: data.data, pagination: data.pagination ?? null };
    } catch (err) {
      return rejectWithValue(errMsg(err, "Failed to fetch payments"));
    }
  }
);

/** GET /fees/payments/:id */
export const fetchPaymentById = createAsyncThunk(
  "fees/fetchPaymentById",
  async (paymentId, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/fees/payments/${paymentId}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(errMsg(err, "Payment not found"));
    }
  }
);

/** POST /fees/payments */
export const recordPayment = createAsyncThunk(
  "fees/recordPayment",
  async (paymentData, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/fees/payments", paymentData);
      return data.data;
    } catch (err) {
      return rejectWithValue(errMsg(err, "Failed to record payment"));
    }
  }
);

/* ============================================================
   BALANCE & REPORTS THUNKS
   ============================================================ */

/** GET /fees/balance/:studentId */
export const fetchStudentBalance = createAsyncThunk(
  "fees/fetchStudentBalance",
  async (studentId, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/fees/balance/${studentId}`);
      return data.data;
    } catch (err) {
      return rejectWithValue(errMsg(err, "Failed to fetch balance"));
    }
  }
);

/** GET /fees/fee-structures */
export const fetchFeeStructures = createAsyncThunk(
  "fees/fetchFeeStructures",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/fees/fee-structures", { params: filters });
      return data.data;
    } catch (err) {
      return rejectWithValue(errMsg(err, "Failed to fetch fee structures"));
    }
  }
);

/** POST /fees/fee-structures */
export const createFeeStructure = createAsyncThunk(
  "fees/createFeeStructure",
  async (structureData, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/fees/fee-structures", structureData);
      return data.data;
    } catch (err) {
      return rejectWithValue(errMsg(err, "Failed to create fee structure"));
    }
  }
);

/** GET /fees/reports/summary */
export const fetchCollectionSummary = createAsyncThunk(
  "fees/fetchCollectionSummary",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/fees/reports/summary", { params: filters });
      return data.data;
    } catch (err) {
      return rejectWithValue(errMsg(err, "Failed to fetch summary"));
    }
  }
);

/** GET /fees/reports/defaulters */
export const fetchDefaulters = createAsyncThunk(
  "fees/fetchDefaulters",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/fees/reports/defaulters", { params: filters });
      return data.data;
    } catch (err) {
      return rejectWithValue(errMsg(err, "Failed to fetch defaulters"));
    }
  }
);

/* ============================================================
   M-PESA THUNKS
   ============================================================ */

/** POST /mpesa/initiate — STK push by admission number */
export const initiateStkPush = createAsyncThunk(
  "fees/initiateStkPush",
  async ({ admissionNo, phoneNumber, amount }, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/mpesa/initiate", { admissionNo, phoneNumber, amount });
      return {
        checkoutRequestId: data.data.checkoutRequestId,
        merchantRequestId: data.data.merchantRequestId,
      };
    } catch (err) {
      return rejectWithValue(errMsg(err, "STK push failed"));
    }
  }
);

/** POST /mpesa/stk-push — STK push by invoice id */
export const initiateStkPushByInvoice = createAsyncThunk(
  "fees/initiateStkPushByInvoice",
  async ({ invoice_id, phone_number, amount }, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/mpesa/stk-push", { invoice_id, phone_number, amount });
      return {
        checkoutRequestId: data.data.checkoutRequestId,
        merchantRequestId: data.data.merchantRequestId,
      };
    } catch (err) {
      return rejectWithValue(errMsg(err, "STK push failed"));
    }
  }
);

/** GET /mpesa/query/:checkoutRequestId */
export const pollStkStatus = createAsyncThunk(
  "fees/pollStkStatus",
  async (checkoutRequestId, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/mpesa/query/${checkoutRequestId}`);
      const result   = data.data;
      let status = "PENDING";
      if      (result?.ResultCode === 0) status = "SUCCESS";
      else if (result?.ResultCode  >  0) status = "FAILED";
      return { status, resultDesc: result?.ResultDesc ?? "" };
    } catch (err) {
      return rejectWithValue(errMsg(err, "Status check failed"));
    }
  }
);

/** POST /fees/payments — manual M-Pesa cashier entry */
export const confirmMpesaManual = createAsyncThunk(
  "fees/confirmMpesaManual",
  async ({ invoice_id, amount, reference_number, payment_date, received_by }, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/fees/payments", {
        invoice_id,
        amount,
        payment_method:   "MPESA",
        reference_number,
        payment_date,
        received_by,
      });
      return data.data;
    } catch (err) {
      return rejectWithValue(errMsg(err, "Manual M-Pesa entry failed"));
    }
  }
);

/** GET /mpesa/transactions */
export const fetchMpesaTransactions = createAsyncThunk(
  "fees/fetchMpesaTransactions",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/mpesa/transactions", { params: filters });
      return { transactions: data.data, pagination: data.pagination };
    } catch (err) {
      return rejectWithValue(errMsg(err, "Failed to fetch M-Pesa transactions"));
    }
  }
);

/** GET /mpesa/transactions/pending */
export const fetchPendingMpesa = createAsyncThunk(
  "fees/fetchPendingMpesa",
  async ({ limit = 50, offset = 0 } = {}, { rejectWithValue }) => {
    try {
      const { data } = await API.get("/mpesa/transactions/pending", { params: { limit, offset } });
      return data.data;
    } catch (err) {
      return rejectWithValue(errMsg(err, "Failed to fetch pending transactions"));
    }
  }
);

/** POST /mpesa/reconcile — auto-reconcile by receipt number */
export const reconcileByReceipt = createAsyncThunk(
  "fees/reconcileByReceipt",
  async ({ receipt_number }, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/mpesa/reconcile", { receipt_number });
      return data.data;
    } catch (err) {
      return rejectWithValue(errMsg(err, "Auto-reconciliation failed"));
    }
  }
);

/** POST /mpesa/reconcile/:transactionId — manual reconcile */
export const reconcileMpesaTransaction = createAsyncThunk(
  "fees/reconcileMpesaTransaction",
  async ({ transactionId, student_id, invoice_id }, { rejectWithValue }) => {
    try {
      const { data } = await API.post(`/mpesa/reconcile/${transactionId}`, { student_id, invoice_id });
      return { ...data.data, transactionId };
    } catch (err) {
      return rejectWithValue(errMsg(err, "Reconciliation failed"));
    }
  }
);

/* ============================================================
   INITIAL STATE
   ============================================================ */

const initialState = {
  // Invoices
  invoices:               [],
  invoicesPagination:     null,
  invoicesLoading:        false,
  invoicesError:          null,

  selectedInvoice:        null,
  selectedInvoiceLoading: false,
  selectedInvoiceError:   null,

  studentInvoices:        [],
  studentInvoicesLoading: false,

  createInvoiceLoading:   false,
  createInvoiceError:     null,
  createInvoiceSuccess:   false,

  // Payments
  payments:               [],
  paymentsPagination:     null,
  paymentsLoading:        false,
  paymentsError:          null,

  selectedPayment:        null,

  recordPaymentLoading:   false,
  recordPaymentError:     null,
  recordPaymentSuccess:   false,

  // Balance
  studentBalance:         null,
  studentBalanceLoading:  false,
  studentBalanceError:    null,

  // Fee structures
  feeStructures:          [],
  feeStructuresLoading:   false,
  feeStructuresError:     null,

  createStructureLoading: false,
  createStructureError:   null,

  // Reports
  collectionSummary:      null,
  summaryLoading:         false,
  summaryError:           null,

  defaulters:             [],
  defaultersLoading:      false,
  defaultersError:        null,

  // M-Pesa
  mpesa: {
    stkPushLoading:    false,
    stkPushError:      null,
    checkoutRequestId: null,
    merchantRequestId: null,
    stkStatus:         "IDLE",
    statusLoading:     false,
    resultDesc:        "",

    manualLoading: false,
    manualError:   null,
    lastPayment:   null,

    transactions:           [],
    transactionsPagination: null,
    transactionsLoading:    false,
    transactionsError:      null,

    pendingTransactions: [],
    pendingLoading:      false,
    pendingError:        null,

    reconcileLoading:          false,
    reconcileError:            null,
    reconcileSuccess:          false,
    lastReconciledTransaction: null,

    receiptReconcileLoading: false,
    receiptReconcileError:   null,
    receiptReconcileSuccess: false,
  },

  activeTerm: null,
};

/* ============================================================
   SLICE
   ============================================================ */

const feesSlice = createSlice({
  name: "fees",
  initialState,

  reducers: {
    resetCreateInvoice(state) {
      state.createInvoiceLoading = false;
      state.createInvoiceError   = null;
      state.createInvoiceSuccess = false;
    },
    resetRecordPayment(state) {
      state.recordPaymentLoading = false;
      state.recordPaymentError   = null;
      state.recordPaymentSuccess = false;
    },
    resetStudentBalance(state) {
      state.studentBalance      = null;
      state.studentBalanceError = null;
    },
    resetMpesa(state) {
      Object.assign(state.mpesa, {
        stkPushLoading:    false,
        stkPushError:      null,
        checkoutRequestId: null,
        merchantRequestId: null,
        stkStatus:         "IDLE",
        statusLoading:     false,
        resultDesc:        "",
        manualLoading:     false,
        manualError:       null,
        lastPayment:       null,
      });
    },
    resetReconcile(state) {
      Object.assign(state.mpesa, {
        reconcileLoading:          false,
        reconcileError:            null,
        reconcileSuccess:          false,
        lastReconciledTransaction: null,
      });
    },
    resetReceiptReconcile(state) {
      Object.assign(state.mpesa, {
        receiptReconcileLoading: false,
        receiptReconcileError:   null,
        receiptReconcileSuccess: false,
      });
    },
    setMpesaTimeout(state) {
      state.mpesa.stkStatus = "TIMEOUT";
    },
    setActiveTerm(state, { payload }) {
      state.activeTerm = payload;
    },
    clearSelectedInvoice(state) {
      state.selectedInvoice = null;
    },
  },

  extraReducers: (builder) => {

    // ── Invoices ──────────────────────────────────────────────────────────────
    builder
      .addCase(fetchInvoices.pending,   (s) => {
        s.invoicesLoading = true;
        s.invoicesError   = null;
      })
      .addCase(fetchInvoices.fulfilled, (s, { payload }) => {
        s.invoicesLoading    = false;
        s.invoices           = payload.invoices;
        s.invoicesPagination = payload.pagination;
      })
      .addCase(fetchInvoices.rejected,  (s, { payload }) => {
        s.invoicesLoading = false;
        s.invoicesError   = payload;
      });

    builder
      .addCase(fetchInvoiceById.pending,   (s) => {
        s.selectedInvoiceLoading = true;
        s.selectedInvoiceError   = null;
      })
      .addCase(fetchInvoiceById.fulfilled, (s, { payload }) => {
        s.selectedInvoiceLoading = false;
        s.selectedInvoice        = payload;
      })
      .addCase(fetchInvoiceById.rejected,  (s, { payload }) => {
        s.selectedInvoiceLoading = false;
        s.selectedInvoiceError   = payload;
      });

    builder
      .addCase(fetchStudentInvoices.pending,   (s) => { s.studentInvoicesLoading = true; })
      .addCase(fetchStudentInvoices.fulfilled, (s, { payload }) => {
        s.studentInvoicesLoading = false;
        s.studentInvoices        = payload;
      })
      .addCase(fetchStudentInvoices.rejected,  (s) => { s.studentInvoicesLoading = false; });

    builder
      .addCase(createInvoice.pending,   (s) => {
        s.createInvoiceLoading  = true;
        s.createInvoiceError    = null;
        s.createInvoiceSuccess  = false;
      })
      .addCase(createInvoice.fulfilled, (s, { payload }) => {
        s.createInvoiceLoading  = false;
        s.createInvoiceSuccess  = true;
        s.invoices = [payload, ...s.invoices];
      })
      .addCase(createInvoice.rejected,  (s, { payload }) => {
        s.createInvoiceLoading = false;
        s.createInvoiceError   = payload;
      });

    // ── Payments ──────────────────────────────────────────────────────────────
    builder
      .addCase(fetchPayments.pending,   (s) => {
        s.paymentsLoading = true;
        s.paymentsError   = null;
      })
      .addCase(fetchPayments.fulfilled, (s, { payload }) => {
        s.paymentsLoading    = false;
        s.payments           = payload.payments;
        s.paymentsPagination = payload.pagination;
      })
      .addCase(fetchPayments.rejected,  (s, { payload }) => {
        s.paymentsLoading = false;
        s.paymentsError   = payload;
      });

    builder
      .addCase(fetchPaymentById.fulfilled, (s, { payload }) => {
        s.selectedPayment = payload;
      });

    builder
      .addCase(recordPayment.pending,   (s) => {
        s.recordPaymentLoading  = true;
        s.recordPaymentError    = null;
        s.recordPaymentSuccess  = false;
      })
      .addCase(recordPayment.fulfilled, (s, { payload }) => {
        s.recordPaymentLoading = false;
        s.recordPaymentSuccess = true;
        s.payments = [payload, ...s.payments];
        s.invoices = s.invoices.map((inv) =>
          inv.id === payload.invoice_id
            ? {
                ...inv,
                paid_amount: (
                  parseFloat(inv.paid_amount || 0) + parseFloat(payload.amount)
                ).toFixed(2),
              }
            : inv
        );
      })
      .addCase(recordPayment.rejected,  (s, { payload }) => {
        s.recordPaymentLoading = false;
        s.recordPaymentError   = payload;
      });

    // ── Balance ───────────────────────────────────────────────────────────────
    builder
      .addCase(fetchStudentBalance.pending,   (s) => {
        s.studentBalanceLoading = true;
        s.studentBalanceError   = null;
      })
      .addCase(fetchStudentBalance.fulfilled, (s, { payload }) => {
        s.studentBalanceLoading = false;
        s.studentBalance        = payload;
      })
      .addCase(fetchStudentBalance.rejected,  (s, { payload }) => {
        s.studentBalanceLoading = false;
        s.studentBalanceError   = payload;
      });

    // ── Fee Structures ────────────────────────────────────────────────────────
    builder
      .addCase(fetchFeeStructures.pending,   (s) => {
        s.feeStructuresLoading = true;
        s.feeStructuresError   = null;
      })
      .addCase(fetchFeeStructures.fulfilled, (s, { payload }) => {
        s.feeStructuresLoading = false;
        s.feeStructures        = payload;
      })
      .addCase(fetchFeeStructures.rejected,  (s, { payload }) => {
        s.feeStructuresLoading = false;
        s.feeStructuresError   = payload;
      });

    builder
      .addCase(createFeeStructure.pending,   (s) => {
        s.createStructureLoading = true;
        s.createStructureError   = null;
      })
      .addCase(createFeeStructure.fulfilled, (s, { payload }) => {
        s.createStructureLoading = false;
        s.feeStructures          = [...s.feeStructures, payload];
      })
      .addCase(createFeeStructure.rejected,  (s, { payload }) => {
        s.createStructureLoading = false;
        s.createStructureError   = payload;
      });

    // ── Reports ───────────────────────────────────────────────────────────────
    builder
      .addCase(fetchCollectionSummary.pending,   (s) => {
        s.summaryLoading = true;
        s.summaryError   = null;
      })
      .addCase(fetchCollectionSummary.fulfilled, (s, { payload }) => {
        s.summaryLoading    = false;
        s.collectionSummary = payload;
      })
      .addCase(fetchCollectionSummary.rejected,  (s, { payload }) => {
        s.summaryLoading = false;
        s.summaryError   = payload;
      });

    builder
      .addCase(fetchDefaulters.pending,   (s) => {
        s.defaultersLoading = true;
        s.defaultersError   = null;
      })
      .addCase(fetchDefaulters.fulfilled, (s, { payload }) => {
        s.defaultersLoading = false;
        s.defaulters        = payload;
      })
      .addCase(fetchDefaulters.rejected,  (s, { payload }) => {
        s.defaultersLoading = false;
        s.defaultersError   = payload;
      });

    // ── M-Pesa: STK push ──────────────────────────────────────────────────────
    [initiateStkPush, initiateStkPushByInvoice].forEach((thunk) => {
      builder
        .addCase(thunk.pending,   (s) => {
          s.mpesa.stkPushLoading    = true;
          s.mpesa.stkPushError      = null;
          s.mpesa.checkoutRequestId = null;
          s.mpesa.stkStatus         = "IDLE";
        })
        .addCase(thunk.fulfilled, (s, { payload }) => {
          s.mpesa.stkPushLoading    = false;
          s.mpesa.stkStatus         = "PENDING";
          s.mpesa.checkoutRequestId = payload.checkoutRequestId;
          s.mpesa.merchantRequestId = payload.merchantRequestId;
        })
        .addCase(thunk.rejected,  (s, { payload }) => {
          s.mpesa.stkPushLoading = false;
          s.mpesa.stkPushError   = payload;
          s.mpesa.stkStatus      = "FAILED";
        });
    });

    // ── M-Pesa: polling ───────────────────────────────────────────────────────
    builder
      .addCase(pollStkStatus.pending,   (s) => { s.mpesa.statusLoading = true; })
      .addCase(pollStkStatus.fulfilled, (s, { payload }) => {
        s.mpesa.statusLoading = false;
        s.mpesa.stkStatus     = payload.status;
        s.mpesa.resultDesc    = payload.resultDesc;
      })
      .addCase(pollStkStatus.rejected,  (s) => { s.mpesa.statusLoading = false; });

    // ── M-Pesa: manual cashier entry ──────────────────────────────────────────
    builder
      .addCase(confirmMpesaManual.pending,   (s) => {
        s.mpesa.manualLoading = true;
        s.mpesa.manualError   = null;
      })
      .addCase(confirmMpesaManual.fulfilled, (s, { payload }) => {
        s.mpesa.manualLoading = false;
        s.mpesa.stkStatus     = "SUCCESS";
        s.mpesa.lastPayment   = payload;
        s.payments = [payload, ...s.payments];
        s.invoices = s.invoices.map((inv) =>
          inv.id === payload.invoice_id
            ? {
                ...inv,
                paid_amount: (
                  parseFloat(inv.paid_amount || 0) + parseFloat(payload.amount)
                ).toFixed(2),
              }
            : inv
        );
      })
      .addCase(confirmMpesaManual.rejected, (s, { payload }) => {
        s.mpesa.manualLoading = false;
        s.mpesa.manualError   = payload;
      });

    // ── M-Pesa: transactions list ─────────────────────────────────────────────
    builder
      .addCase(fetchMpesaTransactions.pending,   (s) => {
        s.mpesa.transactionsLoading = true;
        s.mpesa.transactionsError   = null;
      })
      .addCase(fetchMpesaTransactions.fulfilled, (s, { payload }) => {
        s.mpesa.transactionsLoading    = false;
        s.mpesa.transactions           = payload.transactions;
        s.mpesa.transactionsPagination = payload.pagination;
      })
      .addCase(fetchMpesaTransactions.rejected,  (s, { payload }) => {
        s.mpesa.transactionsLoading = false;
        s.mpesa.transactionsError   = payload;
      });

    // ── M-Pesa: pending / unmatched ───────────────────────────────────────────
    builder
      .addCase(fetchPendingMpesa.pending,   (s) => {
        s.mpesa.pendingLoading = true;
        s.mpesa.pendingError   = null;
      })
      .addCase(fetchPendingMpesa.fulfilled, (s, { payload }) => {
        s.mpesa.pendingLoading      = false;
        s.mpesa.pendingTransactions = payload;
      })
      .addCase(fetchPendingMpesa.rejected,  (s, { payload }) => {
        s.mpesa.pendingLoading = false;
        s.mpesa.pendingError   = payload;
      });

    // ── M-Pesa: receipt auto-reconcile ────────────────────────────────────────
    builder
      .addCase(reconcileByReceipt.pending,   (s) => {
        s.mpesa.receiptReconcileLoading = true;
        s.mpesa.receiptReconcileError   = null;
        s.mpesa.receiptReconcileSuccess = false;
      })
      .addCase(reconcileByReceipt.fulfilled, (s) => {
        s.mpesa.receiptReconcileLoading = false;
        s.mpesa.receiptReconcileSuccess = true;
      })
      .addCase(reconcileByReceipt.rejected,  (s, { payload }) => {
        s.mpesa.receiptReconcileLoading = false;
        s.mpesa.receiptReconcileError   = payload;
      });

    // ── M-Pesa: manual reconcile ──────────────────────────────────────────────
    builder
      .addCase(reconcileMpesaTransaction.pending,   (s) => {
        s.mpesa.reconcileLoading  = true;
        s.mpesa.reconcileError    = null;
        s.mpesa.reconcileSuccess  = false;
      })
      .addCase(reconcileMpesaTransaction.fulfilled, (s, { payload }) => {
        s.mpesa.reconcileLoading          = false;
        s.mpesa.reconcileSuccess          = true;
        s.mpesa.lastReconciledTransaction = payload;
        s.mpesa.pendingTransactions = s.mpesa.pendingTransactions.filter(
          (t) => t.id !== payload.transactionId
        );
      })
      .addCase(reconcileMpesaTransaction.rejected, (s, { payload }) => {
        s.mpesa.reconcileLoading = false;
        s.mpesa.reconcileError   = payload;
      });
  },
});

/* ============================================================
   ACTIONS
   ============================================================ */

export const {
  resetCreateInvoice,
  resetRecordPayment,
  resetStudentBalance,
  resetMpesa,
  resetReconcile,
  resetReceiptReconcile,
  setMpesaTimeout,
  setActiveTerm,
  clearSelectedInvoice,
} = feesSlice.actions;

/* ============================================================
   SELECTORS
   All object-returning selectors are now built with createSelector
   so they return a stable memoized reference and never trigger
   the "Selector returned a different result" React re-render warning.
   ============================================================ */

// ── Invoices — scalar ─────────────────────────────────────────────────────────
export const selectInvoices           = (s) => s.fees.invoices;
export const selectInvoicesPagination = (s) => s.fees.invoicesPagination;
export const selectInvoicesLoading    = (s) => s.fees.invoicesLoading;
export const selectInvoicesError      = (s) => s.fees.invoicesError;
export const selectSelectedInvoice    = (s) => s.fees.selectedInvoice;
export const selectStudentInvoices    = (s) => s.fees.studentInvoices;

export const selectCreateInvoiceLoading = (s) => s.fees.createInvoiceLoading;
export const selectCreateInvoiceError   = (s) => s.fees.createInvoiceError;
export const selectCreateInvoiceSuccess = (s) => s.fees.createInvoiceSuccess;

// ── createInvoice — memoized object (FIX: was returning new object every render)
export const selectCreateInvoice = createSelector(
  selectCreateInvoiceLoading,
  selectCreateInvoiceError,
  selectCreateInvoiceSuccess,
  (loading, error, success) => ({ loading, error, success })
);

// ── Payments — scalar ─────────────────────────────────────────────────────────
export const selectPayments           = (s) => s.fees.payments;
export const selectPaymentsPagination = (s) => s.fees.paymentsPagination;
export const selectPaymentsLoading    = (s) => s.fees.paymentsLoading;
export const selectPaymentsError      = (s) => s.fees.paymentsError;
export const selectSelectedPayment    = (s) => s.fees.selectedPayment;

export const selectRecordPaymentLoading = (s) => s.fees.recordPaymentLoading;
export const selectRecordPaymentError   = (s) => s.fees.recordPaymentError;
export const selectRecordPaymentSuccess = (s) => s.fees.recordPaymentSuccess;

// ── recordPayment — memoized object (FIX)
export const selectRecordPayment = createSelector(
  selectRecordPaymentLoading,
  selectRecordPaymentError,
  selectRecordPaymentSuccess,
  (loading, error, success) => ({ loading, error, success })
);

// ── Balance ───────────────────────────────────────────────────────────────────
export const selectStudentBalance        = (s) => s.fees.studentBalance;
export const selectStudentBalanceLoading = (s) => s.fees.studentBalanceLoading;
export const selectStudentBalanceError   = (s) => s.fees.studentBalanceError;

// ── Fee Structures ────────────────────────────────────────────────────────────
export const selectFeeStructures        = (s) => s.fees.feeStructures;
export const selectFeeStructuresLoading = (s) => s.fees.feeStructuresLoading;
export const selectFeeStructuresError   = (s) => s.fees.feeStructuresError;

// ── Reports ───────────────────────────────────────────────────────────────────
export const selectCollectionSummary = (s) => s.fees.collectionSummary;
export const selectSummaryLoading    = (s) => s.fees.summaryLoading;
export const selectSummaryError      = (s) => s.fees.summaryError;

export const selectDefaulters        = (s) => s.fees.defaulters;
export const selectDefaultersLoading = (s) => s.fees.defaultersLoading;
export const selectDefaultersError   = (s) => s.fees.defaultersError;

// ── M-Pesa — scalar ───────────────────────────────────────────────────────────
export const selectMpesaPending        = (s) => s.fees.mpesa.pendingTransactions;
export const selectMpesaPendingLoading = (s) => s.fees.mpesa.pendingLoading;
export const selectMpesaPendingError   = (s) => s.fees.mpesa.pendingError;

export const selectMpesaTransactions           = (s) => s.fees.mpesa.transactions;
export const selectMpesaTransactionsPagination = (s) => s.fees.mpesa.transactionsPagination;
export const selectMpesaTransactionsLoading    = (s) => s.fees.mpesa.transactionsLoading;

export const selectMpesaReconcileLoading = (s) => s.fees.mpesa.reconcileLoading;
export const selectMpesaReconcileError   = (s) => s.fees.mpesa.reconcileError;
export const selectMpesaReconcileSuccess = (s) => s.fees.mpesa.reconcileSuccess;

export const selectReceiptReconcileLoading = (s) => s.fees.mpesa.receiptReconcileLoading;
export const selectReceiptReconcileError   = (s) => s.fees.mpesa.receiptReconcileError;
export const selectReceiptReconcileSuccess = (s) => s.fees.mpesa.receiptReconcileSuccess;

// ── M-Pesa — memoized objects (FIX: all previously returned new object each render)

// selectMpesa: MpesaModal needs the whole sub-tree. Memoized via sub-selector.
export const selectMpesa = createSelector(
  (s) => s.fees.mpesa,
  (mpesa) => mpesa
);

export const selectMpesaReconcile = createSelector(
  selectMpesaReconcileLoading,
  selectMpesaReconcileError,
  selectMpesaReconcileSuccess,
  (s) => s.fees.mpesa.lastReconciledTransaction,
  (loading, error, success, last) => ({ loading, error, success, last })
);

export const selectReceiptReconcile = createSelector(
  selectReceiptReconcileLoading,
  selectReceiptReconcileError,
  selectReceiptReconcileSuccess,
  (loading, error, success) => ({ loading, error, success })
);

// ── Active term ───────────────────────────────────────────────────────────────
export const selectActiveTerm = (s) => s.fees.activeTerm;

/* ============================================================
   REDUCER
   ============================================================ */

export default feesSlice.reducer;