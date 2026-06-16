import {
  createEvent,
  createEventAdvertisement,
  createEventContact,
  createEventDocument,
  deleteEventAdvertisement,
  deleteEventContact,
  deleteEventDocument,
  getEventAdvertisementById,
  getEventById,
  getEventDocumentById,
  getEvents,
  listEventDocuments,
  updateEventAdvertisement,
  updateEventContact,
  updateEventDocument,
  updateEvent,
} from './models/event.js'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import morgan from 'morgan';
import path from 'path'
import { fileURLToPath } from 'url'
import { createCouncilYear, getAllCouncilYears, getCouncilDetails, updateCouncilYear } from './models/council.js';

import committeesRouter, { getCommitteeById, updateCommittee } from './models/committees.js';
import { createAdvisor, getAdvisors, updateAdvisor } from './models/advisor.js';
import { getCommitteeBudgets, getTotalCouncilBudget } from './models/budget.js';
import { resetApplicationData } from './models/adminReset.js';

import {
    listItemsByEvent,
    createItem,
    confirmItemSpent,
    createEventExpense,
    deleteEventExpense,
    getEventExpenseById,
    listEventExpenses,
    updateEventExpense,
    updateEventExpenseReceipt
  } from './models/supply.js';
import {
  cancelVolunteerSignup,
  listVolunteerEvents,
  signUpForEvent,
} from './models/volunteer.js';

import {
  getUserByUsername,
  updateUserBio,
  updateUserPhotoUrl,
  createAccountRequest,
  listPendingAccountRequests,
  approveAccountRequest,
  denyAccountRequest,
} from './models/user.js'
import {
  checkDatabaseConnection,
  describeDatabaseError,
  getDatabaseConfigSummary,
} from './db.js'
import {
  buildDocumentKey,
  buildProfilePhotoKey,
  buildReceiptKey,
  createDownloadUrl,
  createUploadUrl,
  deleteDocumentObject,
  getDownloadUrlExpiresSeconds,
  getUploadUrlExpiresSeconds,
  validateProfilePhotoUpload,
  validateUpload,
} from './s3Documents.js'
import {
  getS3Config,
  getS3ConfigSummary,
  validateS3ConfigForStartup,
} from './config/aws.js'

dotenv.config()

const app         = express()
const PORT        = process.env.PORT || 4000
const JWT_SECRET  = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('Missing JWT_SECRET')
validateS3ConfigForStartup()
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password'
const ADMIN_SETUP_SCOPE = 'admin_setup'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const defaultOrigins = ['http://localhost:3000', 'http://localhost:5173']
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : defaultOrigins
morgan.token('date', () => new Date().toISOString());
app.use(
  morgan(':date :method :url :status :response-time ms - :res[content-length]')
);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true)
      return cb(null, allowedOrigins.includes(origin))
    },
    credentials: true,
    optionsSuccessStatus: 204
  })
)
app.use(express.json());

function requireAdminSetup(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Admin credentials required' });
  }

  try {
    const payload = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    if (payload.scope !== ADMIN_SETUP_SCOPE) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Admin session expired' });
    }
    return res.status(403).json({ message: 'Invalid admin session' });
  }
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    bio: user.bio,
    photoUrl: user.photoUrl,
    createdAccountAt: user.createdAccountAt,
    committeeId: user.committeeId,
    committeeRole: user.committeeRole,
    committeeMemberships: user.committeeMemberships || [],
    executivePositions: user.executivePositions || [],
    councilYearId: user.councilYearId,
    councilClassName: user.councilClassName,
    academicYear: user.academicYear,
    gradYear: user.gradYear,
  };
}

function publicEventDocument(document) {
  return {
    document_id: document.document_id,
    event_id: document.event_id,
    uploaded_by: document.uploaded_by,
    document_name: document.document_name,
    document_type: document.document_type,
    original_filename: document.original_filename,
    content_type: document.content_type,
    file_size_bytes: document.file_size_bytes,
    file_category: document.file_category,
    visibility: document.visibility,
    uploaded_at: document.uploaded_at,
    updated_at: document.updated_at,
  };
}

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Login required' });
  }

  try {
    const payload = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    if (payload.scope === ADMIN_SETUP_SCOPE) {
      return res.status(403).json({ message: 'Member login required' });
    }

    const user = await getUserByUsername(payload.sub);
    if (!user) return res.status(401).json({ message: 'Account not found' });

    req.user = user;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired' });
    }
    console.error('Auth error:', err);
    return res.status(403).json({ message: 'Invalid token' });
  }
}

function isCommitteeLeadRole(role) {
  const value = String(role || '').toLowerCase().replace(/[\s-]+/g, '_');
  return ['committee_chair', 'chair', 'committee_lead', 'lead'].includes(value);
}

