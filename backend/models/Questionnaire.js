const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  scale: {
    type: Number,
    required: true,
  },
});

const QuestionnaireSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questions: [QuestionSchema],
    participants: { all: Boolean, groups: [String] },
    visibility: { all: Boolean, groups: [String] },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Questionnaire", QuestionnaireSchema);
