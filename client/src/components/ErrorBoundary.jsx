import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ServiGo ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FFFBFC',
            color: '#001E2B',
            padding: '24px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              background: '#FFFFFF',
              border: '1.5px solid rgba(16, 196, 168, 0.4)',
              borderRadius: '20px',
              padding: '36px',
              textAlign: 'center',
              boxShadow: '0 20px 50px rgba(0, 30, 43, 0.1)',
              backdropFilter: 'blur(16px)'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 196, 168, 0.15)',
                border: '2px solid #10C4A8',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                color: '#10C4A8',
                marginBottom: '20px'
              }}
            >
              🛠️
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '12px', color: '#001E2B' }}>
              Oops! Something unexpected happened
            </h2>
            <p style={{ color: '#3D4F58', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
              ServiGo encountered a temporary glitch while rendering this view.
            </p>
            {this.state.error?.message && (
              <pre
                style={{
                  background: '#F0FAF8',
                  border: '1px solid rgba(16, 196, 168, 0.25)',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '12px',
                  color: '#D9534F',
                  textAlign: 'left',
                  overflowX: 'auto',
                  marginBottom: '24px'
                }}
              >
                {this.state.error.toString()}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: '#10C4A8',
                  color: '#001E2B',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 22px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                🔄 Refresh Page
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  background: 'transparent',
                  color: '#CAF0F8',
                  border: '1.5px solid rgba(202, 240, 248, 0.3)',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
