import nodemailer from "nodemailer";

interface InviteEmailInput {
  friendEmail: string;
  inviteToken: string;
  inviterName?: string;
}

function appUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://profile-analyser.vercel.app";
}

export async function sendInviteEmail({ friendEmail, inviteToken, inviterName }: InviteEmailInput) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return { sent: false, reason: "missing_gmail_config" };
  }

  const inviteUrl = `${appUrl()}/?invite=${encodeURIComponent(inviteToken)}`;
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass }
  });

  const sender = inviterName || "Someone";
  const subject = `${sender} invited you to supercharge your LinkedIn`;

  await transporter.sendMail({
    from: `"Profile Analyser" <${user}>`,
    to: friendEmail,
    subject,
    text: `Hi,\n\n${sender} has invited you to sign up for Profile Analyser — the free tool that helps you supercharge your LinkedIn to get hired at your dream role.\n\nTry it now:\n${inviteUrl}`,
    html: `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <tr>
          <td style="padding: 32px 40px;">
            <p style="margin: 0 0 8px; font-size: 15px;">Hi,</p>
            <p style="margin: 0 0 28px; font-size: 15px;"><strong>${sender}</strong> has invited you to sign up for <strong>Profile Analyser</strong> — the free tool that helps you supercharge your LinkedIn to get hired at your dream role.</p>
            <a href="${inviteUrl}" style="display: inline-block; background: #0d9488; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 800; font-size: 15px; letter-spacing: 0.5px;">
              TRY NOW
            </a>
          </td>
        </tr>
      </table>
    `
  });

  return { sent: true };
}
