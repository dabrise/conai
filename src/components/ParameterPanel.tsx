import type { LLMParams } from '../types';
import { SlidersHorizontal } from 'lucide-react';

interface ParameterPanelProps {
  params: LLMParams;
  onParamsChange: (params: LLMParams) => void;
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  description: string;
  onChange: (value: number) => void;
}

function ParamSlider({ label, value, min, max, step, description, onChange }: SliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium text-text-primary">{label}</span>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={e => onChange(parseFloat(e.target.value) || min)}
          className="w-16 bg-bg-primary border border-border rounded px-1.5 py-0.5 text-[11px] text-text-primary text-right focus:outline-none focus:border-accent"
        />
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-accent bg-bg-tertiary"
      />
      <div className="text-[10px] text-text-muted mt-0.5">{description}</div>
    </div>
  );
}

export function ParameterPanel({ params, onParamsChange }: ParameterPanelProps) {
  const update = (key: keyof LLMParams, value: number) => {
    onParamsChange({ ...params, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <SlidersHorizontal className="w-4 h-4 text-accent" />
        <span className="text-xs font-semibold text-text-primary">Hyperparameters</span>
      </div>

      <ParamSlider
        label="Temperature"
        value={params.temperature}
        min={0}
        max={2}
        step={0.05}
        description="Higher = more creative/random, Lower = more focused/deterministic"
        onChange={v => update('temperature', v)}
      />

      <ParamSlider
        label="Top P"
        value={params.topP}
        min={0}
        max={1}
        step={0.05}
        description="Nucleus sampling threshold. Lower = less random"
        onChange={v => update('topP', v)}
      />

      <ParamSlider
        label="Max Tokens"
        value={params.maxTokens}
        min={50}
        max={4096}
        step={50}
        description="Maximum response length in tokens"
        onChange={v => update('maxTokens', v)}
      />

      <ParamSlider
        label="Frequency Penalty"
        value={params.frequencyPenalty}
        min={-2}
        max={2}
        step={0.1}
        description="Penalize repeated tokens. Higher = less repetition"
        onChange={v => update('frequencyPenalty', v)}
      />

      <ParamSlider
        label="Presence Penalty"
        value={params.presencePenalty}
        min={-2}
        max={2}
        step={0.1}
        description="Penalize tokens already in the text. Higher = more topic diversity"
        onChange={v => update('presencePenalty', v)}
      />

      <div className="pt-2 border-t border-border">
        <button
          onClick={() => onParamsChange({
            temperature: 0.7,
            topP: 0.9,
            maxTokens: 512,
            frequencyPenalty: 0,
            presencePenalty: 0,
          })}
          className="text-[10px] text-accent hover:text-accent-hover"
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
