import Anthropic from "@anthropic-ai/sdk";
import type { AnalysisResult, ContextAnswers, LinkedInProfile } from "@/lib/types";
import { compactList } from "@/lib/utils";
import { normalizeLinkedInProfile } from "@/lib/profile-normalize";

export const LINKEDIN_ANALYSIS_SYSTEM_PROMPT = `You are a LinkedIn profile optimization expert for job seekers and internship seekers only. Analyze the user's profile based on their target opportunity, geography, seniority, industry, profile fields, and questionnaire answers.

Scope rules:
Only optimize for full time job search and internship search.
Do not optimize for personal branding, fundraising, hiring, creator growth, investing, selling, or general networking.
If the user gives broad context, translate it into what a recruiter, hiring manager, internship coordinator, or applicant tracking system needs to see.
Every recommendation should help the user get interviews, internship conversations, referrals, recruiter replies, or stronger application conversion.

Return a JSON object with:
overallScore from 1 to 100
personalDiagnosis, one direct sentence that names the gap between what the profile currently signals and what the user is targeting
categoryScores for headline, about, experience, skills, and positioning, each from 1 to 10
strengths with 3 to 5 items, each with title, score from 1 to 10, profileEvidence, explanation, and whyThisMattersForYou
weaknesses with 3 to 5 items, each with title, score from 1 to 10, profileEvidence, explanation, and whyThisMattersForYou
topFixes with 3 items, each with title, profileEvidence, current text, recommended text, why it matters, difficulty, and scoreBump
secondaryFixes with exactly 3 items using the same structure
The topFixes must be based on the most important weaknesses. Every topFix must directly repair something that is not working in the profile.
The secondaryFixes must address lower priority issues or missing profile signals.
scoreBump is an integer from 1 to 15 representing the estimated improvement to the overall score if the user implements that fix. Headline and About fixes typically range 6 to 12. Experience fixes typically range 5 to 10. Skills and secondary fixes typically range 2 to 6.

Scoring rules:
The overallScore must be a weighted profile readiness score, not a general impression.
Use this 100 point rubric exactly:
Headline quality and search visibility, 15 points. Score whether the headline names the target role or role family, includes relevant keywords, signals credibility, and is clear within a fast recruiter scan.
About section positioning, 15 points. Score whether the About section gives a sharp job or internship pitch, connects the user to the target role, proves fit, and has a clear next step.
Experience proof and relevance, 25 points. Score whether experience entries show relevant work, business impact, quantified results, scope, tools, projects, and keywords tied to the target role.
Skills and keyword coverage, 15 points. Score whether skills match recruiter search terms, applicant tracking filters, job descriptions, tools, industry keywords, and target employer expectations.
Education and credential signal, 8 points. Score whether school, degree, coursework, certifications, awards, and academic proof support the target opportunity.
Target role alignment, 12 points. Score whether the profile as a whole clearly points toward the stated job or internship target instead of looking scattered.
Geography and market fit, 5 points. Score whether the profile fits the user's target market, city, country, location preference, work style preference, seniority, and timeline.
Credibility and social proof, 5 points. Score whether the profile has proof signals such as wins, strong employers, projects, network scale, recommendations, publications, leadership, or portfolio evidence.
Add these component scores mentally and set overallScore to the total. Do not default to 62, 52, 38, 34, 30, 70, or any other repeated score unless the weighted evidence genuinely lands there.
Use the full 1 to 100 range. A nearly empty or unverifiable profile should usually be below 35. A partially built student or early career profile should usually be 35 to 60. A good but improvable profile should usually be 61 to 78. A strong profile with clear proof, keywords, and alignment should usually be 79 to 90. Reserve 91 to 100 for exceptional profiles with obvious recruiter fit and strong proof across nearly every section.
Set categoryScores from the same rubric. Headline maps to headline quality. About maps to About section positioning. Experience maps to experience proof and relevance. Skills maps to skills and keyword coverage. Positioning maps mostly to target role alignment, geography and market fit, and credibility signals.
If a section is not returned by the profile import, do not automatically give it 1 out of 10. Score it based on all available evidence, and explain that the import did not return enough data to verify it.

Writing rules:
Always write directly to the user in second person: "you", "your", "you should".
Never write about the user in third person. Do not say "the user should", "[Name] should", "their profile", or "Vansh should".
Do not use dash punctuation in any written explanation, title, current text, recommended text, or why it matters. Avoid hyphens, en dashes, and em dashes. Use commas, periods, or separate sentences instead.
Make every strength, weakness, and fix specific to the provided profile data and context answers. Mention the user's target role, industry, geography, location preference, work style preference, target employers, outcomes, market benchmarks, or recent wins when relevant.
Start by identifying the gap between what the user wants and what their profile currently signals. Use their target role, seniority, industry, headline, About section, experience, skills, education, and imported profile text.
Every strength, weakness, and fix must reference at least one concrete detail from the supplied profile or context. Concrete details include exact headline phrases, current role, company, school, project, tool, skill, industry, target role, seniority, or imported profile text. If you cannot cite a concrete detail, rewrite the item until you can.
profileEvidence must quote or tightly summarize the exact profile or context detail that caused the item. Do not use generic evidence such as "your profile" or "your experience" by itself.
Weakness titles should name the personal mismatch where possible, for example "Your headline does not yet say Product Manager" or "Your experience needs analytics style outcomes". Avoid generic titles such as "Missing measurable proof" unless followed by concrete profile evidence.
For each topFix, use the related weakness as the source. Do not give a fix unless it clearly improves recruiter fit, internship fit, search visibility, proof of impact, or conversion to interviews.
Do not ask for or depend on the user's desired salary. When compensation or market positioning matters, infer expectations from the target role, seniority, geography, industry, and broadly available market benchmarks.
If a profile field is not returned by the profile import, do not claim that section is absent from the actual LinkedIn profile. Say the import did not return enough data to verify that section, then recommend what the user should verify or improve based on the evidence you do have.
Only say a section is blank, empty, or missing when the provided data explicitly proves it is blank.
Do not make weakness titles that start with No Headline, No About Section, No Experience Section, or No Skills Section unless the profile evidence explicitly proves that section is blank.
Do not assign a 1 out of 10 score solely because a URL import did not return a field.
Treat imported profile text as profile evidence. If headline, about, experience, education, or skills appear in the imported profile text, do not describe that section as missing.
Avoid generic advice. Each recommendation must be grounded in at least one supplied field or explicitly call out a missing field.
Recommended text should be ready to paste into a profile where possible.
Be specific, honest, and actionable. Consider geography, job market expectations, internship market expectations, seniority benchmarks, role keywords, proof of impact, and industry norms.

Output ONLY valid JSON, no markdown or preamble.`;

