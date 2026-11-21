const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), override: true });

const { GoogleGenAI, Type } = require('@google/genai');

// Active models cascade in order of priority:
// 1. gemini-3.8-flash (Primary high-intelligence flash)
// 2. gemini-3.5-flash-lite (Ultra-fast resilient fallback)
// 3. gemini-3.7-flash (High capability flash fallback)
const CASCADE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.7-flash'
];

// Initialize Gemini client if API key is provided
const getGeminiClient = () => {
  const rawKey = process.env.GEMINI_API_KEY;
  if (!rawKey || rawKey.trim() === '' || rawKey === 'your_gemini_api_key_here') {
    return null;
  }
  const apiKey = rawKey.trim().replace(/^['"]|['"]$/g, '');
  return new GoogleGenAI({
    apiKey,
    httpOptions: { retryOptions: { attempts: 1 } }
  });
};

// Response schema for Civic Triage
const triageSchema = {
  type: Type.OBJECT,
  properties: {
    isVerifiedAuthentic: {
      type: Type.BOOLEAN,
      description: 'True if genuine civic issue, false if spam, selfie, meme, or non-civic image'
    },
    rejectionReason: {
      type: Type.STRING,
      description: 'Clear reason for rejection if isVerifiedAuthentic is false, otherwise empty string'
    },
    category: {
      type: Type.STRING,
      enum: ['Roads', 'Sanitation', 'Water', 'Electrical', 'Other'],
      description: 'Category of the civic problem'
    },
    severityScore: {
      type: Type.INTEGER,
      description: 'Severity score from 1 (minor issue) to 10 (critical danger or emergency)'
    },
    department: {
      type: Type.STRING,
      description: 'Specific municipal department in charge (e.g. Electricity Department / TANGEDCO, Public Health & Solid Waste Management, Roads Infrastructure, Water Supply & Sewerage Board)'
    },
    aiSummary: {
      type: Type.STRING,
      description: 'Crisp 1-2 sentence executive summary of the issue detected'
    },
    audioTranscript: {
      type: Type.STRING,
      description: 'Verbatim transcription or concise summary of the citizen audio note if provided, else empty string'
    }
  },
  required: [
    'isVerifiedAuthentic',
    'rejectionReason',
    'category',
    'severityScore',
    'department',
    'aiSummary',
    'audioTranscript'
  ]
};

// Response schema for Repair Audit (Before + After photos)
const repairAuditSchema = {
  type: Type.OBJECT,
  properties: {
    isResolved: {
      type: Type.BOOLEAN,
      description: 'True if the after photo visibly proves the civic issue in before photo was repaired or resolved, false if unresolved or incomplete'
    },
    confidence: {
      type: Type.INTEGER,
      description: 'Confidence percentage from 0 to 100'
    },
    qualityAssessment: {
      type: Type.STRING,
      enum: ['Excellent', 'Satisfactory', 'Rejected'],
      description: 'Overall quality rating of the repair work'
    },
    verificationNote: {
      type: Type.STRING,
      description: 'Technical visual inspection notes comparing the before and after state'
    }
  },
  required: ['isResolved', 'confidence', 'qualityAssessment', 'verificationNote']
};

/**
 * Safe JSON sanitizer that strips markdown code blocks and trims whitespace before JSON.parse
 */
const sanitizeAndParseJson = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty or non-string response received from Gemini.');
  }

  let cleaned = rawText.trim();
  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\r?\n?/, '').replace(/\r?\n?```\s*$/, '');
  }

  // Extract outermost JSON object if any leading/trailing text exists
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
};

/**
 * Clamp severity score strictly between 1 and 10
 */
const clampSeverity = (score) => {
  const num = Number(score);
  if (Number.isNaN(num)) return 5;
  return Math.min(10, Math.max(1, Math.round(num)));
};

/**
 * Clamp confidence score strictly between 0 and 100
 */
const clampConfidence = (score) => {
  const num = Number(score);
  if (Number.isNaN(num)) return 85;
  return Math.min(100, Math.max(0, Math.round(num)));
};

/**
 * Extract clean base64 string from Buffer, data URI, or raw string
 */
const extractBase64Data = (input) => {
  if (!input) return null;
  if (Buffer.isBuffer(input)) {
    return input.toString('base64');
  }
  if (typeof input === 'string') {
    if (input.startsWith('data:')) {
      const commaIdx = input.indexOf(',');
      return commaIdx !== -1 ? input.slice(commaIdx + 1) : input;
    }
    return input.trim();
  }
  return null;
};

/**
 * Helper to enforce maximum timeout per model attempt
 */
const callWithTimeout = (promise, ms, modelName) => {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`Request to model "${modelName}" timed out after ${ms}ms.`);
      err.status = 504;
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
};

/**
 * Multi-model cascade with smart retry:
 * Loops sequentially through active models: ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.7-flash"].
 * If a model throws 404 (not found/deprecated), 429 (rate limit), or 503 (overloaded),
 * logs the exact status and immediately retries the next model.
 * If ALL models fail, throws a structured HTTP 503 error to the controller.
 */
const executeWithCascade = async (ai, parts, schema, temperature = 0.2) => {
  const modelErrors = [];

  const modelsToTry = process.env.GEMINI_MODEL
    ? [process.env.GEMINI_MODEL, ...CASCADE_MODELS.filter((m) => m !== process.env.GEMINI_MODEL)]
    : CASCADE_MODELS;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini Cascade] Executing live inference with model: ${model} (attempt ${attempt})`);
        const response = await callWithTimeout(
          ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts }],
            config: {
              responseMimeType: 'application/json',
              responseSchema: schema,
              temperature
            }
          }),
          25000,
          model
        );

        if (response && response.text) {
          console.log(`[Gemini Cascade] Live inference succeeded on model: ${model}`);
          return { text: response.text, model };
        }
        throw new Error(`Model "${model}" returned an empty response.`);
      } catch (err) {
        const status = err.status || (err.error && err.error.code) || err.statusCode || 'UNKNOWN';
        const message = err.message || (err.error && err.error.message) || String(err);
        console.error(`[Gemini Cascade Notice] Model "${model}" attempt ${attempt} failed (HTTP ${status}): ${message}`);

        // If 503 (transient overload spike), wait 1200ms and retry the same model once
        if (Number(status) === 503 && attempt === 1) {
          console.log(`[Gemini Cascade] Transient 503 spike on "${model}", pausing 1200ms before retry...`);
          await new Promise((r) => setTimeout(r, 1200));
          continue;
        }

        modelErrors.push({ model, attempt, status, message });
        break; // try next model in cascade
      }
    }
  }

  // If ALL models fail, throw structured HTTP 503 error to controller (NEVER insert fake fallback records)
  const allFailedError = new Error(
    `All Gemini AI models in cascade [${modelsToTry.join(', ')}] failed or are temporarily unavailable.`
  );
  allFailedError.statusCode = 503;
  allFailedError.status = 503;
  allFailedError.code = 'AI_SERVICE_UNAVAILABLE';
  allFailedError.details = modelErrors;
  throw allFailedError;
};

