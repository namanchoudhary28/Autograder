const User = require("../../models/User");
const bcrypt=require("bcryptjs")
const jwt = require("jsonwebtoken");

exports.registerUser = async ({ name, email, password }) => {
  const exist = await User.findOne({ email });
  if (exist) {
    throw "User already exists";
  }

  const hash = await bcrypt.hash(password, 10);
  return await User.create({ name, email, password: hash });
};


exports.loginUser=async ({email,password})=>{
    const user= await User.findOne({email})
    if (!user){
        throw "User not found"
    }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw "Invalid credentials";
  }
  return jwt.sign(
    { id: user._id,
      role: user.role
     },
    process.env.JWT_SECRET,
    
    { expiresIn: "1d" }
  );
}

exports.me=async (id)=>{
    return User.findById(id).select("-password")
}