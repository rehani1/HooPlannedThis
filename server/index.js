import { createEvent } from './models/event.js';
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import {
  getUserByUsername,
  createUser,
  createAccountRequest
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

app.post('/api/request-account', async (req, res) => {
  const { firstName, lastName, email, classId } = req.body
  await createAccountRequest({ firstName, lastName, email, classId })
  res.status(201).json({ message: 'Request received' })
})

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
  if (err.status === 409) {           // duplicate e-mail / username
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
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).end()
  const token = authHeader.split(' ')[1]
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    res.json({ id: payload.sub, username: payload.username })
  } catch {
    res.status(403).json({ message: 'Invalid or expired token' })
  }
})

app.post('/api/events', async (req, res) => {
  try {
    const auth = req.headers.authorization?.split(' ')[1];
    if (!auth) return res.sendStatus(401);
    jwt.verify(auth, JWT_SECRET);
    const eventId = await createEvent(req.body);   
    res.status(201).json({ id: eventId });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