const analysisTool = {
  name: "return_analysis",
  description: "Return the LinkedIn profile analysis as structured JSON.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["overallScore", "personalDiagnosis", "categoryScores", "strengths", "weaknesses", "topFixes", "secondaryFixes"],
    properties: {
      overallScore: { type: "integer", minimum: 1, maximum: 100 },
      personalDiagnosis: { type: "string" },
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
          required: ["title", "score", "profileEvidence", "explanation", "whyThisMattersForYou"],
          properties: {
            title: { type: "string" },
            score: { type: "integer", minimum: 1, maximum: 10 },
            profileEvidence: { type: "string" },
            explanation: { type: "string" },
            whyThisMattersForYou: { type: "string" }
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
          required: ["title", "score", "profileEvidence", "explanation", "whyThisMattersForYou"],
          properties: {
            title: { type: "string" },
            score: { type: "integer", minimum: 1, maximum: 10 },
            profileEvidence: { type: "string" },
            explanation: { type: "string" },
            whyThisMattersForYou: { type: "string" }
          }
        }
      },
      topFixes: { type: "array", minItems: 3, maxItems: 3, items: { $ref: "#/$defs/fix" } },
      secondaryFixes: { type: "array", minItems: 3, maxItems: 3, items: { $ref: "#/$defs/fix" } }
    },
    $defs: {
      fix: {
        type: "object",
        additionalProperties: false,
        required: ["title", "profileEvidence", "current", "recommended", "whyMatters", "difficulty", "scoreBump"],
        properties: {
          title: { type: "string" },
          profileEvidence: { type: "string" },
          current: { type: "string" },
          recommended: { type: "string" },
          whyMatters: { type: "string" },
          difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
          scoreBump: { type: "integer", minimum: 1, maximum: 15 }
        }
      }
    }
  }
} as const;

