// src/api/scheduleApi.js
import { getCourses } from './courseApi';
import { getMeetings } from './meetingApi';

export const getAllMeetingsWithCourses = () => {
  return getCourses().then((coursesRes) => {
    const courses = coursesRes.data;
    return Promise.all(courses.map((course) => getMeetings(course.id))).then((meetingResponses) => {
      return meetingResponses.flatMap((res, i) =>
        res.data.map((meeting) => ({ ...meeting, course: courses[i] }))
      );
    });
  });
};