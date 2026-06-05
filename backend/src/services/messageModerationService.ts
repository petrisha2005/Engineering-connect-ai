import type { Types } from "mongoose";
import { gemini } from "../config/gemini.js";
import { Message } from "../models/Message.js";
import { ModerationLog } from "../models/ModerationLog.js";

export interface ModerationResult {
  isAllowed: boolean;
  category: "safe" | "spam" | "harassment" | "abusive" | "sexual" | "promotional" | "suspicious_link" | "unprofessional" | "rate_limit" | "restricted";
  severity: "low" | "medium" | "high";
  reason: string;
  suggestedRewrite?: string;
  action: "allowed" | "warned" | "blocked" | "restricted";
  spamScore: number;
}

export const SPAM_WARN_THRESHOLD = 40;
export const SPAM_BLOCK_THRESHOLD = 70;

const SAFE_SHORT_MESSAGES = new Set(["hi", "hello", "okay", "ok", "thanks", "thank you", "sure", "yes", "no", "great", "sounds good"]);
const COLLABORATION_ALLOWLIST = [
  "collaborate",
  "collaboration",
  "project",
  "hackathon",
  "team",
  "connect",
  "discuss",
  "mentor",
  "help",
  "frontend",
  "backend",
  "ai",
  "ml",
  "roadmap"
];

const ABUSE_PHRASES = ["idiot", "stupid", "dumb", "hate you", "shut up", "kill yourself"];
const THREAT_PHRASES = ["i will hurt you", "i will kill", "beat you", "destroy you"];
const SEXUAL_PHRASES = ["send nudes", "nude photo", "sex chat", "sexual favor"];
const SCAM_PHRASES = ["send otp", "send me otp", "send password", "your password", "earn money fast", "free money", "guaranteed investment", "investment guaranteed"];
const PROMOTIONAL_PHRASES = ["limited offer", "buy now", "click this link now", "mass promotion"];
const SUSPICIOUS_DOMAINS = ["bit.ly", "tinyurl.com", "t.me", "telegram.me", "wa.me"];

function preview(text: string) {
  return text.slice(0, 240);
}

export function sanitizeMessageText(text: string) {
  return text.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
}

function countLinks(text: string) {
  return text.match(/https?:\/\/\S+|www\.\S+/gi) ?? [];
}

function uppercaseRatio(text: string) {
  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 8) return 0;
  const upper = letters.replace(/[^A-Z]/g, "");
  return upper.length / letters.length;
}

function emojiAndSymbolRatio(text: string) {
  if (!text.length) return 0;
  const symbols = text.match(/[^\w\s.,!?@:/#'()+-]/gu) ?? [];
  return symbols.length / text.length;
}

function containsAny(normalized: string, phrases: string[]) {
  return phrases.some((phrase) => normalized.includes(phrase));
}

function professionalRewrite(text: string) {
  if (/otp|password/i.test(text)) return "Please avoid asking for private credentials. Could we discuss the project requirements instead?";
  if (/link/i.test(text)) return "Hi, here is one relevant project link with context. Please review it when you have time.";
  if (text.length < 20) return "Hi, I would like to connect and discuss this project professionally.";
  return "Hi, I would like to discuss this professionally. Could we continue with more project context?";
}

function resultFromScore(score: number, category: ModerationResult["category"], reason: string, suggestedRewrite?: string): ModerationResult {
  if (score >= SPAM_BLOCK_THRESHOLD) {
    return { isAllowed: false, category, severity: "high", action: "blocked", reason, suggestedRewrite, spamScore: score };
  }

  if (score >= SPAM_WARN_THRESHOLD) {
    return { isAllowed: true, category, severity: "medium", action: "warned", reason, suggestedRewrite, spamScore: score };
  }

  return { isAllowed: true, category: "safe", severity: "low", action: "allowed", reason: "Normal professional collaboration message.", spamScore: score };
}

async function scoreMessage(text: string, senderId: Types.ObjectId) {
  const normalized = text.toLowerCase();
  const reasons: string[] = [];
  let score = 0;
  let category: ModerationResult["category"] = "safe";

  if (!text) {
    return { score: 100, category: "spam" as const, reasons: ["Message is empty."] };
  }

  if (SAFE_SHORT_MESSAGES.has(normalized)) {
    return { score: 0, category: "safe" as const, reasons: ["Safe short acknowledgement."] };
  }

  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60_000);
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60_000);
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60_000);

  const [recentBlocked, recentCount, duplicateCount] = await Promise.all([
    ModerationLog.countDocuments({ userId: senderId, action: { $in: ["blocked", "restricted"] }, createdAt: { $gte: tenMinutesAgo } }),
    Message.countDocuments({ senderId, createdAt: { $gte: oneMinuteAgo } }),
    Message.countDocuments({ senderId, text, createdAt: { $gte: fiveMinutesAgo } })
  ]);

  if (recentBlocked >= 3) {
    score += 70;
    category = "restricted";
    reasons.push("Temporary restriction after repeated blocked messages.");
  }

  if (recentCount >= 10) {
    score += 70;
    category = "rate_limit";
    reasons.push("More than 10 messages sent in 1 minute.");
  }

  if (duplicateCount >= 3) {
    score += 70;
    category = "spam";
    reasons.push("Same message sent more than 3 times in 5 minutes.");
  }

  const links = countLinks(text);
  if (links.length > 3) {
    score += 70;
    category = "suspicious_link";
    reasons.push("Message contains more than 3 links.");
  } else if (links.some((link) => SUSPICIOUS_DOMAINS.some((domain) => link.toLowerCase().includes(domain)))) {
    score += 40;
    category = "suspicious_link";
    reasons.push("Message contains a shortened or suspicious link.");
  }

  if (containsAny(normalized, SCAM_PHRASES)) {
    score += 80;
    category = "spam";
    reasons.push("Scam, OTP, password, or free-money phrase detected.");
  }

  if (containsAny(normalized, ABUSE_PHRASES)) {
    score += 80;
    category = "abusive";
    reasons.push("Abusive language detected.");
  }

  if (containsAny(normalized, THREAT_PHRASES)) {
    score += 90;
    category = "harassment";
    reasons.push("Threatening language detected.");
  }

  if (containsAny(normalized, SEXUAL_PHRASES)) {
    score += 90;
    category = "sexual";
    reasons.push("Sexually inappropriate content detected.");
  }

  if (containsAny(normalized, PROMOTIONAL_PHRASES)) {
    score += 40;
    category = "promotional";
    reasons.push("Promotional spam phrase detected.");
  }

  if (uppercaseRatio(text) > 0.7 && text.length > 30) {
    score += 20;
    category = category === "safe" ? "unprofessional" : category;
    reasons.push("Message uses mostly uppercase text.");
  }

  if (/(.)\1{7,}/.test(text)) {
    score += 15;
    category = category === "safe" ? "unprofessional" : category;
    reasons.push("Message contains excessive repeated characters.");
  }

  if (emojiAndSymbolRatio(text) > 0.35 && text.length > 20) {
    score += 15;
    category = category === "safe" ? "unprofessional" : category;
    reasons.push("Message contains excessive symbols.");
  }

  const hasCollaborationContext = COLLABORATION_ALLOWLIST.some((word) => normalized.includes(word));
  if (hasCollaborationContext && score < SPAM_BLOCK_THRESHOLD) {
    score = Math.max(0, score - 10);
    reasons.push("Contains normal student collaboration context.");
  }

  return { score, category, reasons };
}

async function ruleBasedModeration(text: string, senderId: Types.ObjectId): Promise<ModerationResult> {
  const { score, category, reasons } = await scoreMessage(text, senderId);
  return resultFromScore(score, category, reasons.join(" ") || "Message passed rule-based moderation.", score >= SPAM_WARN_THRESHOLD ? professionalRewrite(text) : undefined);
}

async function geminiModeration(text: string, ruleResult: ModerationResult): Promise<ModerationResult> {
  if (ruleResult.spamScore >= SPAM_WARN_THRESHOLD) {
    return ruleResult;
  }

  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json", temperature: 0.1 } });
    const result = await model.generateContent(`
You are moderating messages for a professional student networking platform.
Be balanced and avoid false positives.
Allow normal student collaboration, project discussion, hackathon discussion, greetings, and short acknowledgements.
Only block messages that are clearly spam, abusive, threatening, scam-like, sexually inappropriate, or unsafe.
If unsure, allow the message and optionally return a warning.

Do not block just because a message is short.
Do not block just because it contains words like project, collaborate, help, connect, team, GitHub, frontend, backend, AI, or hackathon.
Only block when confidence is high.

Return only JSON:
{"isAllowed":true,"category":"safe","severity":"low","reason":"Normal professional collaboration message.","suggestedRewrite":""}

Categories: safe, spam, harassment, abusive, sexual, promotional, suspicious_link, unprofessional.
Message: ${JSON.stringify(text)}
`);
    const parsed = JSON.parse(result.response.text()) as Partial<ModerationResult>;
    const category = parsed.category ?? "safe";
    const severity = parsed.severity ?? "low";
    const reason = parsed.reason ?? "Normal professional collaboration message.";

    if (parsed.isAllowed === false && severity === "high" && ["spam", "harassment", "abusive", "sexual", "suspicious_link"].includes(category)) {
      return {
        isAllowed: false,
        category,
        severity: "high",
        action: "blocked",
        reason,
        suggestedRewrite: parsed.suggestedRewrite || professionalRewrite(text),
        spamScore: SPAM_BLOCK_THRESHOLD
      };
    }

    if (parsed.isAllowed === false || severity === "medium") {
      return {
        isAllowed: true,
        category: category === "safe" ? "unprofessional" : category,
        severity: "medium",
        action: "warned",
        reason: reason || "Please keep messages professional.",
        suggestedRewrite: parsed.suggestedRewrite || undefined,
        spamScore: SPAM_WARN_THRESHOLD
      };
    }

    return ruleResult;
  } catch {
    return ruleResult;
  }
}

export async function moderateMessage(messageText: string, senderId: Types.ObjectId): Promise<ModerationResult> {
  const text = sanitizeMessageText(messageText);
  const ruleResult = await ruleBasedModeration(text, senderId);
  const result = await geminiModeration(text, ruleResult);

  await ModerationLog.create({
    userId: senderId,
    messageTextPreview: preview(text),
    spamScore: result.spamScore,
    category: result.category,
    severity: result.severity,
    reason: result.reason,
    action: result.action
  });

  return result;
}
