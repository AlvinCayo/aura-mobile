import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Importamos el codificador para transformar la imagen
import { encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`[${req.method}] Petición recibida en generate-haircut (Descarga Activa)`);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { cutName } = await req.json();
    console.log(`Generando imagen de referencia para el corte: ${cutName}`);
    
    const prompt = `A highly detailed photorealistic portrait of a latin person wearing a ${cutName} hairstyle, modern look, professional photography, masterpiece, 4k`;
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&nologo=true`;

    console.log("Descargando imagen desde el generador...");
    
    // 1. El servidor de Supabase descarga la imagen generada
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
        throw new Error("No se pudo descargar la imagen generada.");
    }

    // 2. Convertimos la imagen a un formato de bytes
    const arrayBuffer = await imageResponse.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // 3. Transformamos los bytes a Base64 puro
    const outputBase64 = encode(uint8Array);
    const resultUrl = `data:image/jpeg;base64,${outputBase64}`;

    console.log("¡Imagen convertida y enviada al celular con éxito!");

    // 4. Enviamos la imagen incrustada directamente al frontend
    return new Response(JSON.stringify({ success: true, resultUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("❌ ERROR CRÍTICO EN SIMULACIÓN:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    });
  }
});