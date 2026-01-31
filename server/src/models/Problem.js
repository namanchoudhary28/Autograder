const mongoose = require("mongoose");

const problemSchema = new mongoose.Schema(
  {
    title: { type: String },
    description: { type: String },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    testCases:[
      {
        input:String,
        output:String
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Problem", problemSchema);
