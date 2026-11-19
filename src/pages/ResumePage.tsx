import { useRef } from "react";
import { Link } from "react-router-dom";
import { SectionHeader } from "../components/SectionHeader";
import { useAppContext } from "../context/AppContext";
import { splitTags, structuredResumeToText } from "../lib/resume";
import type { EducationItem, ExperienceItem, StructuredResume } from "../types";

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}`;
}

function createEducationItem(): EducationItem {
  return {
    id: createId(),
    school: "",
    major: "",
    degree: "",
    startDate: "",
    endDate: "",
    details: "",
  };
}

function createExperienceItem(): ExperienceItem {
  return {
    id: createId(),
    type: "项目",
    title: "",
    period: "",
    role: "",
    bullets: [""],
  };
}

export function ResumePage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    structuredResume,
    setStructuredResume,
    uploadResumeFile,
    applyImportedResume,
    resumeImportResult,
    saveResume,
    runResumeAnalysis,
    resumeAnalysis,
    resumeAnalysisHistory,
    saving,
    successMessage,
    error,
    targetJob,
    setTargetJob,
  } = useAppContext();

  const updateResume = (updater: (draft: StructuredResume) => StructuredResume) => {
    setStructuredResume(updater(structuredResume));
  };

  const updateEducation = (id: string, key: keyof EducationItem, value: string) => {
    updateResume((draft) => ({
      ...draft,
      education: draft.education.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  };

  const updateExperience = (id: string, key: keyof Omit<ExperienceItem, "id" | "bullets">, value: string) => {
    updateResume((draft) => ({
      ...draft,
      experiences: draft.experiences.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  };

  const updateBullet = (experienceId: string, bulletIndex: number, value: string) => {
    updateResume((draft) => ({
      ...draft,
      experiences: draft.experiences.map((item) =>
        item.id === experienceId
          ? {
              ...item,
              bullets: item.bullets.map((bullet, index) => (index === bulletIndex ? value : bullet)),
            }
          : item,
      ),
    }));
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".pdf") && !lowerName.endsWith(".docx")) {
      return;
    }

    await uploadResumeFile(file);
    event.target.value = "";
  };

  const previewText = structuredResumeToText(structuredResume);

  return (
    <div className="page-stack">
      <section className="card">
        <SectionHeader
          title="结构化简历填写"
          subtitle="支持手动填写，也支持上传 PDF / DOCX 简历文件自动识别并导入。"
          action={
            <div className="inline-actions">
              <button className="secondary-button" onClick={() => fileInputRef.current?.click()} disabled={saving}>
                {saving ? "解析中..." : "上传 PDF / DOCX 简历"}
              </button>
              <button className="secondary-button" onClick={saveResume} disabled={saving}>
                {saving ? "保存中..." : "保存简历"}
              </button>
              <button className="primary-button" onClick={runResumeAnalysis} disabled={saving}>
                {saving ? "生成中..." : "生成诊断结果"}
              </button>
            </div>
          }
        />

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden-file-input"
          onChange={handleFileSelect}
        />

        <div className="resume-layout">
          <div className="resume-form-column">
            <div className="form-card upload-card">
              <h3>简历文件识别</h3>
              <p className="muted">
                上传 PDF 或 DOCX 简历后，系统会自动提取文本、识别结构化字段，并生成优化建议。识别不到的内容不会瞎编，建议你手动补充。
              </p>
              <div className="tag-row">
                <span className="tag">支持 PDF</span>
                <span className="tag">支持 DOCX</span>
                <span className="tag">可导入到表单</span>
              </div>
              {resumeImportResult ? (
                <div className="import-summary">
                  <strong>最近解析文件：{resumeImportResult.fileName}</strong>
                  <small>识别类型：{resumeImportResult.fileType.toUpperCase()}</small>
                  <small>建议评分：{resumeImportResult.advice.score} 分</small>
                  <button className="primary-button" type="button" onClick={() => applyImportedResume(resumeImportResult)}>
                    将解析结果导入表单
                  </button>
                </div>
              ) : null}
            </div>

            <div className="form-card">
              <h3>基本信息</h3>
              <div className="form-grid two-col">
                <label className="field-block">
                  <span>姓名 <em>*</em></span>
                  <input
                    className="search-input"
                    value={structuredResume.basics.name}
                    onChange={(event) =>
                      updateResume((draft) => ({
                        ...draft,
                        basics: { ...draft.basics, name: event.target.value },
                      }))
                    }
                    placeholder="请输入姓名"
                  />
                </label>
                <label className="field-block">
                  <span>电话 <em>*</em></span>
                  <input
                    className="search-input"
                    value={structuredResume.basics.phone}
                    onChange={(event) =>
                      updateResume((draft) => ({
                        ...draft,
                        basics: { ...draft.basics, phone: event.target.value },
                      }))
                    }
                    placeholder="请输入电话"
                  />
                </label>
                <label className="field-block">
                  <span>邮箱 <em>*</em></span>
                  <input
                    className="search-input"
                    value={structuredResume.basics.email}
                    onChange={(event) =>
                      updateResume((draft) => ({
                        ...draft,
                        basics: { ...draft.basics, email: event.target.value },
                      }))
                    }
                    placeholder="请输入邮箱"
                  />
                </label>
                <label className="field-block">
                  <span>求职意向 <em>*</em></span>
                  <input
                    className="search-input"
                    value={structuredResume.basics.targetRole}
                    onChange={(event) =>
                      updateResume((draft) => ({
                        ...draft,
                        basics: { ...draft.basics, targetRole: event.target.value },
                      }))
                    }
                    placeholder="例如：产品运营实习生"
                  />
                </label>
              </div>
              <label className="field-block">
                <span>教育背景概览 <em>*</em></span>
                <textarea
                  className="editor compact"
                  value={structuredResume.basics.educationSummary}
                  onChange={(event) =>
                    updateResume((draft) => ({
                      ...draft,
                      basics: { ...draft.basics, educationSummary: event.target.value },
                    }))
                  }
                  placeholder="用 1-2 句话概括学历背景、主修方向和亮点。"
                />
              </label>
            </div>

            <div className="form-card">
              <SectionHeader
                title="教育经历"
                subtitle="建议至少保留 1 段教育经历。"
                action={
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() =>
                      updateResume((draft) => ({
                        ...draft,
                        education: [...draft.education, createEducationItem()],
                      }))
                    }
                  >
                    新增教育经历
                  </button>
                }
              />

              <div className="form-stack">
                {structuredResume.education.map((item, index) => (
                  <div key={item.id} className="subform-panel">
                    <div className="subform-head">
                      <strong>教育经历 {index + 1}</strong>
                      {structuredResume.education.length > 1 ? (
                        <button
                          className="text-button"
                          type="button"
                          onClick={() =>
                            updateResume((draft) => ({
                              ...draft,
                              education: draft.education.filter((entry) => entry.id !== item.id),
                            }))
                          }
                        >
                          删除
                        </button>
                      ) : null}
                    </div>
                    <div className="form-grid two-col">
                      <label className="field-block">
                        <span>学校 <em>*</em></span>
                        <input className="search-input" value={item.school} onChange={(event) => updateEducation(item.id, "school", event.target.value)} />
                      </label>
                      <label className="field-block">
                        <span>专业 <em>*</em></span>
                        <input className="search-input" value={item.major} onChange={(event) => updateEducation(item.id, "major", event.target.value)} />
                      </label>
                      <label className="field-block">
                        <span>学历 <em>*</em></span>
                        <input className="search-input" value={item.degree} onChange={(event) => updateEducation(item.id, "degree", event.target.value)} />
                      </label>
                      <label className="field-block">
                        <span>起止时间 <em>*</em></span>
                        <div className="form-grid two-col">
                          <input
                            className="search-input"
                            value={item.startDate}
                            onChange={(event) => updateEducation(item.id, "startDate", event.target.value)}
                            placeholder="开始时间"
                          />
                          <input
                            className="search-input"
                            value={item.endDate}
                            onChange={(event) => updateEducation(item.id, "endDate", event.target.value)}
                            placeholder="结束时间"
                          />
                        </div>
                      </label>
                    </div>
                    <label className="field-block">
                      <span>主修课程 / 成绩 / 荣誉</span>
                      <textarea
                        className="editor compact"
                        value={item.details}
                        onChange={(event) => updateEducation(item.id, "details", event.target.value)}
                        placeholder="可填写主修课程、排名、奖学金、竞赛等。"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-card">
              <SectionHeader
                title="校园 / 实习 / 项目经历"
                subtitle="每段经历支持逐条添加 bullet point。"
                action={
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() =>
                      updateResume((draft) => ({
                        ...draft,
                        experiences: [...draft.experiences, createExperienceItem()],
                      }))
                    }
                  >
                    新增经历
                  </button>
                }
              />

              <div className="form-stack">
                {structuredResume.experiences.map((item, index) => (
                  <div key={item.id} className="subform-panel">
                    <div className="subform-head">
                      <strong>经历 {index + 1}</strong>
                      {structuredResume.experiences.length > 1 ? (
                        <button
                          className="text-button"
                          type="button"
                          onClick={() =>
                            updateResume((draft) => ({
                              ...draft,
                              experiences: draft.experiences.filter((entry) => entry.id !== item.id),
                            }))
                          }
                        >
                          删除
                        </button>
                      ) : null}
                    </div>
                    <div className="form-grid two-col">
                      <label className="field-block">
                        <span>经历类型 <em>*</em></span>
                        <select
                          className="search-input"
                          value={item.type}
                          onChange={(event) => updateExperience(item.id, "type", event.target.value as ExperienceItem["type"])}
                        >
                          <option value="项目">项目</option>
                          <option value="实习">实习</option>
                          <option value="校园经历">校园经历</option>
                        </select>
                      </label>
                      <label className="field-block">
                        <span>标题 <em>*</em></span>
                        <input className="search-input" value={item.title} onChange={(event) => updateExperience(item.id, "title", event.target.value)} />
                      </label>
                      <label className="field-block">
                        <span>时间 <em>*</em></span>
                        <input className="search-input" value={item.period} onChange={(event) => updateExperience(item.id, "period", event.target.value)} />
                      </label>
                      <label className="field-block">
                        <span>角色 <em>*</em></span>
                        <input className="search-input" value={item.role} onChange={(event) => updateExperience(item.id, "role", event.target.value)} />
                      </label>
                    </div>

                    <div className="field-block">
                      <span>经历内容描述 <em>*</em></span>
                      <div className="bullet-list">
                        {item.bullets.map((bullet, bulletIndex) => (
                          <div key={`${item.id}-${bulletIndex}`} className="bullet-row">
                            <span className="bullet-mark">•</span>
                            <input
                              className="search-input"
                              value={bullet}
                              onChange={(event) => updateBullet(item.id, bulletIndex, event.target.value)}
                              placeholder="逐条填写职责、动作、成果或量化结果"
                            />
                            {item.bullets.length > 1 ? (
                              <button
                                className="text-button"
                                type="button"
                                onClick={() =>
                                  updateResume((draft) => ({
                                    ...draft,
                                    experiences: draft.experiences.map((entry) =>
                                      entry.id === item.id
                                        ? {
                                            ...entry,
                                            bullets: entry.bullets.filter((_, index) => index !== bulletIndex),
                                          }
                                        : entry,
                                    ),
                                  }))
                                }
                              >
                                删除
                              </button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                      <button
                        className="secondary-button small-button"
                        type="button"
                        onClick={() =>
                          updateResume((draft) => ({
                            ...draft,
                            experiences: draft.experiences.map((entry) =>
                              entry.id === item.id ? { ...entry, bullets: [...entry.bullets, ""] } : entry,
                            ),
                          }))
                        }
                      >
                        新增要点
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-card">
              <h3>技能证书</h3>
              <div className="form-grid two-col">
                <label className="field-block">
                  <span>专业技能</span>
                  <input
                    className="search-input"
                    value={structuredResume.skills.professional.join("、")}
                    onChange={(event) =>
                      updateResume((draft) => ({
                        ...draft,
                        skills: { ...draft.skills, professional: splitTags(event.target.value) },
                      }))
                    }
                    placeholder="例如：用户调研、需求分析、活动复盘"
                  />
                </label>
                <label className="field-block">
                  <span>工具技能</span>
                  <input
                    className="search-input"
                    value={structuredResume.skills.tools.join("、")}
                    onChange={(event) =>
                      updateResume((draft) => ({
                        ...draft,
                        skills: { ...draft.skills, tools: splitTags(event.target.value) },
                      }))
                    }
                    placeholder="例如：Excel、SQL、Axure"
                  />
                </label>
                <label className="field-block">
                  <span>证书</span>
                  <input
                    className="search-input"
                    value={structuredResume.skills.certificates.join("、")}
                    onChange={(event) =>
                      updateResume((draft) => ({
                        ...draft,
                        skills: { ...draft.skills, certificates: splitTags(event.target.value) },
                      }))
                    }
                    placeholder="例如：英语四级、教师资格证"
                  />
                </label>
                <label className="field-block">
                  <span>语言能力</span>
                  <input
                    className="search-input"
                    value={structuredResume.skills.languages.join("、")}
                    onChange={(event) =>
                      updateResume((draft) => ({
                        ...draft,
                        skills: { ...draft.skills, languages: splitTags(event.target.value) },
                      }))
                    }
                    placeholder="例如：英语 CET-6"
                  />
                </label>
              </div>
            </div>

            <div className="form-card">
              <h3>自我评价</h3>
              <label className="field-block">
                <span>自我评价 <em>*</em></span>
                <textarea
                  className="editor compact"
                  value={structuredResume.selfEvaluation}
                  onChange={(event) =>
                    updateResume((draft) => ({
                      ...draft,
                      selfEvaluation: event.target.value,
                    }))
                  }
                  placeholder="概括个人优势、求职方向和可迁移能力。"
                />
              </label>
            </div>
          </div>

          <aside className="resume-preview-column">
            <div className="card sticky-card">
              <SectionHeader title="简历预览" subtitle="系统会将结构化内容自动拼接为诊断文本。" />
              <pre className="content-preview">{previewText || "填写内容后，这里会生成简历摘要预览。"}</pre>
            </div>

            {resumeImportResult ? (
              <div className="card">
                <SectionHeader title="上传识别结果" subtitle="展示原始提取文本、结构识别和智能优化建议。" />
                <div className="import-panel">
                  <div className="info-panel">
                    <strong>原始提取文本摘要</strong>
                    <pre className="content-preview compact-preview">
                      {resumeImportResult.extractedText.slice(0, 1200) || "未提取到有效文本"}
                    </pre>
                  </div>
                  <div className="info-panel">
                    <strong>识别出的结构化内容</strong>
                    <ul>
                      <li>姓名：{resumeImportResult.structuredResume.basics.name || "建议手动补充"}</li>
                      <li>电话：{resumeImportResult.structuredResume.basics.phone || "建议手动补充"}</li>
                      <li>邮箱：{resumeImportResult.structuredResume.basics.email || "建议手动补充"}</li>
                      <li>求职意向：{resumeImportResult.structuredResume.basics.targetRole || "建议手动补充"}</li>
                      <li>教育经历：{resumeImportResult.structuredResume.education.filter((item) => item.school || item.major).length} 段</li>
                      <li>经历模块：{resumeImportResult.structuredResume.experiences.filter((item) => item.title || item.bullets.some(Boolean)).length} 段</li>
                    </ul>
                  </div>
                  <div className="info-panel">
                    <strong>智能优化建议</strong>
                    <div className="score-chip">建议评分 {resumeImportResult.advice.score} 分</div>
                    <p className="muted">{resumeImportResult.advice.summaryLine}</p>
                    <strong>完整度评价</strong>
                    <ul>
                      {resumeImportResult.advice.completeness.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <strong>表达问题</strong>
                    <ul>
                      {resumeImportResult.advice.expressionIssues.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <strong>经历描述问题</strong>
                    <ul>
                      {resumeImportResult.advice.experienceIssues.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <strong>技能匹配问题</strong>
                    <ul>
                      {resumeImportResult.advice.skillIssues.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <strong>可优化建议</strong>
                    <ul>
                      {resumeImportResult.advice.suggestions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    {resumeImportResult.advice.recommendedAdditions.length ? (
                      <>
                        <strong>推荐补充内容</strong>
                        <ul>
                          {resumeImportResult.advice.recommendedAdditions.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                    <button className="primary-button" type="button" onClick={() => applyImportedResume(resumeImportResult)}>
                      导入识别结果到表单
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="card">
              <SectionHeader title="诊断设置" subtitle="设置目标岗位后可直接生成诊断结果。" />
              <label className="field-block">
                <span>目标岗位描述 <em>*</em></span>
                <textarea
                  className="editor compact"
                  value={targetJob}
                  onChange={(event) => setTargetJob(event.target.value)}
                  placeholder="请输入目标岗位 JD、职责描述或能力要求。"
                />
              </label>
              {successMessage ? <p className="success-text">{successMessage}</p> : null}
              {error ? <p className="error-text">{error}</p> : null}
            </div>
          </aside>
        </div>
      </section>

      <section className="analysis-grid">
        <div className="card">
          <SectionHeader
            title="本次诊断结果"
            subtitle={resumeAnalysis ? `综合评分 ${resumeAnalysis.score} 分` : "保存并生成诊断后显示结果"}
          />
          {resumeAnalysis ? (
            <div className="insight-block">
              <div>
                <strong>完整性检查</strong>
                <ul>
                  {resumeAnalysis.completeness.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>表达问题提示</strong>
                <ul>
                  {resumeAnalysis.issues.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>关键词优化建议</strong>
                <div className="tag-row">
                  {resumeAnalysis.keywordSuggestions.map((item) => (
                    <span key={item} className="tag">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <strong>岗位适配建议</strong>
                <ul>
                  {resumeAnalysis.fitSuggestions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="muted">当前还没有诊断结果。建议先填写简历，补充目标岗位后再生成。</p>
          )}
        </div>

        <div className="card">
          <SectionHeader title="历史诊断记录" subtitle="已保存到数据库，可用于比赛演示回看。" />
          <div className="sidebar-list">
            {resumeAnalysisHistory.length ? (
              resumeAnalysisHistory.map((item) => (
                <div key={item.id ?? item.createdAt} className="sidebar-link">
                  <strong>
                    {item.createdAt ?? "刚刚"} · {item.score} 分
                  </strong>
                  <small>{item.issues[0] ?? "已生成诊断结果"}</small>
                </div>
              ))
            ) : (
              <p className="muted">暂无诊断记录。</p>
            )}
          </div>
          <div className="inline-actions">
            <Link to="/job-match" className="secondary-button">
              下一步：岗位匹配
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
