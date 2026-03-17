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
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Application Received – AFÁRÁ Accelerator Program',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #166534;">Thank You for Applying to AFÁRÁ!</h1>
          <p>Dear ${firstName || 'Applicant'},</p>
          <p>We have received your application for the AFÁRÁ Accelerator Program. Our team will review your submission and get back to you within 2–4 weeks.</p>
          <p>An account has been created for you on the AFÁRÁ platform. Once your application is reviewed and accepted, you will be granted full access to the program resources and community.</p>
          <p>In the meantime, if you have any questions, please contact us at <a href="mailto:info@afaraaccelerator.org">info@afaraaccelerator.org</a>.</p>
          <p>Best regards,<br/>The AFÁRÁ Team</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280;">
            AFÁRÁ is an initiative of Open Spaces & Bridges Advisory (OPSB)
          </p>
        </div>
      `
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

export async function sendWelcomeEmail(email: string, firstName?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Welcome to the AFÁRÁ Community!',
      html: `
        <div style="font-family: Arial, sans-serif; background: #f9fafb; margin: 0; padding: 0;">
          <!-- Hero Image Section -->
          <div style="max-width: 600px; margin: 0 auto; background: white; overflow: hidden;">
            <img src="https://afaraaccelerator.org/assets/welcome-email-hero.png" alt="AFÁRÁ Welcome" style="width: 100%; height: auto; display: block; margin: 0; padding: 0;" />
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
