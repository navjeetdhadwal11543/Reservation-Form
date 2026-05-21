'use client'

import ReservationForm from '@/components/ReservationForm'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function ReservationPage() {
  const { scrollYProgress } = useScroll()

  // Shared movement
  const y = useTransform(scrollYProgress, [0, 1], [0, -50])

  // Heading animation (stronger)
  const h1Opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.6])
  const h1Brightness = useTransform(
    scrollYProgress,
    [0, 0.5],
    ['brightness(1)', 'brightness(1.4)'],
  )

  // Paragraph animation (slightly softer)
  const pOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.75])
  const pBrightness = useTransform(
    scrollYProgress,
    [0, 0.5],
    ['brightness(1)', 'brightness(1.2)'],
  )

  return (
    <div className='reservation-page'>
      <section className='reservation-hero'>
        <div className='hero-overlay'>
          <motion.h1 style={{ y, opacity: h1Opacity, filter: h1Brightness }}>
            Prenotazione Online
          </motion.h1>

          <motion.p style={{ y, opacity: pOpacity, filter: pBrightness }}>
            Inserisci i dati per prenotare un tavolo
          </motion.p>
        </div>
      </section>

      <section className='reservation-section'>
        <div className='reservation-wrapper'>
          <ReservationForm />
        </div>
      </section>
    </div>
  )
}
