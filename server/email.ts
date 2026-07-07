import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

export async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export async function sendNewsletter(
  subject: string,
  htmlContent: string,
  recipients: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: recipients,
      subject,
      html: htmlContent
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Newsletter send failed:', error);
    return { success: false, error: error.message };
  }
}

export async function sendApplicationConfirmationEmail(email: string, firstName?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    const name = firstName || 'there';
    const mastheadPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'assets', 'afara-masthead-email.jpg');
    const mastheadBuffer = fs.existsSync(mastheadPath) ? fs.readFileSync(mastheadPath) : null;
    const mastheadSrc = 'cid:afara-masthead';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Received – AFÁRÁ</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:#f5f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f4f0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">

          <!-- Masthead Image -->
          <tr>
            <td style="padding:0;margin:0;">
              <img src="${mastheadSrc}" alt="AFÁRÁ" width="600" style="display:block;width:100%;max-width:600px;height:auto;" />
            </td>
          </tr>

          <!-- Green accent line -->
          <tr>
            <td style="background-color:#034a21;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding:48px 48px 32px 48px;">

              <h1 style="margin:0 0 28px 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:28px;font-weight:600;font-style:normal;color:#034a21;line-height:1.3;">
                We've received your application
              </h1>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                Dear ${name},
              </p>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                Thank you for applying to the AFÁRÁ Accelerator Program. We're glad you took this step, and we want you to know your application is in good hands.
              </p>

              <p style="margin:0 0 32px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                Our team will review your submission carefully. You can expect to hear from us within <strong style="color:#034a21;">2–4 weeks</strong> with an update on the next steps.
              </p>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #e8e4dd;padding:0;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- What happens next -->
              <h2 style="margin:32px 0 16px 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:18px;font-weight:600;font-style:normal;color:#034a21;">
                What happens next
              </h2>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:10px 0;vertical-align:top;width:24px;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#034a21;margin-top:6px;">&nbsp;</span>
                  </td>
                  <td style="padding:10px 0 10px 8px;font-size:15px;line-height:1.6;color:#2d2d2d;">
                    Our team reviews all applications against the program criteria
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;vertical-align:top;width:24px;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#034a21;margin-top:6px;">&nbsp;</span>
                  </td>
                  <td style="padding:10px 0 10px 8px;font-size:15px;line-height:1.6;color:#2d2d2d;">
                    Shortlisted applicants will be invited to a brief interview or pitch session
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;vertical-align:top;width:24px;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#034a21;margin-top:6px;">&nbsp;</span>
                  </td>
                  <td style="padding:10px 0 10px 8px;font-size:15px;line-height:1.6;color:#2d2d2d;">
                    Final decisions will be communicated to all applicants within the review window
                  </td>
                </tr>
              </table>

              <p style="margin:32px 0 0 0;font-size:15px;line-height:1.7;color:#555555;">
                If you have any questions in the meantime, please reach out to us at
                <a href="mailto:hello@afaraaccelerator.org" style="color:#034a21;text-decoration:underline;">hello@afaraaccelerator.org</a>.
              </p>

            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:0 48px 48px 48px;">
              <p style="margin:32px 0 4px 0;font-size:15px;line-height:1.6;color:#2d2d2d;">
                Warm regards,
              </p>
              <p style="margin:0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:16px;font-weight:600;font-style:normal;color:#034a21;">
                The AFÁRÁ Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#034a21;padding:24px 48px;">
              <p style="margin:0 0 6px 0;font-size:13px;line-height:1.6;color:#a8c4c4;">
                AFÁRÁ is an initiative of
                <a href="https://openspacesandbridges.com/" style="color:#a8c4c4;text-decoration:underline;">Open Spaces & Bridges Advisory (OPSB)</a>
              </p>
              <p style="margin:0;font-size:12px;color:#6a9090;">
                &copy; ${new Date().getFullYear()} AFÁRÁ. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: email,
      subject: "We\u2019ve received your application \u2013 AF\u00C1R\u00C1 Accelerator",
      html,
      attachments: mastheadBuffer ? [
        {
          filename: 'afara-masthead.jpg',
          content: mastheadBuffer.toString('base64'),
          content_id: 'afara-masthead',
        }
      ] as any : [],
    });

    if (error) {
      console.error('Application confirmation email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Application confirmation email failed:', error);
    return { success: false, error: error.message };
  }
}

