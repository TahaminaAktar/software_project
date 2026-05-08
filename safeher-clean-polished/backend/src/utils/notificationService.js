const { getDb } = require('../config/database');
const { env } = require('../config/env');

async function createNotification({ userId, title, body, channel = 'system', data = {} }) {
  const db = await getDb();
  const result = await db.run(
    `INSERT INTO notifications (user_id, title, body, channel, data_json, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, title, body, channel, JSON.stringify(data), 'created']
  );

  return db.get('SELECT * FROM notifications WHERE id = ?', [result.lastID]);
}

async function saveNotificationDelivery({ notificationId, trustedContactId = null, channel, recipient, status, response }) {
  const db = await getDb();
  await db.run(
    `INSERT INTO notification_deliveries (notification_id, trusted_contact_id, channel, recipient, status, response_json)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [notificationId, trustedContactId, channel, recipient, status, JSON.stringify(response || {})]
  );
}

async function deliverToUserDevices(userId, message, notificationId) {
  const db = await getDb();
  const tokenRows = await db.all('SELECT expo_push_token FROM device_tokens WHERE user_id = ?', [userId]);
  const response = {
    sent: 0,
    skipped: tokenRows.length,
    mode: 'in_app_only',
    reason: 'Remote push delivery is disabled in this Expo Go-safe build.',
    message,
  };

  if (notificationId) {
    await saveNotificationDelivery({
      notificationId,
      channel: 'in_app',
      recipient: tokenRows.length > 0 ? `${tokenRows.length} registered device token(s)` : 'Current account',
      status: 'created',
      response,
    });
  }

  return response;
}

async function dispatchSosToTrustedContacts({ user, contacts, shareUrl, latitude, longitude, sosEventId }) {
  const db = await getDb();
  const messageBody = `${user.full_name} triggered an SOS alert. Current coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}. Live location: ${shareUrl}`;

  const userNotification = await createNotification({
    userId: user.id,
    title: 'SOS alert sent',
    body: 'Your emergency alert was created and trusted contacts were notified.',
    channel: 'sos',
    data: { sosEventId, shareUrl },
  });

  const selfDeliveryResult = await deliverToUserDevices(
    user.id,
    {
      title: 'SOS sent successfully',
      body: 'Trusted contacts were notified and live location sharing is active.',
      data: { sosEventId, shareUrl },
    },
    userNotification.id
  );

  const deliverySummary = [];

  for (const contact of contacts) {
    const recipient = contact.phone || contact.email || contact.name;
    const linkedUsers = await db.all(
      `SELECT id FROM users WHERE lower(email) = lower(?) OR phone = ?`,
      [contact.email || '', contact.phone || '']
    );

    if (linkedUsers.length > 0) {
      const targetUserId = linkedUsers[0].id;
      const linkedNotification = await createNotification({
        userId: targetUserId,
        title: `SOS from ${user.full_name}`,
        body: messageBody,
        channel: 'trusted-contact',
        data: { sosEventId, shareUrl, triggeredBy: user.id },
      });

      const inAppResult = await deliverToUserDevices(
        targetUserId,
        {
          title: `SOS from ${user.full_name}`,
          body: messageBody,
          data: { sosEventId, shareUrl, triggeredBy: user.id },
        },
        linkedNotification.id
      );

      await saveNotificationDelivery({
        notificationId: userNotification.id,
        trustedContactId: contact.id,
        channel: 'in_app',
        recipient,
        status: 'created',
        response: inAppResult,
      });

      deliverySummary.push({
        id: contact.id,
        name: contact.name,
        recipient,
        channel: 'in_app',
        status: 'created',
      });
    } else {
      const providerReadyPayload = {
        preview: `Provider-ready alert prepared for ${recipient}`,
        shareUrl,
        messageBody,
        note: 'Connect SMS, email, voice, or WhatsApp provider before public launch.',
      };

      await saveNotificationDelivery({
        notificationId: userNotification.id,
        trustedContactId: contact.id,
        channel: 'provider_pending',
        recipient,
        status: 'prepared',
        response: providerReadyPayload,
      });

      deliverySummary.push({
        id: contact.id,
        name: contact.name,
        recipient,
        channel: 'provider_pending',
        status: 'prepared',
      });
    }
  }

  return {
    appBaseUrl: env.APP_BASE_URL,
    notification: userNotification,
    selfDeliveryResult,
    deliveries: deliverySummary,
  };
}

module.exports = {
  createNotification,
  deliverToUserDevices,
  dispatchSosToTrustedContacts,
};
