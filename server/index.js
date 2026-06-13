import { createEvent, getEvents } from './models/event.js'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import morgan from 'morgan';
import { createCouncilYear, getAllCouncilYears } from './models/council.js';

import committeesRouter from './models/committees.js';
import { createAdvisor, getAdvisors } from './models/advisor.js';
import { getCommitteeBudgets, getTotalCouncilBudget } from './models/budget.js';

import {
    listItemsByEvent,
    createItem
  } from './models/supply.js';

import {
  getUserByUsername,
  createUser,
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

app.post('/api/councils', async (req, res) => {
  try {
    const { gradYear, academicYear, className, advisorId, committees } = req.body;
    await createCouncilYear({ gradYear, academicYear, className, advisorId, committees });
    res.status(201).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
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
  const user = await createUser({
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

  return res.status(201).json({ message: 'User registered', userId: user.id });
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
    { sub: user.id, username: user.username, committeeId: user.committeeId, gradYear:    user.gradYear},
    JWT_SECRET,
    { expiresIn: '2h' }
  )
  res.json({ token, user: { id: user.id, username: user.username, committeeId: user.committeeId, gradYear:  user.gradYear } })
})

app.get('/api/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).end();
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ id: payload.sub, username: payload.username });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired' });
    }
    console.error('Profile error:', err);
    res.status(403).json({ message: 'Invalid token' });
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
    if (err.code === 'ER_BAD_NULL_ERROR') {
      return res.status(400).json({ message: 'Missing required event fields' });
    }
    console.error(err);
    res.sendStatus(500);
  }
});

app.get('/api/events', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 3;
    const order = req.query.order === 'asc' ? 'ASC' : 'DESC';

 
    const rows = await getEvents(limit, order);

    return res.json(rows);
  } catch (err) {
    console.error('Error in GET /api/events:', err);
    return next(err);
  }
});
app.get('/api/budget/overview', async (req, res) => {
  try {
    const budget = await getTotalCouncilBudget();
    if (!budget) return res.status(404).json({ message: 'No budget found' });
    res.json(budget);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.get('/api/budget/allocations', async (req, res) => {
  try {
    const allocations = await getCommitteeBudgets();
    res.json(allocations);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
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
app.post('/api/advisors', async (req, res) => {
  try {
    const id = await createAdvisor(req.body);
    res.status(201).json({ id });
  } catch (err) {
    console.error('POST /api/advisors error', err);
    res.status(500).json({ message: 'Failed to create advisor' });
  }
});


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
