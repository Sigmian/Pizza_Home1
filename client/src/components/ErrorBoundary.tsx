import { Pizza, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-[#0A0A0A]">
          <div className="flex flex-col items-center w-full max-w-md text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 via-orange-500 to-yellow-500 flex items-center justify-center mb-6 shadow-lg shadow-red-500/30">
              <Pizza className="w-10 h-10 text-white" />
            </div>

            <h2
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", color: '#F5F5F5' }}
            >
              Something went wrong
            </h2>

            <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
              We hit an unexpected issue. Please try reloading the page.
            </p>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #DC2626, #EA580C, #F59E0B)',
                boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.25)',
              }}
            >
              <RotateCcw size={16} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
