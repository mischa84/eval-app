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
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    formular: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Formular",
      required: true,
    },
    answers: [answerSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Answer", AnswerSchema);
