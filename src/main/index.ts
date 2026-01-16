import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import db, { initDB } from './database'
import Amadeus from 'amadeus'
import * as dotenv from 'dotenv'

// Load .env file for development
dotenv.config()

const clientId = process.env.MAIN_VITE_AMADEUS_CLIENT_ID || ''
const clientSecret = process.env.MAIN_VITE_AMADEUS_CLIENT_SECRET || ''

console.log('--- Environment Check ---')
console.log('MAIN_VITE_AMADEUS_CLIENT_ID length:', (clientId || '').length)
console.log('MAIN_VITE_AMADEUS_CLIENT_SECRET length:', (clientSecret || '').length)
        
let apiHealth = 'pending' // 'pending', 'ok', or specific error message
let amadeus: any = null

if (clientId && clientSecret) {
  amadeus = new Amadeus({
    clientId: clientId,
    clientSecret: clientSecret,
    hostname: 'test'
  })
  console.log('Amadeus SDK: Initialized (Test Environment).')
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    if (is.dev) mainWindow.webContents.openDevTools()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

const extractAmadeusError = (err: any) => {
  if (err.response?.result?.errors?.[0]?.detail) return err.response.result.errors[0].detail
  if (err.description?.[0]?.title) return err.description[0].title
  if (err.message) return err.message
  return JSON.stringify(err)
}

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize DB
  initDB()

  // Health Check: Try a basic city search to see if the keys work globally
  if (amadeus) {
    amadeus.referenceData.locations
      .get({
        keyword: 'PAR',
        subType: 'CITY'
      })
      .then(() => {
        apiHealth = 'ok'
        console.log('Amadeus SDK: Health Check PASSED (City search successful).')
      })
      .catch((err: any) => {
        apiHealth = extractAmadeusError(err)
        console.error('Amadeus SDK: Health Check FAILED.')
        console.error('Error Detail:', apiHealth)
      })
  } else {
    apiHealth = 'no-keys'
  }

  // IPC Handlers

  // App Profile: Check API Status
  ipcMain.handle('app:getApiStatus', () => {
    return {
      realData: !!amadeus,
      provider: amadeus ? 'Amadeus' : 'Mock Simulator',
      health: apiHealth
    }
  })

  // Auth: Register
  ipcMain.handle('auth:register', (_, { email, password }) => {
    try {
      const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)')
      const info = stmt.run(email, password)
      return { success: true, userId: info.lastInsertRowid }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Auth: Login
  ipcMain.handle('auth:login', (_, { email, password }) => {
    try {
      const stmt = db.prepare('SELECT id, email FROM users WHERE email = ? AND password = ?')
      const user = stmt.get(email, password)
      if (user) {
        return { success: true, user }
      } else {
        return { success: false, error: 'Invalid credentials' }
      }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // Flights: Search (Amadeus + Mock Fallback)
  ipcMain.handle('flights:search', async (_, { from, to, date }) => {
    // 1. Validate inputs for Amadeus (3-letter IATA codes)
    const isIATA = (s: string) => /^[A-Z]{3}$/.test(s.toUpperCase())

    if (amadeus && isIATA(from) && isIATA(to)) {
      try {
        console.log(`Searching Amadeus for ${from} to ${to} on ${date}`)
        const response = await amadeus.shopping.flightOffersSearch.get({
          originLocationCode: from.toUpperCase(),
          destinationLocationCode: to.toUpperCase(),
          departureDate: date,
          adults: '1'
        })

        const flightOffers = response.data
        const carriers = response.dictionaries?.carriers || {}
        console.log(`Amadeus Search: Found ${flightOffers?.length || 0} offers.`)
        if (flightOffers && flightOffers.length > 0) {
          return flightOffers
            .map((offer: any) => {
              try {
                const firstItinerary = offer.itineraries?.[0]
                const segments = firstItinerary?.segments || []
                if (segments.length === 0) return null

                const firstSegment = segments[0]
                const lastSegment = segments[segments.length - 1]
                const airlineCode = firstSegment.carrierCode

                const duration = firstItinerary.duration
                  ? firstItinerary.duration
                      .replace('PT', '')
                      .toLowerCase()
                      .replace('h', 'h ')
                      .replace('m', 'm')
                  : 'N/A'

                return {
                  id: offer.id,
                  airline: carriers[airlineCode] || airlineCode,
                  flightNumber: `${airlineCode}${firstSegment.number}`,
                  from: firstSegment.departure.iataCode,
                  to: lastSegment.arrival.iataCode,
                  date: firstSegment.departure.at.split('T')[0],
                  departureTime: firstSegment.departure.at.split('T')[1].substring(0, 5),
                  arrivalTime: lastSegment.arrival.at.split('T')[1].substring(0, 5),
                  duration,
                  stops: segments.length > 1 ? `${segments.length - 1} Stop` : 'Direct',
                  price: Math.round(parseFloat(offer.price.total)),
                  link: `https://www.google.com/travel/flights?q=one+way+flights+from+${from}+to+${to}+on+${date}`
                }
              } catch (mapErr) {
                console.error('Error mapping offer:', mapErr)
                return null
              }
            })
            .filter((f) => f !== null)
        }
      } catch (error: any) {
        console.error('Amadeus Search Error:', extractAmadeusError(error))
        // If it's a real search with IATA codes, we should probably return empty instead of mock
        // unless we want to keep mock as a "safety net".
        // But user says they see mock data, which is confusing.
        return []
      }
    } else if (amadeus && (!isIATA(from) || !isIATA(to))) {
      console.log('Skipping Amadeus due to non-IATA input, using Mock fallback.')
    } else if (!amadeus && isIATA(from) && isIATA(to)) {
      console.log('Amadeus not initialized but IATA codes used. Falling back to Mock.')
    }

    // If we reach here, it means no results were returned by Amadeus (or it wasn't called)
    // If it was a valid IATA search and Amadeus is initialized, we should return empty instead of mock fallback
    if (amadeus && isIATA(from) && isIATA(to)) {
      console.log('Amadeus search returned no results. Returning empty list (no mock fallback).')
      return []
    }

    // Generate some mock flights (FALLBACK for demo/non-IATA)
    console.log('Generating mock flights (Demo Fallback)...')
    const airlines = ['Air France', 'Emirates', 'Lufthansa', 'British Airways', 'Ryanair']
    const results: any[] = []
    const count = 5 + Math.floor(Math.random() * 5)

    for (let i = 0; i < count; i++) {
      const airline = airlines[Math.floor(Math.random() * airlines.length)]
      const price = 50 + Math.floor(Math.random() * 500)
      const startHour = 6 + Math.floor(Math.random() * 16)
      const durationHours = 2 + Math.floor(Math.random() * 10)
      const stops = Math.random() > 0.7 ? 1 : 0
      const bookLink = `https://www.google.com/travel/flights?q=one+way+flights+from+${from}+to+${to}+on+${date}`

      results.push({
        id: `${date}-${i}`,
        airline,
        flightNumber: `${airline.substring(0, 2).toUpperCase()}${100 + i}`,
        from,
        to,
        date,
        departureTime: `${startHour}:00`,
        arrivalTime: `${(startHour + durationHours) % 24}:00`,
        duration: `${durationHours}h 00m`,
        stops: stops === 0 ? 'Direct' : '1 Stop',
        price,
        link: bookLink
      })
    }
    return results
  })

  ipcMain.handle('flights:saveFavorite', (_, { userId, flight }) => {
    try {
      const stmt = db.prepare('INSERT INTO favorites (user_id, flight_data) VALUES (?, ?)')
      stmt.run(userId, JSON.stringify(flight))
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('flights:removeFavorite', (_, { userId, flightId }) => {
    try {
      const stmt = db.prepare('DELETE FROM favorites WHERE id = ? AND user_id = ?')
      const info = stmt.run(flightId, userId)
      return { success: info.changes > 0 }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('flights:getFavorites', (_, userId) => {
    try {
      const stmt = db.prepare('SELECT id, flight_data FROM favorites WHERE user_id = ?')
      const rows = stmt.all(userId) as any[]
      return rows.map((r) => {
        const data = JSON.parse(r.flight_data)
        return {
          ...data,
          dbId: r.id
        }
      })
    } catch (error: any) {
      return []
    }
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
