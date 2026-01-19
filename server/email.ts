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
      from: fromEmail || 'AFÁRÁ <newsletter@afara.io>',
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

export async function sendWelcomeEmail(email: string, firstName?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const { data, error } = await client.emails.send({
      from: fromEmail || 'AFÁRÁ <newsletter@afara.io>',
      to: email,
      subject: 'Welcome to the AFÁRÁ Community!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #166534;">Welcome to AFÁRÁ!</h1>
          <p>Dear ${firstName || 'Community Member'},</p>
          <p>Thank you for subscribing to our newsletter! You're now part of a growing community of women entrepreneurs transforming Africa's energy and infrastructure landscape.</p>
          <p>As a subscriber, you'll receive:</p>
          <ul>
            <li>Updates on our accelerator programs</li>
            <li>Success stories from our alumni</li>
            <li>Industry insights and resources</li>
            <li>Exclusive event invitations</li>
          </ul>
          <p>Stay tuned for exciting updates!</p>
          <p>Best regards,<br/>The AFÁRÁ Team</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280;">
            AFÁRÁ is an initiative of Open Spaces & Bridges Advisory (OPSB)
          </p>
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
