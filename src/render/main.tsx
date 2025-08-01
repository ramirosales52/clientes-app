import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import "./App.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <ThemeProvider defaultTheme="light">
      <App />
    </ThemeProvider>
  </BrowserRouter>,
);
