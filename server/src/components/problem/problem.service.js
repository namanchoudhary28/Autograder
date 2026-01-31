const Problem = require("../../models/Problem");

exports.create=async (data,adminId)=>{
      return Problem.create({ ...data, createdBy: adminId });
 
}


exports.getAll=async ()=>{
    return Problem.find()
}

exports.getProblemById=async (id)=>{
  return Problem.findById(id)
}