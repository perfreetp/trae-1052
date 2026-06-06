import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Appointment, QueueItem, GateLane, ShiftStats, FleetEvaluation, ExceptionRecord, ManualReleaseRecord } from '@/types'
import {
  mockAppointments,
  mockQueue,
  mockGateLanes,
  mockShiftStats,
  mockFleetEvaluations,
  mockExceptionRecords,
  mockManualReleaseRecords,
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
  const exceptionRecords = ref<ExceptionRecord[]>([...mockExceptionRecords])
  const manualReleaseRecords = ref<ManualReleaseRecord[]>([...mockManualReleaseRecords])
  const currentUser = ref({ name: '张值班员', role: 'gate_operator', shift: '白班' })

  const pendingAppointments = computed(() =>
    appointments.value.filter(a => a.status === 'pending')
  )

  const queuingAppointments = computed(() =>
    appointments.value.filter(a => a.status === 'queuing')
  )

  const verifyingAppointments = computed(() =>
    appointments.value.filter(a => a.status === 'verifying')
  )

  const checkingAppointments = computed(() =>
    appointments.value.filter(a => a.status === 'checking')
  )

  const passingAppointments = computed(() =>
    appointments.value.filter(a => a.status === 'passing')
  )

  const todayAppointments = computed(() => {
    const today = dayjs().format('YYYY-MM-DD')
    return appointments.value.filter(a => a.appointmentTime.startsWith(today))
  })

  const passedCount = computed(() =>
    appointments.value.filter(a => a.status === 'passed').length
  )

  const rejectedCount = computed(() =>
    appointments.value.filter(a => a.status === 'rejected').length
  )

  const absentCount = computed(() =>
    appointments.value.filter(a => a.status === 'absent').length
  )

  const lateCount = computed(() =>
    appointments.value.filter(a => a.status === 'late').length
  )

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
    shiftStats.value[0].totalAppointments++
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

    const existingQueue = queue.value.find(q => q.appointmentId === appointmentId)
    if (existingQueue) return existingQueue

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

  function verifyDriver(appointmentId: string, passed: boolean, reason?: string) {
    const appointment = appointments.value.find(a => a.id === appointmentId)
    if (!appointment) return

    if (passed) {
      updateAppointment(appointmentId, { status: 'checking' })
    } else {
      updateAppointment(appointmentId, { status: 'rejected', remark: reason || '证件核验不通过' })
      const queueItem = queue.value.find(q => q.appointmentId === appointmentId)
      if (queueItem) {
        queueItem.status = 'passed'
        const lane = gateLanes.value.find(l => l.id === queueItem.laneNo)
        if (lane) {
          lane.status = 'idle'
          lane.currentVehicle = undefined
        }
      }
      shiftStats.value[0].rejectedCount++
      addExceptionRecord({
        appointmentNo: appointment.appointmentNo,
        plateNumber: appointment.plateNumber,
        type: 'document_mismatch',
        description: reason || '证件核验不通过',
        action: '已拒绝入场',
        handler: currentUser.value.name
      })
    }
  }

  function returnToVerify(appointmentId: string) {
    const appointment = appointments.value.find(a => a.id === appointmentId)
    if (!appointment) return
    updateAppointment(appointmentId, { status: 'verifying' })
  }

  function returnToCheck(appointmentId: string) {
    const appointment = appointments.value.find(a => a.id === appointmentId)
    if (!appointment) return
    updateAppointment(appointmentId, { status: 'checking' })
  }

  function rejectAtCheck(appointmentId: string, reason: string) {
    const appointment = appointments.value.find(a => a.id === appointmentId)
    if (!appointment) return

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
    shiftStats.value[0].rejectedCount++
    addExceptionRecord({
      appointmentNo: appointment.appointmentNo,
      plateNumber: appointment.plateNumber,
      type: 'container_mismatch',
      description: reason,
      action: '箱单核对不通过，已拒绝',
      handler: currentUser.value.name
    })
  }

  function completeCheck(appointmentId: string, weight: number) {
    updateAppointment(appointmentId, { status: 'passing', weight })
  }

  function releaseVehicle(appointmentId: string) {
    const appointment = appointments.value.find(a => a.id === appointmentId)
    if (!appointment) return

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
    shiftStats.value[0].passedCount++
  }

  function manualRelease(plateNumber: string, reason: string, laneNo: number) {
    const record: ManualReleaseRecord = {
      id: generateId(),
      plateNumber,
      reason,
      laneNo,
      operator: currentUser.value.name,
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
    }
    manualReleaseRecords.value.unshift(record)
    shiftStats.value[0].passedCount++

    const lane = gateLanes.value.find(l => l.id === laneNo)
    if (lane) {
      lane.processedCount++
    }

    const newAppointment: Appointment = {
      id: generateId(),
      appointmentNo: generateAppointmentNo(),
      plateNumber,
      vehicleType: '手动放行',
      driverName: '手动放行',
      driverLicense: '-',
      driverPhone: '-',
      fleetName: '手动放行',
      businessType: 'transfer',
      appointmentTime: dayjs().format('YYYY-MM-DD HH:mm'),
      status: 'passed',
      isDangerous: false,
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      checkOutTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      remark: `手动放行：${reason}`,
      photos: []
    }
    appointments.value.unshift(newAppointment)
    shiftStats.value[0].totalAppointments++

    return record
  }

  function rejectVehicle(appointmentId: string, reason: string) {
    const appointment = appointments.value.find(a => a.id === appointmentId)
    if (!appointment) return

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
    shiftStats.value[0].rejectedCount++
  }

  function markAbsent(appointmentId: string) {
    const appointment = appointments.value.find(a => a.id === appointmentId)
    if (!appointment) return

    updateAppointment(appointmentId, {
      status: 'absent',
      remark: '爽约未到',
      checkOutTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
    })
    shiftStats.value[0].absentCount++
  }

  function markLate(appointmentId: string) {
    const appointment = appointments.value.find(a => a.id === appointmentId)
    if (!appointment) return

    updateAppointment(appointmentId, { status: 'late' })
    shiftStats.value[0].lateCount++
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

  function addExceptionRecord(data: Partial<ExceptionRecord>) {
    const record: ExceptionRecord = {
      id: generateId(),
      appointmentNo: data.appointmentNo || '',
      plateNumber: data.plateNumber || '',
      type: data.type || 'other',
      description: data.description || '',
      action: data.action || '',
      handler: data.handler || currentUser.value.name,
      createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      processed: false
    }
    exceptionRecords.value.unshift(record)
    return record
  }

  function processExceptionRecord(id: string, action: string) {
    const record = exceptionRecords.value.find(r => r.id === id)
    if (record) {
      record.processed = true
      record.processedTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
      record.action = action
    }
  }

  return {
    appointments,
    queue,
    gateLanes,
    shiftStats,
    fleetEvaluations,
    exceptionRecords,
    manualReleaseRecords,
    currentUser,
    pendingAppointments,
    queuingAppointments,
    verifyingAppointments,
    checkingAppointments,
    passingAppointments,
    todayAppointments,
    passedCount,
    rejectedCount,
    absentCount,
    lateCount,
    congestionLevel,
    addAppointment,
    updateAppointment,
    addToQueue,
    callNextVehicle,
    verifyDriver,
    returnToVerify,
    returnToCheck,
    rejectAtCheck,
    completeCheck,
    releaseVehicle,
    manualRelease,
    rejectVehicle,
    markAbsent,
    markLate,
    addPhoto,
    getAppointmentById,
    addExceptionRecord,
    processExceptionRecord
  }
})
