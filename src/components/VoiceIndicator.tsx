import type { LiveSessionState } from '../types';

interface VoiceIndicatorProps {
  state: LiveSessionState;
  size?: 'sm' | 'lg';
}

const stateConfig: Record<LiveSessionState, { color: string; label: string; animate: boolean }> = {
  idle: { color: 'bg-text-muted', label: 'Idle', animate: false },
  listening: { color: 'bg-blue-500', label: 'Listening', animate: true },
  processing: { color: 'bg-amber-500', label: 'Processing', animate: true },
  'awaiting-approval': { color: 'bg-purple-500', label: 'Awaiting Approval', animate: true },
  responding: { color: 'bg-green-500', label: 'Speaking', animate: true },
};

export function VoiceIndicator({ state, size = 'sm' }: VoiceIndicatorProps) {
  const config = stateConfig[state];
  const isLarge = size === 'lg';

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Animated orb */}
      <div className={`relative flex items-center justify-center ${isLarge ? 'w-24 h-24' : 'w-10 h-10'}`}>
        {/* Outer pulse ring */}
        {config.animate && (
          <>
            <div className={`absolute inset-0 rounded-full ${config.color} opacity-20 animate-ping`}
              style={{ animationDuration: state === 'listening' ? '2s' : '1.5s' }}
            />
            <div className={`absolute rounded-full ${config.color} opacity-10 ${isLarge ? 'inset-[-12px]' : 'inset-[-6px]'}`}
              style={{ animation: 'pulse 2s ease-in-out infinite' }}
            />
          </>
        )}
        {/* Core dot */}
        <div className={`relative rounded-full ${config.color} ${isLarge ? 'w-16 h-16' : 'w-6 h-6'} flex items-center justify-center`}>
          {/* Inner bars for speaking state */}
          {state === 'responding' && (
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className={`${isLarge ? 'w-1.5' : 'w-0.5'} bg-white rounded-full`}
                  style={{
                    height: isLarge ? '20px' : '8px',
                    animation: `soundbar 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
                  }}
                />
              ))}
            </div>
          )}
          {/* Microphone icon for listening */}
          {state === 'listening' && (
            <svg className={`${isLarge ? 'w-7 h-7' : 'w-3 h-3'} text-white`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          )}
          {/* Spinner for processing */}
          {state === 'processing' && (
            <div className={`${isLarge ? 'w-8 h-8' : 'w-3 h-3'} border-2 border-white/30 border-t-white rounded-full animate-spin`} />
          )}
          {/* Clock for awaiting approval */}
          {state === 'awaiting-approval' && (
            <svg className={`${isLarge ? 'w-7 h-7' : 'w-3 h-3'} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          )}
        </div>
      </div>
      {/* Label */}
      <div className={`font-medium ${isLarge ? 'text-sm' : 'text-[10px]'}`} style={{ color: config.color.replace('bg-', '').includes('text') ? undefined : undefined }}>
        <span className={`${
          state === 'listening' ? 'text-blue-400' :
          state === 'processing' ? 'text-amber-400' :
          state === 'awaiting-approval' ? 'text-purple-400' :
          state === 'responding' ? 'text-green-400' :
          'text-text-muted'
        }`}>
          {config.label}
        </span>
      </div>
    </div>
  );
}
