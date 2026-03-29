import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { FIRData } from "../types";

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const SYSTEM_INSTRUCTION = `
You are "Raksha", a legal assistant for filing FIRs.
Goal: Proactively interview the user to fill the FIR form EXHAUSTIVELY. Every field in the FIRData schema must be addressed.

CONVERSATION FLOW:
1. Be professional, empathetic, and patient.
2. Ask for missing info ONE BY ONE. Do not ask multiple questions at once.
3. EXHAUSTIVE CHECKLIST (Order of interview):
   a. Incident Overview:
      - complaintContents (The main story)
   b. Incident Timing:
      - occurrenceDay
      - occurrenceDateFrom
      - occurrenceTimeFrom
      - occurrenceDateTo
      - occurrenceTimeTo
      - timePeriod
   c. Police Station Info:
      - district
      - ps (Police Station)
      - actsAndSections (Relevant laws)
   d. Incident Location:
      - placeAddress
      - placeAreaMandal
      - placeStreetVillage
      - placeCityDistrict
      - placeState
      - placePIN
      - placeDistanceDirection
      - beatNo
   e. Complainant Details:
      - complainantName
      - complainantFatherHusbandName
      - complainantDOB
      - complainantAge
      - complainantNationality
      - complainantCaste
      - complainantPassportNo
      - complainantOccupation
      - complainantMobile
      - complainantAddress
   f. Accused & Legal:
      - accusedDetails
      - delayReasons (Why is the report late?)
      - stolenProperties
      - totalValueStolen
      - inquestReport (U.D. Case No if any)
   g. Station Records:
      - infoReceivedAtPSDate
      - infoReceivedAtPSTime
      - gdEntryNo
      - gdDate
      - gdTime

4. VALIDATION:
   - Mobile: 10 digits.
   - Dates: YYYY-MM-DD or DD/MM/YYYY.
   - PIN: 6 digits.
5. EXTRACTION: Map EVERY piece of info to the correct field in 'extractedData'. If the user provides multiple details in one go, extract them all.
6. PERSISTENCE: If a field is missing, keep asking until you get a valid answer or the user explicitly says "skip" or "I don't know".
7. LANGUAGE: English, Hindi, Telugu. Respond in the user's language.
8. CONCISENESS: Keep your 'message' focused on the current question.

RESPONSE FORMAT (JSON ONLY):
{
  "message": "Your response to user",
  "extractedData": { ...mapped fields... },
  "missingFields": ["Field Label 1", "Field Label 2"],
  "nextStep": "Internal Field Name (e.g., complainantMobile)"
}
`;

export class AIError extends Error {
  constructor(public message: string, public type: 'API_ERROR' | 'PARSE_ERROR' | 'EMPTY_RESPONSE') {
    super(message);
    this.name = 'AIError';
  }
}

const DEFAULT_MODEL = "gemini-3-flash-preview";

