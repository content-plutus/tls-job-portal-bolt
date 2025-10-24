import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-legal-navy-50 to-legal-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-16 h-16 text-legal-red-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-legal-navy-800 mb-4">
              Configuration Required
            </h1>
            
            <p className="text-legal-slate-600 mb-6">
              The application requires Supabase environment variables to be configured. 
              Please check your deployment settings.
            </p>
            
            <div className="bg-legal-slate-100 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm font-mono text-legal-slate-700">
                Missing variables:<br />
                • VITE_SUPABASE_URL<br />
                • VITE_SUPABASE_ANON_KEY
              </p>
            </div>
            
            <Button
              onClick={() => window.location.reload()}
              className="w-full"
              variant="primary"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}