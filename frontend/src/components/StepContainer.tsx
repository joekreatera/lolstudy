import type { ReactNode } from 'react';

interface StepContainerProps {
  title?: string;
  children: ReactNode;
}

/** Narrow, centered reading column shared by every non-survey step. */
export default function StepContainer({ title, children }: StepContainerProps) {
  return (
    <div className="w-full max-w-xl py-12">
      {title && (
        <h1 className="mb-8 text-2xl font-semibold text-slate-100">{title}</h1>
      )}
      {children}
    </div>
  );
}
