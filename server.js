const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.get("/chat", async (req, res) => {
  const userMessage = req.query.message;

  if (!userMessage) {
    return res.status(400).send("Message is required");
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      // systemInstruction:
      //   "Act like a chat bot only for - response only to programming question related to react js",
    });

    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
    });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) res.write(`data: ${text}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    console.error("Streaming error:", err);
    res.write(`data: [ERROR] ${err.message || "Unknown error"}\n\n`);
    res.end();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