export async function sendAcceptanceEmail(email: string, firstName?: string, reviewNotes?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    const name = firstName || 'there';
    const mastheadPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'assets', 'afara-masthead-email.jpg');
    const mastheadBuffer = fs.existsSync(mastheadPath) ? fs.readFileSync(mastheadPath) : null;
    const mastheadSrc = 'cid:afara-masthead';
    const loginUrl = 'https://afaraaccelerator.org/lms/dashboard';

    const personalNoteBlock = reviewNotes ? `
              <!-- Personal note from team -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px 0;background-color:#f0f5f5;border-radius:4px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 8px 0;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#034a21;">A personal note</p>
                    <p style="margin:0;font-size:15px;line-height:1.7;color:#2d2d2d;font-style:italic;">"${reviewNotes}"</p>
                    <p style="margin:8px 0 0 0;font-size:13px;color:#555555;">— The AFÁRÁ Team</p>
                  </td>
                </tr>
              </table>` : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've been accepted – AFÁRÁ</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:#f5f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f4f0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">

          <!-- Masthead Image -->
          <tr>
            <td style="padding:0;margin:0;">
              <img src="${mastheadSrc}" alt="AFÁRÁ" width="600" style="display:block;width:100%;max-width:600px;height:auto;" />
            </td>
          </tr>

          <!-- Green accent line -->
          <tr>
            <td style="background-color:#034a21;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding:48px 48px 32px 48px;">

              <h1 style="margin:0 0 28px 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:28px;font-weight:600;color:#034a21;line-height:1.3;">
                Congratulations — you've been selected
              </h1>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                Dear ${name},
              </p>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                We are delighted to let you know that your application to the <strong style="color:#034a21;">AFÁRÁ Accelerator Program</strong> has been successful. You have been selected as one of <strong style="color:#034a21;">50 Infrapreneurs</strong> joining the <strong style="color:#034a21;">AFÁRÁ Inaugural Cohort</strong>.
              </p>

              ${personalNoteBlock}

              <!-- Programme structure intro -->
              <p style="margin:0 0 24px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                Here is what your journey with AFÁRÁ looks like:
              </p>

              <!-- Track 1 box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px 0;background-color:#f9f5f0;border-radius:4px;">
                <tr>
                  <td style="padding:28px 28px 24px 28px;">
                    <p style="margin:0 0 4px 0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#a07840;">All 50 Infrapreneurs</p>
                    <p style="margin:4px 0 16px 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:19px;font-weight:600;color:#034a21;line-height:1.2;">Track 1 &mdash; Venture Access Cohort</p>
                    <p style="margin:0 0 16px 0;font-size:14px;line-height:1.7;color:#2d2d2d;">
                      Upon your successful selection to participate, you will take part in the <strong style="color:#034a21;">Venture Access Cohort</strong> — a two-day Immersive event. During the event, a selection process will take place, and shortlisted finalists will pitch their business or project to a panel of jurors.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:5px 0;vertical-align:top;width:16px;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background-color:#034a21;margin-top:7px;">&nbsp;</span></td>
                        <td style="padding:5px 0 5px 8px;font-size:14px;color:#2d2d2d;line-height:1.6;">Participate in the 2-day Immersive event</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;vertical-align:top;width:16px;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background-color:#034a21;margin-top:7px;">&nbsp;</span></td>
                        <td style="padding:5px 0 5px 8px;font-size:14px;color:#2d2d2d;line-height:1.6;">Access to curated expert-led webinars</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;vertical-align:top;width:16px;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background-color:#034a21;margin-top:7px;">&nbsp;</span></td>
                        <td style="padding:5px 0 5px 8px;font-size:14px;color:#2d2d2d;line-height:1.6;">Select ecosystem opportunities</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;vertical-align:top;width:16px;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background-color:#034a21;margin-top:7px;">&nbsp;</span></td>
                        <td style="padding:5px 0 5px 8px;font-size:14px;color:#2d2d2d;line-height:1.6;">Continued inclusion in the founder network</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Track 2 box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px 0;background-color:#034a21;border-radius:4px;">
                <tr>
                  <td style="padding:28px 28px 24px 28px;">
                    <p style="margin:0 0 4px 0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#a8c4c4;">10 selected after the Immersive event</p>
                    <p style="margin:4px 0 16px 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:19px;font-weight:600;color:#ffffff;line-height:1.2;">Track 2 &mdash; Venture Advancement Cohort</p>
                    <p style="margin:0 0 16px 0;font-size:14px;line-height:1.7;color:#c8dada;">
                      Ten Infrapreneurs will move on to the <strong style="color:#ffffff;">Venture Advancement Cohort</strong> — a six-month project support phase where AFÁRÁ will provide specific, tailored support to your business or project based on your application and our assessment of your needs.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:5px 0;vertical-align:top;width:16px;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background-color:#a8c4c4;margin-top:7px;">&nbsp;</span></td>
                        <td style="padding:5px 0 5px 8px;font-size:14px;color:#c8dada;line-height:1.6;">Intensive 6-month acceleration</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;vertical-align:top;width:16px;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background-color:#a8c4c4;margin-top:7px;">&nbsp;</span></td>
                        <td style="padding:5px 0 5px 8px;font-size:14px;color:#c8dada;line-height:1.6;">Dedicated mentorship</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;vertical-align:top;width:16px;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background-color:#a8c4c4;margin-top:7px;">&nbsp;</span></td>
                        <td style="padding:5px 0 5px 8px;font-size:14px;color:#c8dada;line-height:1.6;">Hands-on project support</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;vertical-align:top;width:16px;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background-color:#a8c4c4;margin-top:7px;">&nbsp;</span></td>
                        <td style="padding:5px 0 5px 8px;font-size:14px;color:#c8dada;line-height:1.6;">Investor and partner access</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Event box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px 0;border:1px solid #e8e4dd;border-radius:4px;">
                <tr>
                  <td style="padding:28px 28px;">
                    <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#034a21;">Save the dates</p>
                    <p style="margin:8px 0 0 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:24px;font-weight:600;color:#034a21;line-height:1.2;">19th &amp; 20th May 2026</p>
                    <p style="margin:8px 0 0 0;font-size:14px;color:#555555;line-height:1.5;">AFÁRÁ Immersive Launch &mdash; Inaugural Cohort</p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;border-top:1px solid #e8e4dd;padding-top:20px;">
                      <tr>
                        <td style="padding:6px 0;vertical-align:top;width:20px;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background-color:#034a21;margin-top:7px;">&nbsp;</span></td>
                        <td style="padding:6px 0 6px 8px;font-size:13px;font-weight:600;color:#2d2d2d;">In person &mdash; J. Randle Center for Yoruba Culture &amp; History, Lagos</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;vertical-align:top;width:20px;"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background-color:#034a21;margin-top:7px;">&nbsp;</span></td>
                        <td style="padding:6px 0 6px 8px;font-size:13px;font-weight:600;color:#2d2d2d;">Online &mdash; for those who cannot attend in person</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Platform access note -->
              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.7;color:#2d2d2d;">
                Your account has been upgraded to full participant access. Log in to your dashboard to connect with your fellow cohort members and explore everything the platform has to offer — more details about the programme and next steps will follow shortly.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px 0;">
                <tr>
                  <td style="border-radius:4px;background-color:#034a21;">
                    <a href="${loginUrl}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:4px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                      Go to your dashboard
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #e8e4dd;padding:0;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <p style="margin:24px 0 0 0;font-size:15px;line-height:1.7;color:#555555;">
                If you have any questions, please reach out at
                <a href="mailto:hello@afaraaccelerator.org" style="color:#034a21;text-decoration:underline;">hello@afaraaccelerator.org</a>.
              </p>

            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:0 48px 48px 48px;">
              <p style="margin:32px 0 4px 0;font-size:15px;line-height:1.6;color:#2d2d2d;">Warm regards,</p>
              <p style="margin:0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:16px;font-weight:600;color:#034a21;">
                The AFÁRÁ Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#034a21;padding:24px 48px;">
              <p style="margin:0 0 6px 0;font-size:13px;line-height:1.6;color:#a8c4c4;">
                AFÁRÁ is an initiative of
                <a href="https://openspacesandbridges.com/" style="color:#a8c4c4;text-decoration:underline;">Open Spaces &amp; Bridges Advisory (OPSB)</a>
              </p>
              <p style="margin:0;font-size:12px;color:#6a9090;">
                &copy; ${new Date().getFullYear()} AFÁRÁ. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: email,
      subject: "Congratulations \u2014 You\u2019ve been accepted to AF\u00C1R\u00C1",
      html,
      attachments: mastheadBuffer ? [
        {
          filename: 'afara-masthead.jpg',
          content: mastheadBuffer.toString('base64'),
          content_id: 'afara-masthead',
        }
      ] as any : [],
    });

    if (error) {
      console.error('Acceptance email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Acceptance email failed:', error);
    return { success: false, error: error.message };
  }
}

