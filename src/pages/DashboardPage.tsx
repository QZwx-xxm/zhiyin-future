import { Link } from "react-router-dom";
import { ProgressRing } from "../components/ProgressRing";
import { SectionHeader } from "../components/SectionHeader";
import { StatCard } from "../components/StatCard";
import { useAppContext } from "../context/AppContext";

export function DashboardPage() {
  const { profile, progress, records, sharePosts, discussions, loading } = useAppContext();
  const featuredPost = sharePosts[0] ?? null;
  const hotDiscussion = discussions[0] ?? null;

  if (loading && !profile) {
    return <div className="card">正在加载学生数据...</div>;
  }

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <span className="eyebrow">学生工作台</span>
          <h1>{profile?.name ?? "同学"}，今天继续完善你的求职准备</h1>
          <p>当前目标岗位为 {profile?.targetRole ?? "未设置"}。本页数据来自数据库，最近记录和任务状态都会实时更新。</p>
        </div>
        <div className="hero-actions">
          <Link className="primary-button" to="/resume">
            继续优化简历
          </Link>
          <Link className="secondary-button" to="/job-match">
            开始岗位匹配
          </Link>
        </div>
      </section>

      <section className="grid grid-4">
        <StatCard title="简历准备度" value={progress.resumeReady} suffix="分" detail="最近一次简历分析评分" />
        <StatCard title="岗位匹配度" value={progress.matchReady} suffix="分" detail="最近一次岗位匹配结果" />
      </section>

      <section className="dashboard-grid">
        <div className="card">
          <SectionHeader title="今日求职准备状态" subtitle="核心模块进度一览" />
          <div className="ring-row">
            <ProgressRing value={progress.resumeReady} label="简历" />
            <ProgressRing value={progress.matchReady} label="匹配" />
          </div>
        </div>

        <div className="card">
          <SectionHeader title="快速入口" subtitle="可直接串联业务演示流程" />
          <div className="quick-links">
            <Link to="/resume" className="quick-link">
              <strong>上传简历</strong>
              <span>录入简历并保存诊断历史</span>
            </Link>
            <Link to="/job-match" className="quick-link">
              <strong>岗位匹配</strong>
              <span>生成并保存岗位分析记录</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="card">
          <SectionHeader title="最近分析记录" subtitle="来自已保存的诊断和匹配记录" />
          <div className="record-list">
            {records.length ? (
              records.map((record) => (
                <div key={record.id} className="record-item">
                  <div>
                    <strong>{record.title}</strong>
                    <p>{record.summary}</p>
                  </div>
                  <div className="record-meta">
                    <span>{record.tag}</span>
                    <small>{record.time}</small>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">暂无记录，先完成一次简历诊断或岗位匹配。</p>
            )}
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="card">
          <SectionHeader title="推荐经验帖" subtitle="来自真实分享区数据" action={<Link to="/share">查看全部</Link>} />
          {featuredPost ? (
            <Link to={`/share/${featuredPost.id}`} className="community-item">
              <div className="community-topline">
                <span className="tag">{featuredPost.category}</span>
                <span className="tag subtle">推荐</span>
              </div>
              <h3>{featuredPost.title}</h3>
              <p>{featuredPost.excerpt}</p>
              <div className="community-meta">
                <span>{featuredPost.author}</span>
                <span>点赞 {featuredPost.likes}</span>
                <span>浏览 {featuredPost.views}</span>
              </div>
            </Link>
          ) : (
            <p className="muted">暂无推荐经验帖。</p>
          )}
        </div>

        <div className="card">
          <SectionHeader title="热门讨论" subtitle="来自真实讨论区数据" action={<Link to="/discussion">进入讨论区</Link>} />
          {hotDiscussion ? (
            <Link to={`/discussion/${hotDiscussion.id}`} className="community-item">
              <div className="community-topline">
                <span className="tag">{hotDiscussion.category}</span>
                <span className="status-tag">{hotDiscussion.status}</span>
              </div>
              <h3>{hotDiscussion.title}</h3>
              <p>{hotDiscussion.content}</p>
              <div className="community-meta">
                <span>{hotDiscussion.author}</span>
                <span>回复 {hotDiscussion.replies.length}</span>
                <span>浏览 {hotDiscussion.views}</span>
              </div>
            </Link>
          ) : (
            <p className="muted">暂无热门讨论。</p>
          )}
        </div>
      </section>
    </div>
  );
}
