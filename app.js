require('dotenv').config();

const express = require('express');

// Security
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
// const whitelist = require('./config/whitelist')

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

// Cross Origin Resource Sharing
app.use(cors());

// Error Middleware
app.use(errorHandler)
app.use(errorMiddleware)

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
app.use('/api/startups', require('./routes/startupRoute'));
app.use('/api/investors', require('./routes/investorRoute'));
app.use('/api/admin', require('./routes/adminRoute'));



module.exports = app;
