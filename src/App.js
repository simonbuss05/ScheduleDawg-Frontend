// src/App.js
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import WeeklyPage from './pages/WeeklyPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<CoursesPage />} />
          <Route path="/courses/:courseId" element={<CourseDetailPage />} />
          <Route path="/weekly" element={<WeeklyPage />} />
          {/* Daily/Map route added once that page exists */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;