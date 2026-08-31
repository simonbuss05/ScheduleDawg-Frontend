// src/App.js
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ConfirmProvider } from './context/ConfirmContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import WeeklyPage from './pages/WeeklyPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import CourseworkPage from './pages/CourseworkPage';
import SettingsPage from './pages/SettingsPage';
import GradesPage from './pages/GradesPage';
import SyllabusPage from './pages/SyllabusPage';

function App() {
  return (
    <AuthProvider>
      <ConfirmProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/weekly" element={<WeeklyPage />} />
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/:courseId" element={<CourseDetailPage />} />
                <Route path="/coursework" element={<CourseworkPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/grades" element={<GradesPage />} />
                <Route path="/syllabus" element={<SyllabusPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ConfirmProvider>
    </AuthProvider>
  );
}

export default App;
