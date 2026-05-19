const express = require("express");
const fetch = require("node-fetch");

const app = express();

app.use(express.json());
app.use(express.static("public"));

// =====================================
// 🤖 TELEGRAM BOT
// =====================================

const TOKEN = "TU_TOKEN_AQUI";

const URL = `https://api.telegram.org/bot${TOKEN}`;

// =====================================
// 🔥 FIREBASE
// =====================================

const FIREBASE =
"https://controlasistencia-d236e-default-rtdb.firebaseio.com";

// =====================================
// ✅ RUTA PRINCIPAL
// =====================================

app.get("/", (req, res) => {

  res.send("✅ BOT ACTIVO");

});

// =====================================
// 🤖 WEBHOOK TELEGRAM
// =====================================

app.post("/webhook", async (req, res) => {

  try {

    console.log("🔥 WEBHOOK:", JSON.stringify(req.body));

    const msg = req.body.message;

    if (!msg) {
      return res.sendStatus(200);
    }

    const chatId = msg.chat.id;

    const text = msg.text
      ? msg.text.trim().toUpperCase()
      : "";

    // =====================================
    // /START
    // =====================================

    if (text === "/START") {

      await enviar(
        chatId,
        `👋 Bienvenido al sistema de asistencia
        
📲 Envía el número de control del alumno para vincular las notificaciones.

Ejemplo:
23318050270088`
      );

      return res.sendStatus(200);
    }

    // =====================================
    // 🔗 VINCULACIÓN AUTOMÁTICA
    // =====================================

    if (/^\d+$/.test(text)) {

      const id = text;

      // 🔥 BUSCAR ALUMNO
      const alumnoRes = await fetch(
        `${FIREBASE}/alumnos/${id}.json`
      );

      const alumno = await alumnoRes.json();

      // ❌ NO EXISTE
      if (!alumno) {

        await enviar(
          chatId,
          "❌ Alumno no encontrado"
        );

        return res.sendStatus(200);
      }

      // =====================================
      // 🔥 OBTENER TELÉFONO ACTUAL
      // =====================================

      const telefonoActual =
        alumno.chat_id || "";

      // =====================================
      // 🔥 GUARDAR NUEVO CHAT_ID
      // =====================================

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
        `✅ Vinculado ${id} -> ${chatId}`
      );

      await enviar(
        chatId,
        `✅ Vinculación exitosa

👨‍🎓 ${alumno.nombre}

🔔 Ahora recibirás notificaciones automáticas de entrada y salida.`
      );

      return res.sendStatus(200);
    }

   // =====================================
// 📋 CONSULTA DE ASISTENCIA
// =====================================

if (text.startsWith("ASISTENCIA")) {

  try {

    const partes = text.split(" ");

    const id = partes[1];

    if (!id) {

      await enviar(
        chatId,
        "⚠️ Usa:\nASISTENCIA 23318050270088"
      );

      return res.sendStatus(200);
    }

    // 🔥 BUSCAR ALUMNO
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

    // 🔥 LEER TODO CONGRESO
    const congresosRes = await fetch(
      `${FIREBASE}/congreso.json`
    );

    const congresos = await congresosRes.json();

    let mensaje =
`🎓 CONGRESO ESCOLAR

👨‍🎓 ${alumno.nombre}

📅 ${fecha}

`;

    let encontrados = 0;

    if (congresos) {

      for (const taller in congresos) {

        const registrosAlumno =
          congresos?.[taller]?.[fecha]?.[id];

        if (registrosAlumno) {

          Object.values(registrosAlumno)
          .forEach(r => {

            encontrados++;

            mensaje +=
`📍 ${r.taller}
${r.tipo.toUpperCase()}
⏰ ${r.hora}

`;

          });

        }

      }

    }

    if (encontrados === 0) {

      mensaje += "❌ Sin registros hoy";
    }

    await enviar(chatId, mensaje);

    return res.sendStatus(200);

  } catch (err) {

    console.error("❌ ERROR ASISTENCIA:", err);

    await enviar(
      chatId,
      "❌ Error consultando asistencia"
    );

    return res.sendStatus(200);
  }

}
      // =====================================
      // 🔥 BUSCAR REGISTROS
      // =====================================

      const regRes = await fetch(
        `${FIREBASE}/congreso.json`
      );

      const data = await regRes.json();

      let respuesta =
`🎓 CONGRESO ESCOLAR

👨‍🎓 ${alumno.nombre}

📅 ${fecha}

`;

      let encontrados = 0;

      if (data) {

        Object.keys(data).forEach(taller => {

          if (
            data[taller] &&
            data[taller][fecha] &&
            data[taller][fecha][id]
          ) {

            const registros =
              data[taller][fecha][id];

            Object.values(registros)
            .forEach(r => {

              encontrados++;

              respuesta +=
`📍 ${r.taller}
${r.tipo.toUpperCase()} - ${r.hora}

`;

            });

          }

        });

      }

      if (encontrados === 0) {

        respuesta +=
        "❌ Sin registros hoy";
      }

      await enviar(chatId, respuesta);

      return res.sendStatus(200);
    }

    // =====================================
    // 💬 MENSAJE DEFAULT
    // =====================================

    await enviar(
      chatId,
`👋 Comandos disponibles:

📲 Vincular:
23318050270088

📋 Consultar:
ASISTENCIA 23318050270088`
    );

    res.sendStatus(200);

  } catch (error) {

    console.error(
      "❌ ERROR WEBHOOK:",
      error
    );

    res.sendStatus(200);
  }

});

// =====================================
// 📢 NOTIFICACIONES
// =====================================

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
      "📩 NOTIFICAR:",
      req.body
    );

    // ❌ NO HAY CHAT ID
    if (!chat_id) {

      console.log("❌ chat_id vacío");

      return res.sendStatus(400);
    }

    // =====================================
    // 🔥 MENSAJE
    // =====================================

    const mensaje =

`🎓 CONGRESO ESCOLAR

👨‍🎓 ${nombre}

📍 Taller:
${taller}

${tipo === "entrada" ? "✅ ENTRADA" : "👋 SALIDA"}

⏰ ${hora}`;

    // =====================================
    // 🔥 ENVIAR A TELEGRAM
    // =====================================

    const telegram = await fetch(
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

    const data = await telegram.json();

    console.log("📨 TELEGRAM:", data);

    res.sendStatus(200);

  } catch (error) {

    console.error(
      "❌ ERROR NOTIFICAR:",
      error
    );

    res.sendStatus(500);
  }

});

// =====================================
// 📤 FUNCIÓN ENVIAR
// =====================================

async function enviar(chatId, texto) {

  try {

    await fetch(
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

  } catch (error) {

    console.error(
      "❌ ERROR ENVIAR:",
      error
    );
  }

}

// =====================================
// 💥 EVITAR CAÍDAS
// =====================================

process.on(
  "uncaughtException",
  err => {

    console.error(
      "💥 uncaughtException:",
      err
    );

  }
);

process.on(
  "unhandledRejection",
  err => {

    console.error(
      "💥 unhandledRejection:",
      err
    );

  }
);

// =====================================
// 🚀 SERVIDOR
// =====================================

const PORT = process.env.PORT || 8080;

app.listen(PORT, "0.0.0.0", () => {

  console.log(
    "🚀 Servidor activo en puerto",
    PORT
  );

});