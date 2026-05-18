const express = require("express");
const fetch = require("node-fetch");

const app = express();

app.use(express.json());
app.use(express.static("public")); // 👈 para index.html y consulta.html

// 🔑 TOKEN BOT TELEGRAM
const TOKEN = "8761191809:AAG0Z_0wuLOdOevzGk9G8bz6BJh9e9NUL6w";
const URL = `https://api.telegram.org/bot${TOKEN}`;

// 🔥 FIREBASE
const FIREBASE = "https://controlasistencia-d236e-default-rtdb.firebaseio.com";

// ✅ RUTA BASE
app.get("/", (req, res) => {
  res.send("OK FUNCIONANDO ✅");
});


// ===============================
// 🤖 WEBHOOK TELEGRAM
// ===============================
app.post("/webhook", async (req, res) => {

  try {

    console.log("🔥 WEBHOOK:", JSON.stringify(req.body));

    const msg = req.body.message;
    if (!msg) return res.sendStatus(200);

    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.toUpperCase() : "";

    // ===============================
    // 👨‍👩‍👧 REGISTRO DE PADRE (/start)
    // ===============================
    if (text === "/START") {

      await enviar(chatId, "👋 Bienvenido(a)\nEnvía el Numero de control de tu hijo(a) para vincularte");

      // Guardar padre temporal
      await fetch(`${FIREBASE}/padres/${chatId}.json`, {
        method: "PUT",
        body: JSON.stringify({
          chat_id: chatId
        })
      });

      return res.sendStatus(200);
    }

    // ===============================
    // 🔗 VINCULAR PADRE CON ALUMNO
    // ===============================
    if (/^\d+$/.test(text)) {

      const id = text;

      const alumnoRes = await fetch(`${FIREBASE}/alumnos/${id}.json`);
      const alumno = await alumnoRes.json();

      if (!alumno) {
        await enviar(chatId, "❌ Alumno no encontrado");
        return res.sendStatus(200);
      }

      // Guardar chat_id en alumno
      await fetch(`${FIREBASE}/alumnos/${id}.json`, {
        method: "PATCH",
        body: JSON.stringify({
          chat_id: chatId
        })
      });

      await enviar(chatId, `✅ Vinculado con ${alumno.nombre}`);

      return res.sendStatus(200);
    }

    // ===============================
    // 📊 CONSULTA ASISTENCIA
    // ===============================
    if (text.startsWith("ASISTENCIA")) {

      const partes = text.trim().split(/\s+/);
      const id = partes[1];

      if (!id) {
        await enviar(chatId, "⚠️ Usa: ASISTENCIA NUMERO DE CONTROL DE TU HIJO(A)");
        return res.sendStatus(200);
      }

      await enviar(chatId, `📋 Buscando alumno ${id}...`);

      const alumnoRes = await fetch(`${FIREBASE}/alumnos/${id}.json`);
      const alumno = await alumnoRes.json();

      if (!alumno) {
        await enviar(chatId, "❌ Alumno no encontrado");
        return res.sendStatus(200);
      }

      const fecha = new Date().toISOString().split("T")[0];

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
      return res.sendStatus(200);
    }

    // ===============================
    // 💬 DEFAULT
    // ===============================
    await enviar(chatId, "👋 Usa:\n/start\nESCRIBE LA PALABRA ASISTENCIA SEGUIDO DEL NUMERO DE CONTROL DE TU HIJO(A)");

    res.sendStatus(200);

  } catch (error) {
    console.error("❌ ERROR WEBHOOK:", error);
    res.sendStatus(200);
  }

});


// ===============================
// 📤 ENVIAR MENSAJE TELEGRAM
// ===============================
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


// ===============================
// 📢 NOTIFICACIONES DESDE WEB
// ===============================
app.post("/notificar", async (req, res) => {

  try {

   const { chat_id, nombre, tipo, hora, taller } = req.body;

    console.log("📩 Datos recibidos:", req.body);

    if (!chat_id) {
      console.log("❌ chat_id vacío");
      return res.sendStatus(400);
    }

    const mensaje = `
🎓 Congreso Escolar

👨‍🎓 ${nombre}

📍 Taller:
${taller}

✅ ${tipo.toUpperCase()}

⏰ ${hora}
`;

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

    res.sendStatus(200);

  } catch (error) {
    console.error("❌ ERROR NOTIFICAR:", error);
    res.sendStatus(500);
  }

});


// ===============================
// 💥 EVITAR CAÍDAS (IMPORTANTE)
// ===============================
process.on("uncaughtException", err => {
  console.error("💥 Error no controlado:", err);
});

process.on("unhandledRejection", err => {
  console.error("💥 Promesa no manejada:", err);
});


// ===============================
// 🌐 SERVIDOR
// ===============================
const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Servidor activo en puerto", PORT);
});