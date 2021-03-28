const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  value: {
    type: Number,
    required: true,
  },
  comment: {
    type: String,
    default: "",
  },
});

const AnswerSchema = new mongoose.Schema(
  {
    questionnaire: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Questionnaire",
      required: true,
    },
    answers: [answerSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Answer", AnswerSchema);
