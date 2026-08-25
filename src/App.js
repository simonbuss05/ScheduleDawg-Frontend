// src/App.js
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import WeeklyPage from './pages/WeeklyPage';
import DailyPage from './pages/DailyPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import AssignmentsPage from './pages/AssignmentsPage';
import EventsPage from './pages/EventsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<WeeklyPage />} />
          <Route path="/daily" element={<DailyPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:courseId" element={<CourseDetailPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route path="/events" element={<EventsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;