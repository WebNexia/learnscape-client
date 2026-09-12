import { getPassageForLevel, READING_TEST_CONTENT_VERSION } from "./content";
import {
  createInitialAssessmentState,
  getCompletedLevelResults,
  submitPassage,
} from "./engine";
import type { AssessmentOutcome, AssessmentState, LevelResult } from "./engine";
import { buildResultCopy, type ReadingLevelGuide } from "./resultCopy";
import {
  buildSkillInsights,
  getHeadlineScore,
  summarizeAttempt,
  type ReadingSkillInsight,
} from "./skillInsights";
import { isAnswerCorrect, isGapFillQuestion } from "./scoring";
import { ANSWER_OPTION_IDS, CEFR_LEVELS } from "./types";
import type {
  AnswerOptionId,
  AnswerSelection,
  CefrLevel,
  ReadingPassage,
  ReadingPassageKind,
  ReadingQuestion,
} from "./types";

export type ReportAttemptInput = {
  level: CefrLevel;
  primaryAnswers: AnswerSelection;
  verificationAnswers?: AnswerSelection;
};
export type ReportQuestionRow = {
  id: string;
  prompt: string;
  options: Array<{ id: AnswerOptionId; text: string }>;
  selected: string | null;
  correctAnswer: string;
  isCorrect: boolean;
};
export type ReportPassageSection = {
  level: CefrLevel;
  kind: ReadingPassageKind;
  title: string;
  paragraphs: string[];
  correct: number;
  total: number;
  score: number;
  questions: ReportQuestionRow[];
};
export type ReadingTestReport = {
  contentVersion: string;
  outcome: AssessmentOutcome;
  resultLabel: string;
  resultBandLabel: string;
  lead: string;
  approachingNote: string | null;
  nextGoalTitle: string;
  nextGoalLead: string;
  nextGoalTips: string[];
  booksHeading: string;
  recommendedLevel: CefrLevel;
  levelGuide: ReadingLevelGuide;
  headlineScore: number;
  totals: { correct: number; total: number };
  skills: ReadingSkillInsight[];
  passages: ReportPassageSection[];
};

export function isCefrLevel(value: unknown): value is CefrLevel {
  return (
    typeof value === "string" &&
    (CEFR_LEVELS as readonly string[]).includes(value)
  );
}
export function isAnswerOptionId(value: unknown): value is AnswerOptionId {
  return (
    typeof value === "string" &&
    (ANSWER_OPTION_IDS as readonly string[]).includes(value)
  );
}

export function sanitizeAnswerSelection(
  value: unknown,
  questions: ReadingQuestion[],
): AnswerSelection | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const answers: AnswerSelection = {};
  const record = value as Record<string, unknown>;
  for (const question of questions) {
    if (
      !(question.id in record) ||
      record[question.id] == null ||
      record[question.id] === ""
    )
      continue;
    const answer = record[question.id];
    if (typeof answer !== "string") return null;
    if (isGapFillQuestion(question)) {
      const text = answer.trim();
      if (!text || text.length > 80) return null;
      answers[question.id] = text;
    } else {
      if (!isAnswerOptionId(answer)) return null;
      answers[question.id] = answer;
    }
  }
  return answers;
}

export function parseReportAttempts(
  value: unknown,
): ReportAttemptInput[] | null {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > CEFR_LEVELS.length
  )
    return null;
  const attempts: ReportAttemptInput[] = [];
  const seen = new Set<CefrLevel>();
  for (const entry of value) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry))
      return null;
    const record = entry as Record<string, unknown>;
    const level = record.level;
    if (!isCefrLevel(level) || seen.has(level)) return null;
    const primary = getPassageForLevel(level, "primary");
    if (!primary) return null;
    const primaryAnswers = sanitizeAnswerSelection(
      record.primaryAnswers,
      primary.questions,
    );
    if (!primaryAnswers) return null;
    let verificationAnswers: AnswerSelection | undefined;
    if ("verificationAnswers" in record && record.verificationAnswers != null) {
      const verification = getPassageForLevel(level, "verification");
      if (!verification) return null;
      const parsed = sanitizeAnswerSelection(
        record.verificationAnswers,
        verification.questions,
      );
      if (!parsed) return null;
      verificationAnswers = parsed;
    }
    seen.add(level);
    attempts.push({ level, primaryAnswers, verificationAnswers });
  }
  return attempts;
}

