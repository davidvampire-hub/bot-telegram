const express = require("express");
const fetch = require("node-fetch");

const app = express();

app.use(express.json());
app.use(express.static("public"));

// ======================================
// 🔑 TELEGRAM
// ======================================

const TOKEN = "8761191809:AAG0Z_0wuLOdOevzGk9G8bz6BJh9e9NUL6w";

const URL = `https://api.telegram.org/bot${TOKEN}`;

// ======================================
// 🔥 FIREBASE
// ======================================

const FIREBASE =
"https://controlasistencia-d236e-default-rtdb.firebaseio.com";

// ======================================
// ✅ RUTA BASE
// ======================================

app.get("/", (req, res) => {

  res.send("OK FUNCIONANDO ✅");

});

// ======================================
// 🤖 WEBHOOK
// ======================================

app.post("/webhook", async (req, res) => {

  try {

    console.log(
      "📩 WEBHOOK:",
      JSON.stringify(req.body)
    );

    const msg = req.body.message;

    if (!msg) {
      return res.sendStatus(200);
    }

    const chatId = msg.chat.id;

    const text = msg.text
      ? msg.text.toUpperCase().trim()
      : "";

    // ======================================
    // 👋 START
    // ======================================

    if (text === "/START") {

      await enviar(
        chatId,
        "👋 Bienvenido(a)\n\nEnvía el número de control de tu hijo(a) para vincularte automáticamente."
      );

      return res.sendStatus(200);

    }

    // ======================================
    // 🔗 VINCULAR CHAT_ID
    // ======================================

    if (/^\d+$/.test(text)) {

      const id = text;

      const alumnoRes = await fetch(
        `${FIREBASE}/alumnos/${id}.json`
      );

      const alumno = await alumnoRes.json();

      if (!alumno) {

        await enviar(
          chatId,
          "❌ Alumno no encontrado"
        );

        return res.sendStatus(200);

      }

      // 🔥 GUARDAR CHAT_ID
      await fetch(
        `${FIREBASE}/alumnos/${id}.json`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            chat_id: chatId
          })
        }
      );

      console.log(
        "✅ CHAT_ID ACTUALIZADO:",
        id,
        chatId
      );

      await enviar(
        chatId,
        `✅ Vinculado con:\n👨‍🎓 ${alumno.nombre}`
      );

      return res.sendStatus(200);

    }

    // ======================================
    // 📋 CONSULTAR ASISTENCIA
    // ======================================

    if (text.startsWith("ASISTENCIA")) {

      const partes = text.split(" ");

      const id = partes[1];

      if (!id) {

        await enviar(
          chatId,
          "⚠️ Ejemplo:\nASISTENCIA 12345678900001\nEl número de control lo puedes encontrar al reverso de la credencial de tu hijo o en una boleta de calificaciones 😀",
        );

        return res.sendStatus(200);

      }

      const alumnoRes = await fetch(
        `${FIREBASE}/alumnos/${id}.json`
      );

      const alumno = await alumnoRes.json();

      if (!alumno) {

        await enviar(
          chatId,
          "❌ Alumno no encontrado"
        );

        return res.sendStatus(200);

      }

      const fecha =
        new Date()
        .toISOString()
        .split("T")[0];

      // ======================================
      // 🔥 LEER CONGRESO
      // ======================================

      const congresosRes = await fetch(
        `${FIREBASE}/congreso.json`
      );

      const congresos = await congresosRes.json();

      let respuesta =
`🎓 CONGRESO ESCOLAR

👨‍🎓 ${alumno.nombre}

📅 ${fecha}

`;

      let encontrados = 0;

      if (congresos) {

        for (const taller in congresos) {

          const registrosAlumno =
            congresos[taller] &&
            congresos[taller][fecha] &&
            congresos[taller][fecha][id];

          if (registrosAlumno) {

            Object.values(registrosAlumno)
            .forEach(r => {

              encontrados++;

              respuesta +=
`📍 ${r.taller}
${r.tipo.toUpperCase()}
⏰ ${r.hora}

`;

            });

          }

        }

      }

      if (encontrados === 0) {

        respuesta +=
          "❌ Sin registros hoy";

      }

      await enviar(chatId, respuesta);

      return res.sendStatus(200);

    }

    // ======================================
    // 💬 DEFAULT
    // ======================================

    await enviar(
      chatId,
`👋 COMANDOS DISPONIBLES

/start

ASISTENCIA NUMERO_CONTROL

Ejemplo:
ASISTENCIA 23318050270088`
    );

    return res.sendStatus(200);

  } catch (error) {

    console.error(
      "❌ ERROR WEBHOOK:",
      error
    );

    return res.sendStatus(200);

  }

});

// ======================================
// 📤 ENVIAR TELEGRAM
// ======================================

async function enviar(chatId, texto) {

  try {

    const resp = await fetch(
      `${URL}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: texto
        })
      }
    );

    const data = await resp.json();

    console.log("📨 TELEGRAM:", data);

  } catch (error) {

    console.error(
      "❌ ERROR TELEGRAM:",
      error
    );

  }

}

// ======================================
// 🔔 NOTIFICACIONES WEB
// ======================================

app.post("/notificar", async (req, res) => {

  try {

    const {
      chat_id,
      nombre,
      tipo,
      hora,
      taller
    } = req.body;

    console.log(
      "📩 NOTIFICACION:",
      req.body
    );

    if (!chat_id) {

      console.log("❌ chat_id vacío");

      return res.sendStatus(400);

    }

    const mensaje =
`🎓 Congreso Escolar

👨‍🎓 ${nombre}

📍 Taller:
${taller}

✅ ${tipo.toUpperCase()}

⏰ ${hora}`;

    const resp = await fetch(
      `${URL}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chat_id,
          text: mensaje
        })
      }
    );

    const data = await resp.json();

    console.log(
      "📨 RESPUESTA TELEGRAM:",
      data
    );

    res.sendStatus(200);

  } catch (error) {

    console.error(
      "❌ ERROR NOTIFICAR:",
      error
    );

    res.sendStatus(500);

  }

});

// ======================================
// 💥 ERRORES
// ======================================

process.on(
  "uncaughtException",
  err => {

    console.error(
      "💥 ERROR:",
      err
    );

  }
);

process.on(
  "unhandledRejection",
  err => {

    console.error(
      "💥 PROMESA:",
      err
    );

  }
);

// ======================================
// 🚀 SERVER
// ======================================

const PORT =
  process.env.PORT || 8080;

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      "🚀 SERVIDOR ACTIVO:",
      PORT
    );

  }
);