/**
 * Email Service
 * Handles sending error notifications via email
 */

export class EmailService {
  private smtpHost: string;
  private smtpPort: number;
  private smtpUser: string;
  private smtpPassword: string;
  private fromEmail: string;
  private toEmail: string;

  constructor() {
    this.smtpHost = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
    this.smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    this.smtpUser = Deno.env.get("SMTP_USER") || "";
    this.smtpPassword = Deno.env.get("SMTP_PASSWORD") || "";
    this.fromEmail = Deno.env.get("FROM_EMAIL") || this.smtpUser;
    this.toEmail = Deno.env.get("TO_EMAIL") || "";
  }

  private isConfigured(): boolean {
    return (
      this.smtpUser !== "" && this.smtpPassword !== "" && this.toEmail !== ""
    );
  }

  async sendErrorAlert(
    errorTitle: string,
    errorMessage: string,
  ): Promise<void> {
    if (!this.isConfigured()) {
      console.warn(
        "Email service not configured. Set SMTP_USER, SMTP_PASSWORD, and TO_EMAIL.",
      );
      return;
    }

    try {
      const emailBody = this.generateEmailBody(errorTitle, errorMessage);

      // Usa il modulo Deno per SMTP (richiede importazione)
      const response = await fetch(`https://api.sendgrid.com/v3/mail/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.smtpPassword}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: this.toEmail }],
            },
          ],
          from: { email: this.fromEmail },
          subject: `🚨 Ruuvi Station Error: ${errorTitle}`,
          content: [
            {
              type: "text/html",
              value: emailBody,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`SendGrid API error: ${response.statusText}`);
      }

      console.log(`✉️ Error notification sent to ${this.toEmail}`);
    } catch (error) {
      console.error("Failed to send error email:", error);
      // Non lanciare l'errore per non bloccare il flusso principale
    }
  }

  private generateEmailBody(title: string, message: string): string {
    const timestamp = new Date().toLocaleString("it-IT");
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ff4444; color: white; padding: 20px; border-radius: 5px; }
            .content { background: #f9f9f9; padding: 20px; margin: 20px 0; border-left: 4px solid #ff4444; }
            .footer { color: #666; font-size: 12px; text-align: center; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 Ruuvi Station - Notifica di Errore</h1>
            </div>
            <div class="content">
              <h2>${title}</h2>
              <p><strong>Messaggio:</strong></p>
              <pre style="background: #fff; padding: 10px; border-radius: 3px; overflow-x: auto;">${message}</pre>
              <p><strong>Timestamp:</strong> ${timestamp}</p>
            </div>
            <div class="footer">
              <p>Questo è un messaggio automatico da Ruuvi Station.</p>
              <p>Per favore controlla il sistema.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
