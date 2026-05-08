const crypto = require('crypto');
const { getDb } = require('../config/database');
const { env } = require('../config/env');
const { ApiError } = require('../utils/ApiError');
const { dispatchSosToTrustedContacts } = require('../utils/notificationService');
const { assertValidCoordinates, parseNullableNumber, sanitizeText } = require('../utils/formatters');

async function getActiveShareRecord(db, userId) {
  return db.get(
    `SELECT * FROM location_shares
     WHERE user_id = ? AND is_active = 1
     ORDER BY id DESC
     LIMIT 1`,
    [userId]
  );
}

function buildShareUrl(shareToken) {
  return `${env.APP_BASE_URL}/api/public/share/${shareToken}`;
}

function withShareUrl(share) {
  return share ? { ...share, shareUrl: buildShareUrl(share.share_token) } : null;
}

function createShareToken() {
  return crypto.randomBytes(24).toString('hex');
}

function parseLocationPayload(body) {
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  const accuracy = parseNullableNumber(body.accuracy);
  const speed = parseNullableNumber(body.speed);
  const heading = parseNullableNumber(body.heading);

  if (!assertValidCoordinates(latitude, longitude)) {
    throw new ApiError(422, 'Latitude and longitude must be valid coordinates.');
  }

  return { latitude, longitude, accuracy, speed, heading };
}

async function insertLocationLog(db, userId, { latitude, longitude, accuracy, speed = null, heading = null }, source) {
  const result = await db.run(
    `INSERT INTO location_logs (user_id, latitude, longitude, accuracy, speed, heading, source)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, latitude, longitude, accuracy, speed, heading, source]
  );
  return db.get('SELECT * FROM location_logs WHERE id = ?', [result.lastID]);
}

async function createShare(db, userId, note, location) {
  const result = await db.run(
    `INSERT INTO location_shares (user_id, share_token, note, last_latitude, last_longitude, last_accuracy)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, createShareToken(), note, location.latitude, location.longitude, location.accuracy]
  );
  return db.get('SELECT * FROM location_shares WHERE id = ?', [result.lastID]);
}

async function updateShareLocation(db, shareId, location, note = null) {
  if (note === null) {
    await db.run(
      `UPDATE location_shares
       SET last_latitude = ?, last_longitude = ?, last_accuracy = ?
       WHERE id = ?`,
      [location.latitude, location.longitude, location.accuracy, shareId]
    );
  } else {
    await db.run(
      `UPDATE location_shares
       SET note = ?, last_latitude = ?, last_longitude = ?, last_accuracy = ?
       WHERE id = ?`,
      [note, location.latitude, location.longitude, location.accuracy, shareId]
    );
  }

  return db.get('SELECT * FROM location_shares WHERE id = ?', [shareId]);
}

async function logLocation(req, res, next) {
  const db = await getDb();
  try {
    const location = parseLocationPayload(req.body);
    const source = sanitizeText(req.body.source || 'manual', 80);

    await db.exec('BEGIN IMMEDIATE');
    const savedLocation = await insertLocationLog(db, req.user.id, location, source);

    const activeShare = await getActiveShareRecord(db, req.user.id);
    if (activeShare) {
      await updateShareLocation(db, activeShare.id, location);
    }
    await db.exec('COMMIT');

    res.status(201).json({ success: true, data: savedLocation });
  } catch (error) {
    try { await db.exec('ROLLBACK'); } catch (_rollbackError) {}
    next(error);
  }
}

async function getLatestLocation(req, res, next) {
  try {
    const db = await getDb();
    const location = await db.get(
      `SELECT * FROM location_logs
       WHERE user_id = ?
       ORDER BY id DESC
       LIMIT 1`,
      [req.user.id]
    );

    res.json({ success: true, data: location || null });
  } catch (error) {
    next(error);
  }
}

async function startSharing(req, res, next) {
  const db = await getDb();
  try {
    const location = parseLocationPayload(req.body);
    const note = sanitizeText(req.body.note || 'Emergency live location sharing started.', 500);

    await db.exec('BEGIN IMMEDIATE');
    let activeShare = await getActiveShareRecord(db, req.user.id);

    if (activeShare) {
      activeShare = await updateShareLocation(db, activeShare.id, location, note);
    } else {
      activeShare = await createShare(db, req.user.id, note, location);
    }

    await insertLocationLog(db, req.user.id, location, 'share-start');
    await db.exec('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Live location sharing started.',
      data: withShareUrl(activeShare),
    });
  } catch (error) {
    try { await db.exec('ROLLBACK'); } catch (_rollbackError) {}
    next(error);
  }
}

async function updateShare(req, res, next) {
  const db = await getDb();
  try {
    const location = parseLocationPayload(req.body);
    const source = sanitizeText(req.body.source || 'share-update', 80);

    await db.exec('BEGIN IMMEDIATE');
    const activeShare = await getActiveShareRecord(db, req.user.id);
    if (!activeShare) {
      throw new ApiError(404, 'No active share session found. Start sharing before sending updates.');
    }

    const updatedShare = await updateShareLocation(db, activeShare.id, location);
    await insertLocationLog(db, req.user.id, location, source);
    await db.exec('COMMIT');

    res.json({
      success: true,
      message: 'Live location updated.',
      data: withShareUrl(updatedShare),
    });
  } catch (error) {
    try { await db.exec('ROLLBACK'); } catch (_rollbackError) {}
    next(error);
  }
}

