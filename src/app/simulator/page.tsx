'use client';

import Sidebar from '@/components/Sidebar';
import SimulatorPanel from '@/components/SimulatorPanel';

export default function SimulatorPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <SimulatorPanel storageKey="simulator" />
      </main>
    </div>
  );
}
