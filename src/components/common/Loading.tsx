// src/components/common/Loading.tsx

interface LoadingProps {
  size?: "small" | "large";
  fullScreen?: boolean;
  message?: string;
}

export function Loading({
  size = "small",
  fullScreen = false,
  message,
}: LoadingProps) {
  const spinner = (
    <div className={`spinner ${size === "large" ? "spinner-lg" : ""}`} />
  );

  if (fullScreen) {
    return (
      <div className="loading-container" style={{ minHeight: "100vh" }}>
        <div className="text-center">
          {spinner}
          {message && <p className="text-muted mt-2">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="loading-container">
      <div className="text-center">
        {spinner}
        {message && <p className="text-muted mt-2">{message}</p>}
      </div>
    </div>
  );
}
