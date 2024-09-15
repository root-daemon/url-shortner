import { Elysia } from "elysia";
import { nanoid } from "nanoid";
import { Buffer } from "buffer";

const app = new Elysia();

const PORT = process.env.PORT || 3000;

const urlMappings: Record<string, string> = {};

const users: Record<string, string> = {
  user1: "password1",
  user2: "password2",
};


app.use(async (ctx, next) => {
  const authHeader = ctx.request.headers.get("authorization");

  if (authHeader && authHeader.startsWith("Basic ")) {
    const base64Credentials = authHeader.slice(6);
    const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
    const [username, password] = credentials.split(":");

    if (users[username] === password) {
      ctx.set("user", username);
      return await next();
    }
  }

  ctx.set("status", 401);
  return ctx.send("Unauthorized");
});


app.post("/shorten", async (ctx) => {
  const body = await ctx.request.json();
  const url = body.url;

  if (!url) {
    ctx.set("status", 400);
    return ctx.send("Bad Request: URL is required.");
  }

  const shortCode = nanoid(6);
  urlMappings[shortCode] = url;

  return ctx.json({ shortUrl: `http://localhost:${PORT}/${shortCode}` });
});


app.get("/:code", (ctx) => {
  const code = ctx.params.code;
  const url = urlMappings[code];

  if (url) {
    ctx.redirect(url);
  } else {
    ctx.set("status", 404);
    return ctx.send("Not Found");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
