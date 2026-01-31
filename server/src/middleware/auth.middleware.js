const jwt = require("jsonwebtoken");

// 1️⃣ AUTH (login check)
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // IMPORTANT: decoded must have role
    // { id, role, iat, exp }
    req.user = decoded;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// 2️⃣ ADMIN CHECK
const isAdmin = (req, res, next) => {
  console.log("ROLE",req.user)
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};

module.exports = {
  protect,
  isAdmin,
};
