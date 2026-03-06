import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { AuthLayout } from "./layouts/AuthLayout";
import { ProtectedRoute } from "./router/ProtectedRoute";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Overview from "./pages/dashboard/Overview";
import JDList from "./pages/dashboard/jd/JDList";
import CreateJD from "./pages/dashboard/jd/CreateJD";
import CandidateList from "./pages/dashboard/resume/CandidateList";
import AssessmentList from "./pages/dashboard/assessment/AssessmentList";
import AssessmentDetail from "./pages/dashboard/assessment/AssessmentDetail";
import InterviewList from "./pages/dashboard/interview/InterviewList";
import OfferList from "./pages/dashboard/offer/OfferList";
import CandidateDashboard from "./pages/candidate/CandidateDashboard";
import TestScreen from "./pages/candidate/TestScreen";
import NotFound from "./pages/NotFound";
import JDDetail from "./pages/dashboard/jd/JDDetail";
import ApplyJobPage from "./pages/application/ApplyJobPage";
import VoiceInput from "./pages/VoiceBot/VoiceInput";
const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/apply/:jdId" element={<ApplyJobPage />} />
            <Route path="/auth" element={<AuthLayout />}>
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
            </Route>

            <Route
              path="/dashboard"
              element={
                // <ProtectedRoute allowedRoles={['admin', 'hr']}>
                  <DashboardLayout />
                // </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="huria" element={<VoiceInput />} />
              <Route path="jd" element={<JDList />} />
              <Route path="jd/:id" element={<JDDetail />} />
              <Route path="jd/create" element={<CreateJD />} />
              <Route path="resume" element={<CandidateList />} />
              <Route path="assessment" element={<AssessmentList />} />
              <Route path="assessment/:id" element={<AssessmentDetail />} />
              <Route path="interview" element={<InterviewList />} />
              <Route path="offer" element={<OfferList />} />
            </Route>

            <Route
              path="/candidate"
              element={
                <ProtectedRoute allowedRoles={['candidate']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<CandidateDashboard />} />
              <Route path="tests/:testId" element={<TestScreen />} />
              <Route path="interviews" element={<div className="p-8">My Interviews - Coming Soon</div>} />
              <Route path="offers" element={<div className="p-8">My Offers - Coming Soon</div>} />
              <Route path="onboarding" element={<div className="p-8">Onboarding - Coming Soon</div>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
