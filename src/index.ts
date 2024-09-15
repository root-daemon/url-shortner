import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const app = new Elysia();

const PORT = process.env.PORT || 3000;
const ADMIN_KEY = "$2b$10$19o/W5gaYXwwfP7HtDj7aOpwLCPm5YdVHYkV12lMObc1Fv5ZvjQQu";
const urlMappings: Record<string, string> = {};
const users: Record<string, string> = {
  user1: process.env.USER1_PASSWORD_HASH || "",
  user2: process.env.USER2_PASSWORD_HASH || "",
};

const authMiddleware = async ({ request, set }: any) => {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    set.status = 401;
    return "Unauthorized";
  }

  const base64Credentials = authHeader.slice(6);
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
  const [username, password] = credentials.split(":");

  const hashedPassword = users[username];
  if (!hashedPassword || !(await bcrypt.compare(password, hashedPassword))) {
    set.status = 401;
    return "Unauthorized";
  }
};

app.post(
  "/add-user",
  async ({ body, set, request }) => {
    const adminKey = request.headers.get("x-admin-key");
    console.log(ADMIN_KEY);
    if (adminKey !== ADMIN_KEY) {
      set.status = 403;
      return "Forbidden";
    }

    const { username, password } = body;
    if (!username || !password) {
      set.status = 400;
      return "Bad Request: Username and password are required";
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    users[username] = hashedPassword;

    return { message: "Password generated and stored successfully" };
  },
  {
    body: t.Object({
      username: t.String(),
      password: t.String(),
    }),
  }
);

app.post(
  "/shorten",
  async ({ body, set }) => {
    if (!body || typeof body !== "object" || !("url" in body)) {
      set.status = 400;
      return "Bad Request: Invalid JSON or missing URL";
    }

    const { url } = body as { url: string };

    if (!url) {
      set.status = 400;
      return "Bad Request: URL is required.";
    }

    const shortCode = nanoid(6);
    urlMappings[shortCode] = url;

    return { shortUrl: `http://localhost:${PORT}/${shortCode}` };
  },
  {
    beforeHandle: authMiddleware,
    body: t.Object({
      url: t.String(),
    }),
  }
);

app.get("/:code", ({ params, set }) => {
  const url = urlMappings[params.code];

  if (url) {
    set.redirect = url;
    return;
  } else {
    set.status = 404;
    return "Not Found";
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
