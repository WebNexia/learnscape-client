import {
  QUESTIONS_PER_A1_PASSAGE,
  QUESTIONS_PER_PASSAGE,
  QUESTIONS_PER_UPPER_PASSAGE,
  QUESTIONS_PER_VERIFICATION_PASSAGE,
  READING_TEST_CONTENT_VERSION,
} from "./content";
import { isAnswerCorrect } from "./scoring";
import { CEFR_LEVELS } from "./types";
import type {
  AnswerSelection,
  CefrLevel,
  ReadingPassage,
  ReadingPassageKind,
} from "./types";

export const STARTING_LEVEL: CefrLevel = "B1";
export const CONFIRMED_CORRECT_MINIMUM = 3;
export const BORDERLINE_CORRECT_MINIMUM = 2;
export const VERIFICATION_PASS_MINIMUM = 1;
export const UPPER_CONFIRMED_CORRECT_MINIMUM = 5;
export const UPPER_BORDERLINE_CORRECT_MINIMUM = 4;
export const UPPER_VERIFICATION_PASS_MINIMUM = 2;

export type PrimaryClassification =
  "confirmed" | "needs_verification" | "failed";
export type VerificationOutcome = "passed" | "failed";
export type LevelResolution =
  "confirmed" | "borderline" | "failed" | "pending_verification";
export type AssessmentDirection = "up" | "down";
export type PassageScore = {
  passageId: string;
  kind: ReadingPassageKind;
  correct: number;
  incorrect: number;
  total: number;
  score: number;
  answers: AnswerSelection;
};
export type PrimaryResult = PassageScore & {
  classification: PrimaryClassification;
};
export type VerificationResult =
  { attempted: false } | (PassageScore & { attempted: true; passed: boolean });
export type LevelResult = {
  level: CefrLevel;
  primary: PrimaryResult;
  verification: VerificationResult;
  finalClassification: LevelResolution;
};
export type AssessmentResultType = "cefr" | "below_a1";
export type AssessmentStatus = "confirmed" | "developing";
export type AssessmentOutcome = {
  resultType: AssessmentResultType;
  finalLevel: CefrLevel | null;
  approachingLevel: CefrLevel | null;
  status: AssessmentStatus | null;
};
export type AssessmentState = {
  contentVersion: string;
  currentLevel: CefrLevel | null;
  currentPassageKind: ReadingPassageKind | null;
  direction: AssessmentDirection | null;
  testedLevels: CefrLevel[];
  resultsByLevel: Partial<Record<CefrLevel, LevelResult>>;
  highestConfirmedLevel: CefrLevel | null;
  borderlineLevel: CefrLevel | null;
  testComplete: boolean;
  outcome: AssessmentOutcome | null;
};

export function getLevelIndex(level: CefrLevel) {
  return CEFR_LEVELS.indexOf(level);
}
export function getLevelAbove(level: CefrLevel): CefrLevel | null {
  return CEFR_LEVELS[getLevelIndex(level) + 1] ?? null;
}
export function getLevelBelow(level: CefrLevel): CefrLevel | null {
  return CEFR_LEVELS[getLevelIndex(level) - 1] ?? null;
}
function higherLevel(left: CefrLevel | null, right: CefrLevel | null) {
  if (!left) return right;
  if (!right) return left;
  return getLevelIndex(left) >= getLevelIndex(right) ? left : right;
}

export function classifyPrimaryResult(
  correct: number,
  total = QUESTIONS_PER_PASSAGE,
  level?: CefrLevel,
): PrimaryClassification {
  if (level === "A1" && total >= QUESTIONS_PER_A1_PASSAGE) {
    if (correct >= 5) return "confirmed";
    if (correct === 4) return "needs_verification";
    return "failed";
  }
  if (
    total >= QUESTIONS_PER_UPPER_PASSAGE &&
    (level === "A1" || level === "A2" || level === "B1")
  ) {
    if (correct >= 4) return "confirmed";
    if (correct === 3) return "needs_verification";
    return "failed";
  }
  const confirmedMinimum =
    total >= QUESTIONS_PER_UPPER_PASSAGE
      ? UPPER_CONFIRMED_CORRECT_MINIMUM
      : CONFIRMED_CORRECT_MINIMUM;
  const borderlineExact =
    total >= QUESTIONS_PER_UPPER_PASSAGE
      ? UPPER_BORDERLINE_CORRECT_MINIMUM
      : BORDERLINE_CORRECT_MINIMUM;
  if (correct >= confirmedMinimum) return "confirmed";
  if (correct === borderlineExact) return "needs_verification";
  return "failed";
}

