import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./lib/gsapRegister";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