async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Check if it's a 429 (Rate Limit) or 5xx (Server Error)
      const isRetryable = error?.status === 429 || (error?.status >= 500 && error?.status <= 599) || 
                         error?.message?.includes("429") || error?.message?.includes("quota");
      
      if (isRetryable && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.warn(`Gemini API retry ${i + 1}/${maxRetries} after ${Math.round(delay)}ms due to:`, error?.message || error);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function processChatMessage(
  history: { role: 'user' | 'model', parts: { text: string }[] }[],
  currentFIR: Partial<FIRData>
) {
  try {
    const response = await callWithRetry(() => ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: history,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION + `\nCURRENT FIR DATA: ${JSON.stringify(currentFIR)}`,
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING },
            extractedData: { 
              type: Type.OBJECT,
              properties: {
                district: { type: Type.STRING },
                ps: { type: Type.STRING },
                year: { type: Type.STRING },
                firNo: { type: Type.STRING },
                date: { type: Type.STRING },
                actsAndSections: { type: Type.STRING },
                occurrenceDay: { type: Type.STRING },
                occurrenceDateFrom: { type: Type.STRING },
                occurrenceTimeFrom: { type: Type.STRING },
                occurrenceDateTo: { type: Type.STRING },
                occurrenceTimeTo: { type: Type.STRING },
                timePeriod: { type: Type.STRING },
                infoReceivedAtPSDate: { type: Type.STRING },
                infoReceivedAtPSTime: { type: Type.STRING },
                gdEntryNo: { type: Type.STRING },
                gdDate: { type: Type.STRING },
                gdTime: { type: Type.STRING },
                typeOfInformation: { type: Type.STRING },
                placeDistanceDirection: { type: Type.STRING },
                beatNo: { type: Type.STRING },
                placeAddress: { type: Type.STRING },
                placeAreaMandal: { type: Type.STRING },
                placeStreetVillage: { type: Type.STRING },
                placeCityDistrict: { type: Type.STRING },
                placeState: { type: Type.STRING },
                placePIN: { type: Type.STRING },
                complainantName: { type: Type.STRING },
                complainantFatherHusbandName: { type: Type.STRING },
                complainantDOB: { type: Type.STRING },
                complainantAge: { type: Type.STRING },
                complainantNationality: { type: Type.STRING },
                complainantCaste: { type: Type.STRING },
                complainantPassportNo: { type: Type.STRING },
                complainantOccupation: { type: Type.STRING },
                complainantMobile: { type: Type.STRING },
                complainantAddress: { type: Type.STRING },
                accusedDetails: { type: Type.STRING },
                delayReasons: { type: Type.STRING },
                stolenProperties: { type: Type.STRING },
                totalValueStolen: { type: Type.STRING },
                inquestReport: { type: Type.STRING },
                complaintContents: { type: Type.STRING }
              }
            },
            missingFields: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            nextStep: { type: Type.STRING }
          },
          required: ["message"]
        }
      }
    }));

    const text = response.text;
    if (!text) throw new AIError("The AI returned an empty response. This might be due to a temporary glitch.", "EMPTY_RESPONSE");
    
    const cleanedText = text.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    
    try {
      return JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON Parse Error. Raw text:", text);
      throw new AIError("The AI's response was not in the expected format. Please try rephrasing your message.", "PARSE_ERROR");
    }
  } catch (error: any) {
    if (error instanceof AIError) throw error;
    
    console.error("Gemini API Error:", error);
    
    const isQuotaError = error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("quota");
    if (isQuotaError) {
      throw new AIError("I've reached my daily limit for legal processing. Please try again in a few minutes or contact support if the issue persists.", "API_ERROR");
    }
    
    throw new AIError("I'm having trouble connecting to my legal database. Please check your internet connection or try again in a moment.", "API_ERROR");
  }
}

export async function processOCR(base64Image: string) {
  try {
    const response = await callWithRetry(() => ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: [
        {
          parts: [
            { text: "Extract all relevant personal details from this ID card for an FIR form. Return as JSON." },
            { inlineData: { mimeType: "image/jpeg", data: base64Image } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            complainantName: { type: Type.STRING },
            complainantFatherHusbandName: { type: Type.STRING },
            complainantDOB: { type: Type.STRING },
            complainantAddress: { type: Type.STRING },
            complainantNationality: { type: Type.STRING }
          }
        }
      }
    }));
    
    const text = response.text;
    if (!text) throw new AIError("The AI couldn't read the ID card. Please try a clearer image.", "EMPTY_RESPONSE");
    
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new AIError("I had trouble parsing the information from the ID card. Please try again or enter the details manually.", "PARSE_ERROR");
    }
  } catch (error) {
    if (error instanceof AIError) throw error;
    console.error("OCR Error:", error);
    throw new AIError("I'm having trouble connecting to the document processing service. Please try again later.", "API_ERROR");
  }
}
