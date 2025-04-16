require("dotenv").config()
const mongoose = require("mongoose")
const app = require("./app")
const PORT = process.env.PORT || PORT

const { logger, logEvents } = require("./middleware/logger")

// Connect to MongoDB
mongoose.set("strictQuery", true)
mongoose.connection.once("open", () => {
  console.log(("Connected to MongoDB"))
  app.listen(PORT, () => console.log((`Server running on port ${PORT}...`)))
})

mongoose.connection.on("error", (err) => {
  console.log(err)
  logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, "mongoErrLog.log")
})