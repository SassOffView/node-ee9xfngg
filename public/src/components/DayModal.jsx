import React, { useEffect, useState } from 'react';
import { toDateKey } from '../utils/date';
import { db } from '../db';

export default function DayModal({ date, onClose }) {
  const [tasks, setTasks] = useState([]);
  const [occurrences, setOccurrences] = useState([]);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    load();
  }, [date]);

  async function load() {
    const allTasks = await db.tasks.toArray();
    const key = toDateKey(date);
    const active = allTasks.filter(t => {
      if (t.repeatRule === 'daily') return true;
      if (t.repeatRule === 'weekly') {
        return (t.daysOfWeek || []).includes(date.getDay());
      }
      return false;
    });
    setTasks(active);
    const occ = await db.occurrences.where({ date: key }).toArray();
    setOccurrences(occ);
  }

  async function toggleOcc(occ) {
    await db.occurrences.update(occ.id, { completed: !occ.completed, completedAt: !occ.completed ? new Date().toISOString() : null });
    load();
  }

  async function addTaskForDay() {
    if (!newTitle.trim()) return;
    const taskId = await db.tasks.add({
      title: newTitle.trim(),
      repeatRule: 'none',
      daysOfWeek: [],
      createdAt: new Date().toISOString()
    });
    const key = toDateKey(date);
    await db.occurrences.add({ taskId, date: key, completed: false });
    setNewTitle('');
    load();
  }

  async function ensureOccurrencesForTasks() {
    const key = toDateKey(date);
    for (const t of tasks) {
      const exists = await db.occurrences.where({ taskId: t.id, date: key }).first();
      if (!exists) {
        await db.occurrences.add({ taskId: t.id, date: key, completed: false });
      }
    }
    load();
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <header>
          <h3>{date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h