import useScrollReveal from '../../hooks/useScrollReveal'

const CARD_BASE =
  'mx-auto w-full max-w-[480px] rounded bg-[#ffffff] px-[30px] py-[40px] text-center text-[#333] shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-[translate,box-shadow,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)]'

const ENTRANCE_FROM_LEFT = '-translate-x-[120px] max-[700px]:translate-x-0'
const ENTRANCE_FROM_RIGHT = 'translate-x-[120px] max-[700px]:translate-x-0'

export default function FeatureCard({ title, description, direction, icon: Icon }) {
  const [ref, visible] = useScrollReveal()
  const entrance = direction === 'left' ? ENTRANCE_FROM_LEFT : ENTRANCE_FROM_RIGHT
  const visibility = visible
    ? 'pointer-events-auto translate-x-0 opacity-100'
    : `pointer-events-none opacity-0 ${entrance}`

  return (
    <article ref={ref} className={`${CARD_BASE} ${visibility}`}>
      <Icon className="mx-auto mb-4 h-10 w-10" />
      <h3 className="text-lg font-semibold text-[#222]">{title}</h3>
      <p className="mx-auto mt-2 max-w-[350px] text-sm leading-relaxed text-[#555]">
        {description}
      </p>
    </article>
  )
}
