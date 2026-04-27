const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

const TOKEN = "TU_TOKEN_AQUI";
const URL = `https://api.telegram.org/bot${TOKEN}`;
const FIREBASE = "https://controlasistencia-d236e-default-rtdb.firebaseio.com";

// ✅ salud
app.get("/", (req, res) => {
  res.send("OK");
});

// ✅ webhook
app.post("/webhook", async (req, res) => {
  try {
    console.log("🔥 WEBHOOK:", JSON.stringify(req.body));

    const msg = req.body.message;
    if (!msg) return res.sendStatus(200);

    const chatId = msg.chat.id;
    const text = msg.text;

    // 🔍 comando
    if (text && text.startsWith("ASISTENCIA")) {
      const id = text.split(" ")[1];

      const alumnoRes = await fetch(`${FIREBASE}/alumnos/${id}.json`);
      const alumno = await alumnoRes.json();

      if (!alumno) {
        await enviar(chatId, "❌ Alumno no encontrado");
        return res.sendStatus(200);
      }

      const fecha = new Date().toISOString().split("T")[0];

      const regRes = await fetch(`${FIREBASE}/registros/${id}/${fecha}.json`);
      const registros = await regRes.json();

      let respuesta = `👤 ${alumno.nombre}\n`;

      if (!registros) {
        respuesta += "Sin registros hoy";
      } else {
        Object.values(registros).forEach(r => {
          respuesta += `\n${r.tipo}: ${r.hora}`;
        });
      }

      await enviar(chatId, respuesta);
    }

    res.sendStatus(200);

  } catch (error) {
    console.error("💥 ERROR:", error);
    res.sendStatus(200);
  }
});

// 📤 enviar mensaje
function enviar(chatId, texto) {
  return fetch(`${URL}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: texto
    })
  });
}

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("🚀 Servidor activo en puerto", PORT);
});