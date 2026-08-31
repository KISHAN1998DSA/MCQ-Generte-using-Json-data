export function sanitizeQuestion(question, fallbackIndex) {
  const options = Array.isArray(question?.options)
    ? question.options.filter((option) => typeof option === "string" && option.trim())
    : [];
  const answer =
    Number.isInteger(question?.answer) && question.answer >= 0 && question.answer < options.length
      ? question.answer
      : null;

  return {
    id: question?.id ?? `q-${fallbackIndex + 1}`,
    question: question?.question?.trim() || "Question text is missing.",
    options,
    answer,
    explanation: question?.explanation?.trim() || "No explanation provided for this question.",
    topic: question?.topic?.trim() || "",
    hasError: !options.length || answer === null,
    errorMessage: !options.length
      ? "This question does not have valid answer options."
      : answer === null
        ? "This question has an invalid answer index."
        : "",
  };
}

export function sanitizeQuestions(rawQuestions) {
  if (!Array.isArray(rawQuestions)) return [];
  const usedIds = new Set();
  return rawQuestions.map((question, index) => {
    const sanitized = sanitizeQuestion(question, index);
    let nextId = String(sanitized.id);
    if (usedIds.has(nextId)) {
      nextId = `${nextId}-${index + 1}`;
    }
    usedIds.add(nextId);
    return {
      ...sanitized,
      id: nextId,
    };
  });
}

export function extractQuestions(payload) {
  if (Array.isArray(payload?.questions)) {
    return sanitizeQuestions(payload.questions);
  }

  if (Array.isArray(payload?.topics)) {
    return sanitizeQuestions(extractNestedQuestions(payload.topics));
  }

  if (payload && typeof payload === "object") {
    return sanitizeQuestions(extractNestedQuestions([payload]));
  }

  return [];
}

function extractNestedQuestions(nodes, parentTopic = "") {
  const collected = [];

  for (const node of nodes) {
    if (!node || typeof node !== "object") continue;

    const currentTopic =
      typeof node.title === "string" && node.title.trim() ? node.title.trim() : parentTopic;

    if (Array.isArray(node.questions)) {
      const questionLikeEntries = node.questions.filter(isQuestionLike);
      if (questionLikeEntries.length) {
        collected.push(
          ...questionLikeEntries.map((question) => ({
            ...question,
            topic: question.topic || currentTopic,
          }))
        );
      } else {
        collected.push(...extractNestedQuestions(node.questions, currentTopic));
      }
    }

    for (const [key, value] of Object.entries(node)) {
      if (key === "questions" || key === "options") continue;
      if (Array.isArray(value)) {
        collected.push(...extractNestedQuestions(value, currentTopic));
      }
    }
  }

  return collected;
}

function isQuestionLike(item) {
  return (
    item &&
    typeof item === "object" &&
    (typeof item.question === "string" || Array.isArray(item.options) || Number.isInteger(item.answer))
  );
}

export function fisherYatesShuffle(list) {
  const items = [...list];
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

export function shuffleQuestionOptions(question) {
  if (!Array.isArray(question.options) || question.answer === null) {
    return question;
  }

  const decorated = question.options.map((option, index) => ({
    option,
    isCorrect: index === question.answer,
  }));

  const shuffled = fisherYatesShuffle(decorated);
  return {
    ...question,
    options: shuffled.map((item) => item.option),
    answer: shuffled.findIndex((item) => item.isCorrect),
  };
}

export async function loadSubjectData(file) {
  const response = await fetch(file);
  if (!response.ok) {
    throw new Error("Unable to load this subject right now.");
  }
  return response.json();
}

export function buildQuestionSet(questions, settings) {
  const validQuestions = questions.filter((question) => !question.hasError);
  const ordered =
    settings.order === "random" ? fisherYatesShuffle(validQuestions) : [...validQuestions];
  const sliced =
    settings.questionLimit === "all"
      ? ordered
      : ordered.slice(0, Math.min(Number(settings.questionLimit), ordered.length));

  return settings.shuffleOptions
    ? sliced.map((question) => shuffleQuestionOptions(question))
    : sliced;
}

export function calculateResult(session) {
  const summary = session.questions.reduce(
    (accumulator, question, index) => {
      const selected = session.answers[index];
      if (selected === undefined || selected === null) {
        accumulator.unanswered += 1;
        return accumulator;
      }
      if (selected === question.answer) {
        accumulator.correct += 1;
      } else {
        accumulator.wrong += 1;
        accumulator.wrongQuestionIndexes.push(index);
      }
      return accumulator;
    },
    { correct: 0, wrong: 0, unanswered: 0, wrongQuestionIndexes: [] }
  );

  const attempted = summary.correct + summary.wrong;
  const percentage = session.questions.length
    ? Math.round((summary.correct / session.questions.length) * 100)
    : 0;
  const accuracy = attempted ? Math.round((summary.correct / attempted) * 100) : 0;
  return { ...summary, attempted, percentage, accuracy };
}

export function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}
