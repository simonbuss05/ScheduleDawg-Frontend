// src/App.js
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfirmProvider } from './context/ConfirmContext';
import Layout from './components/Layout';
import WeeklyPage from './pages/WeeklyPage';
import DailyPage from './pages/DailyPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import AssignmentsPage from './pages/AssignmentsPage';
import EventsPage from './pages/EventsPage';
import SettingsPage from './pages/SettingsPage';
import GradesPage from './pages/GradesPage';
import SyllabusPage from './pages/SyllabusPage';

function App() {
  return (
    <ConfirmProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<WeeklyPage />} />
            <Route path="/daily" element={<DailyPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:courseId" element={<CourseDetailPage />} />
            <Route path="/assignments" element={<AssignmentsPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/grades" element={<GradesPage />} />
            <Route path="/syllabus" element={<SyllabusPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfirmProvider>
  );
}

export default App;