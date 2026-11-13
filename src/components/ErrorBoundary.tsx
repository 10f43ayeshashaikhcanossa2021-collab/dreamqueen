import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  declare readonly props: Readonly<{ children: React.ReactNode }>;
  state: ErrorBoundaryState = { hasError: false, errorMessage: '' };

  constructor(props: { children: React.ReactNode }) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected rendering issue occurred.'
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FDF9F4] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl border border-[#EAD5C5] p-8 text-center shadow-lg space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-700 flex items-center justify-center mx-auto border border-red-200">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-[#5B3A29]">
              Something went wrong
            </h1>
            <p className="text-xs text-[#6E6863] leading-relaxed">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-full bg-[#5B3A29] text-white text-xs font-semibold inline-flex items-center gap-2 hover:bg-[#43291B]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload DreamQueen Atelier</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
