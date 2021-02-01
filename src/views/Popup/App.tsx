import React from "react";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <p>Popup page</p>
        <p>
          Edit <code>src/views/Popup/App.tsx</code> and save.
        </p>
        <p>From localStorage: {localStorage.getItem("test")}</p>
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

export default App;
