import nodemailer from "nodemailer";

interface InviteEmailInput {
  friendEmail: string;
  inviteToken: string;
  inviterName?: string;
  friendName?: string;
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://iheartlinkedin.app";
}

function extractFirstName(email: string): string {
  const local = email.split("@")[0] || "";
  const cleaned = local.replace(/\d+/g, "");
  const parts = cleaned.split(/[._-]+/).filter(Boolean);
  const first = parts[0] || cleaned;
  if (first.length < 2) return "";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export async function sendInviteEmail({ friendEmail, inviteToken, inviterName, friendName }: InviteEmailInput) {
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
  const friendFirstName = friendName
    ? friendName.split(" ")[0]
    : extractFirstName(friendEmail);
  const salutation = friendFirstName ? `Hi ${friendFirstName},` : "Hi,";
  const subject = `${sender} thinks iHeartLinkedIn can supercharge your LinkedIn`;

  await transporter.sendMail({
    from: `"iHeartLinkedIn" <${user}>`,
    to: friendEmail,
    subject,
    text: `${salutation}\n\n${sender} shared iHeartLinkedIn with you — a free tool that gives you a personalized roadmap to supercharge your LinkedIn and land your dream role.\n\nHere is what it does for you:\n- Scores your LinkedIn profile out of 100\n- Pinpoints exactly what is costing you recruiter attention\n- Gives you a fix-by-fix roadmap built around your target role, industry, and dream company\n\nGet recruited. Don't just apply.\n\nClaim your free review:\n${inviteUrl}`,
    html: `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
        <tr>
          <td align="center" style="padding: 40px 16px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 32px rgba(0,0,0,0.10);">
              <!-- Header -->
              <tr>
                <td align="center" style="background:linear-gradient(160deg,#001E3C 0%,#0A66C2 100%); padding:36px 40px;">
                  <div style="display:inline-block; background:#ffffff; border-radius:16px; padding:14px 28px;">
                    <img src="https://iheartlinkedin.app/logo-iheartlinkedin.svg" alt="iHeartLinkedIn" width="160" style="display:block; height:auto;" />
                  </div>
                </td>
              </tr>
              <!-- Accent bar -->
              <tr>
                <td style="height:4px; background:linear-gradient(90deg,#0A66C2,#38bdf8);"></td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px 44px 36px;">
                  <p style="margin:0 0 10px 0; font-size:16px; color:#0f172a;">${salutation}</p>
                  <p style="margin:0 0 24px 0; font-size:16px; color:#334155; line-height:1.75;">
                    <strong style="color:#0f172a;">${sender}</strong> shared <strong style="color:#0A66C2;">iHeartLinkedIn</strong> with you — a free tool that gives you a personalized roadmap to supercharge your LinkedIn and land your dream role.
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px 0;">
                    <tr>
                      <td style="padding:8px 0; border-bottom:1px solid #f1f5f9;">
                        <span style="color:#0A66C2; font-weight:700; font-size:14px;">01 &nbsp;</span>
                        <span style="color:#334155; font-size:14px; line-height:1.6;">Scores your LinkedIn profile out of 100</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0; border-bottom:1px solid #f1f5f9;">
                        <span style="color:#0A66C2; font-weight:700; font-size:14px;">02 &nbsp;</span>
                        <span style="color:#334155; font-size:14px; line-height:1.6;">Pinpoints exactly what is costing you recruiter attention</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0;">
                        <span style="color:#0A66C2; font-weight:700; font-size:14px;">03 &nbsp;</span>
                        <span style="color:#334155; font-size:14px; line-height:1.6;">Gives you a fix roadmap built around your target role and dream company</span>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 32px 0; font-size:15px; color:#64748b; line-height:1.75; font-style:italic;">
                    Get recruited. Don't just apply.
                  </p>
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="border-radius:8px; background:#0A66C2;">
                        <a href="${inviteUrl}" style="display:inline-block; padding:15px 36px; font-size:15px; font-weight:800; color:#ffffff; text-decoration:none; letter-spacing:0.3px; border-radius:8px;">
                          Supercharge My LinkedIn
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:20px 44px 28px; border-top:1px solid #f1f5f9;">
                  <p style="margin:0; font-size:12px; color:#94a3b8; line-height:1.6;">
                    iheartlinkedin.app<br/>
                    You received this because ${sender} invited you.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `
  });

  return { sent: true };
}
