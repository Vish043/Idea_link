import nodemailer from 'nodemailer';

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

/**
 * Initialize email transporter
 */
function getTransporter(): nodemailer.Transporter | null {
  // If already initialized, return it
  if (transporter) {
    return transporter;
  }

  // Check if email is configured
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const emailFrom = process.env.EMAIL_FROM;

  // If not configured, return null (email sending disabled)
  if (!emailHost || !emailPort || !emailUser || !emailPassword) {
    console.log('⚠️  Email service not configured. Email sending is disabled.');
    return null;
  }

  // Create transporter
  transporter = nodemailer.createTransport({
    host: emailHost,
    port: parseInt(emailPort, 10),
    secure: emailPort === '465', // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  });

  return transporter;
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  to: string,
  verificationLink: string,
  userName: string
): Promise<boolean> {
  const emailTransporter = getTransporter();
  
  if (!emailTransporter) {
    console.log('📧 Email not sent (service not configured). Verification link:', verificationLink);
    return false;
  }

  const emailFrom = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@ideaconnect.com';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const backendUrl = process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:5000';
  
  // Extract token from verification link
  const token = verificationLink.split('token=')[1];
  const directBackendLink = `${backendUrl}/api/email-verification/verify/${token}`;

  const mailOptions = {
    from: `"IdeaConnect" <${emailFrom}>`,
    to,
    subject: 'Verify Your Email Address - IdeaConnect',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
            .button-secondary { background: #10b981; }
            .link-box { background: #fff; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; word-break: break-all; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to IdeaConnect!</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>Thank you for signing up for IdeaConnect! To complete your registration and start collaborating, please verify your email address.</p>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="${verificationLink}" class="button">Verify via Website</a>
                <a href="${directBackendLink}" class="button button-secondary">Verify Directly</a>
              </div>
              
              <p><strong>Or copy and paste one of these links into your browser:</strong></p>
              
              <div class="link-box">
                <strong>Website Link:</strong><br>
                <span style="color: #667eea;">${verificationLink}</span>
              </div>
              
              <div class="link-box">
                <strong>Direct Verification Link (works without frontend):</strong><br>
                <span style="color: #10b981;">${directBackendLink}</span>
              </div>
              
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't create an account with IdeaConnect, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} IdeaConnect. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Welcome to IdeaConnect!
      
      Hi ${userName},
      
      Thank you for signing up for IdeaConnect! To complete your registration and start collaborating, please verify your email address by clicking the link below:
      
      ${verificationLink}
      
      This link will expire in 24 hours.
      
      If you didn't create an account with IdeaConnect, you can safely ignore this email.
      
      © ${new Date().getFullYear()} IdeaConnect. All rights reserved.
    `,
  };

  try {
    await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${to}`);
    return true;
  } catch (error: any) {
    console.error('❌ Error sending verification email:', error.message);
    return false;
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(): Promise<boolean> {
  const emailTransporter = getTransporter();
  
  if (!emailTransporter) {
    return false;
  }

  try {
    await emailTransporter.verify();
    console.log('✅ Email service is configured and ready');
    return true;
  } catch (error: any) {
    console.error('❌ Email service configuration error:', error.message);
    return false;
  }
}

