import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import routes from "./routes";
import { ENV } from "./config/env";
import { initializePaymentScheduler } from "./jobs/paymentScheduler";
import { initializeMemberCleanupScheduler } from "./jobs/memberCleanupScheduler";
import { initializeLeavingRequestDuesScheduler } from "./jobs/leavingRequestDuesScheduler";

const app = express();

const configureTrustProxy = () => {
  switch (ENV.TRUST_PROXY) {
    case "true":
      return true;
    case "false":
      return false;
    case "auto":
      // Auto-detect: trust proxy in production, enable in development to avoid warnings
      return ENV.NODE_ENV === "production" ? 1 : true;
    default:
      return isNaN(Number(ENV.TRUST_PROXY)) ? ENV.TRUST_PROXY : Number(ENV.TRUST_PROXY);
  }
};

app.set('trust proxy', configureTrustProxy());

// CORS Configuration
const allowedOrigins = ENV.CORS_ORIGIN?.split(',').map((origin: string) => origin.trim()) || [
  'http://localhost:3000',
  'https://admin.mrmpg.in',
  'https://member.mrmpg.in', 
  'https://mrmpg.in',
  'http://localhost:5173',
  'http://localhost:5174',
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    ' http://localhost:3000'
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept',
    'Origin',
    'X-Requested-With',
    'Cache-Control',
    'Accept-Encoding',
    'Accept-Language'
  ],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Middlewares
app.use(express.json());
app.use(cors(corsOptions));
app.use(helmet());

// Serve static files from uploads directory with CORS headers
app.use('/uploads', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Set CORS headers for uploads
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// API Routes
app.use("/api/v1", routes);

// Default route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "MRM PG Backend API",
    version: "1.0.0",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global error handler:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
  });
});

// Initialize schedulers
console.log('Initializing schedulers...');

// Initialize payment scheduler
initializePaymentScheduler();

// Initialize member cleanup scheduler
initializeMemberCleanupScheduler();

// Initialize leaving request dues scheduler
initializeLeavingRequestDuesScheduler();

export default app;
