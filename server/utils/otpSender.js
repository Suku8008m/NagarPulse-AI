/**
 * Production-Ready HTTPS REST OTP Sender for Render Cloud Deployment
 * 
 * Bypasses Render free tier outbound SMTP port restrictions (ports 465/587 blocked).
 * Communicates exclusively over standard HTTPS (port 443) with strict 5-second AbortController
 * timeouts so API requests never deadlock or hang.
 */

const STRICT_TIMEOUT_MS = 5000;

/**
 * Execute a fetch request with a strict AbortController timeout
 */
const fetchWithTimeout = async (url, options, timeoutMs = STRICT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Send email OTP via Brevo HTTPS REST API (Port 443)
 * Endpoint: POST https://api.brevo.com/v3/smtp/email
 */
const sendViaBrevo = async ({ email, otp }) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error('BREVO_API_KEY not configured');
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@nagarpulse.in';
  const senderName = process.env.BREVO_SENDER_NAME || 'NagarPulse AI';

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email, name: 'Citizen' }],
    subject: 'NagarPulse AI - Citizen Verification OTP Code',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="margin-bottom: 20px;">
          <h2 style="color: #1d4ed8; margin: 0; display: inline-block;">NagarPulse AI</h2>
          <span style="margin-left: 8px; font-size: 11px; background: #eff6ff; color: #1d4ed8; padding: 3px 8px; border-radius: 9999px; font-weight: bold;">Civic Grievance Triage</span>
        </div>
        <p style="color: #334155; font-size: 14px; line-height: 1.5;">Your one-time 6-digit citizen verification code for registration is:</p>
        <div style="background: #f8fafc; border: 2px dashed #93c5fd; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1d4ed8; font-family: monospace;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-bottom: 4px;">This code is valid for <strong>5 minutes</strong>. Never share this code with anyone.</p>
        <p style="color: #94a3b8; font-size: 11px; margin-top: 16px;">Nellore Municipal Corporation • Civic Operations Command Desk</p>
      </div>
    `
  };

  const res = await fetchWithTimeout('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Brevo API responded with HTTP ${res.status}: ${errorText}`);
  }

  return { provider: 'Brevo HTTPS REST', status: res.status };
};

/**
 * Send email OTP via Resend HTTPS REST API (Port 443)
 * Endpoint: POST https://api.resend.com/emails
 */
const sendViaResend = async ({ email, otp }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'NagarPulse AI <onboarding@resend.dev>';

  const payload = {
    from: fromEmail,
    to: [email],
    subject: 'NagarPulse AI - Citizen Verification OTP Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
        <div style="margin-bottom: 20px;">
          <h2 style="color: #1d4ed8; margin: 0; display: inline-block;">NagarPulse AI</h2>
          <span style="margin-left: 8px; font-size: 11px; background: #eff6ff; color: #1d4ed8; padding: 3px 8px; border-radius: 9999px; font-weight: bold;">Civic Grievance Triage</span>
        </div>
        <p style="color: #334155; font-size: 14px; line-height: 1.5;">Your one-time 6-digit citizen verification code for registration is:</p>
        <div style="background: #f8fafc; border: 2px dashed #93c5fd; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1d4ed8; font-family: monospace;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-bottom: 4px;">This code is valid for <strong>5 minutes</strong>. Never share this code with anyone.</p>
        <p style="color: #94a3b8; font-size: 11px; margin-top: 16px;">Nellore Municipal Corporation • Civic Operations Command Desk</p>
      </div>
    `
  };

  const res = await fetchWithTimeout('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Resend API responded with HTTP ${res.status}: ${errorText}`);
  }

  return { provider: 'Resend HTTPS REST', status: res.status };
};

/**
 * Dispatch Email OTP via configured HTTPS REST Provider (Brevo or Resend)
 */
const sendEmailOtp = async ({ email, otp }) => {
  if (process.env.BREVO_API_KEY) {
    return sendViaBrevo({ email, otp });
  }

  if (process.env.RESEND_API_KEY) {
    return sendViaResend({ email, otp });
  }

  throw new Error('No HTTPS email provider configured (set BREVO_API_KEY or RESEND_API_KEY)');
};

/**
 * Dispatch Mobile SMS OTP via HTTPS REST Provider (Twilio or Fast2SMS) with 5s timeout
 */
const sendMobileSmsOtp = async ({ phone, otp }) => {
  const cleanDigits = phone.replace(/\D/g, '');

  // 1. Twilio SMS REST API
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;
    const toPhone = phone.startsWith('+') ? phone : `+91${cleanDigits.slice(-10)}`;

    const formBody = new URLSearchParams({
      To: toPhone,
      From: fromPhone,
      Body: `Your NagarPulse AI verification code is ${otp}. Valid for 5 minutes.`
    });

    const res = await fetchWithTimeout(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formBody.toString()
      }
    );

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`Twilio SMS API HTTP ${res.status}: ${errorText}`);
    }

    return { provider: 'Twilio SMS REST', status: res.status };
  }

  // 2. Fast2SMS Indian Gateway REST API
  if (process.env.FAST2SMS_API_KEY) {
    const targetNumber = cleanDigits.slice(-10);
    const res = await fetchWithTimeout('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': process.env.FAST2SMS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        route: 'otp',
        variables_values: otp,
        numbers: targetNumber
      })
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      throw new Error(`Fast2SMS API HTTP ${res.status}: ${errorText}`);
    }

    return { provider: 'Fast2SMS REST', status: res.status };
  }

  throw new Error('No SMS REST provider configured (set TWILIO_ACCOUNT_SID or FAST2SMS_API_KEY)');
};

/**
 * Dispatch OTP across Email and SMS channels in parallel with strict 5-second timeouts
 */
const dispatchOtp = async ({ email, phone, otp }) => {
  const results = await Promise.allSettled([
    sendEmailOtp({ email, otp }),
    sendMobileSmsOtp({ phone, otp })
  ]);

  const [emailResult, smsResult] = results;

  const emailSuccess = emailResult.status === 'fulfilled';
  const smsSuccess = smsResult.status === 'fulfilled';

  const errors = [];
  if (!emailSuccess) {
    errors.push(`Email: ${emailResult.reason?.message || emailResult.reason}`);
  }
  if (!smsSuccess) {
    errors.push(`SMS: ${smsResult.reason?.message || smsResult.reason}`);
  }

  return {
    success: emailSuccess || smsSuccess,
    emailDelivered: emailSuccess,
    smsDelivered: smsSuccess,
    providers: [
      emailSuccess ? emailResult.value?.provider : null,
      smsSuccess ? smsResult.value?.provider : null
    ].filter(Boolean),
    error: errors.length > 0 ? errors.join(' | ') : null
  };
};

module.exports = {
  dispatchOtp,
  sendEmailOtp,
  sendMobileSmsOtp
};
