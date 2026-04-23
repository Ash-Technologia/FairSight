import Image from 'next/image'

export function Logo({ size = 36 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, position: 'relative', overflow: 'hidden', borderRadius: 8 }}>
      <Image 
        src="/fairsight_logo.png" 
        alt="FairSight Logo" 
        fill 
        style={{ objectFit: 'contain' }}
        priority
      />
    </div>
  )
}
