const express = require("express");

const app = express();

app.use(express.json());

// 🔥 endpoint de salud (MUY IMPORTANTE)
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

// 🔥 webhook
app.post("/webhook", (req, res) => {
  try {
    console.log("🔥 LLEGÓ WEBHOOK");
    res.sendStatus(200);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;

// 🔥 IMPORTANTE: sin host explícito
app.listen(PORT, () => {
  console.log("🚀 Servidor activo en puerto", PORT);
});