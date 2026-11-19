import type { DiscussionQuestion, SharePost } from "../types";

export function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function filterSharePosts(posts: SharePost[], keyword: string, category: string) {
  const normalizedKeyword = normalizeText(keyword);
  return posts.filter((post) => {
    const matchesKeyword =
      !normalizedKeyword ||
      normalizeText(`${post.title} ${post.excerpt} ${post.tags.join(" ")}`).includes(normalizedKeyword);
    const matchesCategory = category === "全部" || post.category === category;
    return matchesKeyword && matchesCategory;
  });
}

export function filterDiscussionQuestions(questions: DiscussionQuestion[], keyword: string, category: string) {
  const normalizedKeyword = normalizeText(keyword);
  return questions.filter((question) => {
    const matchesKeyword =
      !normalizedKeyword ||
      normalizeText(`${question.title} ${question.content} ${question.tags.join(" ")}`).includes(normalizedKeyword);
    const matchesCategory = category === "全部" || question.category === category;
    return matchesKeyword && matchesCategory;
  });
}
