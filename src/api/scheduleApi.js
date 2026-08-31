// src/api/scheduleApi.js
import { getCourses } from './courseApi';
import { getMeetings } from './meetingApi';
import { getAssignments } from './assignmentApi';
import { getEvents } from './eventApi';

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

export const getAllAssignmentsWithCourses = () => {
  return getCourses().then((coursesRes) => {
    const courses = coursesRes.data;
    return Promise.all(courses.map((course) => getAssignments(course.id))).then((responses) => {
      return responses.flatMap((res, i) =>
        res.data.map((assignment) => ({ ...assignment, course: courses[i] }))
      );
    });
  });
};

export const getAllEventsWithCourses = () => {
  return getCourses().then((coursesRes) => {
    const courses = coursesRes.data;
    if (courses.length === 0) return [];
    return Promise.all(courses.map((course) => getEvents(course.id))).then((responses) => {
      return responses.flatMap((res, i) =>
        res.data.map((event) => ({ ...event, course: courses[i] }))
      );
    });
  });
};

export const getCoursesWithSummaries = () => {
  return getCourses().then((coursesRes) => {
    const courses = coursesRes.data;
    return Promise.all(
      courses.map((course) =>
        Promise.all([getMeetings(course.id), getAssignments(course.id)])
      )
    ).then((results) => {
      return courses.map((course, i) => {
        const [meetingsRes, assignmentsRes] = results[i];
        return {
          ...course,
          meetings: meetingsRes.data,
          assignmentCount: assignmentsRes.data.length,
        };
      });
    });
  });
};

export const getDaySchedule = () => {
  return Promise.all([
    getAllMeetingsWithCourses(),
    getAllAssignmentsWithCourses(),
    getAllEventsWithCourses(),
  ]).then(([allMeetings, allAssignments, allEvents]) => ({
    allMeetings,
    allAssignments,
    allEvents,
  }));
};
