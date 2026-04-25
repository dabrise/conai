import { useState } from 'react';
import type { ReactNode } from 'react';
import { Cpu, MessageSquare, BookOpen, Map, SlidersHorizontal, FileText, Clock } from 'lucide-react';

type TabId = 'models' | 'prompt' | 'adas' | 'scenarios' | 'params' | 'preview' | 'history';

interface SidebarProps {
  children: Record<TabId, ReactNode>;
}

const tabs: { id: TabId; icon: React.ElementType; label: string }[] = [
  { id: 'prompt', icon: MessageSquare, label: 'Prompt' },
  { id: 'adas', icon: BookOpen, label: 'ADAS' },
  { id: 'scenarios', icon: Map, label: 'Scenarios' },
  { id: 'models', icon: Cpu, label: 'Models' },
  { id: 'params', icon: SlidersHorizontal, label: 'Params' },
  { id: 'preview', icon: FileText, label: 'Preview' },
  { id: 'history', icon: Clock, label: 'History' },
];

export function Sidebar({ children }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<TabId>('prompt');

  return (
    <div className="flex h-full">
      <div className="w-14 bg-bg-secondary border-r border-border flex flex-col items-center py-2 gap-0.5 shrink-0">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-11 h-11 flex flex-col items-center justify-center rounded-lg transition-colors gap-0.5 ${
                isActive
                  ? 'bg-accent/15 text-accent'
                  : 'text-text-muted hover:text-text-secondary hover:bg-bg-tertiary/30'
              }`}
              title={tab.label}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[8px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {children[activeTab]}
      </div>
    </div>
  );
}
