const express = require("express");

const app = express();
app.use(express.json());

const TOKEN = "8761191809:AAG0Z_0wuLOdOevzGk9G8bz6BJh9e9NUL6w";
const URL = `https://api.telegram.org/bot${TOKEN}`;

const FIREBASE = "https://controlasistencia-d236e-default-rtdb.firebaseio.com";

app.post("/webhook", async (req, res) => {

 console.log("🔥 LLEGÓ MENSAJE:", JSON.stringify(req.body));

    const msg = req.body.message;
    if (!msg) return res.send();

    const chatId = msg.chat.id;
    const text = msg.text || "";

console.log("📩 TEXTO:", text);

    if (text.startsWith("ASISTENCIA")) {

        const id = text.split(" ")[1];

        const alumnoRes = await fetch(`${FIREBASE}/alumnos/${id}.json`);
        const alumno = await alumnoRes.json();

        if (!alumno) {
            enviar(chatId, "Alumno no encontrado");
            return res.send();
        }

        const fecha = new Date().toISOString().split('T')[0];

        const regRes = await fetch(`${FIREBASE}/registros/${id}/${fecha}.json`);
        const registros = await regRes.json();

        let respuesta = `Alumno: ${alumno.nombre}\n`;

        if (!registros) {
            respuesta += "Sin registros hoy";
        } else {
            Object.values(registros).forEach(r => {
                respuesta += `${r.tipo}: ${r.hora}\n`;
            });
        }

        enviar(chatId, respuesta);
    }

    res.send();
});

function enviar(chatId, texto) {
    fetch(`${URL}/sendMessage`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            chat_id: chatId,
            text: texto
        })
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => console.log("Bot corriendo"));