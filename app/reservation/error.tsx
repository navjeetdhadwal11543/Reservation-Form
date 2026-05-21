'use client'

export default function ReservationError({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className='reservation-page'>
      <div style={{ maxWidth: 500, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
        <div className='reservation-card'>
          <h2 style={{ fontWeight: 700, marginBottom: 12 }}>Qualcosa è andato storto</h2>
          <p style={{ color: '#6c757d', marginBottom: 24 }}>
            Non siamo riusciti a caricare la pagina. Riprova.
          </p>
          <button className='btn btn-orange' onClick={reset}>
            Riprova
          </button>
        </div>
      </div>
    </div>
  )
}
