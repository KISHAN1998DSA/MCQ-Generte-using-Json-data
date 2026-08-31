/**
 * Generates a stable, globally unique identifier for a question across JSON files.
 * Format example: digital-logic-q001 or bihar_stet-computer_fundamentals-q14
 */
export function getStableQuestionId(question, subjectId = "generic", topic = "", index = 0) {
  if (question && question.globalId) {
    return question.globalId;
  }

  const cleanSubject = String(subjectId)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const cleanTopic = String(question?.topic || topic || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const rawId = question?.id !== undefined && question?.id !== null ? String(question.id) : `idx${index + 1}`;
  const cleanId = rawId.replace(/[^a-z0-9_-]+/gi, "");

  // Generate a short string hash of the question text to prevent collision when question IDs duplicate across files
  const qText = String(question?.question || "").trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < qText.length; i += 1) {
    hash = (hash << 5) - hash + qText.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash).toString(36);

  const topicPart = cleanTopic ? `-${cleanTopic}` : "";
  return `${cleanSubject}${topicPart}-q${cleanId}-${positiveHash.slice(0, 5)}`;
}
