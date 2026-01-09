//@ts-nocheck
import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

export async function sendMedicineReminder() {
  const to = "ngamsakhurdia90@gmail.com";
  const subject = "REMINDER";

  // TODO: Fill in your reminder text below
  const text = `
This is your daily medicine reminder FROM YOUR LOVE , PLEASE ᲬᲐᲛᲐᲚᲘ ᲐᲠ ᲓᲐᲒᲐᲕᲘᲬᲧᲓᲔᲡ ᲜᲘᲜᲘ.
`;

  const html = `
<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#FFFFFF;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;padding:20px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#FFFFFF;">
            <tr>
              <td style="padding:0 8px 16px 8px;">
                <!-- Card -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.25);">
                  <!-- Header -->
                  <tr>
                    <td style="padding:20px 20px 12px 20px;background:linear-gradient(135deg,#10B981,#34D399);">
                      <div style="font-size:22px;font-weight:800;color:#FFFFFF;">
                        =� Medicine Reminder
                      </div>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding:20px;color:#334155;font-size:15px;line-height:1.6;">
                      <p style="margin:0 0 12px 0;">
                        ნინი, წამალი დალიე - დროულად.
                      </p>
                      <p style="margin:0;">
                        This is your daily medicine reminder.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding:14px 20px 20px 20px;color:#94A3B8;font-size:12px;background:#F8FAFC;border-top:1px solid #EEF2F7;">
                      Automated reminder " Sent daily at 12:00 Tbilisi time from your lover - Iviko Shengelia
                    </td>
                  </tr>
                </table>
                <!-- /Card -->
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  await sendEmailWithResend({ to, subject, html, text });
  console.log("Medicine reminder sent successfully!");
}

async function sendEmailWithResend({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY!;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");

  const resend = new Resend(apiKey);

  const from = "DAILY REMINDER";
  if (!from)
    throw new Error(
      "Missing MAIL_FROM (must be a verified domain/sender in Resend)"
    );

  const toList = Array.isArray(to)
    ? to
    : typeof to === "string" && to.includes(",")
    ? to.split(",").map((s) => s.trim())
    : to;

  const { data, error } = await resend.emails.send({
    from,
    to: toList as any,
    subject,
    cc: "shengelia1800@gmail.com",
    html,
    text,
  });

  if (error) throw error;

  console.log("Email sent:", data);
}
