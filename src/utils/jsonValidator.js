import { extractQuestions } from "./questionUtils";

/**
 * Validates a JSON question payload and returns detailed diagnostic warnings/errors.
 */
export function validateQuestionPayload(payload, filename = "Unknown JSON") {
  const errors = [];
  const warnings = [];

  if (!payload || typeof payload !== "object") {
    return {
      isValid: false,
      errors: [`Invalid file content in ${filename}: Expected a valid JSON object.`],
      warnings: [],
      questionCount: 0,
    };
  }

  const rawQuestions = extractQuestions(payload);

  if (!rawQuestions.length) {
    errors.push(`No valid questions found in ${filename}. Check structure (questions: [] or topics: []).`);
  }

  const questionTextMap = new Map();

  rawQuestions.forEach((q, index) => {
    const qNum = index + 1;
    const qText = String(q.question || "").trim();

    if (!qText || qText === "Question text is missing.") {
      errors.push(`Question #${qNum}: Text is empty or missing.`);
    }

    if (!Array.isArray(q.options) || q.options.length < 2) {
      errors.push(`Question #${qNum} ("${qText.slice(0, 30)}..."): Must have at least 2 options.`);
    }

    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= (q.options?.length || 0)) {
      errors.push(
        `Question #${qNum}: Invalid answer index (${q.answer}). Expected 0 to ${(q.options?.length || 1) - 1}.`
      );
    }

    if (!q.explanation) {
      warnings.push(`Question #${qNum}: Missing explanation (recommended for study mode).`);
    }

    // Duplicate detection check
    const normalizedText = qText.toLowerCase();
    if (questionTextMap.has(normalizedText)) {
      warnings.push(
        `⚠️ Duplicate question detected in ${filename}: "${qText.slice(0, 45)}..." (matches Question #${questionTextMap.get(
          normalizedText
        )})`
      );
    } else {
      questionTextMap.set(normalizedText, qNum);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    questionCount: rawQuestions.length,
  };
}
