import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-800 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-emerald-400/30 shadow-xl max-w-md w-full">
            <h1 className="text-2xl font-bold text-white mb-4">Terjadi Kesalahan</h1>
            <p className="text-emerald-100 mb-4">
              Aplikasi mengalami error. Silakan refresh halaman.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all font-bold shadow-lg"
            >
              Refresh Halaman
            </button>
            {this.state.error && (
              <details className="mt-4">
                <summary className="text-emerald-200 cursor-pointer">Detail Error</summary>
                <pre className="mt-2 text-xs text-red-300 bg-black/20 p-3 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