export async function sendRejectionEmail(email: string, firstName?: string, reviewNotes?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    const name = firstName || 'there';
    const mastheadPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'assets', 'afara-masthead-email.jpg');
    const mastheadBuffer = fs.existsSync(mastheadPath) ? fs.readFileSync(mastheadPath) : null;
    const mastheadSrc = 'cid:afara-masthead';

    const personalNoteBlock = reviewNotes ? `
              <!-- Personal note from team -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px 0;background-color:#f9f5f0;border-radius:4px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 8px 0;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#034a21;">Feedback from the team</p>
                    <p style="margin:0;font-size:15px;line-height:1.7;color:#2d2d2d;font-style:italic;">"${reviewNotes}"</p>
                    <p style="margin:8px 0 0 0;font-size:13px;color:#555555;">— The AFÁRÁ Team</p>
                  </td>
                </tr>
              </table>` : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your AFÁRÁ application – an update</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:#f5f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f4f0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">

          <!-- Masthead Image -->
          <tr>
            <td style="padding:0;margin:0;">
              <img src="${mastheadSrc}" alt="AFÁRÁ" width="600" style="display:block;width:100%;max-width:600px;height:auto;" />
            </td>
          </tr>

          <!-- Green accent line -->
          <tr>
            <td style="background-color:#034a21;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding:48px 48px 32px 48px;">

              <h1 style="margin:0 0 28px 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:28px;font-weight:600;color:#034a21;line-height:1.3;">
                An update on your application
              </h1>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                Dear ${name},
              </p>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                Thank you for taking the time to apply to the <strong style="color:#034a21;">AFÁRÁ Accelerator Program</strong>. After careful review of all applications, we regret to inform you that we are unable to offer you a place in the current cohort.
              </p>

              <p style="margin:0 0 32px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                This was a competitive process, and the decision was not easy. We are genuinely grateful for your interest and the effort you put into your application.
              </p>

              ${personalNoteBlock}

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #e8e4dd;padding:0;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Stay connected -->
              <h2 style="margin:32px 0 16px 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:18px;font-weight:600;color:#034a21;">
                Stay connected with AFÁRÁ
              </h2>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px 0;">
                <tr>
                  <td style="padding:10px 0;vertical-align:top;width:24px;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#034a21;margin-top:6px;">&nbsp;</span>
                  </td>
                  <td style="padding:10px 0 10px 8px;font-size:15px;line-height:1.6;color:#2d2d2d;">We run new cohorts regularly — we encourage you to apply again in a future cycle</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;vertical-align:top;width:24px;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#034a21;margin-top:6px;">&nbsp;</span>
                  </td>
                  <td style="padding:10px 0 10px 8px;font-size:15px;line-height:1.6;color:#2d2d2d;">Follow our updates and events at <a href="https://afaraaccelerator.org" style="color:#034a21;text-decoration:underline;">afaraaccelerator.org</a></td>
                </tr>
                <tr>
                  <td style="padding:10px 0;vertical-align:top;width:24px;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#034a21;margin-top:6px;">&nbsp;</span>
                  </td>
                  <td style="padding:10px 0 10px 8px;font-size:15px;line-height:1.6;color:#2d2d2d;">For any questions, reach us at <a href="mailto:hello@afaraaccelerator.org" style="color:#034a21;text-decoration:underline;">hello@afaraaccelerator.org</a></td>
                </tr>
              </table>

              <p style="margin:0;font-size:15px;line-height:1.7;color:#555555;">
                We wish you all the best in your endeavours and hope our paths will cross again.
              </p>

            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:0 48px 48px 48px;">
              <p style="margin:32px 0 4px 0;font-size:15px;line-height:1.6;color:#2d2d2d;">Warm regards,</p>
              <p style="margin:0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:16px;font-weight:600;color:#034a21;">
                The AFÁRÁ Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#034a21;padding:24px 48px;">
              <p style="margin:0 0 6px 0;font-size:13px;line-height:1.6;color:#a8c4c4;">
                AFÁRÁ is an initiative of
                <a href="https://openspacesandbridges.com/" style="color:#a8c4c4;text-decoration:underline;">Open Spaces &amp; Bridges Advisory (OPSB)</a>
              </p>
              <p style="margin:0;font-size:12px;color:#6a9090;">
                &copy; ${new Date().getFullYear()} AFÁRÁ. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: email,
      subject: "An update on your AF\u00C1R\u00C1 application",
      html,
      attachments: mastheadBuffer ? [
        {
          filename: 'afara-masthead.jpg',
          content: mastheadBuffer.toString('base64'),
          content_id: 'afara-masthead',
        }
      ] as any : [],
    });

    if (error) {
      console.error('Rejection email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Rejection email failed:', error);
    return { success: false, error: error.message };
  }
}