async function stopSharing(req, res, next) {
  try {
    const db = await getDb();
    const activeShare = await getActiveShareRecord(db, req.user.id);

    if (!activeShare) {
      throw new ApiError(404, 'No active share session found.');
    }

    await db.run(
      `UPDATE location_shares
       SET is_active = 0, ended_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [activeShare.id]
    );

    res.json({ success: true, message: 'Live location sharing stopped.' });
  } catch (error) {
    next(error);
  }
}

async function getActiveShare(req, res, next) {
  try {
    const db = await getDb();
    const activeShare = await getActiveShareRecord(db, req.user.id);

    res.json({ success: true, data: withShareUrl(activeShare) });
  } catch (error) {
    next(error);
  }
}

async function triggerSos(req, res, next) {
  const db = await getDb();
  try {
    const location = parseLocationPayload(req.body);
    const address = sanitizeText(req.body.address || 'Current location unavailable', 500);
    const customMessage = sanitizeText(req.body.message || 'Emergency SOS triggered.', 500);

    const trustedContacts = await db.all(
      `SELECT * FROM trusted_contacts WHERE user_id = ? ORDER BY is_primary DESC, name COLLATE NOCASE ASC`,
      [req.user.id]
    );

    if (trustedContacts.length === 0) {
      throw new ApiError(400, 'Add at least one trusted contact before using SOS.');
    }

    await db.exec('BEGIN IMMEDIATE');
    let activeShare = await getActiveShareRecord(db, req.user.id);
    if (!activeShare) {
      activeShare = await createShare(db, req.user.id, 'Started automatically from SOS flow', location);
    } else {
      activeShare = await updateShareLocation(db, activeShare.id, location);
    }

    await insertLocationLog(db, req.user.id, location, 'sos');

    const sosResult = await db.run(
      `INSERT INTO sos_events (user_id, share_id, latitude, longitude, accuracy, address, message, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, activeShare.id, location.latitude, location.longitude, location.accuracy, address, customMessage, 'sent']
    );
    const sosEvent = await db.get('SELECT * FROM sos_events WHERE id = ?', [sosResult.lastID]);
    await db.exec('COMMIT');

    const shareUrl = buildShareUrl(activeShare.share_token);
    let notificationResult = { deliveries: [], deliveryWarning: null };

    try {
      notificationResult = await dispatchSosToTrustedContacts({
        user: {
          id: req.user.id,
          full_name: req.user.fullName,
        },
        contacts: trustedContacts,
        shareUrl,
        latitude: location.latitude,
        longitude: location.longitude,
        sosEventId: sosEvent.id,
      });
    } catch (_deliveryError) {
      try {
        await db.run('UPDATE sos_events SET status = ? WHERE id = ?', ['sent_delivery_warning', sosEvent.id]);
        sosEvent.status = 'sent_delivery_warning';
      } catch (_statusError) {}
      notificationResult = {
        deliveries: [],
        deliveryWarning: 'SOS was saved and live sharing is active, but alert delivery records could not be completed.',
      };
    }

    res.status(201).json({
      success: true,
      message: notificationResult.deliveryWarning || 'SOS alert sent successfully.',
      data: {
        sosEvent,
        share: withShareUrl(activeShare),
        deliveries: notificationResult.deliveries,
        deliveryWarning: notificationResult.deliveryWarning || null,
      },
    });
  } catch (error) {
    try { await db.exec('ROLLBACK'); } catch (_rollbackError) {}
    next(error);
  }
}

async function getPublicShare(req, res, next) {
  try {
    const db = await getDb();
    const token = sanitizeText(req.params.token || '', 128);
    const share = await db.get(
      `SELECT ls.*, u.full_name
       FROM location_shares ls
       INNER JOIN users u ON u.id = ls.user_id
       WHERE ls.share_token = ?`,
      [token]
    );

    if (!share) {
      throw new ApiError(404, 'This shared location link is invalid.');
    }

    const latestLocation = share.is_active
      ? await db.get(
        `SELECT latitude, longitude, accuracy, created_at
         FROM location_logs
         WHERE user_id = ?
         ORDER BY id DESC
         LIMIT 1`,
        [share.user_id]
      )
      : null;

    res.json({
      success: true,
      data: {
        ownerName: share.full_name,
        isActive: Boolean(share.is_active),
        note: share.note,
        startedAt: share.started_at,
        endedAt: share.ended_at,
        lastLatitude: share.is_active ? share.last_latitude : null,
        lastLongitude: share.is_active ? share.last_longitude : null,
        lastAccuracy: share.is_active ? share.last_accuracy : null,
        latestLocation,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  logLocation,
  getLatestLocation,
  startSharing,
  updateShare,
  stopSharing,
  getActiveShare,
  triggerSos,
  getPublicShare,
};
