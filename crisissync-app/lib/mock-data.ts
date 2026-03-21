export type IncidentType = 'fire' | 'medical' | 'security' | 'other'
export type IncidentStatus = 'active' | 'resolved' | 'pending'
export type UserRole = 'guest' | 'staff' | 'responder'

export interface Incident {
  id: string
  type: IncidentType
  location: string
  status: IncidentStatus
  description: string
  reportedBy: string
  reportedAt: Date
  resolvedAt?: Date
  assignedTo?: string
}

export interface Message {
  id: string
  content: string
  sender: string
  senderRole: UserRole
  timestamp: Date
  incidentId?: string
}

export interface AnalyticsData {
  date: string
  responseTime: number
  incidents: number
  resolved: number
}

export const mockIncidents: Incident[] = [
  {
    id: '1',
    type: 'fire',
    location: 'Kitchen - Floor 1',
    status: 'active',
    description: 'Small fire in the kitchen area. Fire suppression activated.',
    reportedBy: 'John Smith',
    reportedAt: new Date(Date.now() - 15 * 60 * 1000),
    assignedTo: 'Fire Response Team A',
  },
  {
    id: '2',
    type: 'medical',
    location: 'Room 405',
    status: 'active',
    description: 'Guest reporting chest pain. Medical assistance needed.',
    reportedBy: 'Front Desk',
    reportedAt: new Date(Date.now() - 8 * 60 * 1000),
    assignedTo: 'Medical Team',
  },
  {
    id: '3',
    type: 'security',
    location: 'Parking Lot B',
    status: 'pending',
    description: 'Suspicious vehicle reported in parking lot.',
    reportedBy: 'Security Camera AI',
    reportedAt: new Date(Date.now() - 25 * 60 * 1000),
  },
  {
    id: '4',
    type: 'medical',
    location: 'Pool Area',
    status: 'resolved',
    description: 'Guest slipped near pool. Minor injury treated on-site.',
    reportedBy: 'Lifeguard',
    reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    assignedTo: 'First Aid Team',
  },
  {
    id: '5',
    type: 'other',
    location: 'Conference Room C',
    status: 'resolved',
    description: 'Power outage affecting conference room equipment.',
    reportedBy: 'Event Coordinator',
    reportedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    assignedTo: 'Maintenance',
  },
  {
    id: '6',
    type: 'security',
    location: 'Main Entrance',
    status: 'resolved',
    description: 'Unauthorized access attempt detected.',
    reportedBy: 'Access Control System',
    reportedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000),
    assignedTo: 'Security Team',
  },
]

export const mockMessages: Message[] = [
  {
    id: '1',
    content: 'Fire alarm triggered in Kitchen. Investigating now.',
    sender: 'Fire Response Team A',
    senderRole: 'responder',
    timestamp: new Date(Date.now() - 14 * 60 * 1000),
    incidentId: '1',
  },
  {
    id: '2',
    content: 'Confirmed small grease fire. Fire suppression system activated. Situation under control.',
    sender: 'Fire Response Team A',
    senderRole: 'responder',
    timestamp: new Date(Date.now() - 12 * 60 * 1000),
    incidentId: '1',
  },
  {
    id: '3',
    content: 'Should we evacuate the nearby dining area?',
    sender: 'Hotel Manager',
    senderRole: 'staff',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    incidentId: '1',
  },
  {
    id: '4',
    content: 'Not necessary at this time. Fire is contained. Ventilation clearing smoke.',
    sender: 'Fire Response Team A',
    senderRole: 'responder',
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    incidentId: '1',
  },
  {
    id: '5',
    content: 'Medical team dispatched to Room 405.',
    sender: 'Medical Team',
    senderRole: 'responder',
    timestamp: new Date(Date.now() - 7 * 60 * 1000),
    incidentId: '2',
  },
  {
    id: '6',
    content: 'Guest is a 65-year-old male. History of heart condition per registration.',
    sender: 'Front Desk',
    senderRole: 'staff',
    timestamp: new Date(Date.now() - 6 * 60 * 1000),
    incidentId: '2',
  },
  {
    id: '7',
    content: 'EMS has been contacted. ETA 8 minutes.',
    sender: 'Medical Team',
    senderRole: 'responder',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    incidentId: '2',
  },
  {
    id: '8',
    content: 'Is there anything I can do to help?',
    sender: 'Guest - Room 406',
    senderRole: 'guest',
    timestamp: new Date(Date.now() - 4 * 60 * 1000),
    incidentId: '2',
  },
]

export const mockAnalytics: AnalyticsData[] = [
  { date: '2024-01-01', responseTime: 4.2, incidents: 12, resolved: 11 },
  { date: '2024-01-02', responseTime: 3.8, incidents: 8, resolved: 8 },
  { date: '2024-01-03', responseTime: 5.1, incidents: 15, resolved: 14 },
  { date: '2024-01-04', responseTime: 3.5, incidents: 6, resolved: 6 },
  { date: '2024-01-05', responseTime: 4.0, incidents: 10, resolved: 9 },
  { date: '2024-01-06', responseTime: 3.2, incidents: 7, resolved: 7 },
  { date: '2024-01-07', responseTime: 4.5, incidents: 11, resolved: 10 },
  { date: '2024-01-08', responseTime: 3.9, incidents: 9, resolved: 9 },
  { date: '2024-01-09', responseTime: 4.8, incidents: 14, resolved: 13 },
  { date: '2024-01-10', responseTime: 3.6, incidents: 8, resolved: 8 },
  { date: '2024-01-11', responseTime: 4.1, incidents: 10, resolved: 10 },
  { date: '2024-01-12', responseTime: 3.4, incidents: 5, resolved: 5 },
  { date: '2024-01-13', responseTime: 4.3, incidents: 12, resolved: 11 },
  { date: '2024-01-14', responseTime: 3.7, incidents: 9, resolved: 9 },
]

export const incidentTypeStats = [
  { type: 'Fire', count: 23, percentage: 18 },
  { type: 'Medical', count: 45, percentage: 35 },
  { type: 'Security', count: 38, percentage: 30 },
  { type: 'Other', count: 22, percentage: 17 },
]

export const resolutionStats = {
  averageResponseTime: '3.8 min',
  totalIncidents: 128,
  resolvedIncidents: 124,
  resolutionRate: 96.9,
}
