export type Role = "student" | "teacher";

export interface UserProfile {
  id: string;
  name: string;
  school: string;
  major: string;
  targetRole: string;
  role: Role;
  email?: string;
  phone?: string;
}

export interface ResumeBasics {
  name: string;
  phone: string;
  email: string;
  targetRole: string;
  educationSummary: string;
}

export interface EducationItem {
  id: string;
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
  details: string;
}

export interface ExperienceItem {
  id: string;
  type: "项目" | "实习" | "校园经历";
  title: string;
  period: string;
  role: string;
  bullets: string[];
}

export interface SkillsSection {
  professional: string[];
  tools: string[];
  certificates: string[];
  languages: string[];
}

export interface StructuredResume {
  basics: ResumeBasics;
  education: EducationItem[];
  experiences: ExperienceItem[];
  skills: SkillsSection;
  selfEvaluation: string;
}

export interface ResumeAnalysis {
  id?: string;
  createdAt?: string;
  score: number;
  completeness: string[];
  issues: string[];
  keywordSuggestions: string[];
  fitSuggestions: string[];
  strengths: string[];
}

export interface ResumeImportAdvice {
  score: number;
  completeness: string[];
  expressionIssues: string[];
  experienceIssues: string[];
  skillIssues: string[];
  suggestions: string[];
  recommendedAdditions: string[];
  summaryLine: string;
}

export interface ResumeImportResult {
  fileName: string;
  fileType: "pdf" | "docx";
  extractedText: string;
  structuredResume: StructuredResume;
  advice: ResumeImportAdvice;
}

export interface JobMatchResult {
  id?: string;
  createdAt?: string;
  roleName?: string;
  score: number;
  keywords: string[];
  strengths: string[];
  gaps: string[];
  deliveryAdvice: string[];
  recommendedDirections: string[];
}

export interface ActivityRecord {
  id: string;
  title: string;
  time: string;
  tag: string;
  summary: string;
}

export interface StudentProgress {
  resumeReady: number;
  matchReady: number;
}

export interface SharePost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  category: string;
  tags: string[];
  likes: number;
  views: number;
  favorites: number;
  isHot?: boolean;
}

export interface DiscussionReply {
  id: string;
  author: string;
  content: string;
  time: string;
  likes: number;
}

export interface DiscussionQuestion {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  status: "讨论中" | "已解决" | "热门";
  views: number;
  replies: DiscussionReply[];
  createdAt: string;
}

export interface CommunityDraftQuestion {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

export interface TeacherStats {
  overview: {
    students: number;
    averageResumeScore: number;
    averageMatchScore: number;
  };
  studentAccounts: Array<{
    id: string;
    name: string;
    email: string;
    school: string;
    major: string;
    targetRole: string;
    joinedAt?: string;
  }>;
  issueDistribution: Array<{ label: string; value: number }>;
  directionDistribution: Array<{ label: string; value: number }>;
  gapDistribution: Array<{ label: string; value: number }>;
  communityTopics: Array<{ label: string; value: number }>;
  shareTags: Array<{ label: string; value: number }>;
  activityOverview: Array<{ label: string; value: string }>;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface AppState {
  role: Role | null;
  isAuthenticated: boolean;
  profile: UserProfile | null;
  resumeText: string;
  structuredResume: StructuredResume;
  resumeImportResult: ResumeImportResult | null;
  targetJob: string;
  resumeAnalysis: ResumeAnalysis | null;
  resumeAnalysisHistory: ResumeAnalysis[];
  jobMatch: JobMatchResult | null;
  jobMatchHistory: JobMatchResult[];
  records: ActivityRecord[];
  progress: StudentProgress;
  sharePosts: SharePost[];
  discussions: DiscussionQuestion[];
  teacherStats: TeacherStats | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  successMessage: string | null;
}

export interface StudentBootstrap {
  user: UserProfile;
  resumeText: string;
  structuredResume: StructuredResume;
  targetJob: string;
  resumeAnalysis: ResumeAnalysis | null;
  resumeAnalysisHistory: ResumeAnalysis[];
  jobMatch: JobMatchResult | null;
  jobMatchHistory: JobMatchResult[];
  records: ActivityRecord[];
  progress: StudentProgress;
  sharePosts: SharePost[];
  discussions: DiscussionQuestion[];
}
