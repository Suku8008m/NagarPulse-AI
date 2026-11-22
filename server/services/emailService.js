/**
 * Production HTTPS Email Service for Render Cloud Deployment
 * 
 * Dispatches transactional OTP emails over HTTPS (port 443) using Brevo's v3 REST API.
 * Bypasses Render free-tier outbound SMTP port blocks (ports 25, 465, and 587).
 * Enforces a strict 7-second AbortController timeout.
 */

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const TIMEOUT_MS = 7000;

/**
 * Common internal dispatcher over Brevo HTTPS REST API (Port 443)
 */
const dispatchBrevoEmail = async ({ email, name, subject, htmlContent }) => {
  const rawApiKey = (process.env.BREVO_API_KEY || '').trim();

  if (!rawApiKey) {
    const errorMsg = 'BREVO_API_KEY is not configured in process.env';
    console.warn(`[EmailService Warning] ${errorMsg}. Activating graceful demo fallback.`);
    return { delivered: false, error: errorMsg };
  }

  // Validate that it is a v3 REST key (xkeysib-), not an SMTP password (xsmtpsib-)
  if (rawApiKey.startsWith('xsmtpsib-')) {
    const errorMsg =
      'BREVO_API_KEY starts with "xsmtpsib-" which is an SMTP password, not a v3 REST API key. ' +
      'Please generate a v3 REST API Key starting with "xkeysib-" in Brevo dashboard under SMTP & API -> API Keys.';
    console.warn(`[EmailService Configuration Warning] ${errorMsg}`);
    return { delivered: false, error: errorMsg };
  }

  if (!rawApiKey.startsWith('xkeysib-')) {
    console.warn('[EmailService Warning] BREVO_API_KEY does not start with expected "xkeysib-" prefix.');
  }

  const senderEmail = (process.env.BREVO_SENDER_EMAIL || process.env.SENDER_EMAIL || 'kamapallisukumar@gmail.com').trim();
  const senderName = (process.env.BREVO_SENDER_NAME || process.env.SENDER_NAME || 'NagarPulse AI').trim();

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email, name: name || 'Citizen' }],
    subject,
    htmlContent
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': rawApiKey,
        'content-type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const responseText = await response.text().catch(() => '');
    let responseData = {};
    try {
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch {
      responseData = { raw: responseText };
    }

    if (!response.ok) {
      console.error(`[Brevo API Error] status=${response.status} body=${JSON.stringify(responseData)}`);
      return {
        delivered: false,
        status: response.status,
        error: `Brevo HTTP ${response.status}: ${responseData.message || responseText}`
      };
    }

    const messageId = responseData.messageId || 'unknown';
    console.log(`[Brevo Email Sent] ${email} messageId: ${messageId} (${subject})`);
    return {
      delivered: true,
      status: response.status,
      messageId
    };
  } catch (err) {
    const errorMsg = err.name === 'AbortError' ? 'Brevo API request timed out after 7 seconds' : err.message;
    console.error(`[Brevo API Error] ${errorMsg}`);
    return { delivered: false, error: errorMsg };
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Send 6-digit Email Verification OTP via Brevo HTTPS REST API (v3)
 */
const sendEmailOtp = async ({ email, otp, name = 'Citizen' }) => {
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

  return dispatchBrevoEmail({
    email,
    name,
    subject: 'NagarPulse AI — Citizen Email Verification OTP',
    htmlContent
  });
};

/**
 * Send 6-digit Password Reset OTP via Brevo HTTPS REST API (v3)
 */
const sendPasswordResetOtp = async ({ email, otp, name = 'Citizen' }) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NagarPulse AI — Password Reset OTP</title>
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
            Reset Your Password
          </h2>
          <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
            Hello${name && name !== 'Citizen' ? ` <strong>${name}</strong>` : ''},<br/>
            We received a request to reset the password for your <strong>NagarPulse AI</strong> account. Please use the 6-digit OTP code below to set a new password:
          </p>

          <!-- OTP Code Box -->
          <div style="background-color: #f8fafc; border: 2px dashed #2563eb; border-radius: 12px; padding: 22px 16px; text-align: center; margin: 24px 0;">
            <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8; font-family: 'Courier New', Courier, monospace;">
              ${otp}
            </div>
            <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b; font-weight: 500;">
              Code is valid for <strong>10 minutes</strong> • Do not share this code
            </p>
          </div>

          <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.5; color: #64748b;">
            If you did not request this password reset, please ignore this email or contact the municipal administrator. Your password will remain unchanged.
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

  return dispatchBrevoEmail({
    email,
    name,
    subject: 'NagarPulse AI — Password Reset OTP',
    htmlContent
  });
};

module.exports = {
  sendEmailOtp,
  sendOtpEmail: sendEmailOtp,
  sendPasswordResetOtp
};
