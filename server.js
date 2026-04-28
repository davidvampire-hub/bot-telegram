const express = require("express");
const fetch = require("node-fetch");

const app = express();


app.use(express.json());
app.use(express.static("public"));


// 🔑 TOKEN DE TU BOT (CAMBIAR)
const TOKEN = "8761191809:AAG0Z_0wuLOdOevzGk9G8bz6BJh9e9NUL6w";
const URL = `https://api.telegram.org/bot${TOKEN}`;

// ✅ Ruta de prueba
app.get("/", (req, res) => {
  res.send("OK FUNCIONANDO ✅");
});

// ✅ WEBHOOK TELEGRAM
const FIREBASE = "https://controlasistencia-d236e-default-rtdb.firebaseio.com";

app.post("/webhook", async (req, res) => {

  console.log("🔥 WEBHOOK:", JSON.stringify(req.body));

  const msg = req.body.message;
  if (!msg) return res.sendStatus(200);

  const chatId = msg.chat.id;
  const text = msg.text ? msg.text.toUpperCase() : "";
  
  if (text && text.startsWith("ASISTENCIA")) {

    const partes = text.trim().split(/\s+/);
    const id = partes[1];

    if (!id) {
      await enviar(chatId, "⚠️ Usa: ASISTENCIA 123");
      return res.sendStatus(200);
    }

    await enviar(chatId, `📋 Buscando alumno ${id}...`);

    try {

      // 🔍 Buscar alumno
      const alumnoRes = await fetch(`${FIREBASE}/alumnos/${id}.json`);
      const alumno = await alumnoRes.json();

      if (!alumno) {
        await enviar(chatId, "❌ Alumno no encontrado");
        return res.sendStatus(200);
      }

      // 📅 Fecha de hoy
      const fecha = new Date().toISOString().split("T")[0];

      // 📊 Buscar registros
      const regRes = await fetch(`${FIREBASE}/registros/${id}/${fecha}.json`);
      const registros = await regRes.json();

      let respuesta = `👨‍🎓 ${alumno.nombre}\n📅 ${fecha}\n\n`;

      if (!registros) {
        respuesta += "Sin registros hoy";
      } else {
        Object.values(registros).forEach(r => {
          respuesta += `✔ ${r.tipo} - ${r.hora}\n`;
        });
      }

      await enviar(chatId, respuesta);

    } catch (error) {
      console.error("❌ Error:", error);
      await enviar(chatId, "❌ Error al consultar datos");
    }
  }

  else {
    await enviar(chatId, "👋 Usa:\nASISTENCIA 123");
  }

  res.sendStatus(200);
});

// 📤 FUNCIÓN PARA ENVIAR MENSAJE
async function enviar(chatId, texto) {
  try {
    await fetch(`${URL}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: texto
      })
    });
  } catch (error) {
    console.error("❌ Error enviando mensaje:", error);
  }
}

//NOTIFICACIONES
app.post("/notificar", async (req, res) => {

  try {

    const { chat_id, nombre, tipo, hora } = req.body;

    console.log("📩 Datos recibidos:", req.body);

    if (!chat_id) {
      console.log("❌ chat_id vacío");
      return res.sendStatus(400);
    }

    const mensaje = `📢 Notificación\n👤 ${nombre}\n📌 ${tipo}\n⏰ ${hora}`;

    const resp = await fetch(`${URL}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chat_id,
        text: mensaje
      })
    });

    const data = await resp.json();
    console.log("📨 Telegram:", data);

    return res.sendStatus(200); // 👈 SIEMPRE responder

  } catch (error) {
    console.error("❌ ERROR CRÍTICO:", error);
    return res.sendStatus(500); // 👈 evita que muera el server
  }

});

const cors = require("cors");
app.use(cors());


if (text === "/START") {

  await enviar(chatId, "👋 Bienvenido\nEnvía tu ID de alumno para vincularte");

  // Guardar temporalmente el chat_id
  await fetch(`${FIREBASE}/padres/${chatId}.json`, {
    method: "PUT",
    body: JSON.stringify({
      chat_id: chatId
    })
  });

  return res.sendStatus(200);
}





// 🌐 PUERTO (IMPORTANTE PARA RAILWAY)
const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Servidor activo en puerto", PORT);
});

process.on("uncaughtException", err => {
  console.error("💥 Error no controlado:", err);
});

process.on("unhandledRejection", err => {
  console.error("💥 Promesa no manejada:", err);
});