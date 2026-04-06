import { Resend } from 'resend';

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
    const baseUrl = process.env.APP_URL || 'https://afaraaccelerator.org';
    const mastheadUrl = `${baseUrl}/afara-masthead.png`;
    const name = firstName || 'there';

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
              <img src="${mastheadUrl}" alt="AFÁRÁ" width="600" style="display:block;width:100%;max-width:600px;height:auto;" />
            </td>
          </tr>

          <!-- Green accent line -->
          <tr>
            <td style="background-color:#173a3a;height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Main content -->
          <tr>
            <td style="padding:48px 48px 32px 48px;">

              <h1 style="margin:0 0 28px 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:28px;font-weight:600;color:#173a3a;line-height:1.3;">
                We've received your application
              </h1>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                Dear ${name},
              </p>

              <p style="margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                Thank you for applying to the AFÁRÁ Accelerator Program. We're glad you took this step, and we want you to know your application is in good hands.
              </p>

              <p style="margin:0 0 32px 0;font-size:16px;line-height:1.7;color:#2d2d2d;">
                Our team will review your submission carefully. You can expect to hear from us within <strong style="color:#173a3a;">2–4 weeks</strong> with an update on the next steps.
              </p>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid #e8e4dd;padding:0;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- What happens next -->
              <h2 style="margin:32px 0 16px 0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:18px;font-weight:600;color:#173a3a;">
                What happens next
              </h2>

              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:10px 0;vertical-align:top;width:24px;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#173a3a;margin-top:6px;">&nbsp;</span>
                  </td>
                  <td style="padding:10px 0 10px 8px;font-size:15px;line-height:1.6;color:#2d2d2d;">
                    Our team reviews all applications against the program criteria
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;vertical-align:top;width:24px;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#173a3a;margin-top:6px;">&nbsp;</span>
                  </td>
                  <td style="padding:10px 0 10px 8px;font-size:15px;line-height:1.6;color:#2d2d2d;">
                    Shortlisted applicants will be invited to a brief interview or pitch session
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;vertical-align:top;width:24px;">
                    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#173a3a;margin-top:6px;">&nbsp;</span>
                  </td>
                  <td style="padding:10px 0 10px 8px;font-size:15px;line-height:1.6;color:#2d2d2d;">
                    Final decisions will be communicated to all applicants within the review window
                  </td>
                </tr>
              </table>

              <p style="margin:32px 0 0 0;font-size:15px;line-height:1.7;color:#555555;">
                If you have any questions in the meantime, please reach out to us at
                <a href="mailto:hello@afaraaccelerator.org" style="color:#173a3a;text-decoration:underline;">hello@afaraaccelerator.org</a>.
              </p>

            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:0 48px 48px 48px;">
              <p style="margin:32px 0 4px 0;font-size:15px;line-height:1.6;color:#2d2d2d;">
                Warm regards,
              </p>
              <p style="margin:0;font-family:'Playfair Display',Georgia,'Times New Roman',serif;font-size:16px;font-weight:600;color:#173a3a;">
                The AFÁRÁ Team
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#173a3a;padding:24px 48px;">
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

export async function sendAcceptanceEmail(email: string, firstName?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Congratulations! Your AFÁRÁ Application Has Been Accepted',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #166534;">Welcome to the AFÁRÁ Accelerator!</h1>
          <p>Dear ${firstName || 'Applicant'},</p>
          <p>Congratulations! We are delighted to inform you that your application to the AFÁRÁ Accelerator Program has been <strong>accepted</strong>.</p>
          <p>Your account has been upgraded to full participant access. You can now log in to the AFÁRÁ platform to access:</p>
          <ul>
            <li>Training modules and courses</li>
            <li>Mentorship matching and sessions</li>
            <li>Program resources and toolkits</li>
            <li>Events and live sessions</li>
            <li>Community discussion boards</li>
          </ul>
          <p>Please log in using your registered email address. If you have not yet set a password, please contact us at <a href="mailto:info@afaraaccelerator.org">info@afaraaccelerator.org</a>.</p>
          <p>We look forward to supporting your journey!</p>
          <p>Best regards,<br/>The AFÁRÁ Team</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280;">
            AFÁRÁ is an initiative of Open Spaces & Bridges Advisory (OPSB)
          </p>
        </div>
      `
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
