export const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3'

interface GoogleCalendar {
    id: string
    summary: string
    description?: string
}

interface GoogleCalendarEvent {
    summary: string
    description?: string
    start: {
        dateTime?: string // ISO 8601
        date?: string // YYYY-MM-DD
        timeZone?: string
    }
    end: {
        dateTime?: string // ISO 8601
        date?: string // YYYY-MM-DD
        timeZone?: string
    }
    location?: string
}

/**
 * Lista os calendários do usuário.
 */
export async function listCalendars(accessToken: string): Promise<GoogleCalendar[]> {
    const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/users/me/calendarList`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Google Calendar API Error (List):', response.status, errorText)
        throw new Error(`Falha ao listar calendários: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    return data.items || []
}

/**
 * Cria um novo calendário no Google Calendar.
 */
export async function createCalendar(accessToken: string, summary: string = 'GSV Calendar'): Promise<GoogleCalendar> {
    const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/calendars`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            summary,
            description: 'Calendário de escalas importado do GSV Calendar Web.',
        }),
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('Google Calendar API Error (Create):', response.status, errorText)
        throw new Error(`Falha ao criar calendário: ${response.status} - ${errorText}`)
    }

    return await response.json()
}

/**
 * Insere um evento em um calendário específico.
 */
export async function insertEvent(accessToken: string, calendarId: string, event: GoogleCalendarEvent) {
    const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
    })

    if (!response.ok) {
        const errorData = await response.json()
        console.error('Google Calendar Error:', errorData)
        throw new Error(`Falha ao inserir evento: ${errorData.error?.message || response.statusText}`)
    }

    return await response.json()
}

/**
 * Remove um evento de um calendário.
 */
export async function deleteEvent(accessToken: string, calendarId: string, eventId: string) {
    const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })

    if (!response.ok) {
        // 410 Gone significa que já foi deletado, o que é aceitável
        if (response.status === 410) return

        const errorText = await response.text()
        console.error('Google Calendar API Error (Delete):', response.status, errorText)
        throw new Error(`Falha ao remover evento: ${response.status}`)
    }
}

/**
 * Atualiza um evento existente.
 */
export async function updateEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
    event: GoogleCalendarEvent
) {
    const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events/${eventId}`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
    })

    if (!response.ok) {
        const errorData = await response.json()
        console.error('Google Calendar Error (Update):', errorData)
        throw new Error(`Falha ao atualizar evento: ${errorData.error?.message || response.statusText}`)
    }

    return await response.json()
}

/**
 * Lista eventos em um intervalo de tempo para verificação de conflitos.
 */
export async function listEvents(
    accessToken: string,
    calendarId: string,
    timeMin: string,
    timeMax: string
): Promise<GoogleCalendarEvent[]> {
    const params = new URLSearchParams({
        timeMin,
        timeMax,
        singleEvents: 'true',
        orderBy: 'startTime',
    })

    const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/calendars/${calendarId}/events?${params.toString()}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    })

    if (!response.ok) {
        // Se calendário não existe (404), retornamos lista vazia para não quebrar fluxo
        if (response.status === 404) return []

        const errorText = await response.text()
        console.error('Google Calendar API Error (List Events):', response.status, errorText)
        throw new Error(`Falha ao listar eventos: ${response.status}`)
    }

    const data = await response.json()
    return data.items || []
}
