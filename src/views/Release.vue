<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">闸道放行</div>
      <div class="header-actions">
        <el-button type="warning" @click="manualReleaseDialog = true">
          <el-icon><Key /></el-icon>
          手动放行
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <div class="card-section">
          <div class="section-title">
            待放行列表
            <el-tag type="success" size="small" style="margin-left: 8px">{{ releaseList.length }} 辆</el-tag>
          </div>
          <el-table
            :data="releaseList"
            stripe
            style="width: 100%"
            @row-click="selectVehicle"
            highlight-current-row
            height="400"
          >
            <el-table-column prop="queueNo" label="排队号" width="80" />
            <el-table-column prop="plateNumber" label="车牌号" width="120" />
            <el-table-column label="状态" width="90">
              <template #default>
                <el-tag size="small" type="success">待放行</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="releaseList.length === 0" description="暂无待放行车辆" :image-size="80" />
        </div>

        <div class="card-section" v-if="manualReleaseRecords.length > 0">
          <div class="section-title">手动放行记录</div>
          <el-table :data="manualReleaseRecords" size="small" stripe>
            <el-table-column prop="plateNumber" label="车牌号" width="110" />
            <el-table-column prop="laneNo" label="闸道" width="60" />
            <el-table-column prop="operator" label="值班员" width="90" />
            <el-table-column prop="createTime" label="时间" show-overflow-tooltip />
          </el-table>
        </div>
      </el-col>

      <el-col :span="16">
        <div v-if="currentAppointment" class="card-section">
          <div class="section-title">车辆通行信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="预约号">
              {{ currentAppointment.appointmentNo }}
            </el-descriptions-item>
            <el-descriptions-item label="排队号">
              <el-tag type="warning" size="large">{{ currentAppointment.queueNo }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="车牌号">
              <el-tag type="primary" size="large">{{ currentAppointment.plateNumber }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="车辆类型">
              {{ currentAppointment.vehicleType }}
            </el-descriptions-item>
            <el-descriptions-item label="司机">
              {{ currentAppointment.driverName }}
            </el-descriptions-item>
            <el-descriptions-item label="联系电话">
              {{ currentAppointment.driverPhone }}
            </el-descriptions-item>
            <el-descriptions-item label="所属车队">
              {{ currentAppointment.fleetName }}
            </el-descriptions-item>
            <el-descriptions-item label="业务类型">
              <el-tag :type="currentAppointment.businessType === 'import' ? 'primary' : 'success'">
                {{ currentAppointment.businessType === 'import' ? '进口提箱' : currentAppointment.businessType === 'export' ? '出口还箱' : '中转' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="集装箱号">
              {{ currentAppointment.containerNo || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="箱型">
              {{ currentAppointment.containerSize || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="称重结果">
              <span style="font-weight: 600; color: #409eff">{{ currentAppointment.weight ? currentAppointment.weight + ' kg' : '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="危险品">
              <el-tag v-if="currentAppointment.isDangerous" type="danger">
                是 - {{ currentAppointment.dangerousInfo }}
              </el-tag>
              <span v-else>否</span>
            </el-descriptions-item>
          </el-descriptions>

          <el-divider />

          <div class="section-title" style="margin-top: 0">闸道状态</div>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="gate-status-card" :class="gateStatus">
                <el-icon :size="48"><Van /></el-icon>
                <div class="gate-status-text">
                  {{ gateStatus === 'open' ? '闸道已开启' : '闸道关闭' }}
                </div>
                <div class="gate-lane">{{ currentLane }}号闸道</div>
              </div>
            </el-col>
            <el-col :span="16">
              <div class="pass-info">
                <div class="pass-item">
                  <span class="pass-label">入场核验时间：</span>
                  <span class="pass-value">{{ currentAppointment.checkInTime || '未记录' }}</span>
                </div>
                <div class="pass-item">
                  <span class="pass-label">预计出场时间：</span>
                  <span class="pass-value">{{ estimatedExitTime }}</span>
                </div>
                <div class="pass-item">
                  <span class="pass-label">箱单核对状态：</span>
                  <el-tag type="success">已完成</el-tag>
                </div>
              </div>
            </el-col>
          </el-row>

          <div class="action-buttons">
            <el-button size="large" type="info" @click="returnInfo">
              <el-icon><RefreshLeft /></el-icon>
              退回箱单重核
            </el-button>
            <el-button size="large" type="primary" @click="printTicket">
              <el-icon><Printer /></el-icon>
              打印通行凭证
            </el-button>
            <el-button size="large" type="success" @click="openGate">
              <el-icon><Right /></el-icon>
              开闸放行
            </el-button>
          </div>
        </div>

        <el-empty v-else description="请从左侧列表选择待放行车辆" :image-size="120" style="margin-top: 100px">
          <template #description>
            <p style="font-size: 16px; color: #909399">仅显示已完成箱单核对的车辆</p>
          </template>
        </el-empty>
      </el-col>
    </el-row>

    <el-dialog v-model="manualReleaseDialog" title="手动放行" width="550px">
      <el-form :model="manualForm" label-width="100px">
        <el-form-item label="车牌号" required>
          <el-input v-model="manualForm.plateNumber" placeholder="请输入车牌号" />
        </el-form-item>
        <el-form-item label="放行原因" required>
          <el-input v-model="manualForm.reason" type="textarea" :rows="3" placeholder="请输入手动放行原因（必填）" />
        </el-form-item>
        <el-form-item label="闸道选择" required>
          <el-select v-model="manualForm.laneNo" placeholder="选择闸道" style="width: 100%">
            <el-option v-for="lane in availableLanes" :key="lane.id" :label="lane.name" :value="lane.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="值班员">
          <el-tag>{{ currentUser.name }}</el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualReleaseDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmManualRelease">确认放行</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="ticketDialog" title="通行凭证预览" width="400px">
      <div class="ticket-preview">
        <div class="ticket-title">港口车辆通行凭证</div>
        <div class="ticket-no">凭证号：{{ ticketInfo.no }}</div>
        <el-divider />
        <div class="ticket-info">
          <p>车牌号：{{ ticketInfo.plateNumber }}</p>
          <p>司机：{{ ticketInfo.driverName }}</p>
          <p>业务类型：{{ ticketInfo.businessType }}</p>
          <p>集装箱号：{{ ticketInfo.containerNo }}</p>
          <p>放行闸道：{{ ticketInfo.laneNo }}号闸道</p>
          <p>放行时间：{{ ticketInfo.releaseTime }}</p>
          <p>值班员：{{ ticketInfo.operator }}</p>
        </div>
        <el-divider />
        <div class="ticket-footer">
          <p style="text-align: right">打印时间：{{ ticketInfo.printTime }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="ticketDialog = false">关闭</el-button>
        <el-button type="primary" @click="doPrint">
          <el-icon><Printer /></el-icon>
          打印
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'
import type { Appointment } from '@/types'
import dayjs from 'dayjs'

const store = useAppStore()

const selectedId = ref<string | null>(null)
const gateStatus = ref<'open' | 'closed'>('closed')
const currentLane = ref(1)
const manualReleaseDialog = ref(false)
const ticketDialog = ref(false)

const manualForm = reactive({
  plateNumber: '',
  reason: '',
  laneNo: 1
})

const ticketInfo = reactive({
  no: '',
  plateNumber: '',
  driverName: '',
  businessType: '',
  containerNo: '',
  laneNo: 1,
  releaseTime: '',
  operator: '',
  printTime: ''
})

const releaseList = computed(() => {
  return store.passingAppointments
})

const manualReleaseRecords = computed(() => store.manualReleaseRecords)

const currentAppointment = computed<Appointment | undefined>(() =>
  selectedId.value ? store.getAppointmentById(selectedId.value) : undefined
)

const availableLanes = computed(() =>
  store.gateLanes.filter(l => l.status !== 'maintenance')
)

const currentUser = computed(() => store.currentUser)

const estimatedExitTime = computed(() =>
  dayjs().add(5, 'minute').format('YYYY-MM-DD HH:mm')
)

function selectVehicle(row: Appointment) {
  selectedId.value = row.id
  gateStatus.value = 'closed'
}

function openGate() {
  if (!currentAppointment.value) return

  ElMessageBox.confirm(
    `确认开闸放行车辆 ${currentAppointment.value.plateNumber}？`,
    '放行确认',
    {
      confirmButtonText: '确认放行',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    gateStatus.value = 'open'
    ElMessage.success('闸道已开启，请车辆通行')

    setTimeout(() => {
      store.releaseVehicle(currentAppointment.value!.id)
      ElMessage.success(`车辆 ${currentAppointment.value!.plateNumber} 已成功放行`)
      gateStatus.value = 'closed'
      selectedId.value = null
    }, 2000)
  }).catch(() => {})
}

function returnInfo() {
  if (!currentAppointment.value) return

  ElMessageBox.confirm('确定要退回资料重新进行箱单核对吗？', '退回确认', {
    confirmButtonText: '确定退回',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    store.returnToCheck(currentAppointment.value!.id)
    ElMessage.success('已退回箱单核对环节')
    selectedId.value = null
  }).catch(() => {})
}

function printTicket() {
  if (!currentAppointment.value) return
  ticketInfo.no = 'T' + Date.now().toString().slice(-8)
  ticketInfo.plateNumber = currentAppointment.value.plateNumber
  ticketInfo.driverName = currentAppointment.value.driverName
  ticketInfo.businessType = currentAppointment.value.businessType === 'import' ? '进口提箱' : '出口还箱'
  ticketInfo.containerNo = currentAppointment.value.containerNo || '-'
  ticketInfo.laneNo = currentLane.value
  ticketInfo.releaseTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
  ticketInfo.operator = currentUser.value.name
  ticketInfo.printTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
  ticketDialog.value = true
}

async function doPrint() {
  if (window.electronAPI) {
    await window.electronAPI.printTicket(ticketInfo)
  }
  ElMessage.success('打印任务已发送')
  ticketDialog.value = false
}

function confirmManualRelease() {
  if (!manualForm.plateNumber.trim()) {
    ElMessage.warning('请输入车牌号')
    return
  }
  if (!manualForm.reason.trim()) {
    ElMessage.warning('请输入放行原因')
    return
  }
  if (!manualForm.laneNo) {
    ElMessage.warning('请选择闸道')
    return
  }

  ElMessageBox.confirm(
    `确认手动放行车辆 ${manualForm.plateNumber}？此操作将被记录并可追溯。`,
    '手动放行确认',
    {
      confirmButtonText: '确认放行',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    store.manualRelease(manualForm.plateNumber, manualForm.reason, manualForm.laneNo)
    ElMessage.success(`车辆 ${manualForm.plateNumber} 已手动放行，记录已保存`)
    manualReleaseDialog.value = false
    manualForm.plateNumber = ''
    manualForm.reason = ''
    manualForm.laneNo = 1
  }).catch(() => {})
}
</script>

<style scoped>
.gate-status-card {
  text-align: center;
  padding: 30px;
  border-radius: 12px;
  transition: all 0.3s;
}

.gate-status-card.open {
  background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%);
  color: #fff;
}

.gate-status-card.closed {
  background: #f5f7fa;
  color: #909399;
}

.gate-status-text {
  font-size: 18px;
  font-weight: 600;
  margin: 10px 0;
}

.gate-lane {
  font-size: 14px;
  opacity: 0.9;
}

.pass-info {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  height: 100%;
}

.pass-item {
  margin-bottom: 14px;
  font-size: 14px;
}

.pass-item:last-child {
  margin-bottom: 0;
}

.pass-label {
  color: #909399;
  display: inline-block;
  width: 110px;
}

.pass-value {
  color: #303133;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 30px;
}

.ticket-preview {
  background: #fff;
  border: 1px dashed #dcdfe6;
  padding: 20px;
  border-radius: 8px;
}

.ticket-title {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
}

.ticket-no {
  text-align: center;
  color: #909399;
  font-size: 12px;
}

.ticket-info p {
  margin: 8px 0;
  font-size: 14px;
}

.ticket-footer {
  font-size: 12px;
  color: #909399;
}
</style>