export async function sendDisqualificationEmail(email: string, firstName?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    const name = firstName || 'there';
    const mastheadPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'assets', 'afara-masthead-email.jpg');
    const mastheadBuffer = fs.existsSync(mastheadPath) ? fs.readFileSync(mastheadPath) : null;
    const mastheadSrc = 'cid:afara-masthead';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your AFÁRÁ application – eligibility update</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:#f5f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f4f0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">

          <!-- Masthead Image -->
          <tr>
            <td style="padding:0;margin:0;">
              <img src="${mastheadSrc}" alt="AFÁRÁ" width="600" style="display:block;width:100%;max-width:600px;height:auto;" />
            </td>
          </tr>

          <!-- Green accent line -->
          <tr>
            <td style="background-color:#034a21;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding:48px 48px 32px 48px;">

              <h1 style="margin:0 0 28px 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:28px;font-weight:600;color:#034a21;line-height:1.3;">
                An update on your application
              </h1>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                Dear ${name},
              </p>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                Thank you sincerely for your interest in the <strong style="color:#034a21;">AFÁRÁ Accelerator Program</strong> and for the time you invested in completing your application.
              </p>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                After reviewing your submission, we are unable to progress your application at this stage as it does not meet the current eligibility criteria for the programme.
              </p>

              <p style="margin:0 0 32px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                AFÁRÁ is specifically designed to support <strong style="color:#034a21;">female-owned and female-led African businesses</strong> operating in the <strong style="color:#034a21;">Energy and Infrastructure</strong> sectors. If your current work does not fall within these parameters, we hope you will find a programme better suited to your journey.
              </p>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #e8e4dd;padding:0;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Other resources -->
              <h2 style="margin:32px 0 16px 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:18px;font-weight:600;color:#034a21;">
                We wish you well
              </h2>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px 0;">
                <tr>
                  <td style="padding:10px 0;vertical-align:top;width:24px;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#034a21;margin-top:6px;">&nbsp;</span>
                  </td>
                  <td style="padding:10px 0 10px 8px;font-size:15px;line-height:1.6;color:#2d2d2d;">We encourage you to explore other programmes and resources aligned with your industry and goals</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;vertical-align:top;width:24px;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#034a21;margin-top:6px;">&nbsp;</span>
                  </td>
                  <td style="padding:10px 0 10px 8px;font-size:15px;line-height:1.6;color:#2d2d2d;">Stay connected with us at <a href="https://afaraaccelerator.org" style="color:#034a21;text-decoration:underline;">afaraaccelerator.org</a> for future news and events</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;vertical-align:top;width:24px;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#034a21;margin-top:6px;">&nbsp;</span>
                  </td>
                  <td style="padding:10px 0 10px 8px;font-size:15px;line-height:1.6;color:#2d2d2d;">If you have any questions, please reach us at <a href="mailto:hello@afaraaccelerator.org" style="color:#034a21;text-decoration:underline;">hello@afaraaccelerator.org</a></td>
                </tr>
              </table>

              <p style="margin:0;font-size:15px;line-height:1.7;color:#555555;">
                We appreciate your enthusiasm for building Africa's future and wish you every success ahead.
              </p>

            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:0 48px 48px 48px;">
              <p style="margin:32px 0 4px 0;font-size:15px;line-height:1.6;color:#2d2d2d;">Warm regards,</p>
              <p style="margin:0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:16px;font-weight:600;color:#034a21;">
                The AFÁRÁ Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#034a21;padding:24px 48px;">
              <p style="margin:0 0 6px 0;font-size:13px;line-height:1.6;color:#a8c4c4;">
                AFÁRÁ is an initiative of
                <a href="https://openspacesandbridges.com/" style="color:#a8c4c4;text-decoration:underline;">Open Spaces &amp; Bridges Advisory (OPSB)</a>
              </p>
              <p style="margin:0;font-size:12px;color:#6a9090;">
                &copy; ${new Date().getFullYear()} AFÁRÁ. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: email,
      subject: "An update on your AF\u00C1R\u00C1 application",
      html,
      attachments: mastheadBuffer ? [
        {
          filename: 'afara-masthead.jpg',
          content: mastheadBuffer.toString('base64'),
          content_id: 'afara-masthead',
        }
      ] as any : [],
    });

    if (error) {
      console.error('Disqualification email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Disqualification email failed:', error);
    return { success: false, error: error.message };
  }
}

