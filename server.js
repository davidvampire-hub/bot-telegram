const express = require("express");

const app = express();

// 🔥 necesario para JSON
app.use(express.json());

// 🔥 ruta base
app.get("/", (req, res) => {
  res.send("OK FUNCIONANDO ✅");
});

// 🔥 webhook seguro
app.post("/webhook", (req, res) => {
  try {
    console.log("🔥 LLEGÓ WEBHOOK");
    console.log(JSON.stringify(req.body, null, 2));

    res.sendStatus(200);
  } catch (error) {
    console.error("💥 ERROR EN WEBHOOK:", error);
    res.sendStatus(500);
  }
});

// 🔥 manejo de errores global (CLAVE)
app.use((err, req, res, next) => {
  console.error("💥 ERROR GLOBAL:", err.stack);
  res.status(500).send("Error interno");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Servidor activo en puerto", PORT);
});