/**
 * Production HTTPS Email Service for Render Cloud Deployment
 * 
 * Bypasses Render free-tier outbound SMTP port restrictions (ports 25, 465, and 587 are blocked).
 * Uses native fetch over HTTPS (port 443) to call Brevo's Transactional Email REST API.
 * Enforces a strict 6-second AbortController timeout.
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const TIMEOUT_MS = 6000;

/**
 * Send 6-digit Email Verification OTP via Brevo HTTPS REST API
 * 
 * @param {Object} params
 * @param {string} params.email - Recipient email address
 * @param {string} params.otp - 6-digit numeric OTP code
 * @param {string} [params.name] - Recipient name
 * @returns {Promise<{ delivered: boolean, status?: number, error?: string }>}
 */
const sendEmailOtp = async ({ email, otp, name = 'Citizen' }) => {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    const errorMsg = 'BREVO_API_KEY is not configured in process.env';
    console.warn(`[EmailService Warning] ${errorMsg}. Activating graceful demo fallback.`);
    return { delivered: false, error: errorMsg };
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'kamapallisukumar@gmail.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'NagarPulse AI';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NagarPulse AI — Email Verification OTP</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 580px; margin: 30px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
        
        <!-- Civic Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%); padding: 28px 24px; color: #ffffff;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                NagarPulse <span style="color: #93c5fd;">AI</span>
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9;">
                Nellore Municipal Corporation • Civic Operations
              </p>
            </div>
          </div>
        </div>

        <!-- Body Content -->
        <div style="padding: 32px 28px; color: #1e293b;">
          <h2 style="margin: 0 0 12px 0; font-size: 17px; font-weight: 700; color: #0f172a;">
            Citizen Email Verification
          </h2>
          <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
            Hello${name && name !== 'Citizen' ? ` <strong>${name}</strong>` : ''},<br/>
            Thank you for registering on <strong>NagarPulse AI</strong>. Please enter the one-time verification code below to verify your email address:
          </p>

          <!-- OTP Code Box -->
          <div style="background-color: #f8fafc; border: 2px dashed #3b82f6; border-radius: 12px; padding: 22px 16px; text-align: center; margin: 24px 0;">
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; font-family: 'Courier New', Courier, monospace;">
              ${otp}
            </div>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b; font-weight: 500;">
              Code is valid for <strong>10 minutes</strong> • Do not disclose to anyone
            </p>
          </div>

          <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.5; color: #64748b;">
            This email was generated for citizen grievance triage with Nellore Municipal Corporation. If you did not request this verification, you may safely ignore this message.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 18px 24px; text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">
            © ${new Date().getFullYear()} Nellore Municipal Corporation • Full-Stack MERN &amp; Multimodal AI Civic Triage
          </p>
        </div>

      </div>
    </body>
    </html>
  `;

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email, name: name || 'Citizen' }],
    subject: 'NagarPulse AI — Citizen Email Verification OTP',
    htmlContent
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      const msg = `Brevo API HTTP ${response.status}: ${errBody}`;
      console.warn('[EmailService Brevo Error]:', msg);
      return { delivered: false, status: response.status, error: msg };
    }

    console.log(`[EmailService] OTP successfully dispatched via Brevo HTTPS REST API to ${email}`);
    return { delivered: true, status: response.status };
  } catch (err) {
    const errorMsg = err.name === 'AbortError' ? 'Brevo API request timed out after 6 seconds' : err.message;
    console.warn('[EmailService Error]:', errorMsg);
    return { delivered: false, error: errorMsg };
  } finally {
    clearTimeout(timeoutId);
  }
};

module.exports = {
  sendEmailOtp
};
