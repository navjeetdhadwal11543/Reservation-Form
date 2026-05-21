'use client'

import { useState, useRef, useEffect } from 'react'
import PhoneInput, { CountryData } from 'react-phone-input-2'

import { Prenotazione, Location, Option } from '@/types/reservation'
import {
  createReservation,
  getLocations,
  getOptions,
  getAvailableSlots,
} from '@/services/reservationService'

const ONLY_LETTERS_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]*$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ReservationForm() {
  const [form, setForm] = useState<Prenotazione>({
    nome: '',
    cognome: '',
    posizione: 'dentro',
    numeroPosti: 1,
    data: '',
    orario: '',
    note: '',
    email: '',
    telefono: '',
    opzioni: {
      seggiolino: false,
      stufa: false,
    },
  })

  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submissionTimes = useRef<number[]>([])
  const [isBanned, setIsBanned] = useState(false)
  const [dialCode, setDialCode] = useState('39')
  const [numberPart, setNumberPart] = useState('')
  const [locations, setLocations] = useState<Location[]>([])
  const [options, setOptions] = useState<Option[]>([])

  useEffect(() => {
    Promise.all([getLocations(), getOptions()])
      .then(([loc, opt]) => {
        setLocations(loc)
        setOptions(opt)
      })
      .catch((err) => {
        console.error('Failed to fetch locations or options:', err)
      })
  }, [])

  const getToday = () => new Date().toLocaleDateString('en-CA')
  const getEndOfYear = () => `${new Date().getFullYear()}-12-31`

  const isLargeGroup = form.numeroPosti > 9

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target

    if (name === 'numeroPosti') {
      setForm((prev) => ({ ...prev, numeroPosti: Number(value) }))
      return
    }

    if (name === 'posizione') {
      setForm((prev) => ({
        ...prev,
        posizione: value as 'dentro' | 'fuori',
        opzioni: {
          ...prev.opzioni,
          stufa: value === 'fuori' ? prev.opzioni.stufa : false,
        },
      }))
      return
    }

    if (name === 'seggiolino' || name === 'stufa') {
      setForm((prev) => ({
        ...prev,
        opzioni: { ...prev.opzioni, [name]: value === 'true' },
      }))
      return
    }

    //  FETCH SLOTS WHEN DATE CHANGES
    if (name === 'data') {
      setForm((prev) => ({ ...prev, data: value, orario: '' }))
      setAvailableTimes([])

      //  Calculate day number from date
      const [y, mo, d] = value.split('-').map(Number)
      const selectedDate = new Date(y, mo - 1, d)
      const dayNumber = selectedDate.getDay()

      //  Send day number to backend
      const fetchSlots = async () => {
        try {
          const times = await getAvailableSlots(dayNumber)
          if (times.length === 0) {
            setError(
              'Nessun orario disponibile. Contattaci direttamente per prenotare.',
            )
          }
          setAvailableTimes(times)
        } catch (err) {
          console.error('Failed to fetch slots:', err)
          setError(
            'Impossibile caricare gli orari. Contattaci direttamente per prenotare.',
          )
          setAvailableTimes([])
        }
      }

      fetchSlots()
      return
    }

    if (name === 'nome' || name === 'cognome') {
      if (!ONLY_LETTERS_REGEX.test(value)) return
    }

    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (isBanned) return setError('Sessione bloccata per troppi tentativi.')

    const now = Date.now()
    submissionTimes.current.push(now)
    if (submissionTimes.current.length > 3) submissionTimes.current.shift()

    if (
      submissionTimes.current.length === 3 &&
      submissionTimes.current[2] - submissionTimes.current[0] < 2000
    ) {
      setIsBanned(true)
      return setError('Troppi tentativi ravvicinati. Sessione bloccata.')
    }

    if (!form.nome.trim()) return setError('Il nome è obbligatorio.')
    if (!form.data) return setError('Seleziona una data.')
    if (!form.orario) return setError('Seleziona un orario.')
    if (form.numeroPosti < 1) return setError('Seleziona almeno un coperto.')
    if (form.numeroPosti > 9)
      return setError(
        'Per gruppi superiori a 9 persone, contattaci direttamente.',
      )
    if (form.email && !EMAIL_REGEX.test(form.email))
      return setError('Email non valida.')

    const digitsOnly = numberPart.replace(/\D/g, '')
    if (numberPart && digitsOnly.length < 9)
      return setError('Numero troppo corto.')
    if (!form.email && !numberPart)
      return setError('Inserisci email o telefono.')

    try {
      setIsSubmitting(true)

      const sanitizedForm = {
        ...form,
        nome: (form.nome ?? '').trim(),
        cognome: (form.cognome ?? '').trim(),
        email: (form.email ?? '').trim().toLowerCase(),
        note: (form.note ?? '').trim(),
        telefono: numberPart ? dialCode + numberPart : '',
      }

      await createReservation(sanitizedForm, locations, options)

      setSuccess(true)
    } catch {
      setError("Errore durante l'invio.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setForm({
      nome: '',
      cognome: '',
      posizione: 'dentro',
      numeroPosti: 1,
      data: '',
      orario: '',
      note: '',
      email: '',
      telefono: '',
      opzioni: { seggiolino: false, stufa: false },
    })
    setDialCode('39')
    setNumberPart('')
    setSuccess(false)
    setError(null)
    setAvailableTimes([])
    setIsBanned(false)
    submissionTimes.current = []
  }

  if (success) {
    return (
      <div className='success-container fade-in'>
        <div className='success-icon-circle'>
          <span className='checkmark-icon'>✅</span>
        </div>
        <h2 className='success-title'>Richiesta inviata!</h2>
        <p className='success-subtitle'>
          La tua prenotazione è in fase di verifica.
        </p>
        <div className='info-box'>
          <h5 className='info-title'>Cosa succede adesso?</h5>
          <p className='info-text'>
            Riceverai un messaggio di conferma tramite i nostri canali
            ufficiali.
          </p>
          <div className='methods-grid'>
            <div className='method-item'>
              <span className='whatsapp-color' style={{ fontSize: '1.5rem' }}>
                📱
              </span>
              <div className='method-label'>WhatsApp</div>
            </div>
            <div className='method-item'>
              <span className='telegram-color' style={{ fontSize: '1.5rem' }}>
                ✈️
              </span>
              <div className='method-label'>Telegram</div>
            </div>
            <div className='method-item'>
              <span className='link-color' style={{ fontSize: '1.5rem' }}>
                📧
              </span>
              <div className='method-label'>Email</div>
            </div>
          </div>
          <div className='info-footer'>
            Solitamente rispondiamo entro pochi minuti.
          </div>
        </div>

        <button className='btn-back' onClick={handleReset}>
          Nuova Prenotazione
        </button>
      </div>
    )
  }

  return (
    <div className='reservation-card fade-in'>
      {error && <div className='alert alert-danger'>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className='row g-4'>
          {/* Left Column - Matches your .col-md-6.border-end CSS selector */}
          <div className='col-md-6 border-end pe-md-4'>
            <div className='mb-3'>
              <label className='form-label fw-semibold'>Nome *</label>
              <input
                type='text'
                name='nome'
                className='form-control'
                required
                value={form.nome}
                onChange={handleChange}
                placeholder='Es:Mario'
              />
            </div>
            <div className='mb-3'>
              <label className='form-label fw-semibold'>Posizione *</label>
              <select
                name='posizione'
                className='form-select'
                value={form.posizione}
                onChange={handleChange}
              >
                <option value='dentro'>Dentro</option>
                <option value='fuori'>Fuori</option>
              </select>
            </div>
            <div className='mb-3'>
              <label className='form-label fw-semibold'>Data *</label>
              <input
                type='date'
                name='data'
                required
                min={getToday()}
                max={getEndOfYear()}
                className='form-control'
                value={form.data}
                onChange={handleChange}
              />
            </div>
            <div className='mb-3'>
              <label className='form-label fw-semibold'>Email</label>
              <input
                type='email'
                name='email'
                className='form-control'
                value={form.email ?? ''}
                onChange={handleChange}
                placeholder='esempio@email.com'
              />
            </div>
          </div>

          {/* Right Column - Matches .col-md-6.ps-md-4 CSS selector in globals.css file */}
          <div className='col-md-6 ps-md-4'>
            <div className='mb-3'>
              <label className='form-label fw-semibold'>Cognome</label>
              <input
                type='text'
                name='cognome'
                className='form-control'
                value={form.cognome ?? ''}
                onChange={handleChange}
                placeholder='Es:Rossi'
              />
            </div>
            <div className='mb-3'>
              <label className='form-label fw-semibold'>N. Coperti *</label>
              <input
                type='number'
                name='numeroPosti'
                min='1'
                className='form-control'
                value={form.numeroPosti}
                onChange={handleChange}
              />
              {isLargeGroup && (
                <div className='warning-box mt-2'>
                  Più di 9 persone, devi contattarci direttamente.
                </div>
              )}
            </div>
            <div className='mb-3'>
              <label className='form-label fw-semibold'>Orario *</label>
              <select
                key={form.data}
                name='orario'
                className='form-select'
                required
                disabled={!form.data}
                value={form.orario}
                onChange={handleChange}
              >
                <option value=''>Seleziona orario</option>
                {availableTimes.map((t, index) => (
                  <option key={`${t}-${index}`} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className='mb-3'>
              <label className='form-label fw-semibold'>Telefono</label>
              <div className='phone-row'>
                <div className='phone-prefix-box'>
                  <PhoneInput
                    country={'it'}
                    enableSearch
                    onChange={(v, d: CountryData) => {
                      setDialCode(d.dialCode)
                    }}
                    inputStyle={{ display: 'none' }}
                    buttonStyle={{ border: 'none', background: 'transparent' }}
                  />
                  <span className='dial-code-text'>+{dialCode}</span>
                </div>
                <div className='phone-number-wrapper'>
                  <input
                    type='tel'
                    className='phone-number-input'
                    value={numberPart}
                    placeholder='3123456789'
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '')
                      setNumberPart(digits)
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='mt-4'>
          <label className='form-label fw-semibold'>Note</label>
          <input
            type='text'
            name='note'
            className='form-control'
            value={form.note}
            onChange={handleChange}
            placeholder='Allergie, compleanni...'
          />
        </div>

        <div className='mt-5'>
          <label className='form-label fw-semibold'>Opzioni Extra</label>
          {/*<h5 className='fw-bold mb-3'>Opzioni Extra</h5>*/}
          <div className='row g-3'>
            <div className='col-md-6'>
              <select
                name='seggiolino'
                className='form-select'
                onChange={handleChange}
                value={String(form.opzioni.seggiolino)}
              >
                <option value='false'>Seggiolino bambini - No</option>
                <option value='true'>Seggiolino bambini - Sì</option>
              </select>
            </div>
            {form.posizione === 'fuori' && (
              <div className='col-md-6'>
                <select
                  name='stufa'
                  className='form-select'
                  onChange={handleChange}
                  value={String(form.opzioni.stufa)}
                >
                  <option value='false'>Stufa esterna - No</option>
                  <option value='true'>Stufa esterna - Sì</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className='text-center mt-5'>
          <button
            type='submit'
            className='btn btn-orange btn-lg px-5'
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Quasi fatto...' : 'Prenota'}
          </button>

          {isBanned && (
            <div className='alert alert-warning mt-3'>
              Sessione temporaneamente bloccata per troppi tentativi.
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