function answersForPassage(
  attempt: ReportAttemptInput | undefined,
  kind: ReadingPassageKind,
) {
  if (!attempt) return null;
  return kind === "verification"
    ? (attempt.verificationAnswers ?? null)
    : attempt.primaryAnswers;
}

export function rebuildAssessmentFromAttempts(
  attempts: ReportAttemptInput[],
): AssessmentState | null {
  const byLevel = new Map(attempts.map((attempt) => [attempt.level, attempt]));
  let state = createInitialAssessmentState();
  let steps = 0;
  while (!state.testComplete && steps < 16) {
    steps += 1;
    const { currentLevel: level, currentPassageKind: kind } = state;
    if (!level || !kind) return null;
    const passage = getPassageForLevel(level, kind);
    const answers = answersForPassage(byLevel.get(level), kind);
    if (!passage || !answers) return null;
    state = submitPassage(state, passage, answers);
  }
  return state.testComplete && state.outcome ? state : null;
}

function buildQuestionRows(
  passage: ReadingPassage,
  answers: AnswerSelection,
): ReportQuestionRow[] {
  return passage.questions.map((question) => {
    const selected = answers[question.id] ?? null;
    return {
      id: question.id,
      prompt: question.prompt,
      options: question.options,
      selected,
      correctAnswer: question.correctAnswer,
      isCorrect: isAnswerCorrect(question, selected ?? undefined),
    };
  });
}

function buildPassageSection(
  result: LevelResult,
  kind: ReadingPassageKind,
): ReportPassageSection | null {
  const passage = getPassageForLevel(result.level, kind);
  if (!passage) return null;
  if (kind === "primary") {
    return {
      level: result.level,
      kind,
      title: `${result.level} ana metin`,
      paragraphs: passage.paragraphs,
      correct: result.primary.correct,
      total: result.primary.total,
      score: result.primary.score,
      questions: buildQuestionRows(passage, result.primary.answers),
    };
  }
  if (!result.verification.attempted) return null;
  return {
    level: result.level,
    kind,
    title: `${result.level} ek değerlendirme`,
    paragraphs: passage.paragraphs,
    correct: result.verification.correct,
    total: result.verification.total,
    score: result.verification.score,
    questions: buildQuestionRows(passage, result.verification.answers),
  };
}

export function buildReadingTestReport(
  state: AssessmentState,
): ReadingTestReport | null {
  if (!state.outcome) return null;
  const results = getCompletedLevelResults(state);
  const copy = buildResultCopy(state.outcome);
  const passages = results.flatMap((result) =>
    (["primary", "verification"] as ReadingPassageKind[]).flatMap((kind) => {
      const section = buildPassageSection(result, kind);
      return section ? [section] : [];
    }),
  );
  return {
    contentVersion: READING_TEST_CONTENT_VERSION,
    outcome: state.outcome,
    resultLabel: copy.resultLabel,
    resultBandLabel: copy.resultBandLabel,
    lead: copy.lead,
    approachingNote: copy.approachingNote,
    nextGoalTitle: copy.nextGoalTitle,
    nextGoalLead: copy.nextGoalLead,
    nextGoalTips: copy.nextGoalTips,
    booksHeading: copy.booksHeading,
    recommendedLevel: copy.recommendedLevel,
    levelGuide: copy.levelGuide,
    headlineScore: getHeadlineScore(results),
    totals: summarizeAttempt(results),
    skills: buildSkillInsights(results),
    passages,
  };
}

export function buildReportFromAttempts(
  attempts: ReportAttemptInput[],
  contentVersion: string,
) {
  if (contentVersion !== READING_TEST_CONTENT_VERSION) return null;
  const state = rebuildAssessmentFromAttempts(attempts);
  return state ? buildReadingTestReport(state) : null;
}

export function attemptsFromLevelResults(
  results: LevelResult[],
): ReportAttemptInput[] {
  return results.map((result) => ({
    level: result.level,
    primaryAnswers: result.primary.answers,
    verificationAnswers: result.verification.attempted
      ? result.verification.answers
      : undefined,
  }));
}
