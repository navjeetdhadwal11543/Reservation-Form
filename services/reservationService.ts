import {
  Prenotazione,
  ReservationRequest,
  Location,
  Option,
} from '@/types/reservation'

// We use an environment variable for the API base URL, which allows us to easily switch between development and production environments without changing the code. This also makes it easier to manage different configurations and keeps sensitive information out of the codebase.
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

// if the API call fails, we have harcoded the code so it still knows what is"dentro" or "seggiolino" . This way, the user can still make a reservation even if the API is down, and the app won't break. The fallback data is simple and covers the basic options, ensuring that the core functionality of making a reservation remains intact.
const FALLBACK_LOCATIONS: Location[] = [
  { id: 1, name: 'dentro' },
  { id: 2, name: 'fuori' },
]

const FALLBACK_OPTIONS: Option[] = [
  { id: 1, name: 'seggiolino' },

  { id: 2, name: 'stufa' },
]

// The createReservation function takes the form data and the dropdown data (locations and options) as input, processes it to match the API's expected format, and sends a POST request to create a new reservation. It also includes error handling to ensure that if the API call fails, it throws an appropriate error message. The function is designed to be resilient, using fallback data for locations and options if the API calls for those fail, ensuring that the user can still make a reservation without interruption.

export async function createReservation(
  form: Prenotazione,
  locations: Location[],
  optionsData: Option[],
) {
  //Backend expects ISO format
  const reserved_at = form.data

  //  LOCATION → ID
  // make bakend send location as same as user selected in fromtend to prohibit the error
  const selectedLocation = locations.find(
    (l) => l.name.toLowerCase() === form.posizione,
  )

  if (!selectedLocation) throw new Error('Location non valida')

  const selectedOptions: number[] = []

  if (form.opzioni.seggiolino) {
    const seggiolino = optionsData.find(
      (o) => o.name.toLowerCase() === 'seggiolino',
    )
    if (seggiolino) selectedOptions.push(seggiolino.id)
  }

  if (form.opzioni.stufa) {
    const stufa = optionsData.find((o) => o.name.toLowerCase() === 'stufa')
    if (stufa) selectedOptions.push(stufa.id)
  }
  //  We construct the payload for the API request, ensuring that it matches the expected format. This includes mapping the form fields to the appropriate keys and converting the date to the required format. The options are also processed to extract their IDs based on the user's selections.
  const payload: ReservationRequest = {
    name: (form.nome ?? '').trim(),
    surname: form.cognome?.trim() || null, // Ensures empty string becomes null
    location: selectedLocation.id,
    cover: form.numeroPosti,
    reserved_at,
    time: form.orario,
    note: form.note?.trim() || null,
    email: form.email?.trim() || null,
    phone: form.telefono || null, // Already contains dialCode + digits
    options: selectedOptions,
  }

  // We send a POST request to the API to create the reservation, including error handling to manage any issues that arise during the request. If the request is successful, we return the response data; otherwise, we throw an error with the message from the API.
  const res = await fetch(`${BASE_URL}/reservation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await res.json()

  if (!res.ok) throw new Error(data.message)

  return data
}
export const getAvailableSlots = async (day: number): Promise<string[]> => {
  try {
    const res = await fetch(`${BASE_URL}/drop-down/hours/${day}`)
    if (!res.ok) throw new Error()

    const data = await res.json()

    // data = [{ hours: "20:00" }, { hours: "21:30" }]
    // Extract hours string from each object using map!
    return data.map((item: { hours: string }) => item.hours)
    // → ["20:00", "21:30"]
  } catch (err) {
    console.error('Error fetching slots:', err)
    return []
  }
}
//   DROPDOWNS WITH ERROR RESILIENCE

export const getLocations = async (): Promise<Location[]> => {
  try {
    const res = await fetch(`${BASE_URL}/drop-down/locations`)
    if (!res.ok) throw new Error()
    return await res.json()
  } catch (err) {
    // Path A: If the backend IP is wrong, we return the fallback
    // so createReservation()  has data to work with and doesn't break the user experience as it will return the location dentro and fuori.
    console.warn('Using fallback locations due to API error', err)
    return FALLBACK_LOCATIONS
  }
}
// Similar to getLocations, this function fetches the options for the dropdown menu. If the API call fails, it returns a predefined set of options (seggiolino and stufa) to ensure that the reservation process can still proceed without interruption.
export const getOptions = async (): Promise<Option[]> => {
  try {
    const res = await fetch(`${BASE_URL}/drop-down/options`)
    if (!res.ok) throw new Error()
    return await res.json()
  } catch (err) {
    console.warn('Using fallback options due to API error:', err)
    return FALLBACK_OPTIONS
  }
}
