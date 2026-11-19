import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Pagination } from "../components/Pagination";
import { SectionHeader } from "../components/SectionHeader";
import { useAppContext } from "../context/AppContext";
import { shareCategories } from "../data/demo";
import { filterSharePosts } from "../utils/community";

const PAGE_SIZE = 4;

export function ShareListPage() {
  const { sharePosts, createShare, likeShare, saving, successMessage } = useAppContext();
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("全部");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [postCategory, setPostCategory] = useState("简历优化经验");
  const [tags, setTags] = useState("");
  const [page, setPage] = useState(1);

  const filteredPosts = useMemo(() => filterSharePosts(sharePosts, keyword, category), [sharePosts, keyword, category]);
  const pageCount = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedPosts = filteredPosts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hotPosts = sharePosts.filter((post) => post.isHot).slice(0, 3);
  const latestPosts = [...sharePosts].slice(0, 4);

  useEffect(() => {
    setPage(1);
  }, [keyword, category]);

  const handleSubmit = async () => {
    if (!title.trim() || !excerpt.trim() || !content.trim()) return;
    await createShare({
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      category: postCategory,
      tags: tags.split(/[，,]/).map((item) => item.trim()).filter(Boolean),
    });
    setTitle("");
    setExcerpt("");
    setContent("");
    setTags("");
  };

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <span className="eyebrow">分享区</span>
          <h1>沉淀真实求职经验，让经验可以被复用</h1>
          <p>帖子列表、详情、浏览量、点赞和发帖都已接入真实数据存储，适合比赛现场演示完整经验沉淀流程。</p>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="card">
          <SectionHeader title="内容检索" subtitle="支持按关键词和分类快速筛选经验帖" />
          <div className="community-toolbar">
            <input
              className="search-input"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索标题、摘要或标签"
            />
            <div className="chip-row">
              {shareCategories.map((item) => (
                <button
                  key={item}
                  className={item === category ? "filter-chip active" : "filter-chip"}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="community-list">
            {filteredPosts.length ? (
              pagedPosts.map((post) => (
                <div key={post.id} className="community-item">
                  <Link to={`/share/${post.id}`}>
                    <div className="community-topline">
                      <span className="tag">{post.category}</span>
                      {post.isHot ? <span className="tag subtle">热门推荐</span> : null}
                    </div>
                    <h3>{post.title}</h3>
                    <p>{post.excerpt}</p>
                  </Link>
                  <div className="tag-row">
                    {post.tags.map((tag) => (
                      <span key={tag} className="tag subtle">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="community-meta">
                    <span>{post.author}</span>
                    <span>{post.publishedAt}</span>
                    <span>浏览 {post.views}</span>
                    <span>收藏 {post.favorites}</span>
                    <button className="text-button" onClick={() => likeShare(post.id)}>
                      点赞 {post.likes}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">暂无匹配内容，试试切换分类或直接发布第一篇经验帖。</p>
            )}
          </div>

          <Pagination
            page={currentPage}
            pageCount={pageCount}
            total={filteredPosts.length}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </div>

        <div className="community-side">
          <div className="card">
            <SectionHeader title="发布分享帖" subtitle="最小可用版已支持真实新增和列表读取" />
            <div className="form-stack">
              <input className="search-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="帖子标题" />
              <input className="search-input" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} placeholder="一句摘要" />
              <select className="search-input" value={postCategory} onChange={(event) => setPostCategory(event.target.value)}>
                {shareCategories.filter((item) => item !== "全部").map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <textarea className="editor compact" value={content} onChange={(event) => setContent(event.target.value)} placeholder="分享你的求职经验内容" />
              <input className="search-input" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="标签，逗号分隔" />
              <button className="primary-button" onClick={handleSubmit} disabled={saving}>
                {saving ? "发布中..." : "发布分享帖"}
              </button>
              {successMessage ? <p className="success-text">{successMessage}</p> : null}
            </div>
          </div>

          <div className="card">
            <SectionHeader title="热门推荐" subtitle="根据真实浏览和热度字段展示" />
            <div className="sidebar-list">
              {hotPosts.map((post) => (
                <Link key={post.id} to={`/share/${post.id}`} className="sidebar-link">
                  <strong>{post.title}</strong>
                  <small>{post.views} 次浏览</small>
                </Link>
              ))}
            </div>
          </div>

          <div className="card">
            <SectionHeader title="最新发布" subtitle="最近新增经验内容" />
            <div className="sidebar-list">
              {latestPosts.map((post) => (
                <Link key={post.id} to={`/share/${post.id}`} className="sidebar-link">
                  <strong>{post.title}</strong>
                  <small>{post.publishedAt}</small>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
