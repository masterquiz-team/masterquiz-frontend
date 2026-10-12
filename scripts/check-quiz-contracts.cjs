/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS contract test runner. */
// Run with: node scripts/check-quiz-contracts.cjs
// Uses the project's TypeScript compiler; no test dependency or backend data required.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const code = ts.transpileModule(
  fs.readFileSync("src/features/quiz/contracts.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
const moduleExports = {};
vm.runInNewContext(code, { exports: moduleExports });
const {
  parsePlayerQuiz,
  parsePlayerAttempt,
  parsePlayerQuizPage,
  parseStartInput,
} = moduleExports;
const plain = (value) => JSON.parse(JSON.stringify(value));
const quiz = {
  id: 1,
  title: "Quiz",
  categoryId: 2,
  userId: 777,
  listOfQuestions: [
    {
      id: 3,
      text: "Question?",
      feedback: "Secret",
      correctAnswer: true,
      answerCounter: 4,
      category: { hibernateLazyInitializer: "private" },
    },
  ],
};
assert.deepEqual(plain(parsePlayerQuiz(quiz)), {
  id: 1,
  title: "Quiz",
  categoryId: 2,
  listOfQuestions: [{ id: 3, text: "Question?" }],
});
assert.throws(
  () =>
    parsePlayerQuiz({
      ...quiz,
      listOfQuestions: [quiz.listOfQuestions[0], quiz.listOfQuestions[0]],
    }),
  /Unexpected/,
);
assert.throws(
  () => parsePlayerQuiz({ ...quiz, id: Number.MAX_SAFE_INTEGER + 1 }),
  /Unexpected/,
);
assert.throws(() => parsePlayerQuiz({ ...quiz, title: "  " }), /Unexpected/);
const attempt = {
  id: 1,
  quizId: 2,
  userId: 3,
  startedAt: "2026-10-12T15:00:00.123456789",
  finishedAt: null,
  status: "IN_PROGRESS",
};
assert.deepEqual(Object.keys(plain(parsePlayerAttempt(attempt))), [
  "id",
  "quizId",
  "startedAt",
  "finishedAt",
  "status",
]);
assert.throws(
  () => parsePlayerAttempt({ ...attempt, startedAt: "not-a-date" }),
  /Unexpected/,
);
assert.throws(
  () => parsePlayerAttempt({ ...attempt, status: "PAUSED" }),
  /Unexpected/,
);
assert.throws(() => parseStartInput({ quizId: 1, difficulty: "easy" }), /Only/);
assert.deepEqual(plain(parseStartInput({ quizId: 1 })), { quizId: 1 });
assert.throws(() => parseStartInput({ quizId: 0 }), /Only/);
assert.throws(
  () =>
    parsePlayerQuizPage({
      content: [quiz],
      number: 0,
      size: 12,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
      empty: true,
    }),
  /Unexpected/,
);
console.log(
  "PASS: 11 quiz contract checks, private-field allowlists, IDs, timestamps, state and start input.",
);