export function evaluateVerification(
  correct: number,
  total = QUESTIONS_PER_VERIFICATION_PASSAGE,
): VerificationOutcome {
  const passMinimum =
    total >= 3 ? UPPER_VERIFICATION_PASS_MINIMUM : VERIFICATION_PASS_MINIMUM;
  return correct >= passMinimum ? "passed" : "failed";
}

export function resolveLevelClassification(
  primary: PrimaryClassification,
  verification?: VerificationOutcome,
): LevelResolution {
  if (primary === "confirmed") return "confirmed";
  if (primary === "failed") return "failed";
  if (!verification) return "pending_verification";
  return verification === "passed" ? "confirmed" : "borderline";
}

export function calculateComprehensionScore(correct: number, total: number) {
  return total <= 0 ? 0 : Math.round((correct / total) * 100);
}
export function countCorrectAnswers(
  passage: ReadingPassage,
  answers: AnswerSelection,
) {
  return passage.questions.reduce(
    (total, question) =>
      isAnswerCorrect(question, answers[question.id]) ? total + 1 : total,
    0,
  );
}
function createPassageScore({
  passageId,
  kind,
  correct,
  total,
  answers = {},
}: {
  passageId: string;
  kind: ReadingPassageKind;
  correct: number;
  total: number;
  answers?: AnswerSelection;
}): PassageScore {
  return {
    passageId,
    kind,
    correct,
    incorrect: total - correct,
    total,
    score: calculateComprehensionScore(correct, total),
    answers,
  };
}

export function createInitialAssessmentState(): AssessmentState {
  return {
    contentVersion: READING_TEST_CONTENT_VERSION,
    currentLevel: STARTING_LEVEL,
    currentPassageKind: "primary",
    direction: null,
    testedLevels: [],
    resultsByLevel: {},
    highestConfirmedLevel: null,
    borderlineLevel: null,
    testComplete: false,
    outcome: null,
  };
}

type NextStep =
  | { kind: "continue"; level: CefrLevel; passageKind: ReadingPassageKind }
  | { kind: "complete"; outcome: AssessmentOutcome };

function planUpwardStep(
  result: LevelResult,
  highestConfirmedLevel: CefrLevel | null,
): NextStep {
  if (result.finalClassification === "confirmed") {
    const nextLevel = getLevelAbove(result.level);
    if (!nextLevel) {
      return {
        kind: "complete",
        outcome: {
          resultType: "cefr",
          finalLevel: result.level,
          approachingLevel: null,
          status: "confirmed",
        },
      };
    }
    return { kind: "continue", level: nextLevel, passageKind: "primary" };
  }
  return {
    kind: "complete",
    outcome: {
      resultType: "cefr",
      finalLevel: highestConfirmedLevel,
      approachingLevel:
        result.finalClassification === "borderline" ? result.level : null,
      status: "confirmed",
    },
  };
}

function planDownwardStep(
  result: LevelResult,
  resultsByLevel: Partial<Record<CefrLevel, LevelResult>>,
): NextStep {
  if (result.finalClassification === "confirmed") {
    const levelAbove = getLevelAbove(result.level);
    const wasBorderlineAbove = Boolean(
      levelAbove &&
      resultsByLevel[levelAbove]?.finalClassification === "borderline",
    );
    return {
      kind: "complete",
      outcome: {
        resultType: "cefr",
        finalLevel: result.level,
        approachingLevel: wasBorderlineAbove ? levelAbove : null,
        status: "confirmed",
      },
    };
  }
  const nextLevel = getLevelBelow(result.level);
  if (nextLevel)
    return { kind: "continue", level: nextLevel, passageKind: "primary" };
  return {
    kind: "complete",
    outcome: {
      resultType: "below_a1",
      finalLevel: null,
      approachingLevel: null,
      status: null,
    },
  };
}

