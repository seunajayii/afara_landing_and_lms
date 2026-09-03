import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root")!;
// Keep the application surface explicitly non-editable. Individual form
// controls remain editable because native controls are independent editing
// hosts and are restored by the CSS baseline.
rootElement.contentEditable = "false";
createRoot(rootElement).render(<App />);
