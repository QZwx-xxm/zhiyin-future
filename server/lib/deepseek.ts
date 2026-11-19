import type { JobMatchResult, ResumeAnalysis, ResumeImportAdvice } from "../../src/types.ts";

const apiKey = process.env.DEEPSEEK_API_KEY;
const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

function canUseDeepSeek() {
  return Boolean(apiKey);
}

async function callDeepSeek(system: string, user: string) {
  if (!canUseDeepSeek()) {
    return null;
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek 请求失败: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("DeepSeek 未返回有效内容");
  }
  return JSON.parse(content) as Record<string, unknown>;
}

export async function deepSeekResumeAnalysis(resumeText: string, targetJob: string): Promise<ResumeAnalysis | null> {
  try {
    const result = await callDeepSeek(
      "你是大学生求职平台的简历诊断助手。只返回 JSON。字段必须包含 score、completeness、issues、keywordSuggestions、fitSuggestions、strengths。",
      `请分析以下简历与目标岗位的适配度。\n简历：${resumeText}\n目标岗位：${targetJob}`,
    );
    if (!result) return null;
    return {
      score: Number(result.score ?? 70),
      completeness: Array.isArray(result.completeness) ? (result.completeness as string[]) : [],
      issues: Array.isArray(result.issues) ? (result.issues as string[]) : [],
      keywordSuggestions: Array.isArray(result.keywordSuggestions) ? (result.keywordSuggestions as string[]) : [],
      fitSuggestions: Array.isArray(result.fitSuggestions) ? (result.fitSuggestions as string[]) : [],
      strengths: Array.isArray(result.strengths) ? (result.strengths as string[]) : [],
    };
  } catch {
    return null;
  }
}

export async function deepSeekJobMatch(resumeText: string, targetJob: string): Promise<JobMatchResult | null> {
  try {
    const result = await callDeepSeek(
      "你是大学生求职平台的岗位匹配助手。只返回 JSON。字段必须包含 score、keywords、strengths、gaps、deliveryAdvice、recommendedDirections。",
      `请将简历与岗位描述进行匹配分析。\n简历：${resumeText}\n岗位描述：${targetJob}`,
    );
    if (!result) return null;
    return {
      score: Number(result.score ?? 70),
      keywords: Array.isArray(result.keywords) ? (result.keywords as string[]) : [],
      strengths: Array.isArray(result.strengths) ? (result.strengths as string[]) : [],
      gaps: Array.isArray(result.gaps) ? (result.gaps as string[]) : [],
      deliveryAdvice: Array.isArray(result.deliveryAdvice) ? (result.deliveryAdvice as string[]) : [],
      recommendedDirections: Array.isArray(result.recommendedDirections)
        ? (result.recommendedDirections as string[])
        : [],
    };
  } catch {
    return null;
  }
}

export async function deepSeekResumeImportAdvice(
  extractedText: string,
  structuredSummary: string,
): Promise<ResumeImportAdvice | null> {
  try {
    const result = await callDeepSeek(
      "你是大学生求职平台的简历文件识别与优化助手。只返回 JSON。字段必须包含 score、completeness、expressionIssues、experienceIssues、skillIssues、suggestions、recommendedAdditions、summaryLine。",
      `请基于以下简历文件识别结果生成优化建议。\n原始文本：${extractedText}\n结构化摘要：${structuredSummary}`,
    );

    if (!result) return null;
    return {
      score: Number(result.score ?? 70),
      completeness: Array.isArray(result.completeness) ? (result.completeness as string[]) : [],
      expressionIssues: Array.isArray(result.expressionIssues) ? (result.expressionIssues as string[]) : [],
      experienceIssues: Array.isArray(result.experienceIssues) ? (result.experienceIssues as string[]) : [],
      skillIssues: Array.isArray(result.skillIssues) ? (result.skillIssues as string[]) : [],
      suggestions: Array.isArray(result.suggestions) ? (result.suggestions as string[]) : [],
      recommendedAdditions: Array.isArray(result.recommendedAdditions)
        ? (result.recommendedAdditions as string[])
        : [],
      summaryLine: typeof result.summaryLine === "string" ? result.summaryLine : "",
    };
  } catch {
    return null;
  }
}
