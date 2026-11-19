import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../lib/api";
import { emptyStructuredResume, structuredResumeToText } from "../lib/resume";
import type {
  AppState,
  CommunityDraftQuestion,
  RegisterPayload,
  ResumeImportResult,
  Role,
  StructuredResume,
  UserProfile,
} from "../types";

interface AppContextValue extends AppState {
  accounts: Array<UserProfile & { label: string }>;
  loadAccounts: () => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<Role>;
  login: (userId: string, role: Role) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  clearMessage: () => void;
  setResumeText: (text: string) => void;
  setStructuredResume: (value: StructuredResume) => void;
  uploadResumeFile: (file: File) => Promise<void>;
  applyImportedResume: (result: ResumeImportResult) => void;
  saveResume: () => Promise<void>;
  setTargetJob: (text: string) => void;
  runResumeAnalysis: () => Promise<void>;
  runJobMatch: () => Promise<void>;
  refreshShares: () => Promise<void>;
  createShare: (payload: {
    title: string;
    excerpt: string;
    content: string;
    category: string;
    tags: string[];
  }) => Promise<void>;
  likeShare: (id: string) => Promise<void>;
  refreshDiscussions: () => Promise<void>;
  addDiscussionQuestion: (draft: CommunityDraftQuestion) => Promise<void>;
  addDiscussionReply: (questionId: string, content: string) => Promise<void>;
}

const SESSION_KEY = "career-future-session";
const DRAFT_KEY = "career-future-draft";

/**
 * 会话/草稿持久化。
 * 用 localStorage 而不是 sessionStorage：关掉浏览器、开新标签、刷新都还在。
 * 顺便把老版本存在 sessionStorage 里的会话迁移过来。
 */
const safeStorage = {
  get(key: string): string | null {
    try {
      const value = window.localStorage.getItem(key);
      if (value) return value;
      const legacy = window.sessionStorage.getItem(key);
      if (legacy) {
        window.localStorage.setItem(key, legacy);
        window.sessionStorage.removeItem(key);
        return legacy;
      }
    } catch {
      /* 隐私模式等场景忽略 */
    }
    return null;
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* 忽略 */
    }
  },
  remove(key: string) {
    try {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    } catch {
      /* 忽略 */
    }
  },
};

