import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Pagination } from "../components/Pagination";
import { SectionHeader } from "../components/SectionHeader";
import { useAppContext } from "../context/AppContext";
import { discussionCategories } from "../data/demo";
import { filterDiscussionQuestions } from "../utils/community";

const PAGE_SIZE = 4;

export function DiscussionListPage() {
  const { discussions, addDiscussionQuestion, saving, successMessage } = useAppContext();
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("全部");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftCategory, setDraftCategory] = useState("面试问答");
  const [draftTags, setDraftTags] = useState("");
  const [page, setPage] = useState(1);

  const filteredQuestions = useMemo(
    () => filterDiscussionQuestions(discussions, keyword, category),
    [discussions, keyword, category],
  );
  const pageCount = Math.max(1, Math.ceil(filteredQuestions.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedQuestions = filteredQuestions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hotQuestions = discussions.filter((item) => item.status === "热门").slice(0, 4);

  useEffect(() => {
    setPage(1);
  }, [keyword, category]);

  const handleSubmit = async () => {
    if (!draftTitle.trim() || !draftContent.trim()) return;
    await addDiscussionQuestion({
      title: draftTitle.trim(),
      content: draftContent.trim(),
      category: draftCategory,
      tags: draftTags.split(/[，,]/).map((item) => item.trim()).filter(Boolean),
    });
    setDraftTitle("");
    setDraftContent("");
    setDraftTags("");
  };

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <span className="eyebrow">讨论区</span>
          <h1>围绕求职问题发问、交流与追踪答案</h1>
          <p>问题列表、详情、回复和状态都已真实存储，适合演示互动问答和教师答疑场景。</p>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="card">
          <SectionHeader title="问题列表" subtitle="支持搜索、分类筛选和状态查看" />
          <div className="community-toolbar">
            <input
              className="search-input"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索问题标题、内容或标签"
            />
            <div className="chip-row">
              {discussionCategories.map((item) => (
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
            {filteredQuestions.length ? (
              pagedQuestions.map((question) => (
                <Link key={question.id} to={`/discussion/${question.id}`} className="community-item">
                  <div className="community-topline">
                    <span className="tag">{question.category}</span>
                    <span className={`status-tag ${question.status === "已解决" ? "resolved" : ""}`}>{question.status}</span>
                  </div>
                  <h3>{question.title}</h3>
                  <p>{question.content}</p>
                  <div className="tag-row">
                    {question.tags.map((tag) => (
                      <span key={tag} className="tag subtle">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="community-meta">
                    <span>{question.author}</span>
                    <span>{question.createdAt}</span>
                    <span>浏览 {question.views}</span>
                    <span>回复 {question.replies.length}</span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="muted">暂无问题，发布第一条讨论即可在这里看到。</p>
            )}
          </div>

          <Pagination
            page={currentPage}
            pageCount={pageCount}
            total={filteredQuestions.length}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </div>

        <div className="community-side">
          <div className="card">
            <SectionHeader title="发布问题" subtitle="真实新增问题并写入数据库" />
            <div className="form-stack">
              <input className="search-input" value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} placeholder="输入问题标题" />
              <select className="search-input" value={draftCategory} onChange={(event) => setDraftCategory(event.target.value)}>
                {discussionCategories.filter((item) => item !== "全部").map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <textarea
                className="editor compact"
                value={draftContent}
                onChange={(event) => setDraftContent(event.target.value)}
                placeholder="描述你的问题背景、困惑和已尝试的方法"
              />
              <input className="search-input" value={draftTags} onChange={(event) => setDraftTags(event.target.value)} placeholder="标签，逗号分隔" />
              <button className="primary-button" onClick={handleSubmit} disabled={saving}>
                {saving ? "发布中..." : "发布问题"}
              </button>
              {successMessage ? <p className="success-text">{successMessage}</p> : null}
            </div>
          </div>

          <div className="card">
            <SectionHeader title="热门问题" subtitle="基于真实问题数据展示" />
            <div className="sidebar-list">
              {hotQuestions.length ? (
                hotQuestions.map((question) => (
                  <Link key={question.id} to={`/discussion/${question.id}`} className="sidebar-link">
                    <strong>{question.title}</strong>
                    <small>{question.views} 次浏览 · {question.replies.length} 条回复</small>
                  </Link>
                ))
              ) : (
                <p className="muted">暂无热门问题。</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
