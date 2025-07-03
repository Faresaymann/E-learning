const allowedOrigins = ["http://localhost:5173"];

const corsOptions = {
  origin: "*" ,
  credentials: true,
  optionsSuccessStatus: 200,
};

module.exports = corsOptions;
