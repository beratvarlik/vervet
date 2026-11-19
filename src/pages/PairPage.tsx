/**
 * /p — eşleme rotası. Kabuk (başlık/tab bar) yok; yalnızca logolu boş ekran.
 * /p#<secret> ile eşleme sonraki fazda eklenecek.
 */
export function PairPage() {
  return (
    <div className="flex h-dvh items-center justify-center bg-background pt-safe-top pb-safe-bottom">
      <img src="/icon.svg" alt="Vervet" className="size-24 rounded-3xl" />
    </div>
  )
}
