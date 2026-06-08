import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`[${req.method}] Petición recibida en analyze-face (Sistema Anti-Fallos)`);

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error("No se encontró GEMINI_API_KEY en los Secrets.");
    }

    const base64Data = body.imageBase64.replace(/^data:image\/\w+;base64,/, "");

    console.log("Consultando lista de modelos activos en la API...");
    const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
    const listData = await listResponse.json();

    if (listData.error) throw new Error(`Error al listar modelos: ${listData.error.message}`);

    const validModels = listData.models
      .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent") && m.name.includes("gemini"))
      .map((m: any) => m.name.replace("models/", ""));

    const selectedModelName = validModels.find((m: string) => m.includes("flash")) || validModels[0];
    console.log(`✅ Modelo asignado dinámicamente: ${selectedModelName}`);

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: selectedModelName });

    let textResponse = "";
    const maxIntentos = 3;

    // PATRÓN DE REINTENTOS: Si Gemini da error 503, lo intenta de nuevo automáticamente
    for (let intento = 1; intento <= maxIntentos; intento++) {
      try {
        console.log(`Intento ${intento} de enviar imagen a ${selectedModelName}...`);
        const result = await model.generateContent([
          "Eres un estilista experto. Analiza este rostro y devuelve UNICAMENTE un JSON válido con esta estructura exacta: {\"shape\": \"tipo de rostro\", \"recommendations\": [\"Corte 1\", \"Corte 2\", \"Corte 3\"]}. No incluyas markdown, explicaciones, ni texto adicional.",
          {
            inlineData: {
              data: base64Data,
              mimeType: "image/jpeg"
            }
          }
        ]);
        
        textResponse = result.response.text();
        console.log("¡Análisis de Gemini exitoso!");
        break; // Rompe el bucle si tuvo éxito
        
      } catch (err) {
        console.error(`Fallo en el intento ${intento}:`, err.message);
        if (intento === maxIntentos) {
          throw new Error("Los servidores de Google están experimentando alta demanda. Por favor, intenta de nuevo en unos segundos.");
        }
        console.log("Esperando 2 segundos antes del próximo intento...");
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    const cleanJson = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

    return new Response(cleanJson, { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("❌ ERROR CRÍTICO:", err.message);
    
    return new Response(JSON.stringify({ error: err.message }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400 
    });
  }
});