import { useState, useCallback, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

const MAX_JOBS = 10;

type Message = { role: "user" | "assistant"; content: string };

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: `Welcome to **JobFit**! I'm here to help you assess how well your CV matches job descriptions.

**To get started:**
1. Upload your CV using the button below
2. Add at least one job description
3. Ask me any questions about your fit — I'll analyze your CV against the jobs and give you insights

Ready when you are!`,
};

type ApiResponse = {
  sessionId?: string;
  response?: string;
  error?: string;
};

async function sendToApi(
  sessionId: string | null,
  cvFile: File | null,
  jobFiles: File[],
  input: string,
  resetSession?: boolean
): Promise<ApiResponse> {
  const formData = new FormData();
  if (sessionId && !resetSession) formData.append("sessionId", sessionId);
  if (cvFile) formData.append("cv", cvFile);
  jobFiles.forEach((f) => formData.append("jobs", f));
  if (input.trim()) formData.append("input", input.trim());

  const res = await fetch("/api/chat", {
    method: "POST",
    body: formData,
  });
  return res.json();
}

export default function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jobFiles, setJobFiles] = useState<File[]>([]);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canQuery = cvFile !== null && jobFiles.length >= 1;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const upload = useCallback(
    async (opts: { cv?: File | null; jobs?: File[]; input?: string; resetSession?: boolean }) => {
      setLoading(true);
      setError(null);
      const userInput = opts.input ?? "";
      const doReset = opts.resetSession ?? false;
      if (doReset) {
        setMessages([WELCOME_MESSAGE]);
      } else if (userInput.trim()) {
        setMessages((prev) => [...prev, { role: "user", content: userInput.trim() }]);
      }
      try {
        const data = await sendToApi(
          doReset ? null : sessionId,
          opts.cv !== undefined ? opts.cv : cvFile,
          opts.jobs ?? jobFiles,
          userInput,
          doReset
        );
        if (data.sessionId) setSessionId(data.sessionId);
        if (data.response) {
          setMessages((prev) => [...prev, { role: "assistant", content: data.response! }]);
        }
        if (data.error) setError(data.error);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed");
      } finally {
        setLoading(false);
      }
    },
    [sessionId, cvFile, jobFiles]
  );

  const onCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCvFile(file);
    setError(null);
    upload({ cv: file, jobs: jobFiles });
    e.target.value = "";
  };

  const onClearCv = (e: React.MouseEvent) => {
    e.preventDefault();
    setCvFile(null);
    setSessionId(null);
    setMessages([WELCOME_MESSAGE]);
    setError(null);
  };

  const onJobsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_JOBS);
    setJobFiles(files);
    setError(null);
    if (files.length > 0) {
      upload({ jobs: files });
    }
    e.target.value = "";
  };

  const onRemoveJob = (index: number) => {
    const next = jobFiles.filter((_, i) => i !== index);
    setJobFiles(next);
    setError(null);
    if (next.length > 0 && cvFile) {
      upload({ cv: cvFile, jobs: next, resetSession: true });
    } else {
      setSessionId(null);
      setMessages([WELCOME_MESSAGE]);
    }
  };

  const onSubmitQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canQuery || !query.trim()) return;
    upload({ input: query.trim() });
    setQuery("");
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>JobFit</h1>
      </header>

      <main className="chat-main">
        <div className="conversation-pane">
          <div className="messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message message--${msg.role}`}>
                <span className="message-role">{msg.role === "user" ? "You" : "JobFit"}</span>
                <div className="message-content">
                  {msg.role === "assistant" ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="message message--assistant">
                <span className="message-role">JobFit</span>
                <div className="message-content">Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {error && <div className="chat-error">{error}</div>}

        <div className={`chat-input-area ${loading ? "is-loading" : ""}`}>
          <div className="chat-attachments">
            <div className="attachment-group">
              <label className="attachment-btn">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={onCvChange}
                  disabled={loading}
                  hidden
                />
                <span className="attachment-label">CV</span>
                {cvFile ? (
                  <span className="attachment-value">{cvFile.name}</span>
                ) : (
                  <span className="attachment-placeholder">Add CV</span>
                )}
              </label>
              {cvFile && (
                <button
                  type="button"
                  className="attachment-remove"
                  onClick={onClearCv}
                  disabled={loading}
                  aria-label="Remove CV"
                >
                  ×
                </button>
              )}
            </div>
            <label className="attachment-btn">
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                multiple
                onChange={onJobsChange}
                disabled={loading}
                hidden
              />
              <span className="attachment-label">Jobs</span>
              {jobFiles.length > 0 ? (
                <span className="attachment-value">{jobFiles.length} file{jobFiles.length !== 1 ? "s" : ""}</span>
              ) : (
                <span className="attachment-placeholder">Add jobs</span>
              )}
            </label>
          </div>
          {jobFiles.length > 0 && (
            <div className="job-files">
              {jobFiles.map((f, i) => (
                <span key={i} className="job-file-chip">
                  {f.name}
                  <button
                    type="button"
                    className="chip-remove"
                    onClick={() => onRemoveJob(i)}
                    disabled={loading}
                    aria-label={`Remove ${f.name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <form className="chat-form" onSubmit={onSubmitQuery}>
            <input
              id="query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={canQuery ? "Ask a question..." : "Upload CV and at least 1 job to continue"}
              disabled={!canQuery || loading}
              className="chat-input"
            />
            <button
              type="submit"
              disabled={!canQuery || loading || !query.trim()}
              className="chat-send"
              aria-label="Send"
            >
              →
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
