import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(err) {
    return { error: err };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', backgroundColor: '#14121c', color: '#ede5d8',
          fontFamily: 'monospace', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column', padding: 32, gap: 16,
        }}>
          <div style={{ color: '#cc7a6e', fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            erreur JavaScript
          </div>
          <pre style={{
            backgroundColor: '#1a1727', border: '1px solid #4a3f5c',
            padding: 16, borderRadius: 4, maxWidth: 600, overflow: 'auto',
            fontSize: 11, color: '#c58aa0', whiteSpace: 'pre-wrap',
          }}>
            {String(this.state.error)}
            {'\n\n'}
            {this.state.error?.stack || ''}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#252237', border: '1px solid #5a526a',
              color: '#ede5d8', padding: '8px 20px', cursor: 'pointer',
              fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.2em',
              textTransform: 'uppercase',
            }}
          >
            recharger
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