export async function sendWaitlistEmail(email: string, firstName?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    const name = firstName || 'there';
    const mastheadPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'assets', 'afara-masthead-email.jpg');
    const mastheadBuffer = fs.existsSync(mastheadPath) ? fs.readFileSync(mastheadPath) : null;
    const mastheadSrc = 'cid:afara-masthead';
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>An update on your AFÁRÁ application</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:#f5f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f4f0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">

          <!-- Masthead Image -->
          <tr>
            <td style="padding:0;margin:0;">
              <img src="${mastheadSrc}" alt="AFÁRÁ" width="600" style="display:block;width:100%;max-width:600px;height:auto;" />
            </td>
          </tr>

          <!-- Green accent line -->
          <tr>
            <td style="background-color:#034a21;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding:48px 48px 32px 48px;">

              <h1 style="margin:0 0 28px 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:28px;font-weight:600;color:#034a21;line-height:1.3;">
                An update on your application
              </h1>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                Dear ${name},
              </p>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                Thank you for your application to the <strong style="color:#034a21;">AFÁRÁ Accelerator Program</strong>. We have completed an initial review of all submissions and we are pleased to let you know that your application remains under active consideration.
              </p>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                Your application has been placed on our <strong style="color:#034a21;">waitlist</strong> as we complete the final stages of the selection process. We will be in touch with a further update as soon as a decision is made.
              </p>

              <p style="margin:0 0 32px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                We appreciate your patience and your interest in being part of this programme. Please do not hesitate to reach out if you have any questions in the meantime.
              </p>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #e8e4dd;padding:0;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <p style="margin:28px 0 0 0;font-size:15px;line-height:1.7;color:#555555;">
                For any questions, please reach out at
                <a href="mailto:hello@afaraaccelerator.org" style="color:#034a21;text-decoration:underline;">hello@afaraaccelerator.org</a>.
              </p>

            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:0 48px 48px 48px;">
              <p style="margin:32px 0 4px 0;font-size:15px;line-height:1.6;color:#2d2d2d;">Warm regards,</p>
              <p style="margin:0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:16px;font-weight:600;color:#034a21;">
                The AFÁRÁ Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#034a21;padding:24px 48px;">
              <p style="margin:0 0 6px 0;font-size:13px;line-height:1.6;color:#a8c4c4;">
                AFÁRÁ is an initiative of
                <a href="https://openspacesandbridges.com/" style="color:#a8c4c4;text-decoration:underline;">Open Spaces &amp; Bridges Advisory (OPSB)</a>
              </p>
              <p style="margin:0;font-size:12px;color:#6a9090;">
                &copy; ${new Date().getFullYear()} AFÁRÁ. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: email,
      subject: "You\u2019re invited \u2014 AF\u00C1R\u00C1 Immersive Launch, 19\u201320 May 2026",
      html,
      attachments: mastheadBuffer ? [
        {
          filename: 'afara-masthead.jpg',
          content: mastheadBuffer.toString('base64'),
          content_id: 'afara-masthead',
        }
      ] as any : [],
    });

    if (error) {
      console.error('Waitlist email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Waitlist email failed:', error);
    return { success: false, error: error.message };
  }
}

