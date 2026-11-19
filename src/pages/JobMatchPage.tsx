import { SectionHeader } from "../components/SectionHeader";
import { useAppContext } from "../context/AppContext";

export function JobMatchPage() {
  const { targetJob, setTargetJob, runJobMatch, jobMatch, jobMatchHistory, saving, successMessage } = useAppContext();

  return (
    <div className="page-stack">
      <section className="card">
        <SectionHeader
          title="岗位匹配分析"
          subtitle="输入目标岗位描述后，系统会生成并保存岗位分析记录。"
          action={
            <button className="primary-button" onClick={runJobMatch} disabled={saving}>
              {saving ? "分析中..." : "开始匹配分析"}
            </button>
          }
        />
        <textarea
          className="editor"
          value={targetJob}
          onChange={(event) => setTargetJob(event.target.value)}
          placeholder="请输入目标岗位 JD"
        />
        {successMessage ? <p className="success-text">{successMessage}</p> : null}
      </section>

      <section className="analysis-grid">
        <div className="card">
          <SectionHeader title="岗位关键词 / 能力要求" subtitle="从 JD 中提取的重点要求" />
          {jobMatch ? (
            <div className="tag-row">
              {jobMatch.keywords.map((item) => (
                <span key={item} className="tag">
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="muted">生成匹配分析后展示岗位关键词。</p>
          )}
        </div>

        <div className="card">
          <SectionHeader title="匹配结果" subtitle={jobMatch ? `匹配度 ${jobMatch.score} 分` : "尚未生成匹配结果"} />
          {jobMatch ? (
            <div className="insight-block">
              <div>
                <strong>匹配优势</strong>
                <ul>
                  {jobMatch.strengths.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>能力缺口</strong>
                <ul>
                  {jobMatch.gaps.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="muted">输入岗位描述后即可生成真实分析记录。</p>
          )}
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="card">
          <SectionHeader title="投递建议与岗位方向" subtitle="结果仍由规则引擎生成，但分析记录真实持久化" />
          {jobMatch ? (
            <div className="three-col">
              <div className="info-panel">
                <strong>投递建议</strong>
                <ul>
                  {jobMatch.deliveryAdvice.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="info-panel">
                <strong>推荐岗位方向</strong>
                <div className="tag-row">
                  {jobMatch.recommendedDirections.map((item) => (
                    <span className="tag" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="info-panel">
                <strong>分析说明</strong>
                <p className="muted">当前采用本地规则引擎生成匹配结果，后续可直接替换为真实 AI 服务。</p>
              </div>
            </div>
          ) : (
            <p className="muted">完成匹配分析后，这里会展示投递建议。</p>
          )}
        </div>

        <div className="card">
          <SectionHeader title="历史岗位分析" subtitle="已保存到数据库的岗位匹配记录" />
          <div className="sidebar-list">
            {jobMatchHistory.length ? (
              jobMatchHistory.map((item) => (
                <div key={item.id ?? item.createdAt} className="sidebar-link">
                  <strong>{item.roleName ?? "目标岗位"} · {item.score} 分</strong>
                  <small>{item.createdAt ?? "刚刚"} · {item.gaps[0] ?? "匹配度良好"}</small>
                </div>
              ))
            ) : (
              <p className="muted">暂无岗位分析记录。</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
