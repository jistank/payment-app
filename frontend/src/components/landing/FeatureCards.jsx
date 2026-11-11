import { useTranslation } from 'react-i18next'
import FeatureCard from './FeatureCard'
import {
  BusinessIcon,
  GiftIcon,
  GlobalTransactionsIcon,
  MoneyExchangeIcon,
  QrPaymentIcon,
} from './icons'

const CARDS = [
  { id: 'globalTransactions', direction: 'left', icon: GlobalTransactionsIcon },
  { id: 'moneyExchange', direction: 'right', icon: MoneyExchangeIcon },
  { id: 'gift', direction: 'left', icon: GiftIcon },
  { id: 'qrPayment', direction: 'right', icon: QrPaymentIcon },
  { id: 'business', direction: 'left', icon: BusinessIcon },
]

export default function FeatureCards() {
  const { t } = useTranslation('landing')

  return (
    <section className="mx-auto flex max-w-[960px] flex-col gap-6 px-5 pb-20 pt-[60px]">
      {CARDS.map(({ id, direction, icon }) => (
        <FeatureCard
          key={id}
          title={t(`features.${id}.title`)}
          description={t(`features.${id}.description`)}
          direction={direction}
          icon={icon}
        />
      ))}
    </section>
  )
}
