import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisResult, ContextAnswers, LinkedInProfile } from "@/lib/types";
import { compactList } from "@/lib/utils";

export const LINKEDIN_ANALYSIS_SYSTEM_PROMPT = `You are a LinkedIn profile optimization expert. Analyze the user's profile based on their stated goal, geography, seniority, industry, profile fields, and questionnaire answers.

Return a JSON object with:
- overallScore (1-100)
- categoryScores (headline, about, experience, skills, positioning - each 1-10)
- strengths (3-5 items: title, score 1-10, explanation)
- weaknesses (3-5 items: title, score 1-10, explanation)
- topFixes (3 items: title, current text, recommended text, why it matters, difficulty)
- secondaryFixes (2-3 items: same structure)

Writing rules:
- Always write directly to the user in second person: "you", "your", "you should".
- Never write about the user in third person. Do not say "the user should", "[Name] should", "their profile", or "Vansh should".
- Make every strength, weakness, and fix specific to the provided profile data and context answers. Mention the user's target role, industry, geography, timeline, challenges, companies, outcomes, network size, relocation preference, market benchmarks, or recent wins when relevant.
- Do not ask for or depend on the user's desired salary. When compensation or market positioning matters, infer expectations from the target role, seniority, geography, industry, and broadly available market benchmarks.
- If a profile field is missing or sparse, say exactly what is missing and what the user should add. Do not invent experience, skills, employers, metrics, or credentials.
- Avoid generic advice. Each recommendation must be grounded in at least one supplied field or explicitly call out a missing field.
- Recommended text should be ready to paste into a profile where possible.
- Be specific, honest, and actionable. Consider geography (India vs US), goal context (recruiting vs fundraising signals), seniority benchmarks, and industry norms.

Output ONLY valid JSON, no markdown or preamble.`;

const analysisTool = {
  name: "return_analysis",
  description: "Return the LinkedIn profile analysis as structured JSON.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["overallScore", "categoryScores", "strengths", "weaknesses", "topFixes", "secondaryFixes"],
    properties: {
      overallScore: { type: "integer", minimum: 1, maximum: 100 },
      categoryScores: {
        type: "object",
        additionalProperties: false,
        required: ["headline", "about", "experience", "skills", "positioning"],
        properties: {
          headline: { type: "integer", minimum: 1, maximum: 10 },
          about: { type: "integer", minimum: 1, maximum: 10 },
          experience: { type: "integer", minimum: 1, maximum: 10 },
          skills: { type: "integer", minimum: 1, maximum: 10 },
          positioning: { type: "integer", minimum: 1, maximum: 10 }
        }
      },
      strengths: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "score", "explanation"],
          properties: {
            title: { type: "string" },
            score: { type: "integer", minimum: 1, maximum: 10 },
            explanation: { type: "string" }
          }
        }
      },
      weaknesses: {
        type: "array",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["title", "score", "explanation"],
          properties: {
            title: { type: "string" },
            score: { type: "integer", minimum: 1, maximum: 10 },
            explanation: { type: "string" }
          }
        }
      },
      topFixes: { type: "array", minItems: 3, maxItems: 3, items: { $ref: "#/$defs/fix" } },
      secondaryFixes: { type: "array", minItems: 2, maxItems: 3, items: { $ref: "#/$defs/fix" } }
    },
    $defs: {
      fix: {
        type: "object",
        additionalProperties: false,
        required: ["title", "current", "recommended", "whyMatters", "difficulty"],
        properties: {
          title: { type: "string" },
          current: { type: "string" },
          recommended: { type: "string" },
          whyMatters: { type: "string" },
          difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] }
        }
      }
    }
  }
} as const;

export function buildAnalysisUserMessage(profile: LinkedInProfile, context: ContextAnswers) {
  return `Profile Data:
- Name: ${profile.name}
- Headline: ${profile.headline || "Not provided"}
- About: ${profile.about || "Not provided"}
- Experience: ${compactList(profile.experience)}
- Skills: ${compactList(profile.skills)}
- Education: ${compactList(profile.education)}
- Imported Profile Text: ${profile.rawProfileText ? profile.rawProfileText.slice(0, 8000) : "Not provided"}
- Import Source: ${profile.importSource || "oauth"}

Context:
- Goal: ${context.goal || "Not specified"}
- Seniority: ${context.seniority || "Not specified"}
- Industry: ${context.industry || "Not specified"}
- Target Role: ${context.targetRole || "Not specified"}
- Geography: ${context.geography || "Not specified"}
- City: ${context.city || "Not specified"}
- Timeline: ${context.timeline || "Not specified"}
- Challenges: ${compactList(context.challenges)}
- Target Companies: ${context.targetCompanies || "Not specified"}
- Ideal Outcome: ${context.outcome || "Not specified"}
- Network Size: ${context.networkSize || "Not specified"}
- Open To Relocation: ${context.relocation === null ? "Not specified" : context.relocation ? "Yes" : "No"}
- Market Benchmarking: Use the target role, seniority, geography, industry, and broadly available market benchmarks. Do not use or ask for desired salary.
- Recent Wins: ${context.wins || "Not specified"}

Important output style:
- Address the reader as "you" and "your" in every explanation and recommendation.
- Do not refer to ${profile.name} in third person.
- Personalize the analysis using the profile data and context above.`;
}

