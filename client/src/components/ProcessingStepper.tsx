import React from 'react';
import { CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';

export interface StageInfo {
  step: number;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
}

interface ProcessingStepperProps {
  stages: StageInfo[];
  errorMessage?: string;
}

export const ProcessingStepper: React.FC<ProcessingStepperProps> = ({
  stages,
  errorMessage
}) => {
  return (
    <div className="bg-white border border-sand rounded-lg p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="font-serif text-lg text-charcoal">Processing Pipeline Stages</h3>
        <p className="text-xs text-charcoal/60 mt-0.5">
          MeetMind AI follows a mandatory 4-stage processing workflow with zero artificial delays.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stages.map((stage) => {
          const isCompleted = stage.status === 'completed';
          const isActive = stage.status === 'active';
          const isFailed = stage.status === 'failed';
          const isPending = stage.status === 'pending';

          return (
            <div
              key={stage.step}
              className={`p-4 rounded border transition-all ${
                isCompleted
                  ? 'border-sage/40 bg-sage-light/40'
                  : isActive
                  ? 'border-terracotta/40 bg-terracotta-light/30 ring-1 ring-terracotta/30'
                  : isFailed
                  ? 'border-red-300 bg-red-50'
                  : 'border-sand/70 bg-ivory-light opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-charcoal/60">
                  Stage {stage.step}
                </span>
                {isCompleted && <CheckCircle2 className="w-4 h-4 text-sage" />}
                {isActive && <Loader2 className="w-4 h-4 text-terracotta animate-spin" />}
                {isFailed && <AlertCircle className="w-4 h-4 text-red-600" />}
                {isPending && <Clock className="w-4 h-4 text-sand-dark" />}
              </div>

              <h4 className="text-sm font-semibold text-charcoal mb-1">{stage.title}</h4>
              <p className="text-xs text-charcoal/70 leading-relaxed">{stage.description}</p>

              <div className="mt-3 pt-2 border-t border-sand/40 flex items-center justify-between text-[11px]">
                <span className="text-charcoal/50">Status:</span>
                <span
                  className={`font-medium capitalize ${
                    isCompleted
                      ? 'text-sage'
                      : isActive
                      ? 'text-terracotta animate-pulse'
                      : isFailed
                      ? 'text-red-600'
                      : 'text-charcoal/40'
                  }`}
                >
                  {stage.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {errorMessage && (
        <div className="mt-4 p-3.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Pipeline Execution Blocked:</span> {errorMessage}
          </div>
        </div>
      )}
    </div>
  );
};
