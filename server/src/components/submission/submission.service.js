const STATUS = require("../../constants/submissionStatus");
const Submission = require("../../models/Submission");
const { runJudge } = require("../services/judge.service");

exports.createSubmission = async (data, id) => {
  const submission = await Submission.create({
    userId: id,
    ...data,
    status: STATUS.QUEUED
  });

  // 🔥 THIS LINE IS THE TRIGGER
  runJudge(submission);

  return submission;
};

exports.getSubmission=async (userId)=>{
    return await Submission.find({userId})
}
exports.getSubmissionById=async (id)=>{
    return await Submission.findById(id)
}