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
    title: { type: String, required: true },
    questions: [QuestionSchema],
    participants: {
      all: { type: Boolean, default: false },
      groups: { type: [String], default: [] },
    },
    visibility: {
      all: { type: Boolean, default: false },
      groups: { type: [String], default: [] },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Questionnaire", QuestionnaireSchema);
