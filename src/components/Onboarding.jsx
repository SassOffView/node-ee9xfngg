import React, { useState } from 'react';
import { db } from '../db';

export default function Onboarding({ onComplete }) {
  const [name, setName] = useState('');
  const [homeView, setHomeView] = useState('monthly');

  async function start() {
    if (!name.trim()) return;
    const id = await db.users.add({ name: name.trim(), createdAt: new Date().toISOString(), homeView });
    const user = await db.users.get(id);
    onComplete(user);
  }

  return (
    <div className="onboard">
      <div className="card">
        <h2>Benvenuto</h2>
        <label>Nome</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Il tuo nome" />
        <label>Vista iniziale</label>
        <select value={homeView} onChange={e => setHomeView(e.target.value)}>
          <option value="monthly">Mensile</option>
          <option value="weekly">Settimanale</option>
          <option value="daily">Giornaliera</option>
        </select>
        <button className="primary" onClick={start}>Inizia</button>
      </div>
    </div>
  );
}
