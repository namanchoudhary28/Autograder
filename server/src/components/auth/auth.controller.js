const authService = require("./auth.service");

exports.registerUser = async (req, res) => {
  try {
    await authService.registerUser(req.body);
    res.status(201).send({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error registering user" });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const token = await authService.loginUser(req.body);
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).send({ message: "Error logging in user" });
  }
};

exports.me=async(req,res)=>{
    try {
        const user=await authService.me(req.user.id)
        res.status(200).json(user)
        
    } catch (error) {
            res.status(500).send({ message: err });

    }
}
