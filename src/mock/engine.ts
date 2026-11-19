import type { JobMatchResult, ResumeAnalysis, ResumeImportAdvice } from "../types";

const resumeKeywords = ["项目", "数据", "分析", "负责", "协同", "用户", "运营", "策划"];

export function analyzeResume(resumeText: string, targetJob: string): ResumeAnalysis {
  const text = resumeText.trim();
  const hasEducation = /大学|学院|本科|硕士/.test(text);
  const hasProject = /项目|实践|实习/.test(text);
  const hasSkill = /技能|工具|Excel|Python|Axure|SQL/.test(text);
  const matchedKeywords = resumeKeywords.filter((keyword) => text.includes(keyword));
  const targetKeywords = extractKeywords(targetJob);
  const overlap = targetKeywords.filter((keyword) => text.includes(keyword));

  const score = Math.min(
    96,
    45 +
      matchedKeywords.length * 4 +
      overlap.length * 3 +
      (hasEducation ? 8 : 0) +
      (hasProject ? 8 : 0) +
      (hasSkill ? 7 : 0),
  );

  return {
    score,
    completeness: [
      hasEducation ? "教育背景信息已识别" : "建议补充教育背景与专业定位",
      hasProject ? "项目/实践经历已覆盖" : "建议增加项目、实习或校园实践经历",
      hasSkill ? "技能工具区已覆盖" : "建议补充技能工具与课程能力",
    ],
    issues: [
      !/\d+/.test(text) ? "项目成果缺少量化结果，可读性和说服力偏弱" : "已有量化表达，可继续增强结果导向",
      text.length < 180 ? "简历内容偏短，信息密度不足" : "简历篇幅基本合理",
      !/复盘|增长|协同|执行/.test(text) ? "与目标岗位相关关键词仍不足" : "已覆盖部分岗位高频关键词",
    ],
    keywordSuggestions: targetKeywords.slice(0, 6),
    fitSuggestions: [
      "将经历改写为“场景-动作-结果”结构，突出你真正做了什么。",
      "把调研、活动执行、跨团队协作相关经历前置，更贴近目标岗位。",
      "在技能区补充数据处理或分析工具，增强岗位适配度。",
    ],
    strengths: overlap.length ? overlap.map((item) => `已体现与岗位相关能力：${item}`) : ["具备校园实践基础"],
  };
}

export function analyzeJobMatch(resumeText: string, targetJob: string): JobMatchResult {
  const keywords = extractKeywords(targetJob);
  const strengths = keywords.filter((keyword) => resumeText.includes(keyword));
  const gaps = keywords.filter((keyword) => !resumeText.includes(keyword)).slice(0, 5);
  const score = Math.max(52, Math.min(95, 58 + strengths.length * 6 - gaps.length * 2));

  return {
    score,
    keywords,
    strengths: strengths.length
      ? strengths.map((item) => `简历中已出现与岗位对应的能力点：${item}`)
      : ["当前简历与岗位重合有限，建议先补足岗位关键词与项目成果表达"],
    gaps: gaps.length ? gaps.map((item) => `需补足或强化：${item}`) : ["当前关键词覆盖较好，可继续优化案例深度"],
    deliveryAdvice: [
      "投递前先把 JD 高频词写入简历标题、项目描述和技能区。",
      "针对岗位职责准备 2 个可复述案例，用于笔试和面试衔接。",
      "优先投递校招运营、产品助理、用户研究支持类岗位。",
    ],
    recommendedDirections: ["产品运营", "用户运营", "内容运营", "用户研究助理"],
  };
}

export function analyzeImportedResume(text: string): ResumeImportAdvice {
  const hasContact = /1\d{10}|@/.test(text);
  const hasEducation = /大学|学院|本科|硕士|教育经历/.test(text);
  const hasInternship = /实习/.test(text);
  const hasProject = /项目/.test(text);
  const hasCampus = /校园|社团|学生会/.test(text);
  const hasSkill = /技能|证书|Excel|SQL|Python|Axure|证书/.test(text);
  const quantified = /\d+[%+]?/.test(text);

  const completeness = [
    hasContact ? "已识别联系方式" : "缺少明确联系方式，建议手动补充电话和邮箱。",
    hasEducation ? "已识别教育背景" : "未识别到明确教育经历，建议手动补充学校、专业与学历。",
    hasProject || hasInternship || hasCampus ? "已识别经历内容" : "未识别到清晰经历模块，建议补充项目、实习或校园经历。",
    hasSkill ? "已识别技能或证书信息" : "未识别到技能证书模块，建议补充工具、语言或证书。",
  ];

  const expressionIssues = [
    quantified ? "部分内容已有数字表达，可继续强化结果描述。" : "经历描述缺少量化成果，建议补充人数、产出、提升比例等信息。",
    text.length > 500 ? "文本信息较完整，但可进一步压缩重复表达。" : "文本整体偏短，信息密度可能不足。",
  ];

  const experienceIssues = [
    hasProject || hasInternship || hasCampus
      ? "已识别经历内容，建议继续突出个人动作与最终结果。"
      : "经历内容不足，建议补充至少 2 段可展示能力的经历。",
    /负责|参与/.test(text) && !/推动|优化|完成|输出/.test(text)
      ? "经历中“负责/参与”较多，建议补充具体动作和成果。"
      : "经历表述具备一定行动性。",
  ];

  const skillIssues = [
    hasSkill ? "已识别技能内容，建议进一步补充熟练程度或使用场景。" : "技能模块较弱，建议补充工具、证书、语言能力。",
    /SQL|Python|Excel|Axure|PowerBI/.test(text)
      ? "已有部分硬技能表达。"
      : "缺少明显硬技能关键词，建议结合目标岗位补充工具技能。",
  ];

  const suggestions = [
    "优先把经历改写为“背景-动作-结果”结构，提升可读性。",
    "在每段经历中补充量化成果，避免只写职责。",
    "将目标岗位相关关键词前置到求职意向、经历标题或技能区。",
  ];

  const recommendedAdditions = [
    !hasEducation ? "补充教育经历（学校、专业、学历、时间）" : "",
    !hasProject && !hasInternship && !hasCampus ? "补充项目、实习或校园经历模块" : "",
    !hasSkill ? "补充技能证书、语言能力或工具使用能力" : "",
    !hasContact ? "补充联系电话和邮箱" : "",
  ].filter(Boolean);

  const score = Math.max(
    55,
    Math.min(
      95,
      55 +
        (hasContact ? 8 : 0) +
        (hasEducation ? 8 : 0) +
        (hasProject || hasInternship || hasCampus ? 10 : 0) +
        (hasSkill ? 8 : 0) +
        (quantified ? 6 : 0),
    ),
  );

  return {
    score,
    completeness,
    expressionIssues,
    experienceIssues,
    skillIssues,
    suggestions,
    recommendedAdditions,
    summaryLine:
      score >= 80
        ? "简历基础信息较完整，建议进一步强化量化成果和岗位关键词。"
        : "简历已识别出部分核心内容，但仍建议补充结构信息并优化经历表达。",
  };
}

function extractKeywords(text: string) {
  const seeds = ["用户调研", "需求分析", "竞品研究", "数据分析", "活动策划", "跨部门协同", "项目推进", "表达清晰"];
  return seeds.filter((item) => text.includes(item));
}
