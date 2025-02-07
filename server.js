import { GoogleAuth } from "google-auth-library";
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { GoogleAuth } = require("google-auth-library");
const dialogflow = require("@google-cloud/dialogflow");
const cors = require("cors");
const app = express();
const port = 3000;

// Habilitar CORS
app.use(cors());

// Configurar multer para recibir archivos de audio
const upload = multer({ dest: "uploads/" });

// Configurar credenciales de Google Cloud
const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

const auth = new GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

// Verificar que el directorio de uploads exista
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Enviar audio a Dialogflow
app.post("/send-audio", upload.single("audio"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const projectId = "riccos-cocina-pmcw"; // Reemplaza con tu ID de Dialogflow
    const sessionId = "123456";
    const sessionClient = new dialogflow.SessionsClient({ auth });
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

    // Leer el archivo de audio
    const audioData = fs.readFileSync(filePath);

    // Crear la solicitud para Dialogflow
    const request = {
      session: sessionPath,
      queryInput: {
        audioConfig: {
          audioEncoding: "AUDIO_ENCODING_LINEAR_16",
          sampleRateHertz: 16000,
          languageCode: "es-ES", // Ajusta según el idioma que usará Dialogflow
        },
      },
      inputAudio: audioData.toString("base64"),
    };

    
    
    // Enviar la solicitud a Dialogflow
    const [response] = await sessionClient.detectIntent(request);
    
    // Obtener la respuesta del intent
    const result = response.queryResult;
    console.log('---------------');
    console.log(result);
    console.log('---------------');

    res.json({ text: result.fulfillmentText });

    // Eliminar archivo temporal
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error("Error procesando audio:", error);
    res.status(500).json({ error: "Error procesando audio" });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
