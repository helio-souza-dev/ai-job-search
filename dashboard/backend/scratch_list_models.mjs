import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key");
    return;
  }
  
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    
    // Just print the model names
    if (data.models) {
      data.models.forEach(m => console.log(m.name, " - ", m.supportedGenerationMethods));
    } else {
      console.log(data);
    }
  } catch (err) {
    console.error(err);
  }
}

run();
