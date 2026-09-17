import { describe, expect, it } from "vitest";
import {
  getPassageForLevel,
  questionsPerPrimaryPassage,
  questionsPerVerificationPassage,
  readingLevelContent,
  READING_TEST_CONTENT_VERSION,
} from "./content";
import {
  classifyPrimaryResult,
  createInitialAssessmentState,
  evaluateVerification,
  recordPrimaryScore,
  recordVerificationScore,
  STARTING_LEVEL,
} from "./engine";
import { attemptsFromLevelResults, buildReportFromAttempts } from "./report";
import { isAnswerCorrect, normalizeGapFillAnswer } from "./scoring";
import { CEFR_LEVELS } from "./types";

describe("level-test content and scoring", () => {
  it("ships all 54 unique questions across A1-C2", () => {
    const questions = readingLevelContent.flatMap((entry) =>
      [...entry.primaryPassages, ...entry.verificationPassages].flatMap(
        (passage) => passage.questions,
      ),
    );
    expect(questions).toHaveLength(54);
    expect(new Set(questions.map((question) => question.id)).size).toBe(54);
    expect(readingLevelContent.map((entry) => entry.level)).toEqual([
      ...CEFR_LEVELS,
    ]);
    expect(READING_TEST_CONTENT_VERSION).toBe("2026-09-listen-order");
  });

  it("keeps canonical form sizes and listening steps", () => {
    for (const level of CEFR_LEVELS) {
      const entry = readingLevelContent.find((item) => item.level === level);
      expect(entry).toBeTruthy();
      expect(getPassageForLevel(level, "primary")?.questions).toHaveLength(
        questionsPerPrimaryPassage(level),
      );
      expect(getPassageForLevel(level, "verification")?.questions).toHaveLength(
        questionsPerVerificationPassage(level),
      );
      expect(entry?.primaryPassages[0].format).toBe("reading");
      expect(
        entry?.primaryPassages
          .slice(1)
          .every((step) => step.format === "listening"),
      ).toBe(true);
      expect(
        entry?.primaryPassages
          .slice(1)
          .every(
            (step) => step.audioSrc === `/audio/level-test/${step.id}.mp3`,
          ),
      ).toBe(true);
    }
  });

  it("normalizes gap-fill answers", () => {
    const question = getPassageForLevel("A1")?.questions.find(
      (item) => item.id === "a1-r2",
    );
    expect(question).toBeTruthy();
    expect(normalizeGapFillAnswer("  Twenty! ")).toBe("twenty");
    expect(isAnswerCorrect(question!, "20")).toBe(true);
    expect(isAnswerCorrect(question!, "twelve")).toBe(false);
  });
});

describe("adaptive engine", () => {
  it("starts at B1 and keeps exact thresholds", () => {
    expect(STARTING_LEVEL).toBe("B1");
    expect(createInitialAssessmentState().currentLevel).toBe("B1");
    expect(classifyPrimaryResult(4, 6, "B1")).toBe("confirmed");
    expect(classifyPrimaryResult(3, 6, "B1")).toBe("needs_verification");
    expect(classifyPrimaryResult(4, 6, "B2")).toBe("needs_verification");
    expect(classifyPrimaryResult(5, 6, "B2")).toBe("confirmed");
    expect(classifyPrimaryResult(4, 8, "A1")).toBe("needs_verification");
    expect(classifyPrimaryResult(5, 8, "A1")).toBe("confirmed");
    expect(evaluateVerification(1, 2)).toBe("passed");
    expect(evaluateVerification(1, 3)).toBe("failed");
    expect(evaluateVerification(2, 3)).toBe("passed");
  });

  it("uses verification before resolving a borderline level", () => {
    let state = createInitialAssessmentState();
    state = recordPrimaryScore(state, {
      level: "B1",
      passageId: "b1",
      correct: 3,
      total: 6,
    });
    expect(state.currentPassageKind).toBe("verification");
    state = recordVerificationScore(state, {
      level: "B1",
      passageId: "b1-v",
      correct: 2,
      total: 3,
    });
    expect(state.resultsByLevel.B1?.finalClassification).toBe("confirmed");
    expect(state.currentLevel).toBe("B2");
  });

  it("steps down and reports below A1 after clear failures", () => {
    let state = createInitialAssessmentState();
    for (const level of ["B1", "A2", "A1"] as const) {
      state = recordPrimaryScore(state, {
        level,
        passageId: `${level}-primary`,
        correct: 0,
        total: level === "A1" ? 8 : 6,
      });
    }
    expect(state.testComplete).toBe(true);
    expect(state.outcome?.resultType).toBe("below_a1");
  });
});

describe("server report helpers", () => {
  it("rebuilds a report only from raw answer attempts", () => {
    const answer = (level: "B1" | "B2", correct: number) => {
      const passage = getPassageForLevel(level)!;
      return Object.fromEntries(
        passage.questions.map((question, index) => [
          question.id,
          index < correct
            ? question.correctAnswer
            : (question.options.find(
                (option) => option.id !== question.correctAnswer,
              )?.id ?? "__wrong__"),
        ]),
      );
    };
    const report = buildReportFromAttempts(
      [
        { level: "B1", primaryAnswers: answer("B1", 4) },
        { level: "B2", primaryAnswers: answer("B2", 1) },
      ],
      READING_TEST_CONTENT_VERSION,
    );
    expect(report?.outcome.finalLevel).toBe("B1");
    expect(report?.totals).toEqual({ correct: 5, total: 12 });
    expect(buildReportFromAttempts([], "old-version")).toBeNull();
  });

  it("serializes only answer attempts from completed results", () => {
    let state = createInitialAssessmentState();
    state = recordPrimaryScore(state, {
      level: "B1",
      passageId: "b1",
      correct: 4,
      total: 6,
      answers: { "b1-r1": "B" },
    });
    const result = state.resultsByLevel.B1;
    expect(result && attemptsFromLevelResults([result])).toEqual([
      {
        level: "B1",
        primaryAnswers: { "b1-r1": "B" },
        verificationAnswers: undefined,
      },
    ]);
  });
});
