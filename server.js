const express = require("express");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

const TOKEN = "TU_TOKEN";
const URL = `https://api.telegram.org/bot${TOKEN}`;

const FIREBASE = "https://controlasistencia-d236e-default-rtdb.firebaseio.com";

app.post("/webhook", async (req, res) => {

    const msg = req.body.message;
    if (!msg) return res.send();

    const chatId = msg.chat.id;
    const text = msg.text;

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

app.listen(3000, () => console.log("Bot corriendo"));