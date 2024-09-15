import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";

const app = new Elysia();

const PORT = process.env.PORT || 3000;

const urlMappings: Record<string, string> = {};

const users: Record<string, string> = {
  user1: "password1",
  user2: "password2",
};

const authPlugin = new Elysia()
  .derive(({ request }) => {
    const authHeader = request.headers.get("authorization");

    if (authHeader && authHeader.startsWith("Basic ")) {
      const base64Credentials = authHeader.slice(6);
      const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
      const [username, password] = credentials.split(":");

      if (users[username] === password) {
        return { isAuthorized: true };
      }
    }

    return { isAuthorized: false };
  })
  .onBeforeHandle(({ isAuthorized, set }) => {
    if (!isAuthorized) {
      set.status = 401;
      return "Unauthorized";
    }
  });

app.use(authPlugin);

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