function canManageCommittee(user, committee) {
  const councilYearId = Number(committee.councilYearId);
  const executiveForCouncil = (user.executivePositions || []).some(position =>
    Number(position.councilYearId) === councilYearId
  );
  const leadForCommittee = (user.committeeMemberships || []).some(membership =>
    Number(membership.committeeId) === Number(committee.id) &&
    isCommitteeLeadRole(membership.role)
  );

  return executiveForCouncil || leadForCommittee;
}

function canManageEvent(user, event) {
  const councilYearId = Number(event.councilYearId ?? event.council_year_id);
  const committeeId = Number(event.committee_id ?? event.committeeId);
  const executiveForCouncil = (user.executivePositions || []).some(position =>
    Number(position.councilYearId) === councilYearId
  );
  const leadForCommittee = (user.committeeMemberships || []).some(membership =>
    Number(membership.committeeId) === committeeId &&
    isCommitteeLeadRole(membership.role)
  );

  return executiveForCouncil || leadForCommittee;
}

function canManageDocument(user, document) {
  return canManageEvent(user, {
    councilYearId: document.council_year_id,
    committee_id: document.committee_id,
  });
}

function canManageExpense(user, expense) {
  return canManageEvent(user, {
    councilYearId: expense.council_year_id,
    committee_id: expense.committee_id,
  });
}

app.get('/api/health', async (req, res) => {
  try {
    await checkDatabaseConnection();
    res.json({ status: 'ok', database: 'ok' });
  } catch (err) {
    const message = describeDatabaseError(err);
    console.error('Database health check failed:', {
      code: err?.code,
      errno: err?.errno,
      fatal: err?.fatal,
      message,
    });
    res.status(503).json({ status: 'error', database: 'unavailable', message });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid admin credentials' });
  }

  const token = jwt.sign(
    { sub: ADMIN_USERNAME, scope: ADMIN_SETUP_SCOPE },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
  return res.json({ token });
});

app.post('/api/admin/master-reset', requireAdminSetup, async (req, res) => {
  if (req.body?.confirmation !== 'RESET') {
    return res.status(400).json({ message: 'Type RESET to confirm the master reset' });
  }

  try {
    const deleted = await resetApplicationData();
    res.json({ message: 'Application data reset', deleted });
  } catch (err) {
    console.error('POST /api/admin/master-reset error', err);
    res.status(500).json({ message: 'Failed to reset application data' });
  }
});
/**
 * GET  /api/items?event_id=27
 */
app.get('/api/items', async (req, res) => {
  const eventId = req.query.event_id;
  if (!eventId) return res.status(400).json({ message: 'Missing event_id' });
  try {
    const items = await listItemsByEvent(eventId);
    res.json(items);
  } catch (err) {
    console.error('Error listing items:', err);
    res.status(500).json({ message: 'Failed to list items' });
  }
});

app.get('/api/volunteers', requireAuth, async (req, res) => {
  try {
    const events = await listVolunteerEvents(req.user.councilYearId, req.user.id);
    res.json(events);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error('GET /api/volunteers error', err);
    res.status(500).json({ message: 'Failed to load volunteer opportunities' });
  }
});

app.post('/api/volunteers/:eventId/signup', requireAuth, async (req, res) => {
  try {
    const result = await signUpForEvent({
      eventId: req.params.eventId,
      computingId: req.user.id,
      councilYearId: req.user.councilYearId,
      volunteerRole: req.body.volunteerRole ?? req.body.volunteer_role,
      shiftStart: req.body.shiftStart ?? req.body.shift_start,
      shiftEnd: req.body.shiftEnd ?? req.body.shift_end,
    });
    res.status(201).json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error('POST /api/volunteers/:eventId/signup error', err);
    res.status(500).json({ message: 'Failed to save volunteer signup' });
  }
});

app.post('/api/volunteers/:eventId/cancel', requireAuth, async (req, res) => {
  try {
    const result = await cancelVolunteerSignup({
      eventId: req.params.eventId,
      computingId: req.user.id,
      councilYearId: req.user.councilYearId,
    });
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error('POST /api/volunteers/:eventId/cancel error', err);
    res.status(500).json({ message: 'Failed to cancel volunteer signup' });
  }
});

/**
 * POST /api/items
 * Body must include event_id
 */
app.post('/api/items', requireAuth, async (req, res) => {
  const data = req.body;
  if (!data.event_id) return res.status(400).json({ message: 'Missing event_id in payload' });
  try {
    const event = await getEventById(data.event_id);
    if (!canManageEvent(req.user, event)) {
      return res.status(403).json({ message: 'You can only manage items for events you lead' });
    }

    const newId = await createItem(data);
    res.status(201).json({ item_id: newId });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error('Error creating item:', err);
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/events/:eventId/items/:supplyId/confirm-spent', requireAuth, async (req, res) => {
  try {
    const event = await getEventById(req.params.eventId);
    if (!canManageEvent(req.user, event)) {
      return res.status(403).json({ message: 'You can only confirm spending for events you lead' });
    }

    const result = await confirmItemSpent(req.params.eventId, req.params.supplyId);
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error('POST /api/events/:eventId/items/:supplyId/confirm-spent error', err);
    res.status(500).json({ message: 'Failed to confirm item spending' });
  }
});

app.get('/api/events/:eventId/expenses', requireAuth, async (req, res) => {
  try {
    const event = await getEventById(req.params.eventId);
    if (!canManageEvent(req.user, event)) {
      return res.status(403).json({ message: 'You can only view expenses for events you lead' });
    }
    const expenses = await listEventExpenses(req.params.eventId);
    res.json(expenses);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('GET /api/events/:eventId/expenses error', err);
    res.status(500).json({ message: 'Failed to load expenses' });
  }
});

app.post('/api/events/:eventId/expenses', requireAuth, async (req, res) => {
  try {
    const event = await getEventById(req.params.eventId);
    if (!canManageEvent(req.user, event)) {
      return res.status(403).json({ message: 'You can only add expenses for events you lead' });
    }
    const expense = await createEventExpense(req.params.eventId, req.body);
    res.status(201).json(expense);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'Selected vendor was not found' });
    }
    console.error('POST /api/events/:eventId/expenses error', err);
    res.status(500).json({ message: 'Failed to save expense' });
  }
});

