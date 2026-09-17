"use client";

// Replaces the root layout when it fails, so it carries its own document and plain styles.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f6f8fa",
          color: "#0b2233",
          padding: "1rem",
        }}
      >
        <title>Ошибка — Bilim Merkezi</title>
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: "1.6rem" }}>Сайт временно недоступен</h1>
          <p style={{ color: "#51606d", lineHeight: 1.5 }}>
            Мы уже разбираемся. Попробуйте обновить страницу через минуту.
            {error.digest ? ` Код ошибки: ${error.digest}.` : ""}
          </p>
          <button
            onClick={() => retry()}
            style={{
              marginTop: 16,
              padding: "0.75rem 1.5rem",
              borderRadius: 12,
              border: 0,
              background: "#0b2233",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Обновить
          </button>
        </div>
      </body>
    </html>
  );
}
