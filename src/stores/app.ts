import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Appointment, QueueItem, GateLane, ShiftStats, FleetEvaluation } from '@/types'
import {
  mockAppointments,
  mockQueue,
  mockGateLanes,
  mockShiftStats,
  mockFleetEvaluations,
  generateId,
  generateAppointmentNo,
  generateQueueNo
} from '@/mock'
import dayjs from 'dayjs'

export const useAppStore = defineStore('app', () => {
  const appointments = ref<Appointment[]>([...mockAppointments])
  const queue = ref<QueueItem[]>([...mockQueue])
  const gateLanes = ref<GateLane[]>([...mockGateLanes])
  const shiftStats = ref<ShiftStats[]>([...mockShiftStats])
  const fleetEvaluations = ref<FleetEvaluation[]>([...mockFleetEvaluations])
  const currentUser = ref({ name: '张值班员', role: 'gate_operator', shift: '白班' })

  const pendingAppointments = computed(() =>
    appointments.value.filter(a => a.status === 'pending')
  )

  const queuingAppointments = computed(() =>
    appointments.value.filter(a => a.status === 'queuing' || a.status === 'verifying' || a.status === 'checking')
  )

  const todayAppointments = computed(() => {
    const today = dayjs().format('YYYY-MM-DD')
    return appointments.value.filter(a => a.appointmentTime.startsWith(today))
  })

  const congestionLevel = computed(() => {
    const waitingCount = queue.value.filter(q => q.status === 'waiting').length
    if (waitingCount >= 10) return 'heavy'
    if (waitingCount >= 5) return 'medium'
    return 'light'
  })

  function addAppointment(data: Partial<Appointment>) {
    const newAppointment: Appointment = {
      id: generateId(),
      appointmentNo: generateAppointmentNo(),
      plateNumber: data.plateNumber || '',
      vehicleType: data.vehicleType || '集装箱货车',
      driverName: data.driverName || '',
      driverLicense: data.driverLicense || '',
      driverPhone: data.driverPhone || '',
      fleetName: data.fleetName || '',
      businessType: data.businessType || 'import',
      containerNo: data.containerNo,
      containerSize: data.containerSize,
      appointmentTime: data.appointmentTime || dayjs().format('YYYY-MM-DD HH:mm'),
      status: 'pending',
      isDangerous: data.isDangerous || false,
      dangerousInfo: data.dangerousInfo,
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      photos: [],
      remark: data.remark
    }
    appointments.value.unshift(newAppointment)
    return newAppointment
  }

  function updateAppointment(id: string, data: Partial<Appointment>) {
    const index = appointments.value.findIndex(a => a.id === id)
    if (index !== -1) {
      appointments.value[index] = { ...appointments.value[index], ...data }
    }
  }

  function addToQueue(appointmentId: string) {
    const appointment = appointments.value.find(a => a.id === appointmentId)
    if (!appointment) return null

    const queueNo = generateQueueNo()
    const queueItem: QueueItem = {
      id: generateId(),
      queueNo,
      appointmentId,
      plateNumber: appointment.plateNumber,
      appointmentTime: appointment.appointmentTime,
      status: 'waiting'
    }
    queue.value.push(queueItem)
    updateAppointment(appointmentId, { status: 'queuing', queueNo })
    return queueItem
  }

  function callNextVehicle(laneNo: number) {
    const waitingItem = queue.value.find(q => q.status === 'waiting')
    if (!waitingItem) return null

    waitingItem.status = 'calling'
    waitingItem.laneNo = laneNo
    waitingItem.calledTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
    updateAppointment(waitingItem.appointmentId, { status: 'verifying' })

    const lane = gateLanes.value.find(l => l.id === laneNo)
    if (lane) {
      lane.status = 'busy'
      lane.currentVehicle = waitingItem.plateNumber
    }

    return waitingItem
  }

  function verifyDriver(appointmentId: string, passed: boolean) {
    if (passed) {
      updateAppointment(appointmentId, { status: 'checking' })
    } else {
      updateAppointment(appointmentId, { status: 'rejected' })
      const queueItem = queue.value.find(q => q.appointmentId === appointmentId)
      if (queueItem) {
        queueItem.status = 'passed'
      }
    }
  }

  function completeCheck(appointmentId: string, weight: number) {
    updateAppointment(appointmentId, { status: 'passing', weight })
  }

  function releaseVehicle(appointmentId: string) {
    updateAppointment(appointmentId, {
      status: 'passed',
      checkOutTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
    })
    const queueItem = queue.value.find(q => q.appointmentId === appointmentId)
    if (queueItem) {
      queueItem.status = 'passed'
      const lane = gateLanes.value.find(l => l.id === queueItem.laneNo)
      if (lane) {
        lane.status = 'idle'
        lane.currentVehicle = undefined
        lane.processedCount++
      }
    }
  }

  function rejectVehicle(appointmentId: string, reason: string) {
    updateAppointment(appointmentId, { status: 'rejected', remark: reason })
    const queueItem = queue.value.find(q => q.appointmentId === appointmentId)
    if (queueItem) {
      queueItem.status = 'passed'
      const lane = gateLanes.value.find(l => l.id === queueItem.laneNo)
      if (lane) {
        lane.status = 'idle'
        lane.currentVehicle = undefined
      }
    }
  }

  function markAbsent(appointmentId: string) {
    updateAppointment(appointmentId, { status: 'absent', remark: '爽约未到' })
  }

  function markLate(appointmentId: string) {
    updateAppointment(appointmentId, { status: 'late' })
  }

  function addPhoto(appointmentId: string, photoUrl: string) {
    const appointment = appointments.value.find(a => a.id === appointmentId)
    if (appointment) {
      appointment.photos.push(photoUrl)
    }
  }

  function getAppointmentById(id: string) {
    return appointments.value.find(a => a.id === id)
  }

  return {
    appointments,
    queue,
    gateLanes,
    shiftStats,
    fleetEvaluations,
    currentUser,
    pendingAppointments,
    queuingAppointments,
    todayAppointments,
    congestionLevel,
    addAppointment,
    updateAppointment,
    addToQueue,
    callNextVehicle,
    verifyDriver,
    completeCheck,
    releaseVehicle,
    rejectVehicle,
    markAbsent,
    markLate,
    addPhoto,
    getAppointmentById
  }
})
