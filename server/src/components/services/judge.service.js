const STATUS = require("../../constants/submissionStatus");
const Problem = require("../../models/Problem");
const Submission = require("../../models/Submission");
const { runInDocker } = require("./dockerJudge.service");

exports.runJudge = async (submission) => {
  await Submission.findByIdAndUpdate(submission._id, {
    status: STATUS.RUNNING
  });

  const problem = await Problem.findById(submission.problemId);

  for (const tc of problem.testCases) {
    const result = await runInDocker(
      submission._id,
      submission.code,
      tc.input,
      submission.language
    );

    // RE / TLE
    if (result.status !== STATUS.AC) {
      return Submission.findByIdAndUpdate(submission._id, {
        status: result.status,
        output: result.output
      });
    }

    // WA
    if (result.output.trim() !== tc.output.trim()) {
      return Submission.findByIdAndUpdate(submission._id, {
        status: STATUS.WA,
        output: result.output
      });
    }
  }

  // all passed
  await Submission.findByIdAndUpdate(submission._id, {
    status: STATUS.AC
  });
};

