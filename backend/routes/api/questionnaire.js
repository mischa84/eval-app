const router = require("express").Router();
const mongoose = require("mongoose");
const User = require("../../models/User");
const Questionnaire = require("../../models/Questionnaire");
const Answer = require("../../models/Answer");
const ResHelper = require("../../helpers/ResHelper");
const AuthHelper = require("../../helpers/AuthHelper");

router.route("/").get(async (req, res) => {
  try {
    let user;
    if (req.headers.authorization) {
      const payload = await AuthHelper.verifyToken(req.headers.authorization);
      user = await User.findById(payload.userId);
    } else {
      user = { id: "", groups: [] };
    }
    let questionnaires = await Questionnaire.find();
    //   .or([
    //   { "visibility.all": true },
    //   { "visibility.groups": { $in: user.groups } },
    //   { "participants.all": true },
    //   { "participants.groups": { $in: user.groups } },
    //   { author: mongoose.Types.ObjectId(user.id) },
    // ]);
    questionnaires = questionnaires.map(
      ({ author, questions, visibility, participants }) => {
        return {
          author,
          questions,
          visibleResults:
            visibility.all ||
            user.id == author ||
            visibility.groups.some((x) => x in user.groups),

          participate:
            participants.all ||
            user.id == author ||
            participants.groups.some((x) => x in user.groups),
        };
      }
    );
    return ResHelper.success(res, questionnaires);
  } catch (err) {
    return ResHelper.error(res, err);
  }
});

router.route("/:id").get(async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id);
    if (!questionnaire) {
      return ResHelper.fail(res, "Questionnaire not found", 404);
    }
    if (req.headers.authorization) {
      const payload = await AuthHelper.verifyToken(req.headers.authorization);
      const user = await User.findById(payload.userId);
      if (
        questionnaire.author != user.id &&
        !questionnaire.visibility.groups.some((x) => x in user.groups) &&
        !questionnaire.visibility.all
      ) {
        return ResHelper.fail(
          res,
          "Access denied: You are not allowed to view the results of this questionnaire",
          401
        );
      }
    } else {
      if (!questionnaire.visibility.all) {
        return ResHelper.fail(
          res,
          "Access denied: You need to be logged in to view the results of this questionnaire",
          401
        );
      }
    }
    const answers = await Answer.find({
      questionnaire: mongoose.Types.ObjectId(req.params.id),
    });
    let results = [];
    for (let i = 0; i < answers[0].answers.length; ++i) {
      let sum = 0;
      let histogram = [];
      let comments = [];
      for (let j = 0; j < answers.length; j++) {
        sum += answers[j].answers[i].value;
        histogram[answers[j].answers[i].value]++;
        comments.push(answers[j].answers[i].comment);
      }
      results.push({ average: sum / answers.length, histogram, comments });
    }
    return ResHelper.success(res, { questionnaire, results });
  } catch (err) {
    return ResHelper.error(res, err);
  }
});

router.route("/:id").post(async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id);
    if (!questionnaire) {
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
    if (
      !questionnaire.questions.every(({ scale }, i) =>
        !!scale ? req.body.answers[i].value <= scale : true
      )
    ) {
      return ResHelper.fail(
        res,
        "The value of an answer does not fit into the scale of the question"
      );
    }
    const newAnswer = new Answer({
      questionnaire: mongoose.Types.ObjectId(req.params.id),
      ...req.body,
    });
    const answer = await newAnswer.save();
    return ResHelper.success(res, answer);
  } catch (err) {
    return ResHelper.error(res, err);
  }
});

//Add a questionnaire
router.route("/").post(async (req, res) => {
  try {
    const payload = await AuthHelper.verifyToken(req.headers.authorization);
    const user = await User.findById(payload.userId);
    if (!user) {
      return ResHelper.fail(
        res,
        "Access denied: You need to be logged in to add a questionnaire",
        403
      );
    }
    const newQuestionnaire = new Questionnaire({
      author: user.id,
      ...req.body,
    });
    const questionnaire = await newQuestionnaire.save();
    ResHelper.success(res, questionnaire, 201);
  } catch (err) {
    return ResHelper.error(res, err);
  }
});

router.route("/:id").put(async (req, res) => {
  try {
    const payload = await AuthHelper.verifyToken(req.headers.authorization);
    const user = await User.findById(payload.userId);
    if (!user) {
      return ResHelper.fail(
        res,
        "Access denied: You need to be logged in to update a questionnaire",
        403
      );
    }
    const oldQuestionnaire = await Questionnaire.findById(req.params.id);
    if (!oldQuestionnaire) {
      return ResHelper.fail(res, "Qestionnaire not found", 404);
    }
    if (user.id != oldQuestionnaire.author) {
      return ResHelper.fail(
        res,
        "Access denied: You need to be the owner to change the questionnaire",
        403
      );
    }
    Object.assign(oldQuestionnaire, req.body);
    const questionnaire = await oldQuestionnaire.save();
    ResHelper.success(res, questionnaire);
  } catch (err) {
    return ResHelper.error(res, err);
  }
});

router.route("/:id").delete(async (req, res) => {
  try {
    const payload = await AuthHelper.verifyToken(req.headers.authorization);
    const user = await User.findById(payload.userId);
    if (!user) {
      return ResHelper.fail(
        res,
        "Access denied: You need to be logged in to delete a questionnaire",
        403
      );
    }
    const oldQuestionnaire = await Questionnaire.findById(req.params.id);
    if (!oldQuestionnaire) {
      return ResHelper.fail(res, "Qestionnaire not found", 404);
    }
    if (user.id != oldQuestionnaire.author) {
      return ResHelper.fail(
        res,
        "Access denied: You need to be the owner to delete the questionnaire",
        403
      );
    }

    const session = await mongoose.startSession();
    session.withTransaction(async () => {
      await Answer.deleteMany(
        {
          questionnaire: mongoose.Types.ObjectId(req.params.id),
        },
        { session }
      );
      await oldQuestionnaire.remove({ session });
    });
    await session.endSession();
    return ResHelper.success(res, { deleted: oldQuestionnaire.id });
  } catch (err) {
    if (session) {
      await session.abortTransaction();
      await session.endSession();
    }
    return ResHelper.error(res, err);
  }
});

module.exports = router;