const initialState: AppState = {
  role: null,
  isAuthenticated: false,
  profile: null,
  resumeText: "",
  structuredResume: emptyStructuredResume,
  resumeImportResult: null,
  targetJob: "",
  resumeAnalysis: null,
  resumeAnalysisHistory: [],
  jobMatch: null,
  jobMatchHistory: [],
  records: [],
  progress: { resumeReady: 0, matchReady: 0 },
  sharePosts: [],
  discussions: [],
  teacherStats: null,
  // 初始为 true：首屏先等 session 恢复，避免直接刷新受保护页面时被误踢回登录页
  loading: true,
  saving: false,
  error: null,
  successMessage: null,
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [accounts, setAccounts] = useState<Array<UserProfile & { label: string }>>([]);

  // 本地草稿：编辑后先写 localStorage（刷新、断网都不丢），停手后再写数据库
  const dirtyRef = useRef(false);
  const draftTimer = useRef<number | null>(null);
  const draftKey = (userId: string) => `${DRAFT_KEY}:${userId}`;

  const readDraft = (userId: string) => {
    const raw = safeStorage.get(draftKey(userId));
    if (!raw) return null;
    try {
      const draft = JSON.parse(raw) as {
        structuredResume?: StructuredResume;
        resumeText?: string;
        targetJob?: string;
        savedAt?: number;
      };
      if (!draft?.structuredResume) return null;
      return draft;
    } catch {
      return null;
    }
  };

  const runRequest = async <T,>(callback: () => Promise<T>, options?: { saving?: boolean }) => {
    setState((prev) => ({
      ...prev,
      loading: !options?.saving,
      saving: !!options?.saving,
      error: null,
      successMessage: options?.saving ? prev.successMessage : null,
    }));

    try {
      const result = await callback();
      setState((prev) => ({ ...prev, loading: false, saving: false }));
      return result;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        saving: false,
        error: error instanceof Error ? error.message : "操作失败",
      }));
      throw error;
    }
  };

  const applyStudentBootstrap = async (userId: string, role: Role) => {
    safeStorage.set(SESSION_KEY, JSON.stringify({ userId, role }));
    const data = await runRequest(() => api.getStudentBootstrap(userId));
    setState((prev) => ({
      ...prev,
      role,
      isAuthenticated: true,
      profile: data.user,
      resumeText: data.resumeText,
      structuredResume: data.structuredResume,
      resumeImportResult: null,
      targetJob: data.targetJob,
      resumeAnalysis: data.resumeAnalysis,
      resumeAnalysisHistory: data.resumeAnalysisHistory,
      jobMatch: data.jobMatch,
      jobMatchHistory: data.jobMatchHistory,
      records: data.records,
      progress: data.progress,
      sharePosts: data.sharePosts,
      discussions: data.discussions,
      teacherStats: null,
      successMessage: null,
    }));

    // 如果这个用户在本地还有没同步进数据库的草稿，就用草稿覆盖回来
    const draft = readDraft(userId);
    if (draft?.structuredResume) {
      const draftText = structuredResumeToText(draft.structuredResume).trim();
      const serverText = structuredResumeToText(data.structuredResume).trim();
      const resumeChanged = Boolean(draftText) && draftText !== serverText;
      const jobChanged = Boolean(draft.targetJob) && draft.targetJob !== data.targetJob;
      if (resumeChanged || jobChanged) {
        dirtyRef.current = true;
        setState((prev) => ({
          ...prev,
          ...(resumeChanged
            ? {
                structuredResume: draft.structuredResume as StructuredResume,
                resumeText: draft.resumeText || draftText,
              }
            : {}),
          ...(jobChanged ? { targetJob: draft.targetJob as string } : {}),
        }));
      }
    }
  };

  const applyTeacherBootstrap = async (userId: string, role: Role) => {
    safeStorage.set(SESSION_KEY, JSON.stringify({ userId, role }));
    const data = await runRequest(() => api.getTeacherBootstrap(userId));
    setState((prev) => ({
      ...prev,
      role,
      isAuthenticated: true,
      profile: data.user,
      teacherStats: data.teacherStats,
      successMessage: null,
    }));
  };

  const login = async (userId: string, role: Role) => {
    if (role === "student") {
      await applyStudentBootstrap(userId, role);
      return;
    }
    await applyTeacherBootstrap(userId, role);
  };

  const loginWithPassword = async (email: string, password: string) => {
    const data = await runRequest(() => api.login({ email, password }), { saving: true });
    await login(data.user.id, data.user.role);
    return data.user.role;
  };

  const register = async (payload: RegisterPayload) => {
    const result = await runRequest(() => api.register(payload), { saving: true });
    setState((prev) => ({ ...prev, successMessage: result.message, error: null }));
    await loadAccounts();
  };

  const loadAccounts = async () => {
    const data = await runRequest(() => api.getAccounts());
    setAccounts(data);

    const saved = safeStorage.get(SESSION_KEY);
    if (saved && !state.isAuthenticated) {
      try {
        const session = JSON.parse(saved) as { userId: string; role: Role };
        const matched = data.find((item) => item.id === session.userId && item.role === session.role);
        if (matched) {
          await login(matched.id, matched.role);
        }
      } catch {
        safeStorage.remove(SESSION_KEY);
      }
    }
  };

  const logout = () => {
    safeStorage.remove(SESSION_KEY);
    if (draftTimer.current) window.clearTimeout(draftTimer.current);
    dirtyRef.current = false;
    // loading 必须显式置 false：初始 state 是 true（等恢复登录态），退出登录后没有请求会把它改回来
    setState({ ...initialState, loading: false });
  };

  const clearMessage = () => setState((prev) => ({ ...prev, error: null, successMessage: null }));

  const setStructuredResume = (value: StructuredResume) => {
    dirtyRef.current = true;
    setState((prev) => ({
      ...prev,
      structuredResume: value,
      resumeText: structuredResumeToText(value),
    }));
  };

  const applyImportedResume = (result: ResumeImportResult) => {
    dirtyRef.current = true;
    setState((prev) => ({
      ...prev,
      resumeImportResult: result,
      structuredResume: result.structuredResume,
      resumeText: result.extractedText,
      successMessage: "解析结果已导入到结构化简历表单",
    }));
  };

  const uploadResumeFile = async (file: File) => {
    if (!state.profile) return;
    const result = await runRequest(() => api.uploadResumeFile(state.profile!.id, file), { saving: true });
    setState((prev) => ({
      ...prev,
      resumeImportResult: result,
      successMessage: "简历文件解析成功",
    }));
  };

  const setResumeText = (text: string) => {
    dirtyRef.current = true;
    setState((prev) => ({ ...prev, resumeText: text }));
  };
  const setTargetJob = (text: string) => {
    dirtyRef.current = true;
    setState((prev) => ({ ...prev, targetJob: text }));
  };

  const saveResume = async () => {
    if (!state.profile) return;

    const userId = state.profile.id;
    const response = await runRequest(() => api.saveResume(userId, state.structuredResume), { saving: true });

    dirtyRef.current = false;
    // 保留本地草稿（里面还有未入库的目标岗位 JD），下次打开时一并恢复
    safeStorage.set(
      draftKey(userId),
      JSON.stringify({
        structuredResume: response.structuredResume,
        resumeText: response.content,
        targetJob: state.targetJob,
        savedAt: Date.now(),
      }),
    );

    setState((prev) => ({
      ...prev,
      resumeText: response.content,
      structuredResume: response.structuredResume,
      profile: prev.profile
        ? {
            ...prev.profile,
            name: response.structuredResume.basics.name || prev.profile.name,
            email: response.structuredResume.basics.email || prev.profile.email,
            phone: response.structuredResume.basics.phone || prev.profile.phone,
            targetRole: response.structuredResume.basics.targetRole || prev.profile.targetRole,
          }
        : prev.profile,
      successMessage: "简历已保存",
    }));
  };

  const runResumeAnalysis = async () => {
    if (!state.profile) return;

    const content = structuredResumeToText(state.structuredResume).trim();
    if (!content) {
      setState((prev) => ({ ...prev, error: "请先填写简历内容" }));
      return;
    }
    if (!state.targetJob.trim()) {
      setState((prev) => ({ ...prev, error: "请先填写目标岗位描述" }));
      return;
    }

    const result = await runRequest(() => api.analyzeResume(state.profile!.id, content, state.targetJob), { saving: true });

    setState((prev) => ({
      ...prev,
      resumeText: content,
      resumeAnalysis: result,
      resumeAnalysisHistory: [result, ...prev.resumeAnalysisHistory],
      progress: { ...prev.progress, resumeReady: result.score },
      successMessage: "简历诊断已生成并保存",
    }));
  };

  const runJobMatch = async () => {
    if (!state.profile) return;

    const resumeText = structuredResumeToText(state.structuredResume).trim() || state.resumeText;
    if (!resumeText) {
      setState((prev) => ({ ...prev, error: "请先填写并保存简历内容" }));
      return;
    }

    const result = await runRequest(
      () => api.analyzeJob(state.profile!.id, state.profile!.targetRole || "目标岗位", state.targetJob, resumeText),
      { saving: true },
    );

    setState((prev) => ({
      ...prev,
      resumeText,
      jobMatch: result,
      jobMatchHistory: [result, ...prev.jobMatchHistory],
      progress: { ...prev.progress, matchReady: result.score },
      successMessage: "岗位匹配分析已保存",
    }));
  };

  const refreshShares = async () => {
    const posts = await runRequest(() => api.getShares());
    setState((prev) => ({ ...prev, sharePosts: posts }));
  };

  const createShare = async (payload: {
    title: string;
    excerpt: string;
    content: string;
    category: string;
    tags: string[];
  }) => {
    if (!state.profile) return;

    const post = await runRequest(() => api.createShare({ ...payload, userId: state.profile!.id }), { saving: true });
    setState((prev) => ({
      ...prev,
      sharePosts: [post, ...prev.sharePosts],
      successMessage: "分享帖已发布",
    }));
  };

  const likeShare = async (id: string) => {
    const updated = await runRequest(() => api.likeShare(id), { saving: true });
    setState((prev) => ({
      ...prev,
      sharePosts: prev.sharePosts.map((post) => (post.id === id ? updated : post)),
    }));
  };

  const refreshDiscussions = async () => {
    const items = await runRequest(() => api.getDiscussions());
    setState((prev) => ({ ...prev, discussions: items }));
  };

  const addDiscussionQuestion = async (draft: CommunityDraftQuestion) => {
    if (!state.profile) return;

    const item = await runRequest(() => api.createDiscussion({ ...draft, userId: state.profile!.id }), { saving: true });
    setState((prev) => ({
      ...prev,
      discussions: [item, ...prev.discussions],
      successMessage: "问题已发布",
    }));
  };

  const addDiscussionReply = async (questionId: string, content: string) => {
    if (!state.profile) return;

    const item = await runRequest(() => api.replyDiscussion(questionId, { userId: state.profile!.id, content }), {
      saving: true,
    });

    setState((prev) => ({
      ...prev,
      discussions: prev.discussions.map((question) => (question.id === questionId ? item : question)),
      successMessage: "回复已提交",
    }));
  };

  // 编辑后自动保存：立刻写一份本地草稿（刷新/断网都不丢），停手 1.5 秒再写数据库
  useEffect(() => {
    if (!state.isAuthenticated || !state.profile || !dirtyRef.current) return;
    const userId = state.profile.id;

    safeStorage.set(
      draftKey(userId),
      JSON.stringify({
        structuredResume: state.structuredResume,
        resumeText: state.resumeText,
        targetJob: state.targetJob,
        savedAt: Date.now(),
      }),
    );

    if (draftTimer.current) window.clearTimeout(draftTimer.current);
    draftTimer.current = window.setTimeout(() => {
      api
        .saveResume(userId, state.structuredResume)
        .then(() => {
          dirtyRef.current = false;
          // 简历已经进库，但目标岗位 JD 还没进库，所以草稿保留，刷新时还能恢复
          safeStorage.set(
            draftKey(userId),
            JSON.stringify({
              structuredResume: state.structuredResume,
              resumeText: state.resumeText,
              targetJob: state.targetJob,
              savedAt: Date.now(),
            }),
          );
        })
        .catch(() => undefined);
    }, 1500);

    return () => {
      if (draftTimer.current) window.clearTimeout(draftTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.structuredResume, state.targetJob, state.resumeText, state.isAuthenticated, state.profile?.id]);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      accounts,
      loadAccounts,
      loginWithPassword,
      login,
      register,
      logout,
      clearMessage,
      setResumeText,
      setStructuredResume,
      uploadResumeFile,
      applyImportedResume,
      saveResume,
      setTargetJob,
      runResumeAnalysis,
      runJobMatch,
      refreshShares,
      createShare,
      likeShare,
      refreshDiscussions,
      addDiscussionQuestion,
      addDiscussionReply,
    }),
    [accounts, state],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}
