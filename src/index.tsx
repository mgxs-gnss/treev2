import ReactDOM from "react-dom/client";
import "./index.css";
import * as Sentry from "@sentry/react";
import App from "./App";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

Sentry.init({
  dsn: "https://b31ad64ddc0c41aaa7e09468dad4d6eb@o4505227351031808.ingest.sentry.io/4505227357978624",
  integrations: [new Sentry.BrowserTracing(), new Sentry.Replay()],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

root.render(<App />);
