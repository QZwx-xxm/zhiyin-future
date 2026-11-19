import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { SectionHeader } from "../components/SectionHeader";
import { useAppContext } from "../context/AppContext";

export function ShareDetailPage() {
  const { id } = useParams();
  const { sharePosts, likeShare } = useAppContext();
  const post = sharePosts.find((item) => item.id === id);
  const relatedPosts = useMemo(
    () => sharePosts.filter((item) => item.id !== id && item.category === post?.category).slice(0, 3),
    [sharePosts, id, post],
  );

  if (!post) {
    return <Navigate to="/share" replace />;
  }

  return (
    <div className="page-stack">
      <section className="card">
        <div className="community-topline">
          <span className="tag">{post.category}</span>
          {post.isHot ? <span className="tag subtle">热门推荐</span> : null}
        </div>
        <h1 className="detail-title">{post.title}</h1>
        <p className="muted detail-meta">
          {post.author} · {post.publishedAt} · 浏览 {post.views} · 点赞 {post.likes} · 收藏 {post.favorites}
        </p>
        <div className="tag-row">
          {post.tags.map((tag) => (
            <span key={tag} className="tag subtle">
              #{tag}
            </span>
          ))}
        </div>
        <article className="detail-article">{post.content}</article>
        <div className="inline-actions">
          <button className="primary-button" onClick={() => likeShare(post.id)}>
            点赞这篇经验帖
          </button>
          <Link className="secondary-button" to="/discussion">
            去讨论区继续交流
          </Link>
        </div>
      </section>

      <section className="card">
        <SectionHeader title="相关推荐" subtitle="同类内容延伸阅读" />
        <div className="sidebar-list">
          {relatedPosts.length ? (
            relatedPosts.map((item) => (
              <Link key={item.id} to={`/share/${item.id}`} className="sidebar-link">
                <strong>{item.title}</strong>
                <small>{item.category}</small>
              </Link>
            ))
          ) : (
            <p className="muted">暂无相关推荐。</p>
          )}
        </div>
      </section>
    </div>
  );
}
