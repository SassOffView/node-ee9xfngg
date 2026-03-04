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
    const allOccs = await db.occurrences.where({ date: key }).toArray();

    // FIX: includi anche i task con repeatRule 'none' che hanno un'occorrenza per questo giorno
    const active = allTasks.filter(t => {
      if (t.repeatRule === 'daily') return true;
      if (t.repeatRule === 'weekly') {
        return (t.daysOfWeek || []).includes(date.getDay());
      }
      if (t.repeatRule === 'none') {
        return allOccs.some(o => o.taskId === t.id);
      }
      return false;
    });

    // FIX: crea automaticamente le occorrenze per i task ricorrenti che non le hanno ancora
    for (const t of active) {
      if (t.repeatRule === 'daily' || t.repeatRule === 'weekly') {
        const exists = allOccs.some(o => o.taskId === t.id);
        if (!exists) {
          await db.occurrences.add({ taskId: t.id, date: key, completed: false });
        }
      }
    }

    const occ = await db.occurrences.where({ date: key }).toArray();
    setTasks(active);
    setOccurrences(occ);
  }

  async function toggleOcc(occ) {
    await db.occurrences.update(occ.id, {
      completed: !occ.completed,
      completedAt: !occ.completed ? new Date().toISOString() : null
    });
    load();
  }

  async function addTaskForDay() {
    if (!newTitle.trim()) return;
    const key = toDateKey(date);
    const taskId = await db.tasks.add({
      title: newTitle.trim(),
      repeatRule: 'none',
      daysOfWeek: [],
      createdAt: new Date().toISOString()
    });
    await db.occurrences.add({ taskId, date: key, completed: false });
    setNewTitle('');
    load();
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <header>
          <h3>{date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
          <button className="close" onClick={onClose}>✕</button>
        </header>
        <div className="modal-body">
          <ul className="task-list">
            {tasks.map(t => {
              const occ = occurrences.find(o => o.taskId === t.id);
              return (
                <li key={t.id} className="task-item">
                  <input
                    type="checkbox"
                    checked={occ ? occ.completed : false}
                    onChange={() => occ && toggleOcc(occ)}
                  />
                  <span>{t.title}</span>
                </li>
              );
            })}
          </ul>
          <div className="add-row">
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Aggiungi task per oggi..."
              onKeyDown={e => e.key === 'Enter' && addTaskForDay()}
            />
            <button className="small" onClick={addTaskForDay}>+</button>
          </div>
        </div>
      </div>
    </div>
  );
}
