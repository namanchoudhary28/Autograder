const submissionService=require('./submission.service')

exports.createSubmission = async (req, res) => {
  try {
    const submission = await submissionService.createSubmission(req.body,req.user.id);
    res.status(200).json(submission);
  } catch (error) {
    res.status(500).send({ message: "Error in submission" });
  }
};

exports.getSubmission = async (req, res) => {
  try {
    const submission = await submissionService.getSubmission(req.user.id);
    res.status(200).json(submission);
  } catch (error) {
    res.status(500).send({ message: "Error in getting my submission" });
  }
};
exports.getSubmissionById = async (req, res) => {
    console.log("PARAM_ID",req.params.id)
  try {
    const submission = await submissionService.getSubmissionById(req.params.id);
    res.status(200).json(submission);
  } catch (error) {
    res.status(500).send({ message: "Error in getting my submission by id" });
  }
};