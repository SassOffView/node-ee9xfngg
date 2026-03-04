import React, { useEffect, useState } from 'react';
import { startOfMonth, endOfMonth, addDays, toDateKey } from '../utils/date';
import { db } from '../db';

function buildMonthGrid(date) {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const startWeekDay = start.getDay();
  const days = [];
  let cur = new Date(start);
  cur.setDate(cur.getDate() - startWeekDay);
  while (cur <= end || cur.getDay() !== 0) {
    days.push(new Date(cur));
    cur = addDays(cur, 1);
  }
  return days;
}

export default function Calendar({ onOpenDay }) {
  const [month, setMonth] = useState(new Date());
  const [statuses, setStatuses] = useState({});

  useEffect(() => {
    computeStatuses();
  }, [month]);

  async function computeStatuses() {
    const days = buildMonthGrid(month);
    const tasks = await db.tasks.toArray();
    const occs = await db.occurrences.toArray();
    const map = {};
    for (const d of days) {
      const key = toDateKey(d);
      const active = tasks.filter(t => {
        if (t.repeatRule === 'daily') return true;
        if (t.repeatRule === 'weekly') {
          const dow = d.getDay();
          return (t.daysOfWeek || []).includes(dow);
        }
        if (t.repeatRule === 'none') {
          return occs.some(o => o.date === key && o.taskId === t.id);
        }
        return false;
      });
      const total = active.length;
      const occForDay = occs.filter(o => o.date === key);
      const completed = occForDay.filter(o => o.completed).length;
      const pct = total === 0 ? null : Math.round((completed / total) * 100);
      const color = total === 0 ? 'none' : pct === 0 ? 'red' : pct === 100 ? 'green' : 'yellow';
      map[key] = { color, completed, total, pct };
    }
    setStatuses(map);
  }

  function prevMonth() {
    const d = new Date(month);
    d.setMonth(d.getMonth() - 1);
    setMonth(d);
  }
  function nextMonth() {
    const d = new Date(month);
    d.setMonth(d.getMonth() + 1);
    setMonth(d);
  }

  const days = buildMonthGrid(month);
  const monthLabel = month.toLocaleString('it-IT', { month: 'long', year: 'numeric' });

  return (
    <div className="calendar">
      <div className="cal-header">
        <button onClick={prevMonth}>‹</button>
        <div className="month-label">{monthLabel}</div>
        <button onClick={nextMonth}>›</button>
      </div>

      <div className="weekdays">
        {['Dom','Lun','Mar','Mer','Gio','Ven','Sab'].map(d => <div key={d}>{d}</div>)}
      </div>

      <div className="grid">
        {days.map((d) => {
          const key = toDateKey(d);
          const s = statuses[key] || { color: 'none' };
          const isCurrentMonth = d.getMonth() === month.getMonth();
          return (
            <button
              key={key}
              className={`cell ${isCurrentMonth ? '' : 'muted'}`}
              onClick={() => onOpenDay(new Date(d))}
            >
              <div className="date">{d.getDate()}</div>
              <div className={`indicator ${s.color}`}></div>
              {s.total > 0 && <div className="tooltip">{s.completed}/{s.total} ({s.pct}%)</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
