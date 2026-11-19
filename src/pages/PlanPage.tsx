import { useParams } from 'react-router'

import { Placeholder } from '@/pages/Placeholder'

export function PlanPage() {
  const { id } = useParams<{ id: string }>()
  return <Placeholder title="Plan" description={`Plan ayrıntısı (${id}) burada görünecek.`} />
}
