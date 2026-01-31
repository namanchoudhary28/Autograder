const mongoose = require("mongoose");
const STATUS = require("../constants/submissionStatus");

const submissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    language: { type: String, required: true },
    code: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.QUEUED,
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Submission", submissionSchema);
