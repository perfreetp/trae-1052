export interface Appointment {
  id: string
  appointmentNo: string
  plateNumber: string
  vehicleType: string
  driverName: string
  driverLicense: string
  driverPhone: string
  fleetName: string
  businessType: 'import' | 'export' | 'transfer'
  containerNo?: string
  containerSize?: string
  appointmentTime: string
  status: 'pending' | 'queuing' | 'verifying' | 'checking' | 'passing' | 'passed' | 'rejected' | 'absent' | 'late'
  queueNo?: string
  isDangerous: boolean
  dangerousInfo?: string
  weight?: number
  checkInTime?: string
  checkOutTime?: string
  createTime: string
  remark?: string
  photos: string[]
}

export interface QueueItem {
  id: string
  queueNo: string
  appointmentId: string
  plateNumber: string
  appointmentTime: string
  status: 'waiting' | 'calling' | 'processing' | 'passed'
  laneNo?: number
  calledTime?: string
}

export interface GateLane {
  id: number
  name: string
  status: 'idle' | 'busy' | 'maintenance'
  currentVehicle?: string
  processedCount: number
}

export interface ShiftStats {
  date: string
  shift: 'day' | 'night'
  totalAppointments: number
  passedCount: number
  rejectedCount: number
  absentCount: number
  lateCount: number
  avgWaitTime: number
  avgProcessTime: number
  dangerousCount: number
}

export interface FleetEvaluation {
  id: string
  fleetName: string
  totalVehicles: number
  onTimeRate: number
  violationRate: number
  score: number
  level: 'A' | 'B' | 'C' | 'D'
}

export interface ExceptionRecord {
  id: string
  appointmentNo: string
  plateNumber: string
  type: 'absent' | 'late' | 'document_mismatch' | 'container_mismatch' | 'equipment_fault' | 'other'
  description: string
  action: string
  handler: string
  createTime: string
  processed: boolean
  processedTime?: string
}

export interface ManualReleaseRecord {
  id: string
  plateNumber: string
  reason: string
  laneNo: number
  operator: string
  createTime: string
}
