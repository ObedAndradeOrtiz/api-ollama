const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const axios = require("axios");
const app = express();
const PORT = 3000;
const cors = require('cors'); 
const OLLAMA_API = "http://localhost:11434/api/generate";
app.use(express.json());
const PREGUNTAS_FILE = "preguntas.json"; 
app.use(cors({
    origin: 'http://localhost:5173'  // Permite solicitudes desde React
  }));
function cargarPreguntas() {
    try {
        if (!fs.existsSync(PREGUNTAS_FILE)) {
            return { preguntas: [] }; 
        }
        const data = fs.readFileSync(PREGUNTAS_FILE, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Error al cargar las preguntas:", error);
        return { preguntas: [] }; 
    }
}

function guardarPreguntas(preguntasData) {
    try {
        fs.writeFileSync(PREGUNTAS_FILE, JSON.stringify(preguntasData, null, 2), "utf-8");
    } catch (error) {
        console.error("Error al guardar las preguntas:", error);
    }
}

let preguntasData = cargarPreguntas();

app.post("/entrenar", (req, res) => {
    try {
        const { pregunta, respuesta } = req.body;
        if (!pregunta?.trim() || !respuesta?.trim()) {
            return res.status(400).json({ error: "La pregunta y la respuesta son obligatorias" });
        }
        if (!preguntasData.preguntas) {
            preguntasData.preguntas = [];
        }
        const existe = preguntasData.preguntas.some(p => p.pregunta.toLowerCase() === pregunta.toLowerCase());
        if (existe) {
            return res.status(409).json({ error: "Esta pregunta ya está registrada" });
        }
        preguntasData.preguntas.push({ pregunta: pregunta.trim(), respuesta: respuesta.trim() });
        guardarPreguntas(preguntasData);
        return res.status(201).json({ mensaje: "Pregunta guardada correctamente" });
    } catch (error) {
        console.error("Error al guardar la pregunta:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

const CONTEXTO = `
Eres un asistente de pedidos para el restaurante King. Tu trabajo es atender a los clientes amablemente, como si fueras un mesero virtual. 
Tu rol es:
- Saludar según la hora (buenos días, buenas tardes, buenas noches).
- Preguntar qué desea ordenar.
- Si pide un plato como "pollo", ofrecer una bebida.
- Si acepta, preguntar qué tamaño de bebida desea (pequeña, mediana, grande).
- Ofrecer algo adicional, como postre o promociones.
- Si el cliente pregunta por promociones, dile que hay una promoción de "dos pollos con dos gaseosas pequeñas y un postre".
- Responde solo sobre saludos, menú, promociones y pedidos. No respondas temas fuera del restaurante.
El horario de atención es de 18:00 a 23:00.
`;

app.post("/preguntar", async (req, res) => {
    const { cliente_id, pregunta } = req.body;
    if (!cliente_id || !pregunta) {
        return res.status(400).json({ error: "Faltan datos" });
    }

    const contextoCompleto = CONTEXTO + "\n\n" + preguntasData.preguntas
        .map(p => `Pregunta: ${p.pregunta}\nRespuesta: ${p.respuesta}`)
        .join("\n\n");

    const promptFinal = `
Contexto del restaurante:
${contextoCompleto}

Cliente dice: ${pregunta}

Responde como si fueras el mesero del restaurante.
`;

    try {
        const response = await axios.post(OLLAMA_API, {
            model: "mistral",
            prompt: promptFinal,
            stream: false
        });

        if (response.data.response) {
            res.json({ respuesta: response.data.response });
        } else {
            console.error("Respuesta inesperada de Ollama:", response.data);
            res.status(500).json({ error: "No se pudo obtener una respuesta válida" });
        }
    } catch (error) {
        console.error("Error al conectar con Ollama:", error);
        res.status(500).json({ error: "Error procesando la solicitud" });
    }
});


app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