app.put('/api/events/:eventId/expenses/:expenseId', requireAuth, async (req, res) => {
  try {
    const expense = await getEventExpenseById(req.params.expenseId);
    if (Number(expense.event_id) !== Number(req.params.eventId)) {
      return res.status(404).json({ message: 'Expense not found for this event' });
    }
    if (!canManageExpense(req.user, expense)) {
      return res.status(403).json({ message: 'You can only update expenses for events you lead' });
    }
    const updated = await updateEventExpense(req.params.expenseId, req.body);
    res.json(updated);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'Selected vendor was not found' });
    }
    console.error('PUT /api/events/:eventId/expenses/:expenseId error', err);
    res.status(500).json({ message: 'Failed to update expense' });
  }
});

app.delete('/api/events/:eventId/expenses/:expenseId', requireAuth, async (req, res) => {
  try {
    const expense = await getEventExpenseById(req.params.expenseId);
    if (Number(expense.event_id) !== Number(req.params.eventId)) {
      return res.status(404).json({ message: 'Expense not found for this event' });
    }
    if (!canManageExpense(req.user, expense)) {
      return res.status(403).json({ message: 'You can only delete expenses for events you lead' });
    }
    const deleted = await deleteEventExpense(req.params.expenseId);
    if (deleted.receipt_url) {
      await deleteDocumentObject(deleted.receipt_url);
    }
    res.sendStatus(204);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('DELETE /api/events/:eventId/expenses/:expenseId error', err);
    res.status(500).json({ message: 'Failed to delete expense' });
  }
});

