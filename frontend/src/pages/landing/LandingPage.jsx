import FeatureCards from '../../components/landing/FeatureCards'
import Hero from '../../components/landing/Hero'
import LandingFooter from '../../components/landing/LandingFooter'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f5f6fa] font-sans text-[#333]">
      <Hero />
      <FeatureCards />
      <LandingFooter />
    </div>
  )
}