export function buildAnalysisUserMessage(profile: LinkedInProfile, context: ContextAnswers) {
  const hasHeadline = Boolean(profile.headline?.trim());
  const hasAbout = Boolean(profile.about?.trim());
  const hasExperience = Boolean(profile.experience?.length);
  const hasEducation = Boolean(profile.education?.length);
  const hasSkills = Boolean(profile.skills?.length);
  const isProfileImport = profile.importSource === "scrape";
  const unavailable = (label: string) =>
    isProfileImport ? `${label} was not returned by the profile import` : `${label} was not provided`;
  const textField = (value: string | undefined, label: string) => value?.trim() || unavailable(label);
  const listField = (values: string[] | undefined, label: string) =>
    values?.length ? compactList(values) : unavailable(label);
  const availability = (hasValue: boolean) =>
    hasValue ? "Available" : isProfileImport ? "Not returned by the profile import" : "Not provided";

  return `Profile Data:
Name: ${profile.name}
Profile URL: ${textField(profile.profileUrl, "Profile URL")}
Headline: ${textField(profile.headline, "Headline")}
About: ${textField(profile.about, "About")}
Experience: ${listField(profile.experience, "Experience")}
Skills: ${listField(profile.skills, "Skills")}
Education: ${listField(profile.education, "Education")}
Location: ${textField(profile.location, "Location")}
Country: ${textField(profile.country, "Country")}
Current Role: ${textField(profile.currentRole, "Current Role")}
Current Company: ${textField(profile.currentCompany, "Current Company")}
Profile Industry: ${textField(profile.industry, "Profile Industry")}
Imported Profile Text: ${profile.rawProfileText ? profile.rawProfileText.slice(0, 8000) : unavailable("Imported Profile Text")}
Import Source: ${profile.importSource || "oauth"}

Section availability:
Headline: ${availability(hasHeadline)}
About: ${availability(hasAbout)}
Experience: ${availability(hasExperience)}
Education: ${availability(hasEducation)}
Skills: ${availability(hasSkills)}

Context:
Opportunity Type: ${context.goal || "Job Search"}
Seniority: ${context.seniority || "Not specified"}
Industry: ${context.industry || "Not specified"}
Target Role: ${context.targetRole || "Not specified"}
Geography: ${context.geography || "Not specified"}
City: ${context.city || "Not specified"}
Timeline: ${context.timeline || "Not specified"}
Challenges: ${compactList(context.challenges)}
Target Employers: ${context.targetCompanies || "Not specified"}
Ideal Outcome: ${context.outcome || "Not specified"}
Network Size: ${context.networkSize || "Not specified"}
Open To Relocation: ${context.relocation === null ? "Not specified" : context.relocation ? "Yes" : "No"}
Work Style Preference: ${context.workPreference || "Not specified"}
Market Benchmarking: Use the target role, seniority, geography, industry, and broadly available market benchmarks. Do not use or ask for desired salary.
Recent Wins: ${context.wins || "Not specified"}

Important output style:
Address the reader as "you" and "your" in every explanation and recommendation.
Do not refer to ${profile.name} in third person.
Do not use dash punctuation in the returned copy.
Do not call any section missing when section availability says Available or Not returned by the profile import. If a present section is weak, critique the content quality instead of saying it does not exist. If the profile import did not return a section, say the import did not return enough data to verify it.
Personalize the analysis using the profile data and context above.`;
}

