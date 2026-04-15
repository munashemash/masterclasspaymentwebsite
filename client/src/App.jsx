import React, { useState, useRef } from "react";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_URL || "https://masterclasspaymentwebsite.onrender.com";

// --- Field Component ---------------------------------------------------------
function Field({ label, id, error, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

// --- Step Indicator ----------------------------------------------------------
function Steps({ current }) {
  const steps = ["Details", "Confirm", "Pay"];
  return (
    <div className="steps">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div
            className={`step ${i + 1 <= current ? "active" : ""} ${
              i + 1 === current ? "current" : ""
            }`}
          >
            <span className="step-num">{i + 1 < current ? "✓" : i + 1}</span>
            <span className="step-label">{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`step-line ${i + 1 < current ? "active" : ""}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// --- Main App ----------------------------------------------------------------
export default function App() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    reference: "",
    amount: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [ozowFields, setOzowFields] = useState(null);
  const [apiError, setApiError] = useState("");

  const ozowFormRef = useRef(null);

  // -- Validation -------------------------------------------------------------
  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^[0-9+()\s-]{7,}$/.test(form.phone))
      e.phone = "Enter a valid phone number";
    if (!form.reference.trim()) e.reference = "Payment reference is required";
    if (!form.amount) e.amount = "Amount is required";
    else if (isNaN(form.amount) || parseFloat(form.amount) <= 0)
      e.amount = "Enter a valid amount";
    return e;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: "" }));
  }

  // -- Step 1 -> Step 2 -------------------------------------------------------
  function handleReview(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) return setErrors(e2);
    setStep(2);
  }

  // -- Step 2 -> Step 3: get hash from backend -> auto-submit to Ozow ---------
  async function handlePay() {
    setLoading(true);
    setApiError("");
    try {
      const res = await fetch(`${API_BASE}/api/initiate-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initiate payment");
      setOzowFields(data);
      setStep(3);
      // Auto-submit the hidden Ozow form after a short tick
      setTimeout(() => ozowFormRef.current?.submit(), 800);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // -- Format amount display --------------------------------------------------
  const formattedAmount = form.amount
    ? `R ${parseFloat(form.amount).toLocaleString("en-ZA", {
        minimumFractionDigits: 2,
      })}`
    : "";

  return (
    <div className="page">
      {/* Decorative background blobs */}
      <div className="bg-blob blob-1" />
      <div className="bg-blob blob-2" />

      <div className="card">
        <header className="card-header">
          <div className="logo-mark">
            <span>P</span>
          </div>
          <h1>Secure Payment</h1>
          <p className="subtitle">Powered by Ozow — Instant EFT</p>
        </header>

        <Steps current={step} />

        {/* -- STEP 1: Details Form ------------------------------------------ */}
        {step === 1 && (
          <form className="form" onSubmit={handleReview} noValidate>
            <div className="form-grid">
              <Field label="Full Name" id="name" error={errors.name}>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Jane Mokoena"
                  value={form.name}
                  onChange={handleChange}
                  className={errors.name ? "input-error" : ""}
                  autoComplete="name"
                />
              </Field>

              <Field label="Email Address" id="email" error={errors.email}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={handleChange}
                  className={errors.email ? "input-error" : ""}
                  autoComplete="email"
                />
              </Field>

              <Field label="Phone Number" id="phone" error={errors.phone}>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+27 82 000 0000"
                  value={form.phone}
                  onChange={handleChange}
                  className={errors.phone ? "input-error" : ""}
                  autoComplete="tel"
                />
              </Field>

              <Field
                label="Payment Reference"
                id="reference"
                error={errors.reference}
              >
                <input
                  id="reference"
                  name="reference"
                  type="text"
                  placeholder="INV-2024-001"
                  value={form.reference}
                  onChange={handleChange}
                  className={errors.reference ? "input-error" : ""}
                />
              </Field>

              <Field label="Amount (ZAR)" id="amount" error={errors.amount}>
                <div className="amount-wrap">
                  <span className="currency-prefix">R</span>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={handleChange}
                    className={`amount-input ${
                      errors.amount ? "input-error" : ""
                    }`}
                  />
                </div>
              </Field>

              <Field label="Description (optional)" id="description">
                <input
                  id="description"
                  name="description"
                  type="text"
                  placeholder="Service description or order details"
                  value={form.description}
                  onChange={handleChange}
                />
              </Field>
            </div>

            <button type="submit" className="btn-primary">
              Review Payment &rarr;
            </button>
          </form>
        )}

        {/* -- STEP 2: Confirmation ------------------------------------------ */}
        {step === 2 && (
          <div className="confirm-panel">
            <div className="confirm-amount">{formattedAmount}</div>
            <div className="confirm-rows">
              <ConfirmRow label="Name" value={form.name} />
              <ConfirmRow label="Email" value={form.email} />
              <ConfirmRow label="Phone" value={form.phone} />
              <ConfirmRow label="Reference" value={form.reference} />
              {form.description && (
                <ConfirmRow label="Description" value={form.description} />
              )}
            </div>

            <p className="confirm-note">
              You will be redirected to Ozow's secure EFT gateway to complete
              your payment. No card details required.
            </p>

            {apiError && <div className="error-banner">{apiError}</div>}

            <div className="confirm-actions">
              <button
                className="btn-ghost"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                &larr; Edit Details
              </button>
              <button
                className="btn-primary"
                onClick={handlePay}
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : "Pay Now \u2192"}
              </button>
            </div>
          </div>
        )}

        {/* -- STEP 3: Redirecting ------------------------------------------- */}
        {step === 3 && (
          <div className="redirecting">
            <div className="redirect-spinner" />
            <p>Redirecting you to Ozow&hellip;</p>
            <span>Please do not close this window</span>
          </div>
        )}

        <footer className="card-footer">
          <span>&#128274; 256-bit SSL encrypted</span>
          <span>&middot;</span>
          <span>Instant EFT via Ozow</span>
        </footer>
      </div>

      {/* -- Hidden Ozow Form (auto-submitted) -------------------------------- */}
      {ozowFields && (
        <form
          ref={ozowFormRef}
          action="https://pay.ozow.com"
          method="POST"
          style={{ display: "none" }}
        >
          {Object.entries(ozowFields).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}
        </form>
      )}
    </div>
  );
}

function ConfirmRow({ label, value }) {
  return (
    <div className="confirm-row">
      <span className="cr-label">{label}</span>
      <span className="cr-value">{value}</span>
    </div>
  );
}