const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("OK FUNCIONANDO ✅");
});

app.post("/webhook", (req, res) => {
  console.log("🔥 LLEGÓ WEBHOOK");
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Servidor activo en puerto", PORT);
});