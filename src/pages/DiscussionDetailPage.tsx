import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { SectionHeader } from "../components/SectionHeader";
import { useAppContext } from "../context/AppContext";

export function DiscussionDetailPage() {
  const { id } = useParams();
  const { discussions, addDiscussionReply, saving, successMessage } = useAppContext();
  const [replyContent, setReplyContent] = useState("");

  const question = discussions.find((item) => item.id === id);
  if (!question) {
    return <Navigate to="/discussion" replace />;
  }

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    await addDiscussionReply(question.id, replyContent);
    setReplyContent("");
  };

  return (
    <div className="page-stack">
      <section className="card">
        <div className="community-topline">
          <span className="tag">{question.category}</span>
          <span className={`status-tag ${question.status === "已解决" ? "resolved" : ""}`}>{question.status}</span>
        </div>
        <h1 className="detail-title">{question.title}</h1>
        <p className="muted detail-meta">
          {question.author} · {question.createdAt} · 浏览 {question.views} · 回复 {question.replies.length}
        </p>
        <div className="tag-row">
          {question.tags.map((tag) => (
            <span key={tag} className="tag subtle">
              #{tag}
            </span>
          ))}
        </div>
        <article className="detail-article">{question.content}</article>
      </section>

      <section className="dashboard-grid">
        <div className="card">
          <SectionHeader title="回复区" subtitle="所有回复都来自真实数据库记录" />
          <div className="reply-list">
            {question.replies.length ? (
              question.replies.map((reply) => (
                <div key={reply.id} className="reply-item">
                  <div className="community-meta">
                    <span>{reply.author}</span>
                    <span>{reply.time}</span>
                    <span>点赞 {reply.likes}</span>
                  </div>
                  <p>{reply.content}</p>
                </div>
              ))
            ) : (
              <p className="muted">暂无回复，发布第一条建议吧。</p>
            )}
          </div>
        </div>

        <div className="card">
          <SectionHeader title="发布回复" subtitle="提交后会真实更新回复数和问题状态" />
          <textarea
            className="editor compact"
            value={replyContent}
            onChange={(event) => setReplyContent(event.target.value)}
            placeholder="输入你的建议、经验或补充问题"
          />
          <div className="inline-actions">
            <button className="primary-button" onClick={handleReply} disabled={saving}>
              {saving ? "提交中..." : "提交回复"}
            </button>
            <Link className="secondary-button" to="/share">
              去分享区看经验帖
            </Link>
          </div>
          {successMessage ? <p className="success-text">{successMessage}</p> : null}
        </div>
      </section>
    </div>
  );
}
