import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import type { ResumeImportResult, StructuredResume } from "../../src/types.ts";
import { analyzeImportedResume } from "../../src/mock/engine.ts";
import { deepSeekResumeImportAdvice } from "./deepseek.ts";
import { emptyStructuredResume, normalizeStructuredResume, structuredResumeToText } from "./resume.ts";

function createId() {
  return `id-${Math.random().toString(36).slice(2, 10)}`;
}

function cleanText(input: string) {
  return input.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

function findFirstMatch(text: string, pattern: RegExp) {
  const match = text.match(pattern);
  return match?.[1]?.trim() ?? "";
}

function splitSection(section: string) {
  return section
    .split(/\n+/)
    .map((line) => line.replace(/^[•·●\-\d.\s]+/, "").trim())
    .filter(Boolean);
}

function findSection(text: string, keywords: string[]) {
  const lines = text.split("\n");
  const lowerKeywords = keywords.map((item) => item.toLowerCase());
  let startIndex = -1;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim().toLowerCase();
    if (lowerKeywords.some((keyword) => line.includes(keyword))) {
      startIndex = index;
      break;
    }
  }

  if (startIndex === -1) return "";

  const collected: string[] = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) {
      if (collected.length >= 2) break;
      continue;
    }

    const lower = line.toLowerCase();
    const isNewSection = [
      "教育",
      "项目",
      "实习",
      "校园",
      "技能",
      "证书",
      "自我评价",
      "求职意向",
      "教育经历",
      "项目经历",
      "实习经历",
      "校园经历",
      "skills",
      "experience",
      "education",
      "profile",
      "summary",
    ].some((keyword) => lower.includes(keyword));

    if (isNewSection && collected.length >= 2) {
      break;
    }
    collected.push(line);
  }

  return collected.join("\n");
}

function parseEducation(section: string) {
  const chunks = section
    .split(/\n(?=(?:20\d{2}|19\d{2}|[\u4e00-\u9fa5A-Za-z].*(大学|学院|school|college)))/i)
    .map((item) => item.trim())
    .filter(Boolean);

  return chunks.slice(0, 3).map((chunk) => {
    const lines = splitSection(chunk);
    const headline = lines[0] ?? "";
    const time = headline.match(/(20\d{2}[.\-\/]?\d{0,2}).{0,8}(20\d{2}[.\-\/]?\d{0,2}|至今|现在)?/);
    return {
      id: createId(),
      school: findFirstMatch(chunk, /([^\n，。；]*?(大学|学院))/) || headline,
      major: findFirstMatch(chunk, /(专业[:：]?\s*([^\n，。；]+))/) || findFirstMatch(chunk, /((?:计算机|软件|信息|市场|管理|金融|电子|英语)[^\n，。；]{0,10})/),
      degree: findFirstMatch(chunk, /((本科|硕士|博士|大专|专科))/),
      startDate: time?.[1] ?? "",
      endDate: time?.[2] ?? "",
      details: lines.slice(1).join("；"),
    };
  });
}

function buildExperience(type: "项目" | "实习" | "校园经历", section: string) {
  const lines = splitSection(section);
  if (!lines.length) return [];

  const blocks = section
    .split(/\n(?=(?:20\d{2}|[\u4e00-\u9fa5A-Za-z].{0,30}(项目|实习|学生会|社团|校园)))/)
    .map((item) => item.trim())
    .filter(Boolean);

  return blocks.slice(0, 4).map((block) => {
    const items = splitSection(block);
    const header = items[0] ?? "";
    const period = header.match(/(20\d{2}[.\-\/]?\d{0,2}\s*[-至~]\s*(?:20\d{2}[.\-\/]?\d{0,2}|至今))/)?.[1] ?? "";
    return {
      id: createId(),
      type,
      title: header.replace(period, "").trim() || `${type}经历`,
      period,
      role: items[1]?.length && items[1].length < 30 ? items[1] : "",
      bullets: (items.slice(items[1]?.length && items[1].length < 30 ? 2 : 1) || []).slice(0, 4),
    };
  });
}

