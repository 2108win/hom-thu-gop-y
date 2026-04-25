export default function LoadingSurveyRedirect() {
  return (
    <main className="site-canvas bg-background flex min-h-dvh items-center justify-center p-4 text-center">
      <div className="card shine-card border-base-300 bg-base-100 w-full max-w-sm border shadow-sm">
        <div className="card-body p-6">
          <div className="skeleton mx-auto mb-3 size-10" />
          <p className="text-primary text-sm font-semibold uppercase">
            Đang chuyển đến khảo sát...
          </p>
        </div>
      </div>
    </main>
  );
}
