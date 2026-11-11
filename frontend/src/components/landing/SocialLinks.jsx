import { FacebookIcon, InstagramIcon, LinkedInIcon, TikTokIcon, XIcon } from './icons'

const SOCIALS = [
  { id: 'x', label: 'X', icon: XIcon },
  { id: 'tiktok', label: 'TikTok', icon: TikTokIcon },
  { id: 'instagram', label: 'Instagram', icon: InstagramIcon },
  { id: 'facebook', label: 'Facebook', icon: FacebookIcon },
  { id: 'linkedin', label: 'LinkedIn', icon: LinkedInIcon },
]

const ICON_CLASSNAME = 'h-4 w-4 fill-white'

export default function SocialLinks() {
  return (
    <div className="mt-3 flex justify-center gap-3">
      {SOCIALS.map(({ id, label, icon: Icon }) => (
        <a
          key={id}
          href="#"
          aria-label={label}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white no-underline transition-[background-color,translate,scale] duration-300 hover:-translate-y-0.5 hover:scale-105 hover:bg-white/25"
        >
          <Icon className={ICON_CLASSNAME} />
        </a>
      ))}
    </div>
  )
}
