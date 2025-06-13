import { createEvent, getEvents } from './models/event.js'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import morgan from 'morgan';
import { createCouncilYear, getAllCouncilYears } from './models/council.js';
import {
  getTotalCouncilBudget,
  getCommitteeBudgets
} from './models/budget.js';
import committeesRouter from './models/committees.js';


import {
  getUserByUsername,
  createUser,
} from './models/user.js'

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

app.use(express.json())

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
  const { firstName, lastName, email, classId, username, password } = req.body;

  if (!firstName || !lastName || !email || !classId || !username || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser({
      firstName,
      lastName,
      email,
      classId,
      username,
      passwordHash
  });

  return res.status(201).json({ message: 'User registered', userId: user.id });
  } catch (err) {
  if (err.status === 409) {           
  return res.status(409).json({ message: err.message });
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
  res.json({ token, user: { id: user.id, username: user.username } })
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
    const id = await createEvent(req.body);
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

    console.log(`→ GET /api/events served ${rows.length} rows`);
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

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
