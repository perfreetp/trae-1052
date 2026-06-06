<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">异常补录</div>
      <div class="header-actions">
        <el-button type="primary" @click="addExceptionDialog = true">
          <el-icon><Plus /></el-icon>
          新增异常记录
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)">
          <div class="stat-value">{{ absentCount }}</div>
          <div class="stat-label">爽约车辆</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)">
          <div class="stat-value">{{ lateCount }}</div>
          <div class="stat-label">迟到车辆</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
          <div class="stat-value">{{ rejectedCount }}</div>
          <div class="stat-label">拒绝放行</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
          <div class="stat-value">{{ exceptionCount }}</div>
          <div class="stat-label">异常总数</div>
        </div>
      </el-col>
    </el-row>

    <div class="card-section" style="margin-top: 20px">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="待处理" name="pending">
          <el-table :data="pendingList" stripe border>
            <el-table-column prop="appointmentNo" label="预约号" width="160" />
            <el-table-column prop="plateNumber" label="车牌号" width="120" />
            <el-table-column prop="driverName" label="司机" width="100" />
            <el-table-column prop="fleetName" label="车队" width="140" />
            <el-table-column prop="appointmentTime" label="预约时间" width="160" />
            <el-table-column label="异常类型" width="120">
              <template #default="{ row }">
                <el-tag :type="row.status === 'absent' ? 'danger' : 'warning'">
                  {{ row.status === 'absent' ? '爽约' : '迟到' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="240" fixed="right">
              <template #default="{ row }">
                <el-button v-if="row.status === 'absent'" type="success" size="small" @click="handleAbsent(row)">
                  标记爽约
                </el-button>
                <el-button v-if="row.status === 'late'" type="primary" size="small" @click="handleLate(row)">
                  安排入场
                </el-button>
                <el-button type="info" size="small" @click="viewDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="已处理" name="processed">
          <el-table :data="processedList" stripe border>
            <el-table-column prop="appointmentNo" label="预约号" width="160" />
            <el-table-column prop="plateNumber" label="车牌号" width="120" />
            <el-table-column prop="driverName" label="司机" width="100" />
            <el-table-column prop="fleetName" label="车队" width="140" />
            <el-table-column label="异常类型" width="120">
              <template #default="{ row }">
                <el-tag :type="row.status === 'absent' ? 'danger' : 'warning'">
                  {{ row.status === 'absent' ? '爽约' : row.status === 'late' ? '迟到' : '其他' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="处理说明" />
            <el-table-column label="处理时间" width="160">
              <template #default="{ row }">{{ row.checkOutTime || '-' }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="全部异常" name="all">
          <el-table :data="allExceptions" stripe border>
            <el-table-column prop="appointmentNo" label="预约号" width="160" />
            <el-table-column prop="plateNumber" label="车牌号" width="120" />
            <el-table-column prop="driverName" label="司机" width="100" />
            <el-table-column prop="fleetName" label="车队" width="140" />
            <el-table-column prop="appointmentTime" label="预约时间" width="160" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <span class="status-tag" :class="'status-' + row.status">
                  {{ getStatusText(row.status) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="addExceptionDialog" title="新增异常记录" width="550px">
      <el-form :model="exceptionForm" label-width="100px">
        <el-form-item label="预约号">
          <el-input v-model="exceptionForm.appointmentNo" placeholder="请输入预约号" />
        </el-form-item>
        <el-form-item label="车牌号">
          <el-input v-model="exceptionForm.plateNumber" placeholder="请输入车牌号" />
        </el-form-item>
        <el-form-item label="异常类型">
          <el-select v-model="exceptionForm.type" placeholder="选择异常类型" style="width: 100%">
            <el-option label="爽约" value="absent" />
            <el-option label="迟到" value="late" />
            <el-option label="证件不符" value="document_mismatch" />
            <el-option label="箱单不符" value="container_mismatch" />
            <el-option label="设备故障" value="equipment_fault" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="异常描述">
          <el-input v-model="exceptionForm.description" type="textarea" :rows="3" placeholder="请描述异常情况" />
        </el-form-item>
        <el-form-item label="处理措施">
          <el-input v-model="exceptionForm.action" type="textarea" :rows="2" placeholder="请输入处理措施" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addExceptionDialog = false">取消</el-button>
        <el-button type="primary" @click="saveException">保存</el-button>
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

const activeTab = ref('pending')
const addExceptionDialog = ref(false)

const exceptionForm = reactive({
  appointmentNo: '',
  plateNumber: '',
  type: '',
  description: '',
  action: ''
})

const absentAppointments = computed(() =>
  store.appointments.filter(a => a.status === 'absent')
)

const lateAppointments = computed(() =>
  store.appointments.filter(a => a.status === 'late')
)

const rejectedAppointments = computed(() =>
  store.appointments.filter(a => a.status === 'rejected')
)

const absentCount = computed(() => absentAppointments.value.length)
const lateCount = computed(() => lateAppointments.value.length)
const rejectedCount = computed(() => rejectedAppointments.value.length)
const exceptionCount = computed(() => absentCount.value + lateCount.value + rejectedCount.value)

const pendingList = computed(() =>
  store.appointments.filter(a => a.status === 'absent' || a.status === 'late')
)

const processedList = computed(() =>
  store.appointments.filter(a => a.status === 'rejected')
)

const allExceptions = computed(() =>
  store.appointments.filter(a =>
    a.status === 'absent' || a.status === 'late' || a.status === 'rejected'
  )
)

function getStatusText(status: string) {
  const map: Record<string, string> = {
    absent: '爽约',
    late: '迟到',
    rejected: '已拒绝',
    pending: '待处理'
  }
  return map[status] || status
}

async function handleAbsent(row: Appointment) {
  try {
    const { value } = await ElMessageBox.prompt('请输入爽约处理说明', '确认爽约', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputValue: row.remark || ''
    })
    store.markAbsent(row.id)
    store.updateAppointment(row.id, { remark: value, checkOutTime: dayjs().format('YYYY-MM-DD HH:mm:ss') })
    ElMessage.success('已标记为爽约')
  } catch {
    // cancelled
  }
}

function handleLate(row: Appointment) {
  ElMessageBox.confirm('迟到车辆已安排优先入场，是否确认？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消'
  }).then(() => {
    store.updateAppointment(row.id, { status: 'queuing' })
    store.addToQueue(row.id)
    ElMessage.success('已安排入场')
  }).catch(() => {})
}

function viewDetail(row: Appointment) {
  ElMessageBox.alert(
    `
    <p><strong>预约号：</strong>${row.appointmentNo}</p>
    <p><strong>车牌号：</strong>${row.plateNumber}</p>
    <p><strong>司机：</strong>${row.driverName}</p>
    <p><strong>车队：</strong>${row.fleetName}</p>
    <p><strong>预约时间：</strong>${row.appointmentTime}</p>
    <p><strong>状态：</strong>${getStatusText(row.status)}</p>
    <p><strong>备注：</strong>${row.remark || '无'}</p>
    `,
    '异常详情',
    { dangerouslyUseHTMLString: true }
  )
}

function saveException() {
  if (!exceptionForm.appointmentNo || !exceptionForm.type) {
    ElMessage.warning('请填写必要信息')
    return
  }
  ElMessage.success('异常记录已保存')
  addExceptionDialog.value = false
  exceptionForm.appointmentNo = ''
  exceptionForm.plateNumber = ''
  exceptionForm.type = ''
  exceptionForm.description = ''
  exceptionForm.action = ''
}
</script>
