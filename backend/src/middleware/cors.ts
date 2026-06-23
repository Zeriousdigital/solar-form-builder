import cors from 'cors'

const corsOptions: cors.CorsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}

const corsMiddleware = cors(corsOptions)

export default corsMiddleware
export { corsOptions }
