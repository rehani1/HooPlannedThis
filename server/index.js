import { createEvent, getEvents } from './models/event.js'
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
    createItem
  } from './models/supply.js';

import {
  getUserByUsername,
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

dotenv.config()

const app         = express()
const PORT        = process.env.PORT || 4000
const JWT_SECRET  = process.env.JWT_SECRET
if (!JWT_SECRET) throw new Error('Missing JWT_SECRET')
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

/**
 * POST /api/items
 * Body must include event_id
 */
app.post('/api/items', async (req, res) => {
  const data = req.body;
  if (!data.event_id) return res.status(400).json({ message: 'Missing event_id in payload' });
  try {
    const newId = await createItem(data);
    res.status(201).json({ item_id: newId });
  } catch (err) {
    console.error('Error creating item:', err);
    res.status(500).json({ message: err.message });
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
  console.log(`Server running on port ${PORT}`)
  console.log(
    `Database configured for ${dbSummary.host}:${dbSummary.port}/${dbSummary.database} ` +
    `(ssl=${dbSummary.sslMode}, pool=${dbSummary.connectionLimit})`
  )
})
