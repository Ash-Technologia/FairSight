export default function Loading() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(248, 250, 252, 0.8)', // Matches var(--bg) with slight transparency
      backdropFilter: 'blur(12px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{ position: 'relative', width: 64, height: 64, marginBottom: 24 }}>
        {/* Outer spinning ring */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '3px solid transparent',
          borderTopColor: 'var(--teal)',
          borderRightColor: 'var(--teal-light)',
          animation: 'spin 1s linear infinite',
        }} />
        
        {/* Inner pulsing shield */}
        <div style={{
          position: 'absolute',
          inset: 8,
          borderRadius: 14,
          background: 'linear-gradient(135deg, var(--teal-light), var(--teal))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          boxShadow: '0 4px 14px rgba(13, 148, 136, 0.4)'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
        </div>
      </div>
      
      <div style={{
        fontSize: 16,
        fontWeight: 800,
        color: 'var(--navy)',
        letterSpacing: '-0.02em',
        marginBottom: 8
      }}>
        FairSight Edge Computing
      </div>
      <div style={{
        fontSize: 13,
        color: 'var(--slate)',
        fontFamily: 'DM Mono, monospace',
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', animation: 'pulse 1.5s infinite' }} />
        Compiling UI modules...
      </div>
    </div>
  )
}
