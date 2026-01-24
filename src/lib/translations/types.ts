export type Language = "en" | "ur"

export interface Translations {
  common: {
    dashboard: string
    liveMap: string
    personnel: string
    logistics: string
    reports: string
    settings: string
    search: string
    loading: string
    noData: string
  }
  header: {
    systemOptimal: string
    gpsLocked: string
    searchIncidents: string
    notifications: string
    settings: string
    commander: string
    seniorDirector: string
  }
  sidebar: {
    ignis: string
    eliteTactical: string
    dashboard: string
    liveMap: string
    personnel: string
    logistics: string
    reports: string
    settings: string
    newDispatch: string
  }
  dashboard: Record<string, string>
  liveMap: Record<string, string>
  incident: Record<string, string>
  personnel: Record<string, string>
  logistics: Record<string, string>
  reports: Record<string, string>
  settings: Record<string, string>
}
