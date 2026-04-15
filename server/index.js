const express = require("express");
const crypto = require("crypto");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CONFIG ------------------------------------------------------------------
const OZOW_SITE_CODE = process.env.OZOW_SITE_CODE;
const OZOW_PRIVATE_KEY = process.env.OZOW_PRIVATE_KEY;
const OZOW_IS_TEST = process.env.OZOW_IS_TEST === "false" ? "false" : "true";

const BASE_URL = process.env.BASE_URL;

const SUCCESS_URL = `${BASE_URL}/payment/success`;
const ERROR_URL = `${BASE_URL}/payment/error`;
const CANCEL_URL = `${BASE_URL}/payment/cancel`;
const NOTIFY_URL = process.env.NOTIFY_URL;

function cleanValue(value) {
  return value == null ? "" : String(value).trim();
}

function formatBoolean(value) {
  return value === "true" ? "true" : "false";
}

// --- HASH FUNCTION (STRICT FIXED ORDER) -------------------------------------
function generateHash(f) {
  const raw = (
    cleanValue(f.SiteCode) +
    cleanValue(f.CountryCode) +
    cleanValue(f.CurrencyCode) +
    cleanValue(f.Amount) +
    cleanValue(f.TransactionReference) +
    cleanValue(f.BankReference) +
    cleanValue(f.Optional1) +
    cleanValue(f.Optional2) +
    cleanValue(f.Optional3) +
    cleanValue(f.Optional4) +
    cleanValue(f.Optional5) +
    cleanValue(f.Customer) +
    cleanValue(f.CancelUrl) +
    cleanValue(f.ErrorUrl) +
    cleanValue(f.SuccessUrl) +
    cleanValue(f.NotifyUrl) +
    formatBoolean(f.IsTest) +
    cleanValue(OZOW_PRIVATE_KEY)
  ).toLowerCase();

  return crypto.createHash("sha512").update(raw).digest("hex");
}

// --- INIT PAYMENT ------------------------------------------------------------
app.post("/api/initiate-payment", (req, res) => {
  try {
    const { name, email, phone, reference, amount, description } = req.body;

    if (!name || !email || !phone || !reference || !amount) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const amountFormatted = Number(amount).toFixed(2);

    const trimmedReference = reference.trim();
    const trimmedDescription = (description || "").trim();
    const payload = {
      SiteCode: OZOW_SITE_CODE,
      CountryCode: "ZA",
      CurrencyCode: "ZAR",
      Amount: amountFormatted,
      TransactionReference: trimmedReference.slice(0, 50),
      BankReference: trimmedReference.slice(0, 20),

      Optional1: name.trim(),
      Optional2: email.trim(),
      Optional3: phone.trim(),
      Optional4: trimmedDescription.slice(0, 50),
      Optional5: "",

      Customer: name.trim(),

      CancelUrl: CANCEL_URL,
      ErrorUrl: ERROR_URL,
      SuccessUrl: SUCCESS_URL,
      NotifyUrl: NOTIFY_URL,

      IsTest: formatBoolean(OZOW_IS_TEST),
    };

    const hash = generateHash(payload);

    res.json({
      ...payload,
      HashCheck: hash,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- WEBHOOK -----------------------------------------------------------------
app.post("/api/notify", (req, res) => {
  console.log("Ozow Notify:", req.body);
  res.send("OK");
});

app.get("/api/health", (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Server running on", PORT));