export function fallbackAnalysis(profile: LinkedInProfile, context: ContextAnswers): AnalysisResult {
  const role = context.targetRole || "your target role";
  const goal = context.goal || "your goal";

  return {
    overallScore: 72,
    categoryScores: {
      headline: profile.headline ? 7 : 4,
      about: profile.about ? 7 : 4,
      experience: profile.experience?.length ? 7 : 5,
      skills: profile.skills?.length ? 7 : 5,
      positioning: 6
    },
    strengths: [
      {
        title: "Clear starting point",
        score: 7,
        explanation: `You have enough signal to begin positioning around ${goal.toLowerCase()}, especially if you sharpen your role narrative for ${role}.`
      },
      {
        title: "Context-aware targeting",
        score: 8,
        explanation: `Your answers make the intended audience more specific, which helps tune headline, about, and experience sections for ${role}.`
      },
      {
        title: "Readable professional baseline",
        score: 7,
        explanation: "You can upgrade your current profile quickly by adding sharper proof points and more audience-specific keywords."
      }
    ],
    weaknesses: [
      {
        title: "Headline needs stronger positioning",
        score: profile.headline ? 5 : 3,
        explanation: "Your headline should state who you help, what you do, and the proof or niche that makes you credible."
      },
      {
        title: "Missing measurable proof",
        score: 5,
        explanation: "Recruiters, hiring teams, and investors scan for outcomes. Add metrics, scope, and named domains wherever possible."
      },
      {
        title: "Audience fit can be tighter",
        score: 6,
        explanation: `Your profile should speak directly to ${context.geography || "your market"} expectations and ${context.seniority || "your"} seniority benchmarks.`
      }
    ],
    topFixes: [
      {
        title: "Rewrite the headline",
        current: profile.headline || "No headline provided",
        recommended: `${role} | ${context.industry || "Industry"} | Helping teams create measurable business outcomes`,
        whyMatters: "The headline is the highest-visibility conversion surface on LinkedIn search, comments, and profile visits.",
        difficulty: "Easy"
      },
      {
        title: "Add a proof-led About opener",
        current: profile.about || "No About section provided",
        recommended: `I help ${context.industry || "teams"} solve high-value problems as a ${role}, with a focus on measurable outcomes, clear execution, and market-aware positioning.`,
        whyMatters: "The first two lines decide whether a visitor expands the section or leaves.",
        difficulty: "Medium"
      },
      {
        title: "Turn experience into outcomes",
        current: "Experience reads like responsibilities.",
        recommended: "Use bullets that combine action, scale, metric, and business result.",
        whyMatters: "Outcome bullets make seniority and impact obvious without asking the reader to infer it.",
        difficulty: "Medium"
      }
    ],
    secondaryFixes: [
      {
        title: "Reorder skills for search intent",
        current: compactList(profile.skills),
        recommended: `Prioritize skills tied to ${role}, ${context.industry || "your target industry"}, and ${goal}.`,
        whyMatters: "Skill ordering influences profile scanning and keyword matching.",
        difficulty: "Easy"
      },
      {
        title: "Add credibility markers",
        current: "Credibility signals are not prominent enough.",
        recommended: "Surface awards, shipped projects, publications, funding, revenue, hiring scale, or logos where relevant.",
        whyMatters: "Specific credibility markers reduce trust friction for new visitors.",
        difficulty: "Easy"
      }
    ]
  };
}

function parseClaudeJson(text: string): AnalysisResult {
  const trimmed = text.trim();
  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Claude response did not contain a JSON object");
  }

  return JSON.parse(unfenced.slice(start, end + 1)) as AnalysisResult;
}

export async function analyzeLinkedInProfile(profile: LinkedInProfile, context: ContextAnswers): Promise<AnalysisResult> {
  if (!process.env.CLAUDE_API_KEY) {
    return fallbackAnalysis(profile, context);
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
      max_tokens: 2000,
      system: LINKEDIN_ANALYSIS_SYSTEM_PROMPT,
      tools: [analysisTool],
      tool_choice: { type: "tool", name: "return_analysis" },
      messages: [{ role: "user", content: buildAnalysisUserMessage(profile, context) }]
    });

    const toolBlock = response.content.find((block) => block.type === "tool_use" && block.name === "return_analysis");
    if (toolBlock && toolBlock.type === "tool_use") {
      return toolBlock.input as AnalysisResult;
    }

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return fallbackAnalysis(profile, context);
    }

    return parseClaudeJson(textBlock.text);
  } catch (error) {
    console.error("Claude analysis failed", error);
    return fallbackAnalysis(profile, context);
  }
}
