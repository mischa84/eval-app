const router = require("express").Router();
const mongoose = require("mongoose");
const User = require("../../models/User");
const Questionnaire = require("../../models/Questionnaire");
const Answer = require("../../models/Answer");
const ResHelper = require("../../helpers/ResHelper");
const AuthHelper = require("../../helpers/AuthHelper");

//List all questionnaires
router.route("/").get(async (req, res) => {
  try {
    let user;
    if (req.headers.authorization) {
      const payload = await AuthHelper.verifyToken(req.headers.authorization);
      user = await User.findById(payload.userId);
      if (!user) {
        return ResHelper.fail(res, "Access denied: Your token is invalid", 403);
      }
    } else {
      user = { id: "", groups: [] };
    }
    let questionnaires = await Questionnaire.find().select("-questions");
    questionnaires = questionnaires.map((questionnaire) => {
      const {
        visibility,
        participants,
        author,
        _id,
        title,
        createdAt,
        updatedAt,
      } = questionnaire;
      visibleResults =
        visibility.all ||
        user.id == author ||
        visibility.groups.some((x) => x in user.groups);
      participate =
        participants.all ||
        user.id == author ||
        participants.groups.some((x) => x in user.groups);
      return {
        _id,
        author,
        title,
        visibleResults,
        participate,
        createdAt,
        updatedAt,
      };
    });
    return ResHelper.success(res, questionnaires);
  } catch (err) {
    console.dir(err);
    return ResHelper.error(res, err);
  }
});

//Get info about one questionnaire plus answer statistics
router.route("/:id").get(async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id).populate(
      "author",
      "username"
    );
    if (!questionnaire) {
      return ResHelper.fail(res, "Questionnaire not found", 404);
    }
    const {
      visibility,
      participants,
      author,
      _id,
      title,
      createdAt,
      updatedAt,
    } = questionnaire;
    let visibleResults = false;
    let participate = false;
    if (req.headers.authorization) {
      const payload = await AuthHelper.verifyToken(req.headers.authorization);
      const user = await User.findById(payload.userId);
      if (!user) {
        return ResHelper.fail(res, "Access denied: Your token is invalid", 403);
      }

      visibleResults =
        author == user.id ||
        visibility.groups.some((x) => x in user.groups) ||
        visibility.all;
      participate =
        author == user.id ||
        participants.groups.some((x) => x in user.groups) ||
        participants.all;
    } else {
      visibleResults = visibility.all;
      participate = participants.all;
    }
    let submits = 0;
    let results = [];
    if (visibleResults) {
      const answers = await Answer.find({
        questionnaire: mongoose.Types.ObjectId(req.params.id),
      });
      submits = answers.length;
      if (answers.length) {
        for (let i = 0; i < answers[0].answers.length; ++i) {
          let sum = 0;
          let histogram = new Array(questionnaire.questions[i].scale + 1).fill(
            0
          );
          let comments = [];
          for (let j = 0; j < answers.length; ++j) {
            sum += answers[j].answers[i].value;
            histogram[answers[j].answers[i].value]++;
            if (answers[j].answers[i].comment) {
              comments.push(answers[j].answers[i].comment);
            }
          }
          results.push({ average: sum / answers.length, histogram, comments });
        }
      }
    }
    return ResHelper.success(res, {
      _id,
      author,
      title,
      visibleResults,
      participate,
      createdAt,
      updatedAt,
      submits,
      results,
    });
  } catch (err) {
    return ResHelper.error(res, err);
  }
});

//Submit an answer to specific questionnaire
router.route("/:id").post(async (req, res) => {
  try {
    const questionnaire = await Questionnaire.findById(req.params.id);
    if (!questionnaire) {
      return ResHelper.fail(res, "Questionnaire not found", 404);
    }
    if (req.headers.authorization) {
      const payload = await AuthHelper.verifyToken(req.headers.authorization);
      const user = await User.findById(payload.userId);
      if (!user) {
        return ResHelper.fail(res, "Access denied: Your token is invalid", 403);
      }
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

//Submit a questionnaire
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
      author: mongoose.Types.ObjectId(user.id),
      ...req.body,
    });
    const questionnaire = await newQuestionnaire.save();
    ResHelper.success(res, questionnaire, 201);
  } catch (err) {
    return ResHelper.error(res, err);
  }
});

//Update questionnaire
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
    const answers = await Answer.find({
      questionnaire: mongoose.Types.ObjectId(req.params.id),
    });
    if (answers.length) {
      return ResHelper.fail(
        res,
        "You can not change the questionnaire after submitting answers"
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
    let session;
    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      try {
        await Answer.deleteMany(
          {
            questionnaire: mongoose.Types.ObjectId(req.params.id),
          },
          { session }
        );
        await oldQuestionnaire.remove({ session });
      } catch (err) {
        return ResHelper.error(res, err);
      }
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
