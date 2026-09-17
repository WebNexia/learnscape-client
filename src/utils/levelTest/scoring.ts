import type { ReadingQuestion } from "./types";

export function normalizeGapFillAnswer(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, "")
    .replace(/\s+/g, " ");
}

export function isGapFillQuestion(question: ReadingQuestion) {
  return question.format === "gap_fill" || question.type === "gap_fill";
}

export function isAnswerCorrect(
  question: ReadingQuestion,
  answer: string | undefined,
) {
  if (!answer) return false;
  if (isGapFillQuestion(question)) {
    const accepted = question.acceptedAnswers?.length
      ? question.acceptedAnswers
      : [question.correctAnswer];
    const normalized = normalizeGapFillAnswer(answer);
    return accepted.some((item) => normalizeGapFillAnswer(item) === normalized);
  }
  return answer === question.correctAnswer;
}
