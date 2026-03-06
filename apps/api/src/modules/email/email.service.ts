import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail = 'MindBridge <noreply@mindbridge.app>';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('email.resendApiKey');
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`[DEV] Password reset email for ${to}: ${resetUrl}`);
      return;
    }

    await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject: 'Reset your MindBridge password',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #2A2623; margin-bottom: 16px;">Reset your password</h2>
          <p style="color: #766F67; line-height: 1.6;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>
          <a href="${resetUrl}" style="
            display: inline-block;
            background-color: #47887A;
            color: white;
            text-decoration: none;
            padding: 12px 32px;
            border-radius: 8px;
            margin: 24px 0;
            font-weight: 500;
          ">Reset Password</a>
          <p style="color: #766F67; font-size: 14px; line-height: 1.6;">
            This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #E8E4DE; margin: 32px 0;" />
          <p style="color: #A09A93; font-size: 12px;">MindBridge — AI Mental Health Support</p>
        </div>
      `,
    });

    this.logger.log(`Password reset email sent to ${to}`);
  }

  async sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`[DEV] Verification email for ${to}: ${verifyUrl}`);
      return;
    }

    await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject: 'Verify your MindBridge email',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #2A2623; margin-bottom: 16px;">Verify your email</h2>
          <p style="color: #766F67; line-height: 1.6;">
            Welcome to MindBridge! Please verify your email address to get full access to your account.
          </p>
          <a href="${verifyUrl}" style="
            display: inline-block;
            background-color: #C4856F;
            color: white;
            text-decoration: none;
            padding: 12px 32px;
            border-radius: 8px;
            margin: 24px 0;
            font-weight: 500;
          ">Verify Email</a>
          <p style="color: #766F67; font-size: 14px; line-height: 1.6;">
            This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #E8E4DE; margin: 32px 0;" />
          <p style="color: #A09A93; font-size: 12px;">MindBridge — AI Mental Health Support</p>
        </div>
      `,
    });

    this.logger.log(`Verification email sent to ${to}`);
  }
}
