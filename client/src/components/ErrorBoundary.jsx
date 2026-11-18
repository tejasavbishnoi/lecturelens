import { Component } from "react";
import "../App.css";

// Catches crashes anywhere in the app and shows a friendly screen instead of a blank page
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("LectureLens crashed:", error, info);
  }

  resetData = () => {
    if (confirm("This removes all saved lectures from this browser. Continue?")) {
      localStorage.removeItem("lecturelens:lectures");
      location.reload();
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="crash">
        <div className="crash-card">
          <div className="empty-icon">🔍</div>
          <h1>Something went wrong</h1>
          <p className="muted">
            LectureLens hit an unexpected error. Reloading the page usually fixes it.
          </p>
          <pre>{String(this.state.error?.message || this.state.error)}</pre>
          <div className="modal-actions">
            <button className="btn btn-ghost" onClick={this.resetData}>
              Reset saved data
            </button>
            <button className="btn btn-primary" onClick={() => location.reload()}>
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
