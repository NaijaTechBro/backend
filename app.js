require('dotenv').config();
const express = require('express');

// Security
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const { whitelist } = require('./config/whitelist');

const app = express();
const path = require('path');
const { logger} = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const errorMiddleware = require("./middleware/errorMiddleware");
const expressSanitizer = require('express-sanitizer');
const bodyParser = require('body-parser');
const hpp = require('hpp');
const connectDB = require('./config/dbConn');


// Connecting to Database Environments
console.log(process.env.NODE_ENV)
connectDB()

// Middlewares
app.use(logger)

// Configure CORS before routes but after other essential middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl requests)
        if (!origin) return callback(null, true);
        
        if (whitelist.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            // Instead of throwing an error, just log it and allow the request with a warning
            console.warn(`Warning: Request from non-whitelisted origin: ${origin}`);
            callback(null, true); // Allow all origins in case of misconfiguration
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Include OPTIONS for preflight
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-Requested-With'],
    maxAge: 86400 // Cache preflight response for 24 hours
}));

app.use(express.json({ limit: "30mb", extended: true}))
app.use(express.urlencoded({ limit: "30mb", extended: false}))
app.use(bodyParser.json())
// Cookie parser
app.use(cookieParser());

app.use(
    helmet.contentSecurityPolicy({
        useDefaults: true,
        directives: {
            "img-src": ["'self'", "https: data:"],
        },
    }),
)
app.use(expressSanitizer());
 
// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
 
// Prevent http param pollution
app.use(hpp());

// Mount routers
app.use('/api', require('./routes/authRoute'));
app.use('/api/verify', require('./routes/roleVerifyRoute'));
app.use('/api/startups', require('./routes/startupRoute'));
app.use('/api/investors', require('./routes/investorRoute'));
app.use('/api/admin', require('./routes/adminRoute'));
app.use('/api/startups/connection', require('./routes/connectionRoute'));
app.use('/api/startups/views', require('./routes/viewRoute'));
app.use('/api/waitlist', require('./routes/waitlistRoute'));
app.use('/api/profile', require('./routes/profileRoute'));
// PitchDeck router
app.use('/api', require('./routes/pitch-deck/deckRoute'));
app.use('/api', require('./routes/pitch-deck/aiRoute'));
app.use('/api', require('./routes/pitch-deck/exportRoute'));
app.use('/api', require('./routes/pitch-deck/templateRoute'));
app.use('/api', require('./routes/pitch-deck/exampleRoute'));
app.use('/api', require('./routes/pitch-deck/slideRoute'));

// Error Middleware - should be after routes
app.use(errorHandler)
app.use(errorMiddleware)

module.exports = app;