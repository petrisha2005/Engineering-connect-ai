import type { Types } from "mongoose";
import { gemini } from "../config/gemini.js";
import { Message } from "../models/Message.js";
import { ModerationLog } from "../models/ModerationLog.js";

export interface ModerationResult {
  isAllowed: boolean;
  category: "safe" | "spam" | "harassment" | "abusive" | "promotional" | "suspicious_link" | "unprofessional" | "rate_limit" | "restricted";
  severity: "low" | "medium" | "high";
  reason: string;
  suggestedRewrite?: string;
  action: "allowed" | "warned" | "blocked" | "restricted";
}

const BANNED_WORDS = ["idiot", "stupid", "dumb", "hate you", "shut up", "kill yourself"];
const SPAM_PHRASES = ["earn money fast", "click this link", "free money", "send otp", "password", "investment guaranteed", "limited offer", "buy now"];
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
  const symbols = text.match(/[^\w\s.,!?@:/-]/gu) ?? [];
  return symbols.length / text.length;
}

function professionalRewrite(text: string) {
  if (/code|send/i.test(text)) return "Hi, could you please share the code when you get time? It would help me with the project.";
  if (/hi\s+hi/i.test(text)) return "Hi, I would like to connect and discuss our engineering interests.";
  return "Hi, I would like to discuss this professionally. Could we continue the conversation with more context?";
}

async function ruleBasedModeration(text: string, senderId: Types.ObjectId): Promise<ModerationResult | null> {
  const normalized = text.toLowerCase();
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60_000);
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60_000);
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60_000);

  const recentBlocked = await ModerationLog.countDocuments({ userId: senderId, action: { $in: ["blocked", "restricted"] }, createdAt: { $gte: tenMinutesAgo } });
  if (recentBlocked >= 3) {
    return {
      isAllowed: false,
      category: "restricted",
      severity: "high",
      action: "restricted",
      reason: "Your messaging has been temporarily restricted due to repeated spam-like messages.",
      suggestedRewrite: "Please wait before sending more messages and keep future messages specific and professional."
    };
  }

  const recentCount = await Message.countDocuments({ senderId, createdAt: { $gte: oneMinuteAgo } });
  if (recentCount >= 10) {
    return { isAllowed: false, category: "rate_limit", severity: "high", action: "blocked", reason: "Too many messages sent in a short time.", suggestedRewrite: "Please slow down and send one thoughtful message at a time." };
  }

  const duplicateCount = await Message.countDocuments({ senderId, text, createdAt: { $gte: fiveMinutesAgo } });
  if (duplicateCount >= 3) {
    return { isAllowed: false, category: "spam", severity: "high", action: "blocked", reason: "Repeated message detected.", suggestedRewrite: "Please write a more specific and professional message." };
  }

  const links = countLinks(text);
  if (links.length > 3) {
    return { isAllowed: false, category: "spam", severity: "high", action: "blocked", reason: "This message contains too many links.", suggestedRewrite: "Share one relevant link and explain why it is useful." };
  }

  if (links.some((link) => SUSPICIOUS_DOMAINS.some((domain) => link.toLowerCase().includes(domain)))) {
    return { isAllowed: false, category: "suspicious_link", severity: "high", action: "blocked", reason: "Suspicious link detected.", suggestedRewrite: "Please remove shortened or suspicious links and explain the context clearly." };
  }

  if (uppercaseRatio(text) > 0.7) {
    return { isAllowed: false, category: "unprofessional", severity: "medium", action: "blocked", reason: "This message uses excessive capital letters.", suggestedRewrite: professionalRewrite(text) };
  }

  if (/(.)\1{7,}/.test(text)) {
    return { isAllowed: false, category: "unprofessional", severity: "medium", action: "blocked", reason: "This message contains repeated characters or symbols.", suggestedRewrite: professionalRewrite(text) };
  }

  if (emojiAndSymbolRatio(text) > 0.25) {
    return { isAllowed: false, category: "unprofessional", severity: "medium", action: "blocked", reason: "This message contains excessive emojis or symbols.", suggestedRewrite: professionalRewrite(text) };
  }

  if (BANNED_WORDS.some((word) => normalized.includes(word))) {
    return { isAllowed: false, category: "abusive", severity: "high", action: "blocked", reason: "Abusive or unsafe language detected.", suggestedRewrite: "Please rewrite your message respectfully and professionally." };
  }

  if (SPAM_PHRASES.some((phrase) => normalized.includes(phrase))) {
    return { isAllowed: false, category: "spam", severity: "high", action: "blocked", reason: "Promotional or suspicious spam phrase detected.", suggestedRewrite: "Please send a specific, relevant message about collaboration or learning." };
  }

  if (/(\+?\d[\d\s-]{8,}\d)/.test(text) || /[^\s@]+@[^\s@]+\.[^\s@]+/.test(text)) {
    return { isAllowed: false, category: "spam", severity: "medium", action: "blocked", reason: "Repeated contact details can look like spam.", suggestedRewrite: "Please first explain why you want to share contact details." };
  }

  if (/^(hi\s*){4,}$/i.test(text) || text.length < 2) {
    return { isAllowed: false, category: "unprofessional", severity: "low", action: "blocked", reason: "This message is too short or repetitive.", suggestedRewrite: professionalRewrite(text) };
  }

  return null;
}

async function geminiModeration(text: string): Promise<ModerationResult> {
  try {
    const model = gemini.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json", temperature: 0.1 } });
    const result = await model.generateContent(`
Classify this direct message for a professional engineering student networking platform.
Return only JSON:
{"isAllowed":true,"category":"safe","severity":"low","reason":"short reason","suggestedRewrite":""}
Categories: safe, spam, harassment, abusive, promotional, suspicious_link, unprofessional.
Message: ${JSON.stringify(text)}
`);
    const parsed = JSON.parse(result.response.text()) as Partial<ModerationResult>;
    const allowed = parsed.isAllowed !== false;
    return {
      isAllowed: allowed,
      category: parsed.category ?? "safe",
      severity: parsed.severity ?? "low",
      reason: parsed.reason ?? "Message passed moderation.",
      suggestedRewrite: parsed.suggestedRewrite || undefined,
      action: allowed ? "allowed" : "blocked"
    };
  } catch {
    return { isAllowed: true, category: "safe", severity: "low", reason: "Rule-based checks passed.", action: "allowed" };
  }
}

export async function moderateMessage(messageText: string, senderId: Types.ObjectId): Promise<ModerationResult> {
  const text = sanitizeMessageText(messageText);
  const ruleResult = await ruleBasedModeration(text, senderId);
  const result = ruleResult ?? (await geminiModeration(text));

  await ModerationLog.create({
    userId: senderId,
    messageTextPreview: preview(text),
    category: result.category,
    severity: result.severity,
    reason: result.reason,
    action: result.action
  });

  return result;
}