export function fallbackAnalysis(profile: LinkedInProfile, context: ContextAnswers): AnalysisResult {
  const role = context.targetRole || "your target role";
  const opportunity = context.goal || "Job Search";
  const audience = opportunity === "Internship Search" ? "internship recruiters and hiring teams" : "recruiters and hiring managers";
  const isProfileImport = profile.importSource === "scrape";
  const headlineCurrent = profile.headline || (isProfileImport ? "Headline was not returned by the profile import" : "No headline provided");
  const aboutCurrent = profile.about || (isProfileImport ? "About text was not returned by the profile import" : "No About section provided");

  return {
    overallScore: 72,
    personalDiagnosis: `Your profile has a usable professional baseline, but it needs to make your fit for ${role} in ${context.industry || "your target industry"} obvious from the headline, About opener, and proof bullets.`,
    categoryScores: {
      headline: profile.headline ? 7 : isProfileImport ? 5 : 4,
      about: profile.about ? 7 : isProfileImport ? 5 : 4,
      experience: profile.experience?.length ? 7 : isProfileImport ? 5 : 5,
      skills: profile.skills?.length ? 7 : isProfileImport ? 5 : 5,
      positioning: 6
    },
    strengths: [
      {
        title: "Clear starting point",
        score: 7,
        profileEvidence: `Target role is ${role}. Target opportunity type is ${opportunity}.`,
        explanation: `You have enough signal to begin positioning for ${opportunity.toLowerCase()}, especially if you sharpen your role narrative for ${role}.`,
        whyThisMattersForYou: `Because you are targeting ${role}, recruiters need the profile to make that direction obvious before they read every section.`
      },
      {
        title: "Role aware targeting",
        score: 8,
        profileEvidence: `You selected ${role} and ${context.seniority || "a target seniority"} seniority.`,
        explanation: `Your answers make your target role clearer, which helps tune your headline, about, and experience sections for ${audience}.`,
        whyThisMattersForYou: `This gives the analysis a clearer benchmark than a generic LinkedIn review.`
      },
      {
        title: "Readable professional baseline",
        score: 7,
        profileEvidence: profile.headline || profile.currentRole || profile.rawProfileText?.slice(0, 160) || "The imported profile provided enough evidence to evaluate a professional baseline.",
        explanation: "You can upgrade your current profile quickly by adding sharper proof points and more audience specific keywords.",
        whyThisMattersForYou: `Small changes can make your fit for ${role} much easier to scan.`
      }
    ],
    weaknesses: [
      {
        title: `Your headline needs to signal ${role}`,
        score: profile.headline ? 5 : isProfileImport ? 5 : 3,
        profileEvidence: headlineCurrent,
        explanation: profile.headline
          ? `Your headline should state the role you want, the domain you fit, and the proof that makes you credible for ${role}.`
          : `The profile import did not return a headline, so verify that your headline is public and make sure it states the role you want, the domain you fit, and the proof that makes you credible for ${role}.`,
        whyThisMattersForYou: "The headline is often the first field a recruiter sees in search results and profile previews."
      },
      {
        title: `Your experience needs ${role} style proof`,
        score: 5,
        profileEvidence: compactList(profile.experience) || profile.rawProfileText?.slice(0, 160) || "The imported profile did not return enough detailed experience proof.",
        explanation: "Recruiters and hiring teams scan for outcomes. Add metrics, scope, tools, projects, and named domains wherever possible.",
        whyThisMattersForYou: `For ${role}, proof of work matters more than broad responsibility statements.`
      },
      {
        title: `Your profile can speak more directly to ${context.industry || "your target industry"}`,
        score: 6,
        profileEvidence: `Target industry is ${context.industry || "not specified"}. Target seniority is ${context.seniority || "not specified"}.`,
        explanation: `Your profile should speak directly to ${context.geography || "your market"} expectations, ${context.seniority || "your"} seniority benchmarks, and the skills needed for ${role}.`,
        whyThisMattersForYou: "Recruiters compare you against people targeting the same function and level, not against every LinkedIn profile."
      }
    ],
    topFixes: [
      {
        title: "Rewrite the headline",
        profileEvidence: headlineCurrent,
        current: headlineCurrent,
        recommended: `${role} | ${context.industry || "Target industry"} | Projects, tools, and outcomes aligned to hiring needs`,
        whyMatters: "The headline is the highest visibility surface for recruiter search, profile visits, and referral checks.",
        difficulty: "Easy",
        scoreBump: 10
      },
      {
        title: "Add a proof led About opener",
        profileEvidence: aboutCurrent,
        current: aboutCurrent,
        recommended: `I am targeting ${role} opportunities in ${context.industry || "my target industry"}. I bring hands on experience with relevant projects, tools, and measurable outcomes that match what hiring teams screen for.`,
        whyMatters: "The first two lines decide whether a recruiter understands your fit before moving to experience.",
        difficulty: "Medium",
        scoreBump: 8
      },
      {
        title: "Turn experience into outcomes",
        profileEvidence: compactList(profile.experience) || profile.rawProfileText?.slice(0, 160) || "The imported profile did not return enough detailed experience proof.",
        current: "Experience reads like responsibilities.",
        recommended: "Use bullets that combine action, scale, metric, and business result.",
        whyMatters: "Outcome bullets make role fit and impact obvious without asking the recruiter to infer it.",
        difficulty: "Medium",
        scoreBump: 7
      }
    ],
    secondaryFixes: [
      {
        title: "Reorder skills for search intent",
        profileEvidence: compactList(profile.skills) || "The profile import did not return enough skills data to verify keyword coverage.",
        current: compactList(profile.skills),
        recommended: `Prioritize skills tied to ${role}, ${context.industry || "your target industry"}, and the job descriptions you want to match.`,
        whyMatters: "Skill ordering influences profile scanning, recruiter search, and keyword matching.",
        difficulty: "Easy",
        scoreBump: 4
      },
      {
        title: "Add credibility markers",
        profileEvidence: profile.rawProfileText?.slice(0, 160) || compactList(profile.education) || "The imported profile needs clearer proof signals.",
        current: "Credibility signals are not prominent enough.",
        recommended: "Surface awards, shipped projects, coursework, certifications, tools, business outcomes, or employer names where relevant.",
        whyMatters: "Specific credibility markers reduce trust friction for recruiters and referral partners.",
        difficulty: "Easy",
        scoreBump: 3
      },
      {
        title: "Strengthen education and credentials",
        profileEvidence: compactList(profile.education) || "The profile import did not return enough education or credential detail.",
        current: "Education section lacks specific proof points tied to the target role.",
        recommended: `Add relevant coursework, academic projects, certifications, or honors that align with ${role} expectations.`,
        whyMatters: "Education signals help recruiters validate your foundation, especially for early career and internship searches.",
        difficulty: "Easy",
        scoreBump: 3
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
  const preparedProfile = normalizeLinkedInProfile(profile) || profile;

  if (!process.env.CLAUDE_API_KEY) {
    return fallbackAnalysis(preparedProfile, context);
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY, timeout: 30_000 });
    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-6",
      max_tokens: 3200,
      system: LINKEDIN_ANALYSIS_SYSTEM_PROMPT,
      tools: [analysisTool],
      tool_choice: { type: "tool", name: "return_analysis" },
      messages: [{ role: "user", content: buildAnalysisUserMessage(preparedProfile, context) }]
    });

    const toolBlock = response.content.find((block) => block.type === "tool_use" && block.name === "return_analysis");
    if (toolBlock && toolBlock.type === "tool_use") {
      return toolBlock.input as AnalysisResult;
    }

    const textBlock = response.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return fallbackAnalysis(preparedProfile, context);
    }

    return parseClaudeJson(textBlock.text);
  } catch (error) {
    console.error("Claude analysis failed", error);
    return fallbackAnalysis(preparedProfile, context);
  }
}
