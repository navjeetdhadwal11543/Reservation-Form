import 'bootstrap/dist/css/bootstrap.min.css'
import 'react-phone-input-2/lib/style.css'
import 'react-datepicker/dist/react-datepicker.css'

import './globals.css'

export const metadata = {
  title: 'Prenotazione Online | Antenati',
  description: 'Prenota un tavolo online al ristorante Antenati. Scegli data, orario e numero di coperti.',
  openGraph: {
    title: 'Prenotazione Online | Antenati',
    description: 'Prenota un tavolo online al ristorante Antenati.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='it'>
      <head>
        {/* Bootstrap Icons */}
        <link
          href='https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css'
          rel='stylesheet'
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
