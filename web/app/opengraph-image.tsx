import { ImageResponse } from 'next/og'

export const alt = 'Naukrify — AI Job Hunt Co-pilot for India'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          padding: '60px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
            fontSize: 48,
            fontWeight: 800,
            color: '#4f46e5',
          }}
        >
          N
        </div>

        {/* Headline */}
        <h1
          style={{
            color: 'white',
            fontSize: 56,
            fontWeight: 800,
            textAlign: 'center',
            margin: '0 0 16px 0',
            lineHeight: 1.1,
            letterSpacing: '-1px',
          }}
        >
          AI Job Hunt Co-pilot for India
        </h1>

        {/* Subline */}
        <p
          style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: 28,
            textAlign: 'center',
            margin: '0 0 40px 0',
            fontWeight: 400,
          }}
        >
          Tailored CV + cover letter in 30 seconds. Built for Naukri, LinkedIn, Wellfound.
        </p>

        {/* Stat chips */}
        <div style={{ display: 'flex', gap: 16 }}>
          {['30 sec per application', 'Voice-rules filter', '₹499 for 3 months'].map((label) => (
            <div
              key={label}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 40,
                padding: '10px 24px',
                color: 'white',
                fontSize: 20,
                fontWeight: 500,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
