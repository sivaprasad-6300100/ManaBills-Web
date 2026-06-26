import React from "react";

export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "40px 20px", lineHeight: 1.6, color: "#222" }}>
      <h1>Privacy Policy for ManaBills</h1>
      <p><strong>Last updated:</strong> June 27, 2026</p>

      <p>
        ManaBills ("we", "our", "us") provides GST billing and invoicing software for
        retail businesses. This Privacy Policy explains how we collect, use, and
        protect information when you use the ManaBills website, app, and services.
      </p>

      <h2>1. Information We Collect</h2>
      <p><strong>Account & Business Information</strong></p>
      <ul>
        <li>Phone number (used for OTP login)</li>
        <li>Business name, shop type, GST number, address</li>
        <li>Email address (if provided)</li>
      </ul>

      <p><strong>Customer & Invoice Data</strong></p>
      <ul>
        <li>Customer names, phone numbers, and addresses you enter for billing purposes</li>
        <li>Invoice, product, and transaction records you create within the app</li>
      </ul>

      <p><strong>Payment Information</strong></p>
      <p>
        Payment transactions are processed by Razorpay. We do not store your card,
        UPI, or bank details — these are handled directly by Razorpay under their
        own privacy policy.
      </p>

      <p><strong>Device & Usage Data</strong></p>
      <ul>
        <li>Basic device and app usage information for app functionality and security (e.g. login sessions)</li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li>To provide and operate the billing, invoicing, and GST reporting features</li>
        <li>To authenticate your account via OTP</li>
        <li>To process subscription payments</li>
        <li>To send important service-related notifications (e.g. payment confirmations, OTP codes)</li>
        <li>To improve and maintain the app</li>
      </ul>

      <h2>3. Third-Party Services We Use</h2>
      <ul>
        <li><strong>Razorpay</strong> – payment processing</li>
        <li><strong>Message Central</strong> – OTP/SMS verification</li>
        <li><strong>Firebase</strong> – authentication</li>
        <li><strong>Hostinger</strong> – backend hosting and database</li>
        <li><strong>Cloudflare</strong> – DNS and security</li>
      </ul>
      <p>Each of these providers processes data under their own privacy policies.</p>

      <h2>4. Data Storage & Security</h2>
      <p>
        Your data is stored on secured servers (Hostinger VPS) with industry-standard
        security practices. We do not sell your personal data or your customers' data
        to third parties.
      </p>

      <h2>5. Data Sharing</h2>
      <p>We do not share your business or customer data with third parties except:</p>
      <ul>
        <li>As required to process payments (Razorpay) or send OTPs (Message Central)</li>
        <li>If required by law</li>
      </ul>

      <h2>6. Data Retention</h2>
      <p>
        We retain your account and invoice data as long as your account is active,
        or as required for legal/tax record-keeping purposes.
      </p>

      <h2>7. Your Rights</h2>
      <p>
        You can request access to, correction of, or deletion of your data by
        contacting us at the email below.
      </p>

      <h2>8. Children's Privacy</h2>
      <p>
        ManaBills is a business tool intended for use by business owners and is not
        directed at children under 18.
      </p>

      <h2>9. Changes to This Policy</h2>
      <p>
        We may update this policy from time to time. Continued use of ManaBills
        after changes means you accept the updated policy.
      </p>

      <h2>10. Contact Us</h2>
      <p>
        For privacy questions, contact: <strong>support@manabills.com</strong>
      </p>
    </div>
  );
}