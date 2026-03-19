import nodemailer from "nodemailer";

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("[email] SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS to enable emails.");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

const APP_NAME = process.env.APP_NAME ?? "ZorvixAI";
const APP_URL = process.env.APP_URL ?? "https://your-app.onrender.com";
const FROM_EMAIL = process.env.FROM_EMAIL ?? process.env.SMTP_USER ?? "noreply@zorvixai.com";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

export async function sendAdminRegistrationRequest(user: {
  name: string;
  email: string;
  id: number;
}): Promise<void> {
  if (!ADMIN_EMAIL) {
    console.warn("[email] ADMIN_EMAIL not set — skipping admin notification email.");
    return;
  }

  const transport = createTransport();
  if (!transport) return;

  const approveUrl = `${APP_URL}/api/admin/registration-requests/${user.id}/approve-via-email?token=${process.env.ADMIN_EMAIL_TOKEN ?? ""}`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#05050f;font-family:'Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#05050f;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0f0f1e;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:100%;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px 40px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.03em;">${APP_NAME}</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Admin Notification</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          <h2 style="margin:0 0 8px;color:#eeeeff;font-size:18px;font-weight:700;">New Registration Request</h2>
          <p style="margin:0 0 28px;color:#b4b4d4;font-size:14px;line-height:1.6;">
            A new user is waiting for your approval to join <strong style="color:#eeeeff;">${APP_NAME}</strong>.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#161628;border:1px solid rgba(255,255,255,0.06);border-radius:12px;margin-bottom:28px;">
            <tr><td style="padding:20px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;color:#7878a0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;width:80px;">Name</td>
                  <td style="padding:6px 0;color:#eeeeff;font-size:14px;font-weight:500;">${user.name}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#7878a0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Email</td>
                  <td style="padding:6px 0;color:#eeeeff;font-size:14px;font-weight:500;">${user.email}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#7878a0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Time</td>
                  <td style="padding:6px 0;color:#eeeeff;font-size:14px;font-weight:500;">${new Date().toLocaleString()}</td>
                </tr>
              </table>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:8px;width:50%;">
                <a href="${approveUrl}" style="display:block;text-align:center;padding:12px 20px;background:#7c3aed;color:#ffffff;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">
                  ✓ Approve via Email
                </a>
              </td>
              <td style="padding-left:8px;width:50%;">
                <a href="${APP_URL}/admin" style="display:block;text-align:center;padding:12px 20px;background:#161628;color:#b4b4d4;text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;border:1px solid rgba(255,255,255,0.08);">
                  Open Admin Panel
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:24px 0 0;color:#4a4a70;font-size:12px;line-height:1.6;text-align:center;">
            You can also manage all registration requests from the Admin Dashboard inside the app.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await transport.sendMail({
      from: `"${APP_NAME}" <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `[${APP_NAME}] New registration request from ${user.name}`,
      html,
    });
    console.log(`[email] Admin notification sent for ${user.email}`);
  } catch (err: any) {
    console.error("[email] Failed to send admin notification:", err.message);
  }
}

export async function sendApprovalEmail(user: {
  name: string;
  email: string;
}): Promise<void> {
  const transport = createTransport();
  if (!transport) return;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#05050f;font-family:'Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#05050f;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0f0f1e;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:100%;">
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px 40px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.03em;">${APP_NAME}</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Account Approved</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <div style="text-align:center;margin-bottom:28px;">
            <div style="width:64px;height:64px;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.25);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:28px;">✓</div>
          </div>

          <h2 style="margin:0 0 8px;color:#eeeeff;font-size:20px;font-weight:700;text-align:center;">You're approved, ${user.name}!</h2>
          <p style="margin:0 0 32px;color:#b4b4d4;font-size:14px;line-height:1.7;text-align:center;">
            Your account request has been approved by the admin. You can now sign in to <strong style="color:#eeeeff;">${APP_NAME}</strong> and start building with AI.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td align="center">
              <a href="${APP_URL}/login" style="display:inline-block;padding:14px 36px;background:#7c3aed;color:#ffffff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600;box-shadow:0 4px 20px rgba(124,58,237,0.35);">
                Sign In Now →
              </a>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#161628;border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
            <tr><td style="padding:20px 24px;">
              <p style="margin:0 0 4px;color:#7878a0;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Your login email</p>
              <p style="margin:0;color:#eeeeff;font-size:14px;font-weight:500;">${user.email}</p>
            </td></tr>
          </table>

          <p style="margin:24px 0 0;color:#4a4a70;font-size:12px;text-align:center;">
            If you didn't create this account, you can safely ignore this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await transport.sendMail({
      from: `"${APP_NAME}" <${FROM_EMAIL}>`,
      to: user.email,
      subject: `[${APP_NAME}] Your account has been approved — you can now log in!`,
      html,
    });
    console.log(`[email] Approval email sent to ${user.email}`);
  } catch (err: any) {
    console.error("[email] Failed to send approval email:", err.message);
  }
}

export async function sendRejectionEmail(user: {
  name: string;
  email: string;
}): Promise<void> {
  const transport = createTransport();
  if (!transport) return;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#05050f;font-family:'Inter',system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#05050f;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#0f0f1e;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;max-width:100%;">
        <tr><td style="background:linear-gradient(135deg,#374151,#1f2937);padding:32px 40px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.03em;">${APP_NAME}</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.6);font-size:13px;">Account Request Update</p>
        </td></tr>
        <tr><td style="padding:36px 40px;">
          <h2 style="margin:0 0 12px;color:#eeeeff;font-size:18px;font-weight:700;">Hi ${user.name},</h2>
          <p style="margin:0 0 16px;color:#b4b4d4;font-size:14px;line-height:1.7;">
            Thank you for your interest in <strong style="color:#eeeeff;">${APP_NAME}</strong>. Unfortunately, your account request has not been approved at this time.
          </p>
          <p style="margin:0 0 28px;color:#b4b4d4;font-size:14px;line-height:1.7;">
            If you believe this is a mistake or have any questions, please contact the administrator directly.
          </p>
          <p style="margin:0;color:#4a4a70;font-size:12px;">— The ${APP_NAME} Team</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await transport.sendMail({
      from: `"${APP_NAME}" <${FROM_EMAIL}>`,
      to: user.email,
      subject: `[${APP_NAME}] Update on your account request`,
      html,
    });
    console.log(`[email] Rejection email sent to ${user.email}`);
  } catch (err: any) {
    console.error("[email] Failed to send rejection email:", err.message);
  }
}
