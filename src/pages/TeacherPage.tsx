import { SectionHeader } from "../components/SectionHeader";
import { StatCard } from "../components/StatCard";
import { useAppContext } from "../context/AppContext";

export function TeacherPage() {
  const { teacherStats, loading } = useAppContext();
  const studentAccounts = teacherStats?.studentAccounts ?? [];

  if (loading && !teacherStats) {
    return <div className="card">正在加载教师端统计数据...</div>;
  }

  if (!teacherStats) {
    return <div className="card">暂无教师端数据。</div>;
  }

  return (
    <div className="page-stack">
      <section className="hero-panel compact-hero">
        <div>
          <span className="eyebrow">教师 / 管理端</span>
          <h1>学生就业准备情况总览</h1>
          <p>当前页面统计结果均来自数据库真实记录，适合展示平台运行后的学生准备情况、注册账号概况与社区活跃趋势。</p>
        </div>
      </section>

      <section className="grid grid-4">
        <StatCard title="参与学生" value={teacherStats.overview.students} detail="数据库中的学生账号数量" />
        <StatCard title="平均简历得分" value={teacherStats.overview.averageResumeScore} suffix="分" detail="基于最近一次简历分析记录计算" />
        <StatCard title="平均匹配得分" value={teacherStats.overview.averageMatchScore} suffix="分" detail="基于最近一次岗位分析记录计算" />
      </section>

      <section className="dashboard-grid">
        <div className="card">
          <SectionHeader title="学生账号列表" subtitle="展示当前已注册学生账号，方便教师查看平台使用情况。" />
          <div className="sidebar-list">
            {studentAccounts.length ? (
              studentAccounts.map((student) => (
                <div className="sidebar-link" key={student.id}>
                  <strong>{student.name || "未填写姓名"}</strong>
                  <small>{student.email || "未填写邮箱"}</small>
                  <small>
                    {student.school || "未填写学校"} {student.major ? `· ${student.major}` : ""}
                  </small>
                  <small>
                    目标岗位：{student.targetRole || "待填写"} {student.joinedAt ? `· 注册时间 ${student.joinedAt}` : ""}
                  </small>
                </div>
              ))
            ) : (
              <p className="muted">暂无学生账号。</p>
            )}
          </div>
        </div>

        <div className="card">
          <SectionHeader title="平台活跃概览" subtitle="从社区和答疑行为统计" />
          <div className="phase-list">
            {teacherStats.activityOverview.map((item) => (
              <div className="phase-item" key={item.label}>
                <strong>{item.label}</strong>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="card">
          <SectionHeader title="学生简历常见问题分布" subtitle="从真实简历分析记录聚合" />
          <div className="bar-list">
            {teacherStats.issueDistribution.map((item) => (
              <div className="bar-item" key={item.label}>
                <div className="bar-head">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.min(item.value * 12, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <SectionHeader title="岗位偏好方向" subtitle="从岗位匹配记录统计目标方向" />
          <div className="bar-list">
            {teacherStats.directionDistribution.map((item) => (
              <div className="bar-item" key={item.label}>
                <div className="bar-head">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill alt" style={{ width: `${Math.min(item.value * 12, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="card">
          <SectionHeader title="高频能力短板" subtitle="从岗位分析中的能力缺口聚合" />
          <div className="bar-list">
            {teacherStats.gapDistribution.map((item) => (
              <div className="bar-item" key={item.label}>
                <div className="bar-head">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
                <div className="bar-track">
                  <div className="bar-fill muted-fill" style={{ width: `${Math.min(item.value * 12, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <SectionHeader title="热门讨论主题" subtitle="从真实讨论主题聚合" />
          <div className="sidebar-list">
            {teacherStats.communityTopics.map((item) => (
              <div className="sidebar-link" key={item.label}>
                <strong>{item.label}</strong>
                <small>热度计数 {item.value}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card">
        <SectionHeader title="高频分享标签" subtitle="从真实分享帖标签聚合" />
        <div className="bar-list">
          {teacherStats.shareTags.map((item) => (
            <div className="bar-item" key={item.label}>
              <div className="bar-head">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
              <div className="bar-track">
                <div className="bar-fill alt" style={{ width: `${Math.min(item.value * 18, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
