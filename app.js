require('dotenv').config();

const express = require('express');

// Security
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const whitelist = require('./config/whitelist')

const app = express();
const path = require('path');
const { logger} = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const errorMiddleware = require("./middleware/errorMiddleware");
const expressSanitizer = require('express-sanitizer');
const bodyParser = require('body-parser');


const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const connectDB = require('./config/dbConn');



// Connecting to Database Environments
console.log(process.env.NODE_ENV)
connectDB()

// Middlewares
app.use(logger)

// Cross Origin Resource Sharing
app.use(cors(whitelist));

// Error Middleware
app.use(errorHandler)
app.use(errorMiddleware)

app.use(express.json({ limit: "30mb", extended: true}))

app.use(cookieParser())
app.use(express.urlencoded({ limit: "30mb", extended: false}))
app.use(bodyParser.json())

app.use(
    helmet.contentSecurityPolicy({
        useDefaults: true,
        directives: {
            "img-src": ["'self'", "https: data:"],
        },
    }),
)
app.use(expressSanitizer());


// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Set security headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100
});
app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Enable CORS
app.use(cors());

// Mount routers
app.use('/api', require('./routes/authRoute'));
app.use('/api/startups', require('./routes/startupRoute'));
app.use('/api/investors', require('./routes/investorRoute'));
app.use('/api/admin', require('./routes/adminRoute'));



module.exports = app;
