import React, { useEffect, useState } from 'react';
import { db } from './db';
import Calendar from './components/Calendar';
import DayModal from './components/DayModal';
import Onboarding from './components/Onboarding';

export default function App() {
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState('monthly');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    (async () => {
      const u = await db.users.toArray();
      if (u.length) {
        setUser(u[0]);
        setView(u[0].homeView || 'monthly');
      }
    })();
  }, []);

  function triggerRefresh() {
    setRefreshKey(k => k + 1);
  }

  if (!user) {
    return <Onboarding onComplete={(u) => { setUser(u); setView(u.homeView || 'monthly'); }} />;
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Routine</h1>
        <div className="controls">
          <select value={view} onChange={e => { setView(e.target.value); db.users.update(user.id, { homeView: e.target.value }); }}>
            <option value="monthly">Mensile</option>
            <option value="weekly">Settimanale</option>
            <option value="daily">Giornaliera</option>
          </select>
        </div>
      </header>

      <main>
        <Calendar key={refreshKey} onOpenDay={(d) => setSelectedDate(d)} />
      </main>

      {selectedDate && (
        <DayModal date={selectedDate} onClose={() => { setSelectedDate(null); triggerRefresh(); }} />
      )}
    </div>
  );
}
