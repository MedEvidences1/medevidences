import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CalculatorPage from "./pages/CalculatorPage";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CalculatorPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
