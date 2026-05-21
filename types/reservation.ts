// The Location interface defines the structure of a location that can be selected for a reservation. Each location has an ID and a name. This interface is used to represent the available locations that can be chosen for a reservation, such as indoor or outdoor seating.
export interface Location {
  id: number
  name: string
}
// L'interfaccia Opzione definisce la struttura di un'opzione che può essere selezionata per una prenotazione.
// Ogni opzione ha un ID e un nome. Questa interfaccia viene utilizzata per rappresentare le opzioni disponibili che possono essere incluse in una prenotazione,
// come un seggiolino per bambini o un stuffa.
export interface Option {
  id: number
  name: string
}

// L'interfaccia Prenotazione definisce la struttura dei dati del modulo di prenotazione raccolti dall'utente.
// Include campi per nome e cognome del cliente, preferenza di location (al chiuso o all'aperto), numero di coperti, data e ora della prenotazione, note facoltative,
// informazioni di contatto e opzioni selezionate (come valori booleani). Questa interfaccia viene utilizzata per rappresentare i dati raccolti dal modulo di prenotazione prima che vengano elaborati e inviati all'API.
export interface Prenotazione {
  nome: string
  cognome?: string
  posizione: 'dentro' | 'fuori'
  numeroPosti: number
  orario: string
  data: string
  note?: string
  email?: string
  telefono?: string
  opzioni: {
    seggiolino: boolean
    stufa: boolean
  }
}
// L'interfaccia ReservationRequest definisce la struttura dei dati che verranno inviati all'API durante la creazione di una prenotazione. Include campi per
// nome del cliente, cognome, località (come ID), numero di coperti, data e ora della prenotazione, note facoltative, informazioni di contatto e opzioni selezionate
// (come array di ID di opzione). Questa interfaccia garantisce che i dati inviati all'API siano coerenti e formattati correttamente.

export interface ReservationRequest {
  name: string
  surname?: string | null
  location: Location['id']
  cover: number
  reserved_at: string
  time: string
  note?: string | null
  email?: string | null
  phone?: string | null
  options: Option['id'][]
}
