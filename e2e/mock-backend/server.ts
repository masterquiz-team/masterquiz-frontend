import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import {
  avatarPng,
  categories,
  options,
  quiz,
  seedUser,
  springPage,
} from "./fixtures.ts";

type User = typeof seedUser;
type Identity = { id: number; subject: string; guest: boolean };
type Answer = {
  id: number;
  quizAttemptId: number;
  answerId: number;
  questionId: number;
  correctAnswer: boolean;
  correctAnswerIds: number[];
  feedback: string;
};
type Attempt = {
  id: number;
  quizId: number;
  startedAt: string;
  finishedAt: string | null;
  status: "IN_PROGRESS" | "FINISHED";
  owner: number;
  quiz: ReturnType<typeof quiz>;
  answers: Answer[];
};
let users: User[];
const tokens = new Map<string, Identity>();
const attempts = new Map<number, Attempt>();
let scenarios: Record<string, string> = {};
let nextId = 10;
function reset() {
  users = [{ ...seedUser }];
  tokens.clear();
  attempts.clear();
  scenarios = {};
  nextId = 10;
}
reset();
function token(identity: Identity) {
  const encode = (v: unknown) =>
    Buffer.from(JSON.stringify(v)).toString("base64url");
  const jwt = `${encode({ alg: "none" })}.${encode({ sub: identity.subject, exp: Math.floor(Date.now() / 1000) + 3600, jti: randomUUID() })}.mock`;
  tokens.set(jwt, identity);
  return jwt;
}
const dateTime = () => new Date().toISOString().replace(/Z$/, "");
const attemptDto = (a: Attempt) => ({
  id: a.id,
  quizId: a.quizId,
  startedAt: a.startedAt,
  finishedAt: a.finishedAt,
  status: a.status,
});

createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  const path = url.pathname;
  const method = req.method;
  const reply = (data: unknown, status = 200) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  };
  try {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    const body: Record<string, unknown> = raw ? JSON.parse(raw) : {};
    if (path === "/__health") return reply({ ok: true });
    if (method === "POST" && path === "/__reset") {
      reset();
      return reply({ ok: true });
    }
    if (method === "POST" && path === "/__scenario") {
      for (const [key, value] of Object.entries(body)) {
        if (typeof value !== "string") {
          reply({ message: "Scenario must be a string" }, 400);
          return;
        }
        scenarios[key] = value;
        if (key === "attemptClock" && value === "expired") {
          for (const attempt of attempts.values()) {
            attempt.startedAt = new Date(Date.now() - 601_000)
              .toISOString()
              .replace(/Z$/, "");
          }
        }
      }
      return reply({ ok: true });
    }
    if (path === "/__state" && method === "GET") {
      return reply({
        users: users.map(({ password, ...user }) => {
          void password;
          return user;
        }),
        attempts: [...attempts.values()].map(attemptDto),
      });
    }
    if (path === "/login" && method === "POST") {
      const user = users.find(
        (u) => u.email === body.email && u.password === body.password,
      );
      if (!user || scenarios.login === "invalid-credentials")
        return reply(
          { message: "Incorrect email or password. Please try again." },
          401,
        );
      return reply({
        token: token({ id: user.id, subject: user.email, guest: false }),
      });
    }
    if (path === "/register" && method === "POST") {
      if (users.some((u) => u.email === body.email))
        return reply(
          { message: "An account with this email already exists." },
          409,
        );
      const user = {
        ...seedUser,
        id: nextId++,
        email: String(body.email),
        nickname: String(body.nickname),
        password: String(body.password),
      };
      users.push(user);
      return reply(
        { id: user.id, email: user.email, nickname: user.nickname },
        201,
      );
    }
    if (path === "/guest" && method === "POST") {
      const id = nextId++;
      const nickname = `Guest${id}`;
      return reply(
        {
          token: token({ id, subject: nickname, guest: true }),
          guestUserDto: {
            id,
            nickname,
            avatar: "avatar-1",
            score: 0,
            totalGamesPlayed: 0,
          },
        },
        201,
      );
    }
    const identity = tokens.get(
      req.headers.authorization?.replace(/^Bearer /, "") ?? "",
    );
    if (!identity) return reply({ message: "Unauthorized" }, 401);
    const user = users.find((u) => u.id === identity.id);
    const page = <T>(items: T[]) =>
      springPage(
        items,
        Number(url.searchParams.get("page") ?? 0),
        Number(url.searchParams.get("size") ?? 10),
      );
    const scenarioKey = path.startsWith("/user-profile")
      ? "profile"
      : path.split("/")[1];
    if (scenarios[scenarioKey] === "error500")
      return reply({ message: "Forced backend failure" }, 500);
    if (path === "/user-profile") {
      if (!user || identity.guest)
        return reply({ message: "Members only" }, 403);
      if (method === "DELETE") {
        users = users.filter((u) => u.id !== user.id);
        tokens.forEach((v, k) => {
          if (v.id === user.id) tokens.delete(k);
        });
        return reply(null);
      }
      if (method === "PUT") {
        if (scenarios.profileUpdate === "error500")
          return reply({ message: "Forced update failure" }, 500);
        if (typeof body.nickname === "string") user.nickname = body.nickname;
        if (typeof body.avatarId === "string") user.avatarId = body.avatarId;
      }
      const { password: omittedPassword, ...profile } = user;
      void omittedPassword;
      return reply(profile);
    }
    if (/^\/avatars\/avatar-(?:[1-9]|1\d|20)\.png$/.test(path)) {
      res.writeHead(200, { "Content-Type": "image/png" });
      return res.end(avatarPng);
    }
    if (path === "/categories") return reply(page(categories));
    if (/^\/categories\/\d+$/.test(path)) {
      const category = categories.find(
        (c) => c.id === Number(path.split("/")[2]),
      );
      return reply(category ?? {}, category ? 200 : 404);
    }
    if (path === "/leaderboard/me")
      return reply({
        nickname: user?.nickname ?? identity.subject,
        totalScore: user?.score ?? 0,
        totalGamesPlayed: 2,
        rank: 1,
        scoreByCategoryId: { "1": 100 },
        flag: true,
      });
    if (/^\/leaderboard(?:\/\d+)?$/.test(path)) {
      const history = path === "/leaderboard/2";
      return reply(
        page([
          {
            userId: identity.id,
            rank: 1,
            nickname: history
              ? "HistoryChampion"
              : (user?.nickname ?? identity.subject),
            flag: !history,
            score: 100,
            totalGamesPlayed: 2,
            categoryName: history ? "History" : "Geography",
            categoryScore: history ? 240 : 100,
            gamesPlayed: 2,
          },
        ]),
      );
    }
    if (/^\/quiz\/category\/\d+$/.test(path))
      return reply(page([quiz("EASY", Number(path.split("/")[3]))]));
    if (/^\/quiz\/\d+$/.test(path))
      return reply(
        [...attempts.values()].find((a) => a.owner === identity.id)?.quiz ??
          quiz(),
      );
    if (/^\/answers\/question\/\d+(?:\/quiz)?$/.test(path))
      return reply(options(Number(path.split("/")[3])));
    if (
      method === "POST" &&
      (path === "/quiz-attempts/random-quiz" ||
        /^\/quiz-attempts\/\d+$/.test(path))
    ) {
      const id = nextId++;
      const a: Attempt = {
        id,
        quizId: 1,
        startedAt: dateTime(),
        finishedAt: null,
        status: "IN_PROGRESS",
        owner: identity.id,
        quiz: quiz(
          String(body.difficulty ?? "EASY"),
          categories.find((c) => c.name === body.category)?.id ?? 1,
        ),
        answers: [],
      };
      attempts.set(id, a);
      return reply(attemptDto(a), 201);
    }
    if (path === "/quiz-attempts/answers/create" && method === "POST") {
      const a = attempts.get(Number(body.quizAttemptId));
      if (!a || a.owner !== identity.id) return reply({}, 404);
      const answerId = Number(body.answerId);
      const questionId = Math.floor(answerId / 10);
      const answer: Answer = {
        id: nextId++,
        quizAttemptId: a.id,
        answerId,
        questionId,
        correctAnswer: answerId % 10 === 1,
        correctAnswerIds: [questionId * 10 + 1],
        feedback: "Kyiv is the capital of Ukraine.",
      };
      a.answers.push(answer);
      return reply(answer, 201);
    }
    if (/^\/quiz-attempts\/answers\/\d+$/.test(path)) {
      const a = attempts.get(Number(path.split("/")[3]));
      return reply(
        a?.owner === identity.id ? a.answers : [],
        a?.owner === identity.id ? 200 : 404,
      );
    }
    if (/^\/quiz-attempts\/\d+(?:\/finish)?$/.test(path)) {
      const a = attempts.get(Number(path.split("/")[2]));
      if (!a || a.owner !== identity.id) return reply({}, 404);
      if (path.endsWith("/finish") && method === "PUT") {
        a.status = "FINISHED";
        a.finishedAt = dateTime();
      }
      return reply(attemptDto(a));
    }
    console.error(`Unmocked endpoint: ${method} ${path}`);
    reply({ message: "Unmocked endpoint" }, 404);
  } catch (error) {
    console.error(error);
    reply({ message: "Invalid mock request" }, 400);
  }
}).listen(
  Number(
    process.env.MOCK_BACKEND_PORT ?? process.env.E2E_BACKEND_PORT ?? 18080,
  ),
  "127.0.0.1",
  () => console.log("Mock backend ready"),
);
