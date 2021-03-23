const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  scale: {
    type: Number,
    required: true,
  },
});

const FormularSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    questions: [QuestionSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Formular", FormularSchema);
