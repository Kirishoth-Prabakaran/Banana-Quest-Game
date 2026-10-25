const cors = require('cors')
const express = require('express')
const authRoutes = require('./routes/auth')

const app = express()

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  }),
)
app.use(express.json({ limit: '10kb' }))

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)

app.use((_request, response) => {
  response.status(404).json({ message: 'That game API route was not found.' })
})

app.use((error, _request, response, _next) => {
  console.error('API request failed:', error)
  response.status(500).json({
    message: 'Something went wrong. Please try again in a moment.',
  })
})

module.exports = app