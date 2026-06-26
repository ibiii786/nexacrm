import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(env.SMTP_PORT) || 587,
      secure: Number(env.SMTP_PORT) === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  async sendPasswordResetEmail(toEmail: string, resetToken: string) {
    if (!env.SMTP_USER || !env.SMTP_PASS) {
      logger.warn('SMTP credentials not provided. Password reset email will NOT be sent.');
      logger.warn(`Use this link to reset password (dev mode): ${env.FRONTEND_URL}/reset-password?token=${resetToken}`);
      return;
    }

    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: env.EMAIL_FROM || 'NexaCRM <noreply@nexacrm.com>',
      to: toEmail,
      subject: 'Password Reset Request',
      text: `You have requested to reset your password. Please click the following link to reset it:\n\n${resetLink}\n\nThis link will expire in 1 hour. If you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Password Reset Request</h2>
          <p>You have requested to reset your password. Please click the button below to reset it:</p>
          <div style="margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #64748b;">This link will expire in 1 hour. If you did not request this, please ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;" />
          <p style="font-size: 12px; color: #94a3b8;">If the button doesn't work, copy and paste this URL into your browser: <br/>${resetLink}</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent to ${toEmail}`);
    } catch (error) {
      logger.error(`Failed to send password reset email to ${toEmail}:`, error);
      throw new Error('FAILED_TO_SEND_EMAIL');
    }
  }
}

export const emailService = new EmailService();
