import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App crashed:', error, info.componentStack);
    this.setState({ errorMessage: `${error.name}: ${error.message}` });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">!</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Er ging iets mis
            </h2>
            <p className="text-gray-600 mb-4">
              De app is gecrasht. Klik op de knop om opnieuw te laden.
            </p>
            {this.state.errorMessage && (
              <p className="text-xs text-gray-400 mb-4 font-mono break-all bg-gray-50 p-2 rounded">
                {this.state.errorMessage}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Opnieuw laden
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