export async function sendContactNotificationEmail(data: {
  name: string;
  email: string;
  organization?: string;
  interest?: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    const { error } = await client.emails.send({
      from: fromEmail,
      to: "hello@afaraaccelerator.org",
      replyTo: data.email,
      subject: `New contact message from ${data.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #166534;">New Contact Form Submission</h2>
          <table style="width:100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; font-weight: bold;">Name</td><td style="padding: 8px;">${data.name}</td></tr>
            <tr style="background:#f9fafb"><td style="padding: 8px; font-weight: bold;">Email</td><td style="padding: 8px;"><a href="mailto:${data.email}">${data.email}</a></td></tr>
            ${data.organization ? `<tr><td style="padding: 8px; font-weight: bold;">Organisation</td><td style="padding: 8px;">${data.organization}</td></tr>` : ""}
            ${data.interest ? `<tr style="background:#f9fafb"><td style="padding: 8px; font-weight: bold;">Area of Interest</td><td style="padding: 8px;">${data.interest}</td></tr>` : ""}
            <tr><td style="padding: 8px; font-weight: bold; vertical-align:top;">Message</td><td style="padding: 8px; white-space: pre-wrap;">${data.message}</td></tr>
          </table>
          <hr style="border:none; border-top:1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size:12px; color:#6b7280;">Sent via the AFÁRÁ website contact form.</p>
        </div>
      `,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendWelcomeEmail(email: string, firstName?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Welcome to the AFÁRÁ Community!',
      html: `
        <div style="font-family: Arial, sans-serif; background: #f9fafb; margin: 0; padding: 0;">
          <!-- Header with Brand -->
          <div style="background-color: #166534; padding: 60px 30px; text-align: center;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #166534;">
              <tr>
                <td align="center" style="padding: 20px 0;">
                  <h1 style="margin: 0; font-size: 48px; font-weight: bold; color: white; letter-spacing: 2px; font-family: Arial, sans-serif;">AFÁRÁ</h1>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 10px 0 20px 0;">
                  <p style="margin: 0; font-size: 15px; color: #d1fae5; font-family: Arial, sans-serif; line-height: 1.4;">Women Leading Africa's Energy & Infrastructure Future</p>
                </td>
              </tr>
            </table>
          </div>

          <!-- Main Content -->
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px 30px;">
            <h2 style="color: #166534; font-size: 28px; margin: 0 0 20px 0;">Welcome to AFÁRÁ!</h2>
            
            <p style="color: #333; margin: 0 0 15px 0; line-height: 1.6;">Dear ${firstName || 'Community Member'},</p>
            
            <p style="color: #333; margin: 0 0 20px 0; line-height: 1.6;">
              Thank you for joining our community! You're now part of a vibrant network of women entrepreneurs and leaders transforming Africa's energy and infrastructure landscape.
            </p>

            <!-- Benefits Box -->
            <div style="background: #f0fdf4; border-left: 4px solid #15803d; padding: 20px; margin: 25px 0; border-radius: 4px;">
              <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 16px;">As a member, you'll receive:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #333; line-height: 1.8; list-style: none;">
                <li style="margin-bottom: 8px;"><strong>✓ Program Updates</strong> – Latest news on our accelerator cohorts and initiatives</li>
                <li style="margin-bottom: 8px;"><strong>✓ Success Stories</strong> – Inspiring journeys from our alumni entrepreneurs</li>
                <li style="margin-bottom: 8px;"><strong>✓ Industry Insights</strong> – Expert perspectives on energy and infrastructure trends</li>
                <li style="margin-bottom: 8px;"><strong>✓ Exclusive Events</strong> – Networking sessions, webinars, and workshops</li>
                <li><strong>✓ Resource Library</strong> – Templates, guides, and tools to support your journey</li>
              </ul>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://afaraaccelerator.org" style="display: inline-block; background: #166534; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Explore AFÁRÁ
              </a>
            </div>

            <!-- Closing Message -->
            <p style="color: #333; margin: 20px 0; line-height: 1.6;">
              We're excited to have you in the AFÁRÁ community. If you have any questions, our team is here to help.
            </p>

            <p style="color: #333; margin: 20px 0 5px 0;">
              <strong>Contact us:</strong> <a href="mailto:info@afaraaccelerator.org" style="color: #166534; text-decoration: none;">info@afaraaccelerator.org</a>
            </p>

            <p style="color: #333; margin: 20px 0 0 0;">
              Best regards,<br/>
              <strong style="color: #166534;">The AFÁRÁ Team</strong>
            </p>
          </div>

          <!-- Footer -->
          <div style="max-width: 600px; margin: 0 auto; background: #f3f4f6; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #666; font-size: 12px; margin: 0 0 8px 0;">
              AFÁRÁ is an initiative of <strong>Open Spaces & Bridges Advisory (OPSB)</strong>
            </p>
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2026 AFÁRÁ. All rights reserved. | Building Africa's energy and infrastructure future
            </p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('Welcome email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Welcome email failed:', error);
    return { success: false, error: error.message };
  }
}

export async function sendTeamWelcomeEmail(
  email: string,
  firstName: string,
  role: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    const mastheadPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'assets', 'afara-masthead-email.jpg');
    const mastheadBuffer = fs.existsSync(mastheadPath) ? fs.readFileSync(mastheadPath) : null;
    const mastheadSrc = 'cid:afara-masthead';
    const loginUrl = 'https://afaraaccelerator.org/lms/dashboard';

    const roleLabel: Record<string, string> = {
      mentor: 'Mentor',
      facilitator: 'Facilitator',
      admin: 'Administrator',
      superadmin: 'Super Administrator',
    };
    const displayRole = roleLabel[role] || role;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to the AFÁRÁ Team</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:#f5f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f4f0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">

          <!-- Masthead -->
          <tr>
            <td style="padding:0;margin:0;">
              <img src="${mastheadSrc}" alt="AFÁRÁ" width="600" style="display:block;width:100%;max-width:600px;height:auto;" />
            </td>
          </tr>

          <!-- Accent line -->
          <tr>
            <td style="background-color:#034a21;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:48px 48px 32px 48px;">

              <h1 style="margin:0 0 28px 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:28px;font-weight:600;color:#034a21;line-height:1.3;">
                Welcome to the AFÁRÁ team
              </h1>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                Dear ${firstName},
              </p>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                You have been added to the AFÁRÁ Accelerator Platform as a <strong style="color:#034a21;">${displayRole}</strong>. Your account is ready — you can log in right now using the credentials below.
              </p>

              <!-- Credentials box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px 0;background-color:#f0f5f5;border-radius:4px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#034a21;">Your login credentials</p>
                    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">
                      <tr>
                        <td style="padding:6px 0;width:100px;font-size:14px;color:#555555;vertical-align:top;">Email</td>
                        <td style="padding:6px 0;font-size:14px;font-weight:600;color:#2d2d2d;">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#555555;vertical-align:top;">Password</td>
                        <td style="padding:6px 0;font-size:14px;font-weight:600;color:#2d2d2d;font-family:'Courier New',Courier,monospace;letter-spacing:0.05em;">${password}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 32px 0;font-size:15px;line-height:1.7;color:#555555;">
                We recommend changing your password after your first login. You can do this from your profile settings inside the platform.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px 0;">
                <tr>
                  <td style="border-radius:4px;background-color:#034a21;">
                    <a href="${loginUrl}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:4px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                      Log In to AFÁRÁ
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #e8e4dd;padding:0;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <p style="margin:24px 0 0 0;font-size:15px;line-height:1.7;color:#555555;">
                Questions? Reach us at
                <a href="mailto:hello@afaraaccelerator.org" style="color:#034a21;text-decoration:underline;">hello@afaraaccelerator.org</a>.
              </p>

            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:0 48px 48px 48px;">
              <p style="margin:32px 0 4px 0;font-size:15px;line-height:1.6;color:#2d2d2d;">Warm regards,</p>
              <p style="margin:0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:16px;font-weight:600;color:#034a21;">
                The AFÁRÁ Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#034a21;padding:24px 48px;">
              <p style="margin:0 0 6px 0;font-size:13px;line-height:1.6;color:#a8c4c4;">
                AFÁRÁ is an initiative of
                <a href="https://openspacesandbridges.com/" style="color:#a8c4c4;text-decoration:underline;">Open Spaces &amp; Bridges Advisory (OPSB)</a>
              </p>
              <p style="margin:0;font-size:12px;color:#6a9090;">
                &copy; ${new Date().getFullYear()} AFÁRÁ. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const { error } = await client.emails.send({
      from: fromEmail,
      to: email,
      subject: `You\u2019ve been added to the AF\u00C1R\u00C1 platform \u2013 your login details`,
      html,
      attachments: mastheadBuffer ? [
        {
          filename: 'afara-masthead-email.jpg',
          content: mastheadBuffer.toString('base64'),
          content_id: 'afara-masthead',
        }
      ] as any : [],
    });

    if (error) {
      console.error('Team welcome email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Team welcome email failed:', error);
    return { success: false, error: error.message };
  }
}

const APPLICATION_STEPS = [
  { id: 0, title: "Personal",    description: "About yourself" },
  { id: 1, title: "Background",  description: "Sector experience" },
  { id: 2, title: "Business",    description: "Ownership & operations" },
  { id: 3, title: "Financial",   description: "Documentation" },
  { id: 4, title: "Project",     description: "Readiness & status" },
  { id: 5, title: "Support",     description: "Needs & advancement" },
  { id: 6, title: "Commitment",  description: "Programme & mentorship" },
  { id: 7, title: "Preview",     description: "Review & submit" },
];

export async function sendDraftSaveNotificationEmail(
  email: string,
  firstName: string | undefined,
  currentStep: number,
  totalSteps: number,
  resumeUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    const name = firstName && firstName.trim() ? firstName.trim() : 'there';
    const mastheadPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'assets', 'afara-masthead-email.jpg');
    const mastheadBuffer = fs.existsSync(mastheadPath) ? fs.readFileSync(mastheadPath) : null;
    const mastheadSrc = 'cid:afara-masthead';

    const safeStep = Math.max(0, Math.min(currentStep, APPLICATION_STEPS.length - 1));
    const currentStepInfo = APPLICATION_STEPS[safeStep];
    const remainingSteps = APPLICATION_STEPS.slice(safeStep + 1);
    const applyUrl = resumeUrl || 'https://afaraaccelerator.org/apply';

    const remainingRowsHtml = remainingSteps.length > 0
      ? remainingSteps.map(s => `
          <tr>
            <td style="padding:8px 0;vertical-align:top;width:24px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#c8d8d8;margin-top:6px;">&nbsp;</span>
            </td>
            <td style="padding:8px 0 8px 8px;font-size:14px;line-height:1.5;color:#555555;">
              <strong style="color:#2d2d2d;">${s.title}</strong> &mdash; ${s.description}
            </td>
          </tr>`).join('')
      : `<tr><td colspan="2" style="padding:8px 0;font-size:14px;color:#555555;">You&rsquo;re on the final step &mdash; just review and submit!</td></tr>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Progress Saved – AFÁRÁ</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:#f5f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f4f0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">

          <!-- Masthead Image -->
          <tr>
            <td style="padding:0;margin:0;">
              <img src="${mastheadSrc}" alt="AFÁRÁ" width="600" style="display:block;width:100%;max-width:600px;height:auto;" />
            </td>
          </tr>

          <!-- Green accent line -->
          <tr>
            <td style="background-color:#034a21;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding:48px 48px 32px 48px;">

              <h1 style="margin:0 0 28px 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:28px;font-weight:600;color:#034a21;line-height:1.3;">
                Your progress has been saved
              </h1>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                Dear ${name},
              </p>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                Good news — your AFÁRÁ Accelerator application has been saved. You can return at any time to pick up exactly where you left off.
              </p>

              <!-- Current step highlight -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px 0;background-color:#f0f5f5;border-radius:4px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px 0;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#034a21;">Last saved at</p>
                    <p style="margin:0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:20px;font-weight:600;color:#034a21;">
                      Step ${safeStep + 1} of ${totalSteps} &mdash; ${currentStepInfo.title}
                    </p>
                    <p style="margin:4px 0 0 0;font-size:14px;color:#555555;">${currentStepInfo.description}</p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #e8e4dd;padding:0;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              ${remainingSteps.length > 0 ? `
              <!-- Remaining sections -->
              <h2 style="margin:28px 0 12px 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:18px;font-weight:600;color:#034a21;">
                Still to complete
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px 0;">
                ${remainingRowsHtml}
              </table>` : `
              <p style="margin:28px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                You&rsquo;re on the final step &mdash; just review your answers and hit <strong>Submit Application</strong>.
              </p>`}

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px 0;">
                <tr>
                  <td style="border-radius:4px;background-color:#034a21;">
                    <a href="${applyUrl}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:4px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                      Continue My Application
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #e8e4dd;padding:0;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <p style="margin:24px 0 0 0;font-size:15px;line-height:1.7;color:#555555;">
                If you have any questions, reach out to us at
                <a href="mailto:hello@afaraaccelerator.org" style="color:#034a21;text-decoration:underline;">hello@afaraaccelerator.org</a>.
              </p>

            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:0 48px 48px 48px;">
              <p style="margin:32px 0 4px 0;font-size:15px;line-height:1.6;color:#2d2d2d;">Warm regards,</p>
              <p style="margin:0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:16px;font-weight:600;color:#034a21;">
                The AFÁRÁ Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#034a21;padding:24px 48px;">
              <p style="margin:0 0 6px 0;font-size:13px;line-height:1.6;color:#a8c4c4;">
                AFÁRÁ is an initiative of
                <a href="https://openspacesandbridges.com/" style="color:#a8c4c4;text-decoration:underline;">Open Spaces &amp; Bridges Advisory (OPSB)</a>
              </p>
              <p style="margin:0;font-size:12px;color:#6a9090;">
                &copy; ${new Date().getFullYear()} AFÁRÁ. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const { error } = await client.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Your AFÁRÁ application progress has been saved',
      html,
      attachments: mastheadBuffer ? [
        {
          filename: 'afara-masthead-email.jpg',
          content: mastheadBuffer.toString('base64'),
          content_id: 'afara-masthead',
        }
      ] as any : [],
    });

    if (error) {
      console.error('Draft save notification email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Draft save notification email failed:', error);
    return { success: false, error: error.message };
  }
}

export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  resetUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    const mastheadPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'assets', 'afara-masthead-email.jpg');
    const mastheadBuffer = fs.existsSync(mastheadPath) ? fs.readFileSync(mastheadPath) : null;
    const mastheadSrc = 'cid:afara-masthead';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password – AFÁRÁ</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:#f5f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f4f0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">

          <!-- Masthead Image -->
          <tr>
            <td style="padding:0;margin:0;">
              <img src="${mastheadSrc}" alt="AFÁRÁ" width="600" style="display:block;width:100%;max-width:600px;height:auto;" />
            </td>
          </tr>

          <!-- Green accent line -->
          <tr>
            <td style="background-color:#034a21;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding:48px 48px 32px 48px;">
              <h1 style="margin:0 0 28px 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:28px;font-weight:600;font-style:normal;color:#034a21;line-height:1.3;">
                Reset your password
              </h1>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                Dear ${firstName},
              </p>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                We received a request to reset the password for your AFÁRÁ account. Click the button below to choose a new password.
              </p>

              <p style="margin:0 0 32px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                This link is valid for <strong style="color:#034a21;">1 hour</strong>. If you did not request a password reset, you can safely ignore this email — your password will not change.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px 0;">
                <tr>
                  <td style="border-radius:4px;background-color:#034a21;">
                    <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:4px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #e8e4dd;padding:0;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <p style="margin:24px 0 0 0;font-size:13px;line-height:1.6;color:#888888;">
                If the button above doesn't work, paste this link into your browser:<br />
                <a href="${resetUrl}" style="color:#034a21;word-break:break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f5f4f0;padding:24px 48px;text-align:center;">
              <p style="margin:0 0 4px 0;font-size:12px;color:#888888;">
                AFÁRÁ is an initiative of <strong>Open Spaces &amp; Bridges Advisory (OPSB)</strong>
              </p>
              <p style="margin:0;font-size:12px;color:#aaaaaa;">
                &copy; 2026 AFÁRÁ. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const attachments: any[] = mastheadBuffer
      ? [{ filename: 'afara-masthead-email.jpg', content: mastheadBuffer, content_id: 'afara-masthead', content_type: 'image/jpeg' }]
      : [];

    const { error } = await client.emails.send({
      from: fromEmail,
      to: [email],
      subject: 'Reset your AFÁRÁ password',
      html,
      attachments,
    });

    if (error) {
      console.error('Password reset email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Password reset email failed:', error);
    return { success: false, error: error.message };
  }
}

export async function sendAdminPasswordResetNotificationEmail(
  email: string,
  firstName: string,
  loginUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    const mastheadPath = path.join(path.dirname(new URL(import.meta.url).pathname), 'assets', 'afara-masthead-email.jpg');
    const mastheadBuffer = fs.existsSync(mastheadPath) ? fs.readFileSync(mastheadPath) : null;
    const mastheadSrc = 'cid:afara-masthead';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Password Has Been Reset – AFÁRÁ</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:#f5f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f4f0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;">

          <!-- Masthead Image -->
          <tr>
            <td style="padding:0;margin:0;">
              <img src="${mastheadSrc}" alt="AFÁRÁ" width="600" style="display:block;width:100%;max-width:600px;height:auto;" />
            </td>
          </tr>

          <!-- Green accent line -->
          <tr>
            <td style="background-color:#034a21;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding:48px 48px 32px 48px;">
              <h1 style="margin:0 0 28px 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:28px;font-weight:600;color:#034a21;line-height:1.3;">
                Your password has been reset
              </h1>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                Dear ${firstName},
              </p>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                An administrator has reset your AFÁRÁ platform password. A temporary password has been assigned to your account.
              </p>

              <!-- Notice box -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px 0;">
                <tr>
                  <td style="background-color:#fef9ec;border:1px solid #f0d080;border-radius:4px;padding:16px 20px;">
                    <p style="margin:0;font-size:15px;line-height:1.6;color:#7a5c00;">
                      <strong style="color:#5a3e00;">Action required:</strong> When you sign in, you will be immediately prompted to set a new password. You will not be able to access the platform until you do so.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 32px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                If you did not expect this change or believe this was done in error, please contact your platform administrator immediately.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 32px 0;">
                <tr>
                  <td style="border-radius:4px;background-color:#034a21;">
                    <a href="${loginUrl}" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:4px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                      Sign In &amp; Set New Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #e8e4dd;padding:0;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <p style="margin:24px 0 0 0;font-size:13px;line-height:1.6;color:#888888;">
                If the button above doesn't work, paste this link into your browser:<br />
                <a href="${loginUrl}" style="color:#034a21;word-break:break-all;">${loginUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f5f4f0;padding:24px 48px;text-align:center;">
              <p style="margin:0 0 4px 0;font-size:12px;color:#888888;">
                AFÁRÁ is an initiative of <strong>Open Spaces &amp; Bridges Advisory (OPSB)</strong>
              </p>
              <p style="margin:0;font-size:12px;color:#aaaaaa;">
                &copy; 2026 AFÁRÁ. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const attachments: any[] = mastheadBuffer
      ? [{ filename: 'afara-masthead-email.jpg', content: mastheadBuffer, content_id: 'afara-masthead', content_type: 'image/jpeg' }]
      : [];

    const { error } = await client.emails.send({
      from: fromEmail,
      to: [email],
      subject: 'Your AFÁRÁ password has been reset',
      html,
      attachments,
    });

    if (error) {
      console.error('Admin password reset notification email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Admin password reset notification email failed:', error);
    return { success: false, error: error.message };
  }
}