function parseSkills(section: string) {
  const lines = splitSection(section);
  const joined = lines.join("、");
  return {
    professional: splitSection(findFirstMatch(joined, /(专业技能[:：]?\s*([^]+))/) || joined).slice(0, 6),
    tools: (joined.match(/Excel|Word|PowerPoint|SQL|Python|Axure|Figma|PowerBI|SPSS/gi) ?? []).slice(0, 8),
    certificates: splitSection(findFirstMatch(joined, /(证书[:：]?\s*([^]+))/) || "").slice(0, 6),
    languages: (joined.match(/英语[^、，。\n]*|CET[-\s]?[46]|雅思[^、，。\n]*|托福[^、，。\n]*/gi) ?? []).slice(0, 6),
  };
}

function parseName(text: string) {
  const firstLine = text.split("\n").map((item) => item.trim()).find(Boolean) ?? "";
  if (/^[\u4e00-\u9fa5]{2,4}$/.test(firstLine)) {
    return firstLine;
  }
  return findFirstMatch(text, /(姓名[:：]?\s*([\u4e00-\u9fa5A-Za-z·\s]{2,30}))/) || "";
}

export async function extractResumeText(fileName: string, buffer: Buffer) {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith(".pdf")) {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    await parser.destroy();
    return { fileType: "pdf" as const, text: cleanText(result.text) };
  }

  if (lowerName.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return { fileType: "docx" as const, text: cleanText(result.value) };
  }

  throw new Error("仅支持 PDF 或 DOCX 简历文件");
}

export function parseResumeTextToStructured(text: string): StructuredResume {
  const educationSection = findSection(text, ["教育经历", "教育背景", "education"]);
  const projectSection = findSection(text, ["项目经历", "项目经验", "project"]);
  const internshipSection = findSection(text, ["实习经历", "实习经验", "internship"]);
  const campusSection = findSection(text, ["校园经历", "学生工作", "社团经历"]);
  const skillSection = findSection(text, ["技能证书", "技能", "证书", "skills"]);
  const selfSection = findSection(text, ["自我评价", "个人评价", "profile", "summary"]);

  const parsed = normalizeStructuredResume({
    basics: {
      name: parseName(text),
      phone: text.match(/1[3-9]\d{9}/)?.[0] ?? "",
      email: text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "",
      targetRole:
        findFirstMatch(text, /(求职意向[:：]?\s*([^\n]+))/) ||
        findFirstMatch(text, /(目标岗位[:：]?\s*([^\n]+))/) ||
        "",
      educationSummary: educationSection ? splitSection(educationSection).slice(0, 2).join("；") : "",
    },
    education: educationSection ? parseEducation(educationSection) : emptyStructuredResume().education,
    experiences: [
      ...buildExperience("项目", projectSection),
      ...buildExperience("实习", internshipSection),
      ...buildExperience("校园经历", campusSection),
    ],
    skills: parseSkills(skillSection),
    selfEvaluation: selfSection ? splitSection(selfSection).join("；") : "",
  });

  if (!parsed.experiences.length) {
    parsed.experiences = emptyStructuredResume().experiences;
  }

  return parsed;
}

export async function buildResumeImportResult(fileName: string, buffer: Buffer): Promise<ResumeImportResult> {
  const { fileType, text } = await extractResumeText(fileName, buffer);
  if (!text) {
    throw new Error("未能从文件中提取到有效文本，请检查文件内容或尝试手动填写。");
  }

  const structuredResume = parseResumeTextToStructured(text);
  const structuredSummary = structuredResumeToText(structuredResume);
  const advice = (await deepSeekResumeImportAdvice(text, structuredSummary)) ?? analyzeImportedResume(text);

  return {
    fileName,
    fileType,
    extractedText: text,
    structuredResume,
    advice,
  };
}
