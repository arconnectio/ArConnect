import React, { useEffect } from "react";

export default function App() {
  useEffect(() => {
    localStorage.setItem("test", "tttttt");
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <p>Welcome page</p>
        <p>
          Edit <code>src/views/Welcome/App.tsx</code> and save.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}
