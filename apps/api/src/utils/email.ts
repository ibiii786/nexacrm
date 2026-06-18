import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

// Create a transporter using SMTP config from environment variables
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Utility to send emails
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  // If SMTP is not properly configured, just log it (useful for local dev)
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    logger.warn('SMTP configuration is missing. Email not sent.', {
      to: options.to,
      subject: options.subject,
    });
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM || '"NexaCRM" <noreply@nexacrm.com>',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    
    logger.info('Email sent successfully', { messageId: info.messageId, to: options.to });
    return true;
  } catch (error) {
    logger.error('Failed to send email', { error, to: options.to });
    return false;
  }
}
