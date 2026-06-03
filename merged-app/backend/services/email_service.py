import os
from flask import current_app, render_template
import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content

class EmailService:

    @staticmethod
    def _send(to_email: str, subject: str, html_content: str):
        api_key = current_app.config.get('SENDGRID_API_KEY')
        
        # 1. Try SendGrid if configured and not placeholder
        if api_key and api_key != 'your-sendgrid-api-key' and api_key != '':
            try:
                sg = sendgrid.SendGridAPIClient(api_key=api_key)
                from_email = Email(current_app.config['EMAIL_FROM'], current_app.config['EMAIL_FROM_NAME'])
                to_email_obj = To(to_email)
                content = Content('text/html', html_content)
                mail = Mail(from_email, to_email_obj, subject, content)
                sg.client.mail.send.post(request_body=mail.get())
                current_app.logger.info(f"Email sent successfully to {to_email} via SendGrid.")
                return True
            except Exception as e:
                current_app.logger.error(f'SendGrid email send error: {e}. Trying SMTP fallback...')
                # Fall through to SMTP

        # 2. Try SMTP if configured
        smtp_server = current_app.config.get('SMTP_SERVER')
        smtp_username = current_app.config.get('SMTP_USERNAME')
        smtp_password = current_app.config.get('SMTP_PASSWORD')

        if smtp_server and smtp_username and smtp_password:
            try:
                import smtplib
                from email.mime.multipart import MIMEMultipart
                from email.mime.text import MIMEText

                port = int(current_app.config.get('SMTP_PORT', 587))
                use_ssl = current_app.config.get('SMTP_USE_SSL', False)

                msg = MIMEMultipart('alternative')
                msg['Subject'] = subject
                msg['From'] = f"{current_app.config['EMAIL_FROM_NAME']} <{current_app.config['EMAIL_FROM']}>"
                msg['To'] = to_email

                part = MIMEText(html_content, 'html')
                msg.attach(part)

                if use_ssl:
                    server = smtplib.SMTP_SSL(smtp_server, port, timeout=10)
                else:
                    server = smtplib.SMTP(smtp_server, port, timeout=10)
                    if current_app.config.get('SMTP_USE_TLS', True):
                        server.starttls()

                server.login(smtp_username, smtp_password)
                server.sendmail(current_app.config['EMAIL_FROM'], to_email, msg.as_string())
                server.quit()
                current_app.logger.info(f"Email sent successfully to {to_email} via SMTP.")
                return True
            except Exception as e:
                current_app.logger.error(f'SMTP email send error: {e}')
                return False

        current_app.logger.warning('Neither SendGrid nor SMTP configured correctly for sending email.')
        return False

    @staticmethod
    def send_otp_email(to_email: str, otp_code: str, purpose: str = 'verification'):
        # Print OTP to terminal log for easy local development verification
        print(f"\n========================================\n[EMAIL OTP] To: {to_email}\n[EMAIL OTP] Code: {otp_code}\n[EMAIL OTP] Purpose: {purpose}\n========================================\n")
        current_app.logger.info(f"[EMAIL OTP] To: {to_email} | Code: {otp_code} | Purpose: {purpose}")
        html = render_template('otp_email.html', otp=otp_code, purpose=purpose)
        return EmailService._send(to_email, f'Your Subspace OTP: {otp_code}', html)

    @staticmethod
    def send_welcome_email(to_email: str, name: str):
        html = render_template('welcome_email.html', name=name)
        return EmailService._send(to_email, 'Welcome to Subspace!', html)

    @staticmethod
    def send_payment_success_email(to_email: str, name: str, plan_name: str, amount: float, invoice_url: str = None):
        html = render_template('payment_success.html', name=name, plan_name=plan_name, amount=amount, invoice_url=invoice_url)
        return EmailService._send(to_email, 'Payment Successful - Subspace', html)

    @staticmethod
    def send_renewal_reminder(to_email: str, name: str, days_left: int, plan_name: str):
        html = render_template('renewal_reminder.html', name=name, days_left=days_left, plan_name=plan_name)
        return EmailService._send(to_email, f'Your Subspace {plan_name} expires in {days_left} days', html)
