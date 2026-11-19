import type { StructuredResume } from "../../src/types.ts";

function createId() {
  return `id-${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyStructuredResume(): StructuredResume {
  return {
    basics: {
      name: "",
      phone: "",
      email: "",
      targetRole: "",
      educationSummary: "",
    },
    education: [
      {
        id: createId(),
        school: "",
        major: "",
        degree: "",
        startDate: "",
        endDate: "",
        details: "",
      },
    ],
    experiences: [
      {
        id: createId(),
        type: "项目",
        title: "",
        period: "",
        role: "",
        bullets: [""],
      },
    ],
    skills: {
      professional: [],
      tools: [],
      certificates: [],
      languages: [],
    },
    selfEvaluation: "",
  };
}

export function normalizeStructuredResume(input: Partial<StructuredResume> | null | undefined): StructuredResume {
  const fallback = emptyStructuredResume();

  return {
    basics: {
      ...fallback.basics,
      ...(input?.basics ?? {}),
    },
    education:
      input?.education?.length
        ? input.education.map((item) => ({
            id: item.id || createId(),
            school: item.school ?? "",
            major: item.major ?? "",
            degree: item.degree ?? "",
            startDate: item.startDate ?? "",
            endDate: item.endDate ?? "",
            details: item.details ?? "",
          }))
        : fallback.education,
    experiences:
      input?.experiences?.length
        ? input.experiences.map((item) => ({
            id: item.id || createId(),
            type: item.type === "实习" || item.type === "校园经历" ? item.type : "项目",
            title: item.title ?? "",
            period: item.period ?? "",
            role: item.role ?? "",
            bullets: item.bullets?.length ? item.bullets.map((bullet) => bullet ?? "") : [""],
          }))
        : fallback.experiences,
    skills: {
      professional: input?.skills?.professional ?? fallback.skills.professional,
      tools: input?.skills?.tools ?? fallback.skills.tools,
      certificates: input?.skills?.certificates ?? fallback.skills.certificates,
      languages: input?.skills?.languages ?? fallback.skills.languages,
    },
    selfEvaluation: input?.selfEvaluation ?? fallback.selfEvaluation,
  };
}

export function structuredResumeToText(resume: StructuredResume) {
  const basics = [
    resume.basics.name ? `姓名：${resume.basics.name}` : "",
    resume.basics.phone ? `电话：${resume.basics.phone}` : "",
    resume.basics.email ? `邮箱：${resume.basics.email}` : "",
    resume.basics.targetRole ? `求职意向：${resume.basics.targetRole}` : "",
    resume.basics.educationSummary ? `教育背景概览：${resume.basics.educationSummary}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const education = resume.education
    .map((item) =>
      [
        item.school ? `学校：${item.school}` : "",
        item.major ? `专业：${item.major}` : "",
        item.degree ? `学历：${item.degree}` : "",
        item.startDate || item.endDate ? `时间：${item.startDate} - ${item.endDate}` : "",
        item.details ? `补充：${item.details}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .filter(Boolean)
    .join("\n\n");

  const experiences = resume.experiences
    .map((item) =>
      [
        item.title ? `${item.type}：${item.title}` : item.type,
        item.period ? `时间：${item.period}` : "",
        item.role ? `角色：${item.role}` : "",
        ...item.bullets.filter(Boolean).map((bullet) => `- ${bullet}`),
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .filter(Boolean)
    .join("\n\n");

  const skills = [
    resume.skills.professional.length ? `专业技能：${resume.skills.professional.join("、")}` : "",
    resume.skills.tools.length ? `工具技能：${resume.skills.tools.join("、")}` : "",
    resume.skills.certificates.length ? `证书：${resume.skills.certificates.join("、")}` : "",
    resume.skills.languages.length ? `语言能力：${resume.skills.languages.join("、")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    basics,
    education ? "教育经历" : "",
    education,
    experiences ? "校园/实习/项目经历" : "",
    experiences,
    skills ? "技能证书" : "",
    skills,
    resume.selfEvaluation ? "自我评价" : "",
    resume.selfEvaluation,
  ]
    .filter(Boolean)
    .join("\n\n");
}