function applyResolvedLevelResult(
  state: AssessmentState,
  result: LevelResult,
): AssessmentState {
  const testedLevels = state.testedLevels.includes(result.level)
    ? state.testedLevels
    : [...state.testedLevels, result.level];
  const resultsByLevel = { ...state.resultsByLevel, [result.level]: result };
  if (result.finalClassification === "pending_verification") {
    return {
      ...state,
      testedLevels,
      resultsByLevel,
      currentLevel: result.level,
      currentPassageKind: "verification",
      testComplete: false,
      outcome: null,
    };
  }
  const highestConfirmedLevel =
    result.finalClassification === "confirmed"
      ? higherLevel(state.highestConfirmedLevel, result.level)
      : state.highestConfirmedLevel;
  const borderlineLevel =
    result.finalClassification === "borderline"
      ? result.level
      : state.borderlineLevel;
  const direction: AssessmentDirection =
    state.direction ??
    (result.finalClassification === "confirmed" ? "up" : "down");
  const nextStep =
    direction === "up"
      ? planUpwardStep(result, highestConfirmedLevel)
      : planDownwardStep(result, resultsByLevel);
  return {
    ...state,
    direction,
    testedLevels,
    resultsByLevel,
    highestConfirmedLevel,
    borderlineLevel,
    currentLevel: nextStep.kind === "continue" ? nextStep.level : null,
    currentPassageKind:
      nextStep.kind === "continue" ? nextStep.passageKind : null,
    testComplete: nextStep.kind === "complete",
    outcome: nextStep.kind === "complete" ? nextStep.outcome : null,
  };
}

export function recordPrimaryScore(
  state: AssessmentState,
  {
    level,
    passageId,
    correct,
    total = QUESTIONS_PER_PASSAGE,
    answers = {},
  }: {
    level: CefrLevel;
    passageId: string;
    correct: number;
    total?: number;
    answers?: AnswerSelection;
  },
) {
  const primary: PrimaryResult = {
    ...createPassageScore({
      passageId,
      kind: "primary",
      correct,
      total,
      answers,
    }),
    classification: classifyPrimaryResult(correct, total, level),
  };
  return applyResolvedLevelResult(state, {
    level,
    primary,
    verification: { attempted: false },
    finalClassification: resolveLevelClassification(primary.classification),
  });
}

export function recordVerificationScore(
  state: AssessmentState,
  {
    level,
    passageId,
    correct,
    total = QUESTIONS_PER_VERIFICATION_PASSAGE,
    answers = {},
  }: {
    level: CefrLevel;
    passageId: string;
    correct: number;
    total?: number;
    answers?: AnswerSelection;
  },
) {
  const existing = state.resultsByLevel[level];
  const verificationOutcome = evaluateVerification(correct, total);
  const verification: VerificationResult = {
    attempted: true,
    ...createPassageScore({
      passageId,
      kind: "verification",
      correct,
      total,
      answers,
    }),
    passed: verificationOutcome === "passed",
  };
  const primary =
    existing?.primary ??
    ({
      ...createPassageScore({
        passageId: "",
        kind: "primary",
        correct: BORDERLINE_CORRECT_MINIMUM,
        total: QUESTIONS_PER_PASSAGE,
      }),
      classification: "needs_verification" as const,
    } satisfies PrimaryResult);
  return applyResolvedLevelResult(state, {
    level,
    primary,
    verification,
    finalClassification: resolveLevelClassification(
      primary.classification,
      verificationOutcome,
    ),
  });
}

export function submitPassage(
  state: AssessmentState,
  passage: ReadingPassage,
  answers: AnswerSelection,
) {
  const payload = {
    level: passage.level,
    passageId: passage.id,
    correct: countCorrectAnswers(passage, answers),
    total: passage.questions.length,
    answers,
  };
  return passage.kind === "verification"
    ? recordVerificationScore(state, payload)
    : recordPrimaryScore(state, payload);
}

export function getCompletedLevelResults(
  state: AssessmentState,
): LevelResult[] {
  return state.testedLevels.flatMap((level) => {
    const result = state.resultsByLevel[level];
    return result ? [result] : [];
  });
}

export function getCompletedPassageCount(state: AssessmentState) {
  return getCompletedLevelResults(state).reduce(
    (count, result) => count + 1 + (result.verification.attempted ? 1 : 0),
    0,
  );
}

export function summarizeAssessment(state: AssessmentState) {
  const results = getCompletedLevelResults(state);
  const numberOfVerificationPassages = results.filter(
    (result) => result.verification.attempted,
  ).length;
  return {
    verificationUsed: numberOfVerificationPassages > 0,
    numberOfPrimaryPassages: results.length,
    numberOfVerificationPassages,
  };
}
