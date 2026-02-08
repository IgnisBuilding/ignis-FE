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
  sidebar: Record<string, string>
  dashboard: Record<string, string>
  liveMap: Record<string, string>
  incident: Record<string, string>
  personnel: Record<string, string>
  logistics: Record<string, string>
  reports: Record<string, string>
  settings: Record<string, string>
  nav: Record<string, string>
  buttons: Record<string, string>
  profile: Record<string, string>
  security: Record<string, string>
  notifications: Record<string, string>
  appearance: Record<string, string>
  system: Record<string, string>
  users: Record<string, string>
  sensors: Record<string, string>
  login: Record<string, string>
  signup: Record<string, string>
  toasts: Record<string, string>
}