/**
 * Triage civic grievance with unified multimodal prompt & strict schema enforcement
 */
const triageGrievance = async ({
  imageBuffer,
  imageMimeType = 'image/jpeg',
  audioBuffer = null,
  audioMimeType = 'audio/webm',
  userDescription = ''
}) => {
  const ai = getGeminiClient();

  if (!ai) {
    const error = new Error('GEMINI_API_KEY is not configured on the server. AI inference cannot proceed.');
    error.statusCode = 503;
    error.code = 'GEMINI_KEY_MISSING';
    throw error;
  }

  const promptText = `You are NagarPulse AI, an advanced civic grievance triage system for municipal authorities.
Analyze the provided civic issue report (which includes a photo, optional citizen audio transcript/note, and user description: "${userDescription || 'No text description provided'}").

Your tasks:
1. Determine if this is an authentic civic grievance (pothole, garbage dump, broken pipe, hanging live wire, open manhole, etc.) or spam/meme/selfie/unrelated file. Set isVerifiedAuthentic accordingly (true/false) and provide rejectionReason (empty string if authentic).
2. Classify into EXACTLY one category: Roads, Sanitation, Water, Electrical, Other.
3. Assign a severityScore between 1 (minor issue) and 10 (critical hazard / immediate public danger).
4. Assign the responsible municipal department.
5. Provide a crisp 1-2 sentence executive aiSummary of the civic hazard.
6. Provide audioTranscript (verbatim transcription or concise summary of citizen voice audio if audio is attached, otherwise empty string "").

Respond strictly in valid JSON matching the requested schema.`;

  const parts = [{ text: promptText }];

  // Pass uploaded image buffer (inlineData with exact mimeType)
  const imageBase64 = extractBase64Data(imageBuffer);
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: imageMimeType || 'image/jpeg',
        data: imageBase64
      }
    });
  }

  // Pass optional audio buffer (inlineData with exact mimeType)
  const audioBase64 = extractBase64Data(audioBuffer);
  if (audioBase64) {
    parts.push({
      inlineData: {
        mimeType: audioMimeType || 'audio/webm',
        data: audioBase64
      }
    });
  }

  // Run multi-model cascade with smart retry
  const { text, model } = await executeWithCascade(ai, parts, triageSchema);

  // Safe JSON sanitization and clamping
  const parsed = sanitizeAndParseJson(text);
  const clampedSeverity = clampSeverity(parsed.severityScore);

  return {
    isVerifiedAuthentic: parsed.isVerifiedAuthentic !== false,
    rejectionReason: parsed.rejectionReason || '',
    category: parsed.category || 'Other',
    severityScore: clampedSeverity,
    department: parsed.department || 'Municipal Grievance Cell',
    aiSummary: parsed.aiSummary || 'Civic grievance triaged by NagarPulse AI.',
    audioTranscript: parsed.audioTranscript || '',
    aiModelUsed: model,
    rationale: parsed.rejectionReason || parsed.aiSummary || `Model: ${model}`
  };
};

