const router = require("express").Router();
const mongoose = require("mongoose");
const User = require("../../models/User");
const Questionnaire = require("../../models/Questionnaire");
const Answer = require("../../models/Answer");
const ResHelper = require("../../helpers/ResHelper");
const AuthHelper = require("../../helpers/AuthHelper");


router.route("/:id").post(async (req, res) => {
  try {
    questionnaire = await Questionnaire.findbyID(req.params.id);
    if(!questionnaire){
      return ResHelper.fail(res, "Questionnaire not found", 404);
    }
    if (req.headers.authorization) {
      const payload = await AuthHelper.verifyToken(req.headers.authorization);
      const user = await User.findById(payload.userId);
      if (
        questionnaire.author != user.id &&
        !questionnaire.participants.groups.some((x) => x in user.groups) &&
        !questionnaire.participants.all
      ) {
        return ResHelper.fail(
          res,
          "Access denied: You can't participate in this questionnaire",
          401
        );
      }
    } else {
      if (!questionnaire.participants.all) {
        return ResHelper.fail(
          res,
          "Access denied: You need to be logged in to participate in this questionnaire",
          401
        );
      }
    }
    if (questionnaire.questions.length !== req.body.answers.length) {
      return ResHelper.fail(
        res,
        `The number of answers(${questionnaire.questions.length}) do not match the number of questions (${req.body.answers.length})`
      );
    }
    if(!questionnaire.questions.every(({scale}, i) => !!scale ? req.body.answers[i].value <= scale : true ){
      return ResHelper.fail(
        res,
        "The value of an answer does not fit into the scale of the question"
      );
    }
    const newAnswer = new Answer({questionnaire: mongoose.Types.ObjectId(req.params.id), ...req.body});
    const answer = await newAnswer.save();
    return ResHelper.success(res, answer);
  } catch (err) {
    return ResHelper.error(res, err);
  }
});
