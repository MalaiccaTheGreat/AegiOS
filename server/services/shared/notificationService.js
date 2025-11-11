const { WebSocket } = require('ws');
const nodemailer = require('nodemailer');
const webPush = require('web-push');

class NotificationService {
  constructor(realtimeBroadcaster) {
    this.realtimeBroadcaster = realtimeBroadcaster;
    this.setupEmailTransport();
    this.setupWebPush();
  }

  setupEmailTransport() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  setupWebPush() {
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webPush.setVapidDetails(
        `mailto:${process.env.ADMIN_EMAIL || 'admin@aegios.com'}`,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
      );
    }
  }

  async sendNotification(userId, notification) {
    const { type, title, message, data = {}, channels = ['in_app'] } = notification;
    
    const notificationData = {
      id: require('crypto').randomUUID(),
      type,
      title,
      message,
      data,
      read: false,
      createdAt: new Date().toISOString(),
    };

    // Store notification in database (implementation depends on your DB)
    await this.storeNotification(userId, notificationData);

    // Send through configured channels
    for (const channel of channels) {
      switch (channel) {
        case 'in_app':
          this.sendInAppNotification(userId, notificationData);
          break;
        case 'email':
          this.sendEmailNotification(userId, notificationData);
          break;
        case 'push':
          this.sendPushNotification(userId, notificationData);
          break;
      }
    }

    return notificationData;
  }

  async sendInAppNotification(userId, notification) {
    this.realtimeBroadcaster.sendDirectMessage(userId, {
      type: 'notification',
      data: notification,
    });
  }

  async sendEmailNotification(userId, notification) {
    // Get user email from database
    const user = await this.getUser(userId);
    if (!user || !user.email) return;

    const mailOptions = {
      from: `"Aegios" <${process.env.EMAIL_FROM || 'noreply@aegios.com'}>`,
      to: user.email,
      subject: notification.title,
      text: notification.message,
      html: this.generateEmailTemplate(notification),
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  async sendPushNotification(userId, notification) {
    // Get user's push subscription
    const subscription = await this.getPushSubscription(userId);
    if (!subscription) return;

    try {
      await webPush.sendNotification(
        subscription,
        JSON.stringify({
          title: notification.title,
          body: notification.message,
          data: notification.data,
          icon: '/icons/icon-192x192.png',
        })
      );
    } catch (error) {
      console.error('Error sending push notification:', error);
      if (error.statusCode === 410) {
        // Subscription is no longer valid, remove it
        await this.removePushSubscription(userId, subscription);
      }
    }
  }

  // Helper methods
  async storeNotification(userId, notification) {
    // Implement database storage logic here
    // Example: await db.collection('notifications').insertOne({ userId, ...notification });
  }

  async getUser(userId) {
    // Implement user retrieval logic here
    // Example: return db.collection('users').findOne({ _id: userId });
    return { email: 'user@example.com' }; // Mock data
  }

  async getPushSubscription(userId) {
    // Retrieve push subscription from database
    // Example: return db.collection('pushSubscriptions').findOne({ userId });
    return null; // Mock data
  }

  async removePushSubscription(userId, subscription) {
    // Remove invalid push subscription
    // Example: await db.collection('pushSubscriptions').deleteOne({ userId, endpoint: subscription.endpoint });
  }

  generateEmailTemplate(notification) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${notification.title}</h1>
            </div>
            <div class="content">
              <p>${notification.message}</p>
              ${notification.data.url ? `<p><a href="${notification.data.url}">View details</a></p>` : ''}
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Aegios. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

module.exports = NotificationService;
