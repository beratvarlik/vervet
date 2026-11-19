type PlaceholderProps = {
  title: string
  description?: string
}

export function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <section className="flex min-h-full flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground">
        {description ?? 'Bu sayfa henüz hazır değil.'}
      </p>
    </section>
  )
}
