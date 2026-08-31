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

export const getAllEventsWithDetails = (meetings) => {
  if (meetings.length === 0) return Promise.resolve([]);
  return Promise.all(meetings.map((m) => getEvents(m.id))).then((eventResponses) => {
    return eventResponses.flatMap((res, i) =>
      res.data.map((event) => ({ ...event, meeting: meetings[i] }))
    );
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
  return getCourses().then((coursesRes) => {
    const courses = coursesRes.data;
    return Promise.all(courses.map((c) => getMeetings(c.id))).then((meetingResponses) => {
      const allMeetings = meetingResponses.flatMap((res, i) =>
        res.data.map((m) => ({ ...m, course: courses[i] }))
      );
      return Promise.all([
        Promise.resolve(allMeetings),
        Promise.all(courses.map((c) => getAssignments(c.id))).then((r) =>
          r.flatMap((res, i) => res.data.map((a) => ({ ...a, course: courses[i] })))
        ),
        Promise.all(allMeetings.map((m) => getEvents(m.id))).then((r) =>
          r.flatMap((res, i) => res.data.map((ev) => ({ ...ev, meeting: allMeetings[i] })))
        ),
      ]);
    });
  }).then(([allMeetings, allAssignments, allEvents]) => ({
    allMeetings,
    allAssignments,
    allEvents,
  }));
};