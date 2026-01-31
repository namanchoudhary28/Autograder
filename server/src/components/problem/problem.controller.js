const problemService = require("./problem.service");
exports.createProblem = async (req, res) => {
            console.log(req.body, req.user.id)

  try {
    const problem = await problemService.create(req.body, req.user.id);
    res.status(200).json(problem);
  } catch (error) {
    res.status(500).send({ message: "Error in creating problem" });
  }
};

exports.getAll = async (req, res) => {
  try {
    const problem = await problemService.getAll();
    res.status(200).json(problem);
  } catch (error) {
    res.status(500).send({ message: "Error in displaying problems" });
  }
};

exports.getProblemById=async (req,res) =>{
  console.log("BYID",req.params.id)
    try {
            const problem = await problemService.getProblemById(req.params.id);
    res.status(200).json(problem);

    } catch (error) {
            res.status(500).send({ message: "Error in displaying problem by id" });

        
    }
}