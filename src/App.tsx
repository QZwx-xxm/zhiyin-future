import type { ReactNode } from "react";
import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAppContext } from "./context/AppContext";
import { AppShell } from "./layouts/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { DiscussionDetailPage } from "./pages/DiscussionDetailPage";
import { DiscussionListPage } from "./pages/DiscussionListPage";
import { JobMatchPage } from "./pages/JobMatchPage";
import { LoginPage } from "./pages/LoginPage";
import { ResumePage } from "./pages/ResumePage";
import { ShareDetailPage } from "./pages/ShareDetailPage";
import { ShareListPage } from "./pages/ShareListPage";
import { TeacherPage } from "./pages/TeacherPage";
import { VideoCallPage } from "./pages/VideoCallPage";

function StudentLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  const { role, loadAccounts } = useAppContext();

  useEffect(() => {
    loadAccounts().catch(() => undefined);
  }, []);

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentLayout>
              <DashboardPage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentLayout>
              <ResumePage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/job-match"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentLayout>
              <JobMatchPage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/video-call"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentLayout>
              <VideoCallPage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/share"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentLayout>
              <ShareListPage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/share/:id"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentLayout>
              <ShareDetailPage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/discussion"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentLayout>
              <DiscussionListPage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/discussion/:id"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentLayout>
              <DiscussionDetailPage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher"
        element={
          <ProtectedRoute roles={["teacher"]}>
            <AppShell>
              <TeacherPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={role === "teacher" ? "/teacher" : "/dashboard"} replace />} />
    </Routes>
  );
}
