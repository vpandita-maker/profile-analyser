import nodemailer from "nodemailer";

interface InviteEmailInput {
  friendEmail: string;
  inviteToken: string;
}

function appUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://profile-analyser.vercel.app";
}

export async function sendInviteEmail({ friendEmail, inviteToken }: InviteEmailInput) {
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

  await transporter.sendMail({
    from: `"Profile Analyzer" <${user}>`,
    to: friendEmail,
    subject: "You have been invited to try Profile Analyzer",
    text: `You have been invited to try Profile Analyzer.\n\nOpen this link to start:\n${inviteUrl}\n\nAdd your LinkedIn profile URL, answer a few questions, and get expert profile analysis with specific fixes.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.6;">
        <h2 style="margin: 0 0 12px;">You have been invited to try Profile Analyzer</h2>
        <p>Add your LinkedIn profile URL, answer a few questions, and get expert profile analysis with specific fixes.</p>
        <p>
          <a href="${inviteUrl}" style="display: inline-block; background: #0f9f8f; color: white; padding: 12px 18px; border-radius: 8px; text-decoration: none; font-weight: 700;">
            Start your review
          </a>
        </p>
      </div>
    `
  });

  return { sent: true };
}