app.post('/api/councils', requireAdminSetup, async (req, res) => {
  try {
    const { gradYear, academicYear, className, advisorId, budgetTotal, committees } = req.body;
    await createCouncilYear({ gradYear, academicYear, className, advisorId, budgetTotal, committees });
    res.status(201).end();
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/councils/:id', requireAdminSetup, async (req, res) => {
  try {
    const result = await updateCouncilYear(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error('PUT /api/councils/:id error', err);
    res.status(500).json({ message: 'Failed to update council' });
  }
});

app.get('/api/account-requests', requireAdminSetup, async (req, res) => {
  try {
    const requests = await listPendingAccountRequests();
    res.json(requests);
  } catch (err) {
    console.error('GET /api/account-requests error', err);
    res.status(500).json({ message: 'Failed to load account requests' });
  }
});

app.post('/api/account-requests/:id/approve', requireAdminSetup, async (req, res) => {
  try {
    const result = await approveAccountRequest(req.params.id);
    res.json({ message: 'Account request approved', userId: result.id });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error('POST /api/account-requests/:id/approve error', err);
    res.status(500).json({ message: 'Failed to approve account request' });
  }
});

app.post('/api/account-requests/:id/deny', requireAdminSetup, async (req, res) => {
  try {
    await denyAccountRequest(req.params.id);
    res.json({ message: 'Account request denied' });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error('POST /api/account-requests/:id/deny error', err);
    res.status(500).json({ message: 'Failed to deny account request' });
  }
});

app.get('/api/councils', async (req, res) => {
  try {
    const list = await getAllCouncilYears();
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

app.get('/api/class-council', requireAuth, async (req, res) => {
  try {
    const council = await getCouncilDetails(req.user.councilYearId);
    res.json(council);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error('GET /api/class-council error', err);
    res.status(500).json({ message: 'Failed to load class council' });
  }
});


app.post('/api/register', async (req, res) => {
  try {
  const {
    firstName,
    lastName,
    email,
    classId,
    academicYear,
    username,
    password,
    role,
    committee,
  } = req.body;

  if (!firstName || !lastName || !email || !classId || !academicYear || !username || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const request = await createAccountRequest({
      firstName,
      lastName,
      email,
      classId,
      academicYear,
      username,
      passwordHash,
      role,
      committee
  });

  return res.status(201).json({
    message: 'Account request submitted for approval',
    requestId: request.id,
  });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error(err);
    res.sendStatus(500);
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body
  const user = await getUserByUsername(username)
  if (!user) return res.status(401).json({ message: 'Invalid credentials' })
  const match = await bcrypt.compare(password, user.passwordHash)
  if (!match) return res.status(401).json({ message: 'Invalid credentials' })
  const token = jwt.sign(
    { sub: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '2h' }
  )
  res.json({ token, user: publicUser(user) })
})

app.get('/api/profile', requireAuth, (req, res) => {
  res.json(publicUser(req.user));
});

app.put('/api/profile/bio', requireAuth, async (req, res) => {
  try {
    const updated = await updateUserBio(req.user.id, req.body.bio);
    res.json(publicUser(updated));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('PUT /api/profile/bio error', err);
    res.status(500).json({ message: 'Failed to save profile bio' });
  }
});

app.post('/api/profile/photo/upload-url', requireAuth, async (req, res) => {
  try {
    const { filename, contentType, size } = req.body;
    validateProfilePhotoUpload({ contentType, size });

    const key = buildProfilePhotoKey({
      computingId: req.user.id,
      filename,
    });
    const uploadUrl = await createUploadUrl({ key, contentType });

    console.info('profile photo upload-url-created', {
      user: req.user.id,
      result: 'allowed',
    });

    res.json({ uploadUrl, key, expiresIn: getUploadUrlExpiresSeconds() });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('POST /api/profile/photo/upload-url error', err);
    res.status(500).json({ message: 'Failed to create profile photo upload URL' });
  }
});

app.put('/api/profile/photo', requireAuth, async (req, res) => {
  try {
    const key = String(req.body.key || '');
    const expectedPrefix = `profiles/${req.user.id}/photos/`;
    if (!key.startsWith(expectedPrefix)) {
      return res.status(400).json({ message: 'Invalid profile photo key' });
    }

    const updated = await updateUserPhotoUrl(req.user.id, key);
    console.info('profile photo metadata-updated', {
      user: req.user.id,
      result: 'allowed',
    });

    res.json(publicUser(updated));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('PUT /api/profile/photo error', err);
    res.status(500).json({ message: 'Failed to save profile photo' });
  }
});

app.get('/api/profile/photo-url', requireAuth, async (req, res) => {
  try {
    if (!req.user.photoUrl) {
      return res.status(404).json({ message: 'Profile photo not found' });
    }

    const downloadUrl = await createDownloadUrl(req.user.photoUrl);
    console.info('profile photo read-url-created', {
      user: req.user.id,
      result: 'allowed',
    });

    res.json({ downloadUrl, expiresIn: getDownloadUrlExpiresSeconds() });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('GET /api/profile/photo-url error', err);
    res.status(500).json({ message: 'Failed to create profile photo URL' });
  }
});

app.delete('/api/profile/photo', requireAuth, async (req, res) => {
  try {
    const existingKey = req.user.photoUrl;
    if (existingKey) {
      await updateUserPhotoUrl(req.user.id, null);
      await deleteDocumentObject(existingKey);
    }

    const updated = await getUserByUsername(req.user.id);
    console.info('profile photo deleted', {
      user: req.user.id,
      result: 'allowed',
    });

    res.json(publicUser(updated));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('DELETE /api/profile/photo error', err);
    res.status(500).json({ message: 'Failed to remove profile photo' });
  }
});


app.post('/api/events', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let createdBy = null;

    if (authHeader?.startsWith('Bearer ')) {
      try {
        createdBy = jwt.verify(authHeader.split(' ')[1], JWT_SECRET).sub;
      } catch {
        createdBy = null;
      }
    }

    const id = await createEvent({ ...req.body, createdBy });
    return res.status(201).json({ id });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'Selected committee or creator was not found' });
    }
    if (err.code === 'ER_BAD_NULL_ERROR') {
      return res.status(400).json({ message: 'Missing required event fields' });
    }
    console.error(err);
    res.sendStatus(500);
  }
});

app.put('/api/events/:id', requireAuth, async (req, res) => {
  try {
    const event = await getEventById(req.params.id);
    if (!canManageEvent(req.user, event)) {
      return res.status(403).json({ message: 'You can only edit events for committees you lead' });
    }

    const requestedCommitteeId = req.body.committeeId ?? req.body.committee_id;
    if (requestedCommitteeId !== undefined && Number(requestedCommitteeId) !== Number(event.committee_id)) {
      const targetCommittee = await getCommitteeById(requestedCommitteeId);
      if (!canManageCommittee(req.user, targetCommittee)) {
        return res.status(403).json({ message: 'You can only move events to committees you lead' });
      }
    }

    const updated = await updateEvent(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    if (err.code === 'ER_BAD_NULL_ERROR') {
      return res.status(400).json({ message: 'Missing required event fields' });
    }
    console.error('PUT /api/events/:id error', err);
    res.status(500).json({ message: 'Failed to update event' });
  }
});

app.post('/api/events/:eventId/documents/upload-url', requireAuth, async (req, res) => {
  try {
    const event = await getEventById(req.params.eventId);
    if (!canManageEvent(req.user, event)) {
      return res.status(403).json({ message: 'You can only upload documents for events you lead' });
    }

    const { filename, contentType, size } = req.body;
    validateUpload({ filename, contentType, size });

    const key = buildDocumentKey({
      councilYearId: event.councilYearId ?? event.council_year_id,
      committeeId: event.committee_id,
      eventId: event.event_id,
      filename,
    });
    const uploadUrl = await createUploadUrl({ key, contentType });
    const { bucketName } = getS3Config();
    const document = await createEventDocument(req.params.eventId, {
      documentName: req.body.documentName ?? filename,
      documentType: req.body.documentType ?? contentType,
      fileUrl: key,
      s3Bucket: bucketName,
      s3Key: key,
      originalFilename: filename,
      contentType,
      fileSizeBytes: size,
      fileCategory: req.body.fileCategory ?? req.body.file_category,
      visibility: req.body.visibility,
    }, req.user.id);

    console.info('document upload-url-created', {
      user: req.user.id,
      eventId: event.event_id,
      documentId: document.document_id,
      result: 'allowed',
    });

    res.json({
      fileId: document.document_id,
      documentId: document.document_id,
      document: publicEventDocument(document),
      uploadUrl,
      key,
      headers: { 'Content-Type': contentType },
      expiresIn: getUploadUrlExpiresSeconds(),
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('POST /api/events/:eventId/documents/upload-url error', err);
    res.status(500).json({ message: 'Failed to create upload URL' });
  }
});

app.post('/api/events/:eventId/contacts', requireAuth, async (req, res) => {
  try {
    const event = await getEventById(req.params.eventId);
    if (!canManageEvent(req.user, event)) {
      return res.status(403).json({ message: 'You can only manage contacts for events you lead' });
    }
    const contact = await createEventContact(req.params.eventId, req.body);
    res.status(201).json(contact);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('POST /api/events/:eventId/contacts error', err);
    res.status(500).json({ message: 'Failed to save event contact' });
  }
});

app.put('/api/events/:eventId/contacts/:computingId', requireAuth, async (req, res) => {
  try {
    const event = await getEventById(req.params.eventId);
    if (!canManageEvent(req.user, event)) {
      return res.status(403).json({ message: 'You can only manage contacts for events you lead' });
    }
    const contact = await updateEventContact(req.params.eventId, req.params.computingId, req.body);
    res.json(contact);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('PUT /api/events/:eventId/contacts/:computingId error', err);
    res.status(500).json({ message: 'Failed to update event contact' });
  }
});

app.delete('/api/events/:eventId/contacts/:computingId', requireAuth, async (req, res) => {
  try {
    const event = await getEventById(req.params.eventId);
    if (!canManageEvent(req.user, event)) {
      return res.status(403).json({ message: 'You can only manage contacts for events you lead' });
    }
    await deleteEventContact(req.params.eventId, req.params.computingId);
    res.sendStatus(204);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('DELETE /api/events/:eventId/contacts/:computingId error', err);
    res.status(500).json({ message: 'Failed to delete event contact' });
  }
});

app.post('/api/events/:eventId/advertisements', requireAuth, async (req, res) => {
  try {
    const event = await getEventById(req.params.eventId);
    if (!canManageEvent(req.user, event)) {
      return res.status(403).json({ message: 'You can only manage advertisements for events you lead' });
    }
    const advertisement = await createEventAdvertisement(req.params.eventId, req.body, req.user.id);
    res.status(201).json(advertisement);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('POST /api/events/:eventId/advertisements error', err);
    res.status(500).json({ message: 'Failed to save advertisement' });
  }
});

app.put('/api/events/:eventId/advertisements/:advertisementId', requireAuth, async (req, res) => {
  try {
    const advertisement = await getEventAdvertisementById(req.params.advertisementId);
    if (Number(advertisement.event_id) !== Number(req.params.eventId)) {
      return res.status(404).json({ message: 'Advertisement not found for this event' });
    }
    if (!canManageDocument(req.user, advertisement)) {
      return res.status(403).json({ message: 'You can only manage advertisements for events you lead' });
    }
    const updated = await updateEventAdvertisement(req.params.advertisementId, req.body);
    res.json(updated);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('PUT /api/events/:eventId/advertisements/:advertisementId error', err);
    res.status(500).json({ message: 'Failed to update advertisement' });
  }
});

app.delete('/api/events/:eventId/advertisements/:advertisementId', requireAuth, async (req, res) => {
  try {
    const advertisement = await getEventAdvertisementById(req.params.advertisementId);
    if (Number(advertisement.event_id) !== Number(req.params.eventId)) {
      return res.status(404).json({ message: 'Advertisement not found for this event' });
    }
    if (!canManageDocument(req.user, advertisement)) {
      return res.status(403).json({ message: 'You can only manage advertisements for events you lead' });
    }
    await deleteEventAdvertisement(req.params.advertisementId);
    res.sendStatus(204);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('DELETE /api/events/:eventId/advertisements/:advertisementId error', err);
    res.status(500).json({ message: 'Failed to delete advertisement' });
  }
});

app.get('/api/events/:eventId/documents', requireAuth, async (req, res) => {
  try {
    const event = await getEventById(req.params.eventId);
    if (!canManageEvent(req.user, event)) {
      return res.status(403).json({ message: 'You can only view documents for events you lead' });
    }

    const documents = await listEventDocuments(req.params.eventId);
    res.json(documents.map(publicEventDocument));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('GET /api/events/:eventId/documents error', err);
    res.status(500).json({ message: 'Failed to list event documents' });
  }
});

app.post('/api/events/:eventId/documents', requireAuth, async (req, res) => {
  try {
    const event = await getEventById(req.params.eventId);
    if (!canManageEvent(req.user, event)) {
      return res.status(403).json({ message: 'You can only add documents for events you lead' });
    }

    const key = String(req.body.key || '');
    const { bucketName, eventFilesPrefix } = getS3Config();
    const expectedPrefix = [
      eventFilesPrefix,
      `council-years/${Number(event.councilYearId ?? event.council_year_id)}`,
      `committees/${Number(event.committee_id)}`,
      `events/${Number(event.event_id)}`,
      'documents/',
    ].join('/');
    if (!key.startsWith(expectedPrefix)) {
      return res.status(400).json({ message: 'Invalid document key for this event' });
    }

    const document = await createEventDocument(req.params.eventId, {
      documentName: req.body.documentName,
      documentType: req.body.documentType,
      fileUrl: key,
      s3Bucket: bucketName,
      s3Key: key,
      originalFilename: req.body.originalFilename ?? req.body.original_filename ?? req.body.filename ?? req.body.documentName,
      contentType: req.body.contentType ?? req.body.content_type ?? req.body.documentType,
      fileSizeBytes: req.body.fileSizeBytes ?? req.body.file_size_bytes ?? req.body.size,
      fileCategory: req.body.fileCategory ?? req.body.file_category,
      visibility: req.body.visibility,
    }, req.user.id);

    console.info('document metadata-created', {
      user: req.user.id,
      eventId: event.event_id,
      documentId: document.document_id,
      result: 'allowed',
    });

    res.status(201).json(publicEventDocument(document));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('POST /api/events/:eventId/documents error', err);
    res.status(500).json({ message: 'Failed to save document metadata' });
  }
});

app.put('/api/events/:eventId/documents/:documentId', requireAuth, async (req, res) => {
  try {
    const document = await getEventDocumentById(req.params.documentId);
    if (Number(document.event_id) !== Number(req.params.eventId)) {
      return res.status(404).json({ message: 'Document not found for this event' });
    }
    if (!canManageDocument(req.user, document)) {
      return res.status(403).json({ message: 'You can only update documents for events you lead' });
    }
    const updated = await updateEventDocument(req.params.documentId, req.body);
    res.json(publicEventDocument(updated));
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('PUT /api/events/:eventId/documents/:documentId error', err);
    res.status(500).json({ message: 'Failed to update document' });
  }
});

app.get('/api/events/:eventId/documents/:documentId/download-url', requireAuth, async (req, res) => {
  try {
    const document = await getEventDocumentById(req.params.documentId);
    if (Number(document.event_id) !== Number(req.params.eventId)) {
      return res.status(404).json({ message: 'Document not found for this event' });
    }
    if (!canManageDocument(req.user, document)) {
      return res.status(403).json({ message: 'You can only view documents for events you lead' });
    }

    const objectKey = document.s3_key || document.file_url;
    if (!objectKey) {
      return res.status(404).json({ message: 'Document object key not found' });
    }

    const downloadUrl = await createDownloadUrl(objectKey);
    console.info('document read-url-created', {
      user: req.user.id,
      eventId: document.event_id,
      documentId: document.document_id,
      result: 'allowed',
    });

    res.json({
      document: publicEventDocument(document),
      downloadUrl,
      expiresIn: getDownloadUrlExpiresSeconds(),
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('GET /api/events/:eventId/documents/:documentId/download-url error', err);
    res.status(500).json({ message: 'Failed to create download URL' });
  }
});

app.post('/api/events/:eventId/expenses/:expenseId/receipt/upload-url', requireAuth, async (req, res) => {
  try {
    const expense = await getEventExpenseById(req.params.expenseId);
    if (Number(expense.event_id) !== Number(req.params.eventId)) {
      return res.status(404).json({ message: 'Expense not found for this event' });
    }
    if (!canManageExpense(req.user, expense)) {
      return res.status(403).json({ message: 'You can only manage receipts for events you lead' });
    }
    const { filename, contentType, size } = req.body;
    validateUpload({ filename, contentType, size });
    const key = buildReceiptKey({
      councilYearId: expense.council_year_id,
      committeeId: expense.committee_id,
      eventId: expense.event_id,
      expenseId: expense.expense_id,
      filename,
    });
    const uploadUrl = await createUploadUrl({ key, contentType });
    res.json({ uploadUrl, key, expiresIn: getUploadUrlExpiresSeconds() });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('POST /api/events/:eventId/expenses/:expenseId/receipt/upload-url error', err);
    res.status(500).json({ message: 'Failed to create receipt upload URL' });
  }
});

app.put('/api/events/:eventId/expenses/:expenseId/receipt', requireAuth, async (req, res) => {
  try {
    const expense = await getEventExpenseById(req.params.expenseId);
    if (Number(expense.event_id) !== Number(req.params.eventId)) {
      return res.status(404).json({ message: 'Expense not found for this event' });
    }
    if (!canManageExpense(req.user, expense)) {
      return res.status(403).json({ message: 'You can only manage receipts for events you lead' });
    }
    const key = String(req.body.key || '');
    const { eventFilesPrefix } = getS3Config();
    const expectedPrefix = `${eventFilesPrefix}/council-years/${Number(expense.council_year_id)}/committees/${Number(expense.committee_id)}/events/${Number(expense.event_id)}/receipts/${Number(expense.expense_id)}/`;
    if (!key.startsWith(expectedPrefix)) {
      return res.status(400).json({ message: 'Invalid receipt key for this expense' });
    }
    const updated = await updateEventExpenseReceipt(req.params.expenseId, key);
    res.json(updated);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('PUT /api/events/:eventId/expenses/:expenseId/receipt error', err);
    res.status(500).json({ message: 'Failed to save receipt' });
  }
});

app.get('/api/events/:eventId/expenses/:expenseId/receipt/download-url', requireAuth, async (req, res) => {
  try {
    const expense = await getEventExpenseById(req.params.expenseId);
    if (Number(expense.event_id) !== Number(req.params.eventId) || !expense.receipt_url) {
      return res.status(404).json({ message: 'Receipt not found for this event' });
    }
    if (!canManageExpense(req.user, expense)) {
      return res.status(403).json({ message: 'You can only view receipts for events you lead' });
    }
    const downloadUrl = await createDownloadUrl(expense.receipt_url);
    res.json({ downloadUrl, expiresIn: getDownloadUrlExpiresSeconds() });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('GET /api/events/:eventId/expenses/:expenseId/receipt/download-url error', err);
    res.status(500).json({ message: 'Failed to create receipt download URL' });
  }
});

app.delete('/api/events/:eventId/expenses/:expenseId/receipt', requireAuth, async (req, res) => {
  try {
    const expense = await getEventExpenseById(req.params.expenseId);
    if (Number(expense.event_id) !== Number(req.params.eventId)) {
      return res.status(404).json({ message: 'Expense not found for this event' });
    }
    if (!canManageExpense(req.user, expense)) {
      return res.status(403).json({ message: 'You can only delete receipts for events you lead' });
    }
    if (expense.receipt_url) {
      await updateEventExpenseReceipt(req.params.expenseId, null);
      await deleteDocumentObject(expense.receipt_url);
    }
    res.sendStatus(204);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('DELETE /api/events/:eventId/expenses/:expenseId/receipt error', err);
    res.status(500).json({ message: 'Failed to delete receipt' });
  }
});

app.delete('/api/events/:eventId/documents/:documentId', requireAuth, async (req, res) => {
  try {
    const document = await getEventDocumentById(req.params.documentId);
    if (Number(document.event_id) !== Number(req.params.eventId)) {
      return res.status(404).json({ message: 'Document not found for this event' });
    }
    if (!canManageDocument(req.user, document)) {
      return res.status(403).json({ message: 'You can only delete documents for events you lead' });
    }

    const objectKey = document.s3_key || document.file_url;
    if (!objectKey) {
      return res.status(404).json({ message: 'Document object key not found' });
    }

    try {
      await deleteDocumentObject(objectKey);
    } catch (s3Err) {
      console.error('document object delete failed', {
        eventId: document.event_id,
        documentId: document.document_id,
        code: s3Err?.name || s3Err?.Code || s3Err?.code,
        status: s3Err?.$metadata?.httpStatusCode,
      });
      return res.status(502).json({ message: 'Failed to delete document object; metadata was not removed' });
    }

    const deleted = await deleteEventDocument(req.params.documentId);

    console.info('document deleted', {
      user: req.user.id,
      eventId: deleted.event_id,
      documentId: deleted.document_id,
      result: 'allowed',
    });

    res.sendStatus(204);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error('DELETE /api/events/:eventId/documents/:documentId error', err);
    res.status(500).json({ message: 'Failed to delete document' });
  }
});

app.get('/api/events', async (req, res, next) => {
  try {
    const requestedLimit = parseInt(req.query.limit, 10);
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 3;
    const order = req.query.order === 'asc' ? 'ASC' : 'DESC';
    const committeeId = req.query.committeeId === undefined
      ? null
      : Number(req.query.committeeId);

    if (committeeId !== null && (!Number.isInteger(committeeId) || committeeId <= 0)) {
      return res.status(400).json({ message: 'committeeId must be a positive integer' });
    }

    const rows = await getEvents(limit, order, committeeId);

    return res.json(rows);
  } catch (err) {
    console.error('Error in GET /api/events:', err);
    return next(err);
  }
});
app.get('/api/budget/overview', requireAuth, async (req, res) => {
  try {
    const budget = await getTotalCouncilBudget(req.user.councilYearId);
    if (!budget) return res.status(404).json({ message: 'No budget found' });
    res.json(budget);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error(err);
    res.sendStatus(500);
  }
});

app.get('/api/budget/allocations', requireAuth, async (req, res) => {
  try {
    const allocations = await getCommitteeBudgets(req.user.councilYearId);
    res.json(allocations);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error(err);
    res.sendStatus(500);
  }
});

app.put('/api/committees/:id', requireAuth, async (req, res) => {
  try {
    const committee = await getCommitteeById(req.params.id);
    if (!canManageCommittee(req.user, committee)) {
      return res.status(403).json({ message: 'You can only edit committees you lead' });
    }

    const updated = await updateCommittee(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error('PUT /api/committees/:id error', err);
    res.status(500).json({ message: 'Failed to update committee' });
  }
});

app.use('/api/committees', committeesRouter);

// GET /api/advisors  
app.get('/api/advisors', async (req, res) => {
  try {
    const list = await getAdvisors();
    res.json(list);
  } catch (err) {
    console.error('GET /api/advisors error', err);
    res.status(500).json({ message: 'Server error' });
  }
});
app.use(express.json());
// POST /api/advisors  
app.post('/api/advisors', requireAdminSetup, async (req, res) => {
  try {
    const id = await createAdvisor(req.body);
    res.status(201).json({ id });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error('POST /api/advisors error', err);
    res.status(500).json({ message: 'Failed to create advisor' });
  }
});

app.put('/api/advisors/:id', requireAdminSetup, async (req, res) => {
  try {
    const advisor = await updateAdvisor(req.params.id, req.body);
    res.json(advisor);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error('PUT /api/advisors/:id error', err);
    res.status(500).json({ message: 'Failed to update advisor' });
  }
});

if (process.env.NODE_ENV === 'production' || process.env.SERVE_CLIENT === 'true') {
  const clientDistPath = path.resolve(__dirname, '../client/dist')
  app.use(express.static(clientDistPath))
  app.use((req, res, next) => {
    if (!['GET', 'HEAD'].includes(req.method) || req.path.startsWith('/api/')) return next()
    res.sendFile(path.join(clientDistPath, 'index.html'))
  })
}

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ message: 'Server error' });
});

app.listen(PORT, () => {
  const dbSummary = getDatabaseConfigSummary();
  const s3Summary = getS3ConfigSummary();
  console.log(`Server running on port ${PORT}`)
  console.log(
    `Database configured for ${dbSummary.host}:${dbSummary.port}/${dbSummary.database} ` +
    `(ssl=${dbSummary.sslMode}, pool=${dbSummary.connectionLimit})`
  )
  console.log(
    `S3 configured for region ${s3Summary.region} ` +
    `(bucket=${s3Summary.bucketConfigured ? 'configured' : 'missing'}, ` +
    `eventFilesPrefix=${s3Summary.eventFilesPrefix}, ` +
    `uploadExpires=${s3Summary.uploadUrlExpiresSeconds}s, ` +
    `downloadExpires=${s3Summary.downloadUrlExpiresSeconds}s, ` +
    `customEndpoint=${s3Summary.customEndpointConfigured ? 'yes' : 'no'})`
  )
})