/**
 * Fetch image buffer from URL or base64 data URI
 */
const getImageBufferFromUrl = async (url) => {
  if (url.startsWith('data:')) {
    const commaIdx = url.indexOf(',');
    const base64Str = url.substring(commaIdx + 1);
    const mimeMatch = url.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64/);
    return {
      buffer: Buffer.from(base64Str, 'base64'),
      mimeType: mimeMatch ? mimeMatch[1] : 'image/jpeg'
    };
  }

  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const mimeType = response.headers.get('content-type') || 'image/jpeg';
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType
  };
};

/**
 * Repair Audit (Before + After photos) verification with Gemini Vision
 */
const verifyResolution = async ({
  beforeImageUrl,
  afterImageBuffer = null,
  afterImageUrl = null,
  afterMimeType = 'image/jpeg',
  category = '',
  issueDescription = ''
}) => {
  const ai = getGeminiClient();

  if (!ai) {
    const error = new Error('GEMINI_API_KEY is not configured on the server. AI verification cannot proceed.');
    error.statusCode = 503;
    error.code = 'GEMINI_KEY_MISSING';
    throw error;
  }

  const promptText = `You are NagarPulse AI Quality Audit Inspector.
You are inspecting a civic repair resolution ticket.
Issue Category: ${category || 'Civic Grievance'}
Original Issue: ${issueDescription || 'Civic infrastructure defect'}

You are provided with:
- IMAGE 1: "Before" photo showing the original reported civic hazard/defect (e.g., exposed low-hanging wire, road pothole, overflowing garbage, or water pipe leak).
- IMAGE 2: "After" photo submitted by municipal contractors / authorities to demonstrate completion of repairs and restoration of public safety at the site.

Visual Audit Guidelines:
1. Spatial Landmark Check: Verify matching background landmarks (utility poles, shopfronts, boundary walls, road geometry, trees, buildings) to confirm that IMAGE 2 is taken at the exact same physical site as IMAGE 1.
2. Hazard Elimination Check: Verify that the reported hazard in IMAGE 1 has been physically resolved or removed in IMAGE 2 (e.g. overhead wiring secured to utility poles, pothole filled and leveled with bitumen, garbage cleared and disinfected, water pipe leak sealed).
3. If BOTH landmarks match and the hazard has been eliminated:
   - Set isResolved: true
   - Assign confidence between 75 and 100
   - Set qualityAssessment to "Excellent" or "Satisfactory"
   - In verificationNote, document the verified landmarks and proof of work.
4. If IMAGE 2 is identical to IMAGE 1, or visibly shows the hazard still active, or shows an irrelevant non-civic scene without matching site landmarks:
   - Set isResolved: false
   - Assign confidence between 0 and 40
   - Set qualityAssessment to "Rejected"
   - In verificationNote, state the exact reason for audit rejection.

Respond strictly in valid JSON matching the schema.`;

  const parts = [{ text: promptText }];

  if (beforeImageUrl) {
    const beforeImg = await getImageBufferFromUrl(beforeImageUrl);
    parts.push({
      inlineData: {
        mimeType: beforeImg.mimeType,
        data: beforeImg.buffer.toString('base64')
      }
    });
  }

  if (afterImageBuffer) {
    const afterData = extractBase64Data(afterImageBuffer);
    if (afterData) {
      parts.push({
        inlineData: {
          mimeType: afterMimeType || 'image/jpeg',
          data: afterData
        }
      });
    }
  } else if (afterImageUrl) {
    const afterImg = await getImageBufferFromUrl(afterImageUrl);
    parts.push({
      inlineData: {
        mimeType: afterImg.mimeType,
        data: afterImg.buffer.toString('base64')
      }
    });
  }

  const { text, model } = await executeWithCascade(ai, parts, repairAuditSchema);
  const parsed = sanitizeAndParseJson(text);
  const clampedConfidence = clampConfidence(parsed.confidence);

  return {
    isResolved: Boolean(parsed.isResolved),
    confidence: clampedConfidence,
    qualityAssessment: parsed.qualityAssessment || 'Satisfactory',
    verificationNote: parsed.verificationNote || 'AI visual comparison completed.',
    aiModelUsed: model,
    // Backwards-compatibility aliases
    isRepairVerified: Boolean(parsed.isResolved),
    confidenceScore: clampedConfidence,
    verificationNotes: parsed.verificationNote || 'AI visual comparison completed.'
  };
};

module.exports = {
  triageGrievance,
  verifyResolution,
  CASCADE_MODELS,
  sanitizeAndParseJson,
  clampSeverity,
  clampConfidence
};
