export default function PublicHome() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">Move Mountains Artisan Market</h1>
        <p className="text-lg text-muted-foreground mb-6">
          The public site is currently served from the existing static HTML at <code>/site/</code>.
          A Next.js migration is staged but not yet rolled out.
        </p>
        <p className="text-sm text-muted-foreground">
          Admin / CRM access at <a href="/admin" className="text-primary underline">/admin</a>
        </p>
      </div>
    </main>
  );
}
