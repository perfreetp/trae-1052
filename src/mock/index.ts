import type { Appointment, QueueItem, GateLane, ShiftStats, FleetEvaluation, ExceptionRecord, ManualReleaseRecord } from '@/types'
import dayjs from 'dayjs'

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

function generateAppointmentNo(): string {
  const date = dayjs().format('YYYYMMDD')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `YY${date}${random}`
}

function generateQueueNo(): string {
  const num = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `A${num}`
}

const fleets = ['中远海运', '中外运', '马士基物流', '中海集运', '顺丰物流', '德邦物流']
const drivers = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十']
const plates = ['京A12345', '沪B67890', '粤C24680', '津D13579', '苏E98765', '浙F54321', '鲁G11223', '闽H44556']
const containers = ['CBHU1234567', 'MSKU7654321', 'CMAU9876543', 'EMCU3456789', 'OOLU2345678']

export const mockAppointments: Appointment[] = [
  {
    id: generateId(),
    appointmentNo: generateAppointmentNo(),
    plateNumber: '京A12345',
    vehicleType: '集装箱货车',
    driverName: '张三',
    driverLicense: '110101199001011234',
    driverPhone: '13800138001',
    fleetName: '中远海运',
    businessType: 'import',
    containerNo: 'CBHU1234567',
    containerSize: '40HQ',
    appointmentTime: dayjs().add(30, 'minute').format('YYYY-MM-DD HH:mm'),
    status: 'pending',
    isDangerous: false,
    createTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    photos: []
  },
  {
    id: generateId(),
    appointmentNo: generateAppointmentNo(),
    plateNumber: '沪B67890',
    vehicleType: '集装箱货车',
    driverName: '李四',
    driverLicense: '310101199202022345',
    driverPhone: '13900139002',
    fleetName: '中外运',
    businessType: 'export',
    containerNo: 'MSKU7654321',
    containerSize: '20GP',
    appointmentTime: dayjs().add(15, 'minute').format('YYYY-MM-DD HH:mm'),
    status: 'queuing',
    queueNo: generateQueueNo(),
    isDangerous: false,
    createTime: dayjs().subtract(10, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    photos: []
  },
  {
    id: generateId(),
    appointmentNo: generateAppointmentNo(),
    plateNumber: '粤C24680',
    vehicleType: '危险品运输车',
    driverName: '王五',
    driverLicense: '440101198803033456',
    driverPhone: '13700137003',
    fleetName: '马士基物流',
    businessType: 'import',
    containerNo: 'CMAU9876543',
    containerSize: '40GP',
    appointmentTime: dayjs().format('YYYY-MM-DD HH:mm'),
    status: 'verifying',
    queueNo: 'A001',
    isDangerous: true,
    dangerousInfo: '3类易燃液体',
    createTime: dayjs().subtract(20, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    photos: []
  },
  {
    id: generateId(),
    appointmentNo: generateAppointmentNo(),
    plateNumber: '津D13579',
    vehicleType: '集装箱货车',
    driverName: '赵六',
    driverLicense: '120101199104044567',
    driverPhone: '13600136004',
    fleetName: '中海集运',
    businessType: 'export',
    containerNo: 'EMCU3456789',
    containerSize: '40HQ',
    appointmentTime: dayjs().subtract(5, 'minute').format('YYYY-MM-DD HH:mm'),
    status: 'checking',
    queueNo: 'A002',
    isDangerous: false,
    weight: 28500,
    createTime: dayjs().subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    photos: []
  },
  {
    id: generateId(),
    appointmentNo: generateAppointmentNo(),
    plateNumber: '苏E98765',
    vehicleType: '集装箱货车',
    driverName: '钱七',
    driverLicense: '320101198905055678',
    driverPhone: '13500135005',
    fleetName: '顺丰物流',
    businessType: 'transfer',
    appointmentTime: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm'),
    status: 'passed',
    queueNo: 'A003',
    isDangerous: false,
    weight: 15200,
    checkInTime: dayjs().subtract(45, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    checkOutTime: dayjs().subtract(20, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    createTime: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    photos: []
  },
  {
    id: generateId(),
    appointmentNo: generateAppointmentNo(),
    plateNumber: '辽M88990',
    vehicleType: '集装箱货车',
    driverName: '郑十',
    driverLicense: '210101199007077890',
    driverPhone: '13300133007',
    fleetName: '中远海运',
    businessType: 'import',
    containerNo: 'MSKU8899001',
    containerSize: '40HQ',
    appointmentTime: dayjs().subtract(15, 'minute').format('YYYY-MM-DD HH:mm'),
    status: 'passing',
    queueNo: 'A006',
    isDangerous: false,
    weight: 26800,
    checkInTime: dayjs().subtract(10, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    createTime: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    photos: []
  },
  {
    id: generateId(),
    appointmentNo: generateAppointmentNo(),
    plateNumber: '浙F54321',
    vehicleType: '集装箱货车',
    driverName: '孙八',
    driverLicense: '330101199306066789',
    driverPhone: '13400134006',
    fleetName: '德邦物流',
    businessType: 'import',
    containerNo: 'OOLU2345678',
    containerSize: '20GP',
    appointmentTime: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm'),
    status: 'absent',
    isDangerous: false,
    createTime: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    photos: [],
    remark: '未按时到场'
  }
]

export const mockExceptionRecords: ExceptionRecord[] = [
  {
    id: generateId(),
    appointmentNo: generateAppointmentNo(),
    plateNumber: '鲁G11223',
    type: 'late',
    description: '预约时间14:00，实际15:30到场，迟到1小时30分钟',
    action: '已登记迟到，重新安排排队',
    handler: '张值班员',
    createTime: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    processed: true,
    processedTime: dayjs().subtract(50, 'minute').format('YYYY-MM-DD HH:mm:ss')
  },
  {
    id: generateId(),
    appointmentNo: generateAppointmentNo(),
    plateNumber: '闽H44556',
    type: 'document_mismatch',
    description: '司机驾驶证与预约登记信息不符，登记姓名为"周九"，实际持证人为"吴十"',
    action: '已退回，要求司机提供正确证件',
    handler: '张值班员',
    createTime: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    processed: true,
    processedTime: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss')
  },
  {
    id: generateId(),
    appointmentNo: generateAppointmentNo(),
    plateNumber: '浙F54321',
    type: 'absent',
    description: '预约时间12:00，截至14:30仍未到场，电话联系不上司机',
    action: '',
    handler: '张值班员',
    createTime: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    processed: false
  }
]

export const mockManualReleaseRecords: ManualReleaseRecord[] = [
  {
    id: generateId(),
    plateNumber: '皖J77889',
    reason: '紧急物资运输，已获得港务部门特批，优先放行',
    laneNo: 3,
    operator: '张值班员',
    createTime: dayjs().subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss')
  },
  {
    id: generateId(),
    plateNumber: '冀K66554',
    reason: '系统故障导致排队信息丢失，根据纸质预约单人工核实后放行',
    laneNo: 1,
    operator: '李值班员',
    createTime: dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss')
  }
]

export const mockQueue: QueueItem[] = [
  {
    id: generateId(),
    queueNo: 'A001',
    appointmentId: mockAppointments[2].id,
    plateNumber: '粤C24680',
    appointmentTime: dayjs().format('YYYY-MM-DD HH:mm'),
    status: 'processing',
    laneNo: 1
  },
  {
    id: generateId(),
    queueNo: 'A002',
    appointmentId: mockAppointments[3].id,
    plateNumber: '津D13579',
    appointmentTime: dayjs().subtract(5, 'minute').format('YYYY-MM-DD HH:mm'),
    status: 'waiting',
    laneNo: 2
  },
  {
    id: generateId(),
    queueNo: 'A004',
    appointmentId: generateId(),
    plateNumber: '鲁G11223',
    appointmentTime: dayjs().add(10, 'minute').format('YYYY-MM-DD HH:mm'),
    status: 'waiting'
  },
  {
    id: generateId(),
    queueNo: 'A005',
    appointmentId: generateId(),
    plateNumber: '闽H44556',
    appointmentTime: dayjs().add(20, 'minute').format('YYYY-MM-DD HH:mm'),
    status: 'waiting'
  }
]

export const mockGateLanes: GateLane[] = [
  { id: 1, name: '1号闸道', status: 'busy', currentVehicle: '粤C24680', processedCount: 12 },
  { id: 2, name: '2号闸道', status: 'busy', currentVehicle: '津D13579', processedCount: 15 },
  { id: 3, name: '3号闸道', status: 'idle', processedCount: 8 },
  { id: 4, name: '4号闸道', status: 'maintenance', processedCount: 0 }
]

export const mockShiftStats: ShiftStats[] = [
  {
    date: dayjs().format('YYYY-MM-DD'),
    shift: 'day',
    totalAppointments: 86,
    passedCount: 72,
    rejectedCount: 5,
    absentCount: 6,
    lateCount: 3,
    avgWaitTime: 12,
    avgProcessTime: 8,
    dangerousCount: 4
  }
]

export const mockFleetEvaluations: FleetEvaluation[] = [
  { id: '1', fleetName: '中远海运', totalVehicles: 156, onTimeRate: 95.2, violationRate: 1.2, score: 96, level: 'A' },
  { id: '2', fleetName: '中外运', totalVehicles: 142, onTimeRate: 92.8, violationRate: 2.1, score: 91, level: 'A' },
  { id: '3', fleetName: '马士基物流', totalVehicles: 98, onTimeRate: 88.5, violationRate: 4.3, score: 85, level: 'B' },
  { id: '4', fleetName: '中海集运', totalVehicles: 87, onTimeRate: 85.3, violationRate: 5.8, score: 80, level: 'B' },
  { id: '5', fleetName: '顺丰物流', totalVehicles: 65, onTimeRate: 78.6, violationRate: 8.2, score: 72, level: 'C' },
  { id: '6', fleetName: '德邦物流', totalVehicles: 54, onTimeRate: 72.1, violationRate: 12.5, score: 65, level: 'D' }
]

export { generateId, generateAppointmentNo, generateQueueNo, fleets, drivers, plates, containers }
