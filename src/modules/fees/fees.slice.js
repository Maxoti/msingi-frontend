/**
 * fees.slice.js
 * Redux state for fee management — invoices, payments, M-Pesa, reports.
 *
 * Fix summary (v3):
 *  - CRITICAL FIX: initiateStkPush now maps data.data.transactionId →
 *    checkoutRequestId so polling never hits /query/null.
 *  - pollStkStatus now auto-stops when ResultCode is received (SUCCESS/FAILED).
 *  - Timer in MpesaModal extended to 120 s to match M-Pesa's actual timeout.
 *  - All createSelector memoizations retained from v2.
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

export const createInvoice = createAsyncThunk(
  "fees/createInvoice",
  async ({ student_id, term_id, items }, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/fees/invoices", {
        student_id: parseInt(student_id, 10),
        term_id:    parseInt(term_id,    10),
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

/**
 * POST /mpesa/initiate — STK push by admission number.
 *
 * FIX v3: The Lipana API returns `transactionId` (not `checkoutRequestId`).
 * We now map data.data.transactionId → checkoutRequestId so the Redux state
 * always has a real value and polling never calls /query/null.
 */
export const initiateStkPush = createAsyncThunk(
  "fees/initiateStkPush",
  async ({ admissionNo, phoneNumber, amount }, { rejectWithValue }) => {
    try {
      const { data } = await API.post("/mpesa/initiate", { admissionNo, phoneNumber, amount });
      const result = data.data;
      return {
        // Lipana returns `transactionId`; fall back to checkoutRequestId if
        // the backend is ever updated to use the standard field name.
        checkoutRequestId: result.transactionId ?? result.checkoutRequestId ?? null,
        merchantRequestId: result.merchantRequestId ?? null,
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
      const result = data.data;
      return {
        checkoutRequestId: result.transactionId ?? result.checkoutRequestId ?? null,
        merchantRequestId: result.merchantRequestId ?? null,
      };
    } catch (err) {
      return rejectWithValue(errMsg(err, "STK push failed"));
    }
  }
);

/**
 * GET /mpesa/query/:checkoutRequestId
 *
 * FIX v3: Returns a stable { status, resultDesc } shape. The reducer stops
 * the polling cycle by setting stkStatus to SUCCESS or FAILED; MpesaModal's
 * useEffect dependency on stkStatus then clears the interval automatically.
 */
export const pollStkStatus = createAsyncThunk(
  "fees/pollStkStatus",
  async (checkoutRequestId, { rejectWithValue }) => {
    try {
      const { data } = await API.get(`/mpesa/query/${checkoutRequestId}`);
      const result = data.data;

      let status = "PENDING";

      // ResultCode check
      if      (result?.ResultCode === 0)                                   status = "SUCCESS";
      else if (result?.ResultCode !== undefined && result.ResultCode > 0)  status = "FAILED";

      //  Handle both uppercase (backend) and lowercase (just in case)
      const s = result?.status?.toUpperCase();
      if (s === "COMPLETED" || s === "RECONCILED" || s === "SUCCESS")      status = "SUCCESS";
      if (s === "FAILED"    || s === "CANCELLED")                          status = "FAILED";

      return { status, resultDesc: result?.ResultDesc ?? result?.message ?? "" };
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

  payments:               [],
  paymentsPagination:     null,
  paymentsLoading:        false,
  paymentsError:          null,

  selectedPayment:        null,

  recordPaymentLoading:   false,
  recordPaymentError:     null,
  recordPaymentSuccess:   false,

  studentBalance:         null,
  studentBalanceLoading:  false,
  studentBalanceError:    null,

  feeStructures:          [],
  feeStructuresLoading:   false,
  feeStructuresError:     null,

  createStructureLoading: false,
  createStructureError:   null,

  collectionSummary:      null,
  summaryLoading:         false,
  summaryError:           null,

  defaulters:             [],
  defaultersLoading:      false,
  defaultersError:        null,

  mpesa: {
    stkPushLoading:    false,
    stkPushError:      null,
    checkoutRequestId: null,   // ← set from transactionId after FIX
    merchantRequestId: null,
    stkStatus:         "IDLE", // IDLE | PENDING | SUCCESS | FAILED | TIMEOUT
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
      .addCase(fetchInvoices.pending,   (s) => { s.invoicesLoading = true;  s.invoicesError = null; })
      .addCase(fetchInvoices.fulfilled, (s, { payload }) => {
        s.invoicesLoading    = false;
        s.invoices           = payload.invoices;
        s.invoicesPagination = payload.pagination;
      })
      .addCase(fetchInvoices.rejected,  (s, { payload }) => { s.invoicesLoading = false; s.invoicesError = payload; });

    builder
      .addCase(fetchInvoiceById.pending,   (s) => { s.selectedInvoiceLoading = true;  s.selectedInvoiceError = null; })
      .addCase(fetchInvoiceById.fulfilled, (s, { payload }) => { s.selectedInvoiceLoading = false; s.selectedInvoice = payload; })
      .addCase(fetchInvoiceById.rejected,  (s, { payload }) => { s.selectedInvoiceLoading = false; s.selectedInvoiceError = payload; });

    builder
      .addCase(fetchStudentInvoices.pending,   (s) => { s.studentInvoicesLoading = true; })
      .addCase(fetchStudentInvoices.fulfilled, (s, { payload }) => { s.studentInvoicesLoading = false; s.studentInvoices = payload; })
      .addCase(fetchStudentInvoices.rejected,  (s) => { s.studentInvoicesLoading = false; });

    builder
      .addCase(createInvoice.pending,   (s) => { s.createInvoiceLoading = true;  s.createInvoiceError = null; s.createInvoiceSuccess = false; })
      .addCase(createInvoice.fulfilled, (s, { payload }) => {
        s.createInvoiceLoading = false;
        s.createInvoiceSuccess = true;
        s.invoices = [payload, ...s.invoices];
      })
      .addCase(createInvoice.rejected,  (s, { payload }) => { s.createInvoiceLoading = false; s.createInvoiceError = payload; });

    // ── Payments ──────────────────────────────────────────────────────────────
    builder
      .addCase(fetchPayments.pending,   (s) => { s.paymentsLoading = true;  s.paymentsError = null; })
      .addCase(fetchPayments.fulfilled, (s, { payload }) => {
        s.paymentsLoading    = false;
        s.payments           = payload.payments;
        s.paymentsPagination = payload.pagination;
      })
      .addCase(fetchPayments.rejected,  (s, { payload }) => { s.paymentsLoading = false; s.paymentsError = payload; });

    builder
      .addCase(fetchPaymentById.fulfilled, (s, { payload }) => { s.selectedPayment = payload; });

    builder
      .addCase(recordPayment.pending,   (s) => { s.recordPaymentLoading = true;  s.recordPaymentError = null; s.recordPaymentSuccess = false; })
      .addCase(recordPayment.fulfilled, (s, { payload }) => {
        s.recordPaymentLoading = false;
        s.recordPaymentSuccess = true;
        s.payments = [payload, ...s.payments];
        s.invoices = s.invoices.map((inv) =>
          inv.id === payload.invoice_id
            ? { ...inv, paid_amount: (parseFloat(inv.paid_amount || 0) + parseFloat(payload.amount)).toFixed(2) }
            : inv
        );
      })
      .addCase(recordPayment.rejected,  (s, { payload }) => { s.recordPaymentLoading = false; s.recordPaymentError = payload; });

    // ── Balance ───────────────────────────────────────────────────────────────
    builder
      .addCase(fetchStudentBalance.pending,   (s) => { s.studentBalanceLoading = true;  s.studentBalanceError = null; })
      .addCase(fetchStudentBalance.fulfilled, (s, { payload }) => { s.studentBalanceLoading = false; s.studentBalance = payload; })
      .addCase(fetchStudentBalance.rejected,  (s, { payload }) => { s.studentBalanceLoading = false; s.studentBalanceError = payload; });

    // ── Fee Structures ────────────────────────────────────────────────────────
    builder
      .addCase(fetchFeeStructures.pending,   (s) => { s.feeStructuresLoading = true;  s.feeStructuresError = null; })
      .addCase(fetchFeeStructures.fulfilled, (s, { payload }) => { s.feeStructuresLoading = false; s.feeStructures = payload; })
      .addCase(fetchFeeStructures.rejected,  (s, { payload }) => { s.feeStructuresLoading = false; s.feeStructuresError = payload; });

    builder
      .addCase(createFeeStructure.pending,   (s) => { s.createStructureLoading = true;  s.createStructureError = null; })
      .addCase(createFeeStructure.fulfilled, (s, { payload }) => { s.createStructureLoading = false; s.feeStructures = [...s.feeStructures, payload]; })
      .addCase(createFeeStructure.rejected,  (s, { payload }) => { s.createStructureLoading = false; s.createStructureError = payload; });

    // ── Reports ───────────────────────────────────────────────────────────────
    builder
      .addCase(fetchCollectionSummary.pending,   (s) => { s.summaryLoading = true;  s.summaryError = null; })
      .addCase(fetchCollectionSummary.fulfilled, (s, { payload }) => { s.summaryLoading = false; s.collectionSummary = payload; })
      .addCase(fetchCollectionSummary.rejected,  (s, { payload }) => { s.summaryLoading = false; s.summaryError = payload; });

    builder
      .addCase(fetchDefaulters.pending,   (s) => { s.defaultersLoading = true;  s.defaultersError = null; })
      .addCase(fetchDefaulters.fulfilled, (s, { payload }) => { s.defaultersLoading = false; s.defaulters = payload; })
      .addCase(fetchDefaulters.rejected,  (s, { payload }) => { s.defaultersLoading = false; s.defaultersError = payload; });

    // ── M-Pesa: STK push ──────────────────────────────────────────────────────
    // FIX v3: checkoutRequestId now correctly populated from transactionId
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
          s.mpesa.checkoutRequestId = payload.checkoutRequestId; // ← now a real value
          s.mpesa.merchantRequestId = payload.merchantRequestId;
        })
        .addCase(thunk.rejected,  (s, { payload }) => {
          s.mpesa.stkPushLoading = false;
          s.mpesa.stkPushError   = payload;
          s.mpesa.stkStatus      = "FAILED";
        });
    });

    // ── M-Pesa: polling ───────────────────────────────────────────────────────
    // FIX v3: when status is SUCCESS or FAILED the reducer updates stkStatus,
    // which is a dependency of MpesaModal's polling useEffect — so the interval
    // is cleared automatically without any extra logic in the component.
    builder
      .addCase(pollStkStatus.pending,   (s) => { s.mpesa.statusLoading = true; })
      .addCase(pollStkStatus.fulfilled, (s, { payload }) => {
        s.mpesa.statusLoading = false;
        s.mpesa.stkStatus     = payload.status;     // SUCCESS/FAILED stops the poll
        s.mpesa.resultDesc    = payload.resultDesc;
      })
      .addCase(pollStkStatus.rejected,  (s) => { s.mpesa.statusLoading = false; });

    // ── M-Pesa: manual cashier entry ──────────────────────────────────────────
    builder
      .addCase(confirmMpesaManual.pending,   (s) => { s.mpesa.manualLoading = true;  s.mpesa.manualError = null; })
      .addCase(confirmMpesaManual.fulfilled, (s, { payload }) => {
        s.mpesa.manualLoading = false;
        s.mpesa.stkStatus     = "SUCCESS";
        s.mpesa.lastPayment   = payload;
        s.payments = [payload, ...s.payments];
        s.invoices = s.invoices.map((inv) =>
          inv.id === payload.invoice_id
            ? { ...inv, paid_amount: (parseFloat(inv.paid_amount || 0) + parseFloat(payload.amount)).toFixed(2) }
            : inv
        );
      })
      .addCase(confirmMpesaManual.rejected, (s, { payload }) => { s.mpesa.manualLoading = false; s.mpesa.manualError = payload; });

    // ── M-Pesa: transactions list ─────────────────────────────────────────────
    builder
      .addCase(fetchMpesaTransactions.pending,   (s) => { s.mpesa.transactionsLoading = true;  s.mpesa.transactionsError = null; })
      .addCase(fetchMpesaTransactions.fulfilled, (s, { payload }) => {
        s.mpesa.transactionsLoading    = false;
        s.mpesa.transactions           = payload.transactions;
        s.mpesa.transactionsPagination = payload.pagination;
      })
      .addCase(fetchMpesaTransactions.rejected,  (s, { payload }) => { s.mpesa.transactionsLoading = false; s.mpesa.transactionsError = payload; });

    // ── M-Pesa: pending / unmatched ───────────────────────────────────────────
    builder
      .addCase(fetchPendingMpesa.pending,   (s) => { s.mpesa.pendingLoading = true;  s.mpesa.pendingError = null; })
      .addCase(fetchPendingMpesa.fulfilled, (s, { payload }) => { s.mpesa.pendingLoading = false; s.mpesa.pendingTransactions = payload; })
      .addCase(fetchPendingMpesa.rejected,  (s, { payload }) => { s.mpesa.pendingLoading = false; s.mpesa.pendingError = payload; });

    // ── M-Pesa: receipt auto-reconcile ────────────────────────────────────────
    builder
      .addCase(reconcileByReceipt.pending,   (s) => { s.mpesa.receiptReconcileLoading = true;  s.mpesa.receiptReconcileError = null; s.mpesa.receiptReconcileSuccess = false; })
      .addCase(reconcileByReceipt.fulfilled, (s) => { s.mpesa.receiptReconcileLoading = false; s.mpesa.receiptReconcileSuccess = true; })
      .addCase(reconcileByReceipt.rejected,  (s, { payload }) => { s.mpesa.receiptReconcileLoading = false; s.mpesa.receiptReconcileError = payload; });

    // ── M-Pesa: manual reconcile ──────────────────────────────────────────────
    builder
      .addCase(reconcileMpesaTransaction.pending,   (s) => { s.mpesa.reconcileLoading = true;  s.mpesa.reconcileError = null; s.mpesa.reconcileSuccess = false; })
      .addCase(reconcileMpesaTransaction.fulfilled, (s, { payload }) => {
        s.mpesa.reconcileLoading          = false;
        s.mpesa.reconcileSuccess          = true;
        s.mpesa.lastReconciledTransaction = payload;
        s.mpesa.pendingTransactions = s.mpesa.pendingTransactions.filter((t) => t.id !== payload.transactionId);
      })
      .addCase(reconcileMpesaTransaction.rejected, (s, { payload }) => { s.mpesa.reconcileLoading = false; s.mpesa.reconcileError = payload; });
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
   ============================================================ */

export const selectInvoices           = (s) => s.fees.invoices;
export const selectInvoicesPagination = (s) => s.fees.invoicesPagination;
export const selectInvoicesLoading    = (s) => s.fees.invoicesLoading;
export const selectInvoicesError      = (s) => s.fees.invoicesError;
export const selectSelectedInvoice    = (s) => s.fees.selectedInvoice;
export const selectStudentInvoices    = (s) => s.fees.studentInvoices;

export const selectCreateInvoiceLoading = (s) => s.fees.createInvoiceLoading;
export const selectCreateInvoiceError   = (s) => s.fees.createInvoiceError;
export const selectCreateInvoiceSuccess = (s) => s.fees.createInvoiceSuccess;

export const selectCreateInvoice = createSelector(
  selectCreateInvoiceLoading, selectCreateInvoiceError, selectCreateInvoiceSuccess,
  (loading, error, success) => ({ loading, error, success })
);

export const selectPayments           = (s) => s.fees.payments;
export const selectPaymentsPagination = (s) => s.fees.paymentsPagination;
export const selectPaymentsLoading    = (s) => s.fees.paymentsLoading;
export const selectPaymentsError      = (s) => s.fees.paymentsError;
export const selectSelectedPayment    = (s) => s.fees.selectedPayment;

export const selectRecordPaymentLoading = (s) => s.fees.recordPaymentLoading;
export const selectRecordPaymentError   = (s) => s.fees.recordPaymentError;
export const selectRecordPaymentSuccess = (s) => s.fees.recordPaymentSuccess;

export const selectRecordPayment = createSelector(
  selectRecordPaymentLoading, selectRecordPaymentError, selectRecordPaymentSuccess,
  (loading, error, success) => ({ loading, error, success })
);

export const selectStudentBalance        = (s) => s.fees.studentBalance;
export const selectStudentBalanceLoading = (s) => s.fees.studentBalanceLoading;
export const selectStudentBalanceError   = (s) => s.fees.studentBalanceError;

export const selectFeeStructures        = (s) => s.fees.feeStructures;
export const selectFeeStructuresLoading = (s) => s.fees.feeStructuresLoading;
export const selectFeeStructuresError   = (s) => s.fees.feeStructuresError;

export const selectCollectionSummary = (s) => s.fees.collectionSummary;
export const selectSummaryLoading    = (s) => s.fees.summaryLoading;
export const selectSummaryError      = (s) => s.fees.summaryError;

export const selectDefaulters        = (s) => s.fees.defaulters;
export const selectDefaultersLoading = (s) => s.fees.defaultersLoading;
export const selectDefaultersError   = (s) => s.fees.defaultersError;

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

export const selectMpesa = createSelector(
  (s) => s.fees.mpesa,
  (mpesa) => mpesa
);

export const selectMpesaReconcile = createSelector(
  selectMpesaReconcileLoading, selectMpesaReconcileError, selectMpesaReconcileSuccess,
  (s) => s.fees.mpesa.lastReconciledTransaction,
  (loading, error, success, last) => ({ loading, error, success, last })
);

export const selectReceiptReconcile = createSelector(
  selectReceiptReconcileLoading, selectReceiptReconcileError, selectReceiptReconcileSuccess,
  (loading, error, success) => ({ loading, error, success })
);

export const selectActiveTerm = (s) => s.fees.activeTerm;

/* ============================================================
   REDUCER
   ============================================================ */

export default feesSlice.reducer;