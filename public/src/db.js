import Dexie from 'dexie';

export const db = new Dexie('RoutineAppDB');
db.version(1).stores({
  users: '++id, name, createdAt, homeView',
  tasks: '++id, title, repeatRule, daysOfWeek, startDate, endDate, createdAt',
  occurrences: '++id, taskId, date, completed, completedAt'
});
