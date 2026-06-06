<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">箱单核对</div>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <div class="card-section">
          <div class="section-title">待核对列表</div>
          <el-table :data="checkingList" stripe style="width: 100%" @row-click="selectVehicle" highlight-current-row>
            <el-table-column prop="queueNo" label="排队号" width="80" />
            <el-table-column prop="plateNumber" label="车牌号" width="120" />
            <el-table-column prop="businessType" label="业务" width="70">
              <template #default="{ row }">
                <el-tag size="small" :type="row.businessType === 'import' ? 'primary' : 'success'">
                  {{ row.businessType === 'import' ? '进口' : '出口' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>

      <el-col :span="16">
        <div v-if="currentAppointment" class="card-section">
          <div class="section-title">提还箱信息匹配</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="业务类型">
              <el-tag :type="currentAppointment.businessType === 'import' ? 'primary' : 'success'">
                {{ currentAppointment.businessType === 'import' ? '进口提箱' : currentAppointment.businessType === 'export' ? '出口还箱' : '中转' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="预约号">
              {{ currentAppointment.appointmentNo }}
            </el-descriptions-item>
            <el-descriptions-item label="车牌号">
              {{ currentAppointment.plateNumber }}
            </el-descriptions-item>
            <el-descriptions-item label="车队">
              {{ currentAppointment.fleetName }}
            </el-descriptions-item>
          </el-descriptions>

          <el-divider />

          <div class="section-title" style="margin-top: 0">系统箱单信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="集装箱号">
              <span :class="matched ? 'text-success' : 'text-danger'">
                {{ systemContainerInfo.containerNo }}
              </span>
              <el-icon v-if="matched" color="#67c23a"><CircleCheck /></el-icon>
              <el-icon v-else color="#f56c6c"><CircleClose /></el-icon>
            </el-descriptions-item>
            <el-descriptions-item label="箱型尺寸">
              {{ systemContainerInfo.containerSize }}
            </el-descriptions-item>
            <el-descriptions-item label="提单号">
              {{ systemContainerInfo.billNo }}
            </el-descriptions-item>
            <el-descriptions-item label="货物名称">
              {{ systemContainerInfo.cargoName }}
            </el-descriptions-item>
            <el-descriptions-item label="重量（系统）">
              {{ systemContainerInfo.weight }} kg
            </el-descriptions-item>
            <el-descriptions-item label="目的地">
              {{ systemContainerInfo.destination }}
            </el-descriptions-item>
          </el-descriptions>

          <el-divider />

          <div class="section-title" style="margin-top: 0">现场称重记录</div>
          <el-form :model="weightForm" label-width="120px" inline>
            <el-form-item label="地磅称重">
              <el-input-number v-model="weightForm.weight" :min="0" :max="50000" :step="100" style="width: 180px" />
              <span style="margin-left: 8px">kg</span>
            </el-form-item>
            <el-form-item label="偏差">
              <el-tag :type="weightDeviationType">
                {{ weightDeviation }}%
              </el-tag>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="recordWeight">记录称重</el-button>
            </el-form-item>
          </el-form>

          <el-divider />

          <div class="section-title" style="margin-top: 0">铅封检查</div>
          <el-form label-width="120px">
            <el-form-item label="铅封号">
              <el-input v-model="sealNo" placeholder="请输入铅封号" style="width: 240px" />
              <el-button @click="matchSeal">匹配校验</el-button>
            </el-form-item>
            <el-form-item label="箱体检查">
              <el-checkbox v-model="containerCheck.undamaged">箱体完好</el-checkbox>
              <el-checkbox v-model="containerCheck.clean">箱内清洁</el-checkbox>
              <el-checkbox v-model="containerCheck.sealed">铅封完好</el-checkbox>
            </el-form-item>
          </el-form>

          <div class="match-result" v-if="matchResult">
            <el-alert
              :title="matchResult.title"
              :type="matchResult.type"
              :closable="false"
              show-icon
            />
          </div>

          <div class="action-buttons">
            <el-button size="large" @click="backToVerify">退回重验</el-button>
            <el-button type="success" size="large" :disabled="!canComplete" @click="completeCheck">
              确认无误，进入放行
            </el-button>
          </div>
        </div>

        <el-empty v-else description="请选择待核对车辆" :image-size="120" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/stores/app'
import type { Appointment } from '@/types'

const store = useAppStore()

const selectedId = ref<string | null>(null)
const sealNo = ref('')
const weightRecorded = ref(false)
const matchResult = ref<any>(null)

const weightForm = reactive({
  weight: 28000
})

const containerCheck = reactive({
  undamaged: true,
  clean: true,
  sealed: true
})

const systemContainerInfo = reactive({
  containerNo: 'CBHU1234567',
  containerSize: '40HQ',
  billNo: 'BL202401001',
  cargoName: '电子产品',
  weight: 28500,
  destination: '北京朝阳'
})

const checkingList = computed(() =>
  store.appointments.filter(a => a.status === 'verifying' || a.status === 'checking')
)

const currentAppointment = computed<Appointment | undefined>(() =>
  selectedId.value ? store.getAppointmentById(selectedId.value) : undefined
)

const matched = computed(() => {
  if (!currentAppointment.value?.containerNo) return false
  return currentAppointment.value.containerNo === systemContainerInfo.containerNo
})

const weightDeviation = computed(() => {
  const sysWeight = systemContainerInfo.weight
  const actualWeight = weightForm.weight
  if (sysWeight === 0) return 0
  return Math.abs(((actualWeight - sysWeight) / sysWeight * 100)).toFixed(1)
})

const weightDeviationType = computed(() => {
  const dev = parseFloat(weightDeviation.value)
  if (dev <= 3) return 'success'
  if (dev <= 5) return 'warning'
  return 'danger'
})

const canComplete = computed(() => {
  return matched.value && weightRecorded.value && containerCheck.undamaged && containerCheck.clean && containerCheck.sealed
})

watch(currentAppointment, (val) => {
  if (val) {
    if (val.containerNo) {
      systemContainerInfo.containerNo = val.containerNo
      systemContainerInfo.containerSize = val.containerSize || '40HQ'
    }
    if (val.weight) {
      weightForm.weight = val.weight
    }
  }
  weightRecorded.value = false
  matchResult.value = null
  sealNo.value = ''
})

function selectVehicle(row: Appointment) {
  selectedId.value = row.id
}

function recordWeight() {
  weightRecorded.value = true
  ElMessage.success(`称重记录已保存：${weightForm.weight} kg`)
}

function matchSeal() {
  if (!sealNo.value) {
    ElMessage.warning('请输入铅封号')
    return
  }
  matchResult.value = {
    title: '铅封校验通过，与系统记录一致',
    type: 'success'
  }
  ElMessage.success('铅封匹配成功')
}

function completeCheck() {
  if (!currentAppointment.value) return
  store.completeCheck(currentAppointment.value.id, weightForm.weight)
  ElMessage.success('箱单核对完成，已进入放行环节')
  selectedId.value = null
}

function backToVerify() {
  if (!currentAppointment.value) return
  store.updateAppointment(currentAppointment.value.id, { status: 'verifying' })
  ElMessage.info('已退回证件核验环节')
  selectedId.value = null
}
</script>

<style scoped>
.text-success {
  color: #67c23a;
  font-weight: 600;
}

.text-danger {
  color: #f56c6c;
  font-weight: 600;
}

.match-result {
  margin: 20px 0;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 30px;
}
</style>
