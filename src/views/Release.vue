<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">闸道放行</div>
      <div class="header-actions">
        <el-tag v-if="passingList.length > 0" type="warning" size="large">
          待放行：{{ passingList.length }} 辆
        </el-tag>
        <el-button type="primary" @click="manualReleaseDialog = true">
          <el-icon><Hand /></el-icon>
          手动放行
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="9">
        <div class="card-section">
          <div class="section-title">待放行车辆列表</div>
          <el-table
            :data="passingList"
            stripe
            style="width: 100%"
            @row-click="selectVehicle"
            highlight-current-row
            height="280"
          >
            <el-table-column prop="queueNo" label="排队号" width="90" />
            <el-table-column prop="plateNumber" label="车牌号" width="120" />
            <el-table-column prop="driverName" label="司机" width="100" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag size="small" type="success">待放行</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="passingList.length === 0" description="暂无待放行车辆" :image-size="80" />
          <div class="tip-text">仅显示已完成箱单核对的车辆</div>
        </div>

        <div class="card-section" style="margin-top: 20px">
          <div class="section-title">放行台账查询</div>
          <el-form :inline="true" size="small" style="margin-bottom: 12px">
            <el-form-item label="车牌号">
              <el-input v-model="filterPlate" placeholder="请输入" clearable style="width: 120px" />
            </el-form-item>
            <el-form-item label="闸道">
              <el-select v-model="filterLane" placeholder="全部" clearable style="width: 90px">
                <el-option label="1号" :value="1" />
                <el-option label="2号" :value="2" />
                <el-option label="3号" :value="3" />
                <el-option label="4号" :value="4" />
              </el-select>
            </el-form-item>
            <el-form-item label="值班员">
              <el-select v-model="filterOperator" placeholder="全部" clearable style="width: 100px">
                <el-option label="张值班员" value="张值班员" />
                <el-option label="李值班员" value="李值班员" />
                <el-option label="王值班员" value="王值班员" />
              </el-select>
            </el-form-item>
            <el-form-item label="类型">
              <el-select v-model="filterType" placeholder="全部" clearable style="width: 100px">
                <el-option label="正常放行" value="normal" />
                <el-option label="手动放行" value="manual" />
              </el-select>
            </el-form-item>
            <el-form-item label="放行时间">
              <el-date-picker
                v-model="filterTimeRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                clearable
                style="width: 300px"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="small" @click="filterRecords">查询</el-button>
              <el-button size="small" @click="resetFilter">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="filteredReleaseRecords" stripe border height="260" size="small">
            <el-table-column prop="releaseTime" label="放行时间" width="160" fixed="left" />
            <el-table-column prop="plateNumber" label="车牌号" width="100" />
            <el-table-column label="类型" width="90">
              <template #default="{ row }">
                <el-tag :type="row.isManual ? 'danger' : 'success'" size="small">
                  {{ row.isManual ? '手动' : '正常' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="laneNo" label="闸道" width="60">
              <template #default="{ row }">{{ row.laneNo }}号</template>
            </el-table-column>
            <el-table-column prop="operator" label="值班员" width="90" />
            <el-table-column prop="appointmentNo" label="预约号" width="150" show-overflow-tooltip />
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewReleaseDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>

      <el-col :span="15">
        <div v-if="currentAppointment" class="card-section">
          <div class="section-title">车辆通行信息</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="预约号">
              {{ currentAppointment.appointmentNo }}
            </el-descriptions-item>
            <el-descriptions-item label="排队号">
              <el-tag type="primary" size="large">{{ currentAppointment.queueNo }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="车牌号">
              <el-tag type="primary" size="large">{{ currentAppointment.plateNumber }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="司机姓名">
              {{ currentAppointment.driverName }}
            </el-descriptions-item>
            <el-descriptions-item label="所属车队">
              {{ currentAppointment.fleetName }}
            </el-descriptions-item>
            <el-descriptions-item label="车辆类型">
              {{ currentAppointment.vehicleType }}
            </el-descriptions-item>
            <el-descriptions-item label="业务类型">
              <el-tag :type="currentAppointment.businessType === 'import' ? 'primary' : 'success'">
                {{ currentAppointment.businessType === 'import' ? '进口提箱' : currentAppointment.businessType === 'export' ? '出口还箱' : '中转' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="箱号">
              {{ currentAppointment.containerNo || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="箱型">
              {{ currentAppointment.containerSize || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="称重结果">
              <span style="font-weight: 600; color: #409eff">{{ currentAppointment.weight || 0 }} kg</span>
            </el-descriptions-item>
            <el-descriptions-item label="危险品">
              <el-tag :type="currentAppointment.isDangerous ? 'danger' : 'info'" size="small">
                {{ currentAppointment.isDangerous ? '是' : '否' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="入闸时间">
              {{ currentAppointment.checkInTime || '-' }}
            </el-descriptions-item>
          </el-descriptions>

          <el-divider />

          <div class="section-title" style="margin-top: 0">放行操作</div>
          <el-row :gutter="16">
            <el-col :span="12">
              <div class="verify-card">
                <div class="verify-card-title">放行信息确认</div>
                <div class="verify-card-content">
                  <div class="info-row">
                    <span class="info-label">通行闸道：</span>
                    <el-select v-model="selectedLane" placeholder="选择闸道" style="width: 150px">
                      <el-option v-for="lane in availableLanes" :key="lane.id" :label="lane.name" :value="lane.id" :disabled="lane.status === 'maintenance'" />
                    </el-select>
                  </div>
                  <div class="info-row">
                    <span class="info-label">当前状态：</span>
                    <span style="color: #67c23a">箱单核对完成，等待放行</span>
                  </div>
                </div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="verify-card">
                <div class="verify-card-title">操作</div>
                <div class="verify-card-content" style="gap: 12px">
                  <el-button type="success" size="large" @click="confirmRelease" :disabled="!selectedLane" style="width: 100%">
                    <el-icon><Check /></el-icon>
                    确认开闸放行
                  </el-button>
                  <el-button type="warning" size="large" @click="returnToCheck" style="width: 100%">
                    <el-icon><Back /></el-icon>
                    退回箱单核对
                  </el-button>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <div v-else class="card-section" style="min-height: 400px; display: flex; align-items: center; justify-content: center">
          <el-empty description="点击左侧列表中的车辆开始放行操作" :image-size="100" />
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="manualReleaseDialog" title="手动放行" width="500px">
      <el-form :model="manualReleaseForm" label-width="100px" :rules="manualReleaseRules" ref="manualReleaseFormRef">
        <el-form-item label="车牌号" prop="plateNumber">
          <el-input v-model="manualReleaseForm.plateNumber" placeholder="请输入车牌号" />
        </el-form-item>
        <el-form-item label="放行原因" prop="reason">
          <el-input v-model="manualReleaseForm.reason" type="textarea" :rows="3" placeholder="请输入手动放行原因（必填）" />
        </el-form-item>
        <el-form-item label="闸道选择" prop="laneNo">
          <el-select v-model="manualReleaseForm.laneNo" placeholder="选择闸道" style="width: 100%">
            <el-option v-for="lane in availableLanes" :key="lane.id" :label="lane.name" :value="lane.id" :disabled="lane.status === 'maintenance'" />
          </el-select>
        </el-form-item>
        <el-form-item label="值班员">
          <el-tag type="info">{{ store.currentUser.name }}</el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualReleaseDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmManualRelease">确认放行</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialog" title="放行记录详情" width="550px">
      <el-descriptions v-if="currentRelease" :column="1" border size="default">
        <el-descriptions-item label="放行时间">
          {{ currentRelease.releaseTime }}
        </el-descriptions-item>
        <el-descriptions-item label="车牌号">
          <el-tag type="primary">{{ currentRelease.plateNumber }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="预约号">
          {{ currentRelease.appointmentNo || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="放行类型">
          <el-tag :type="currentRelease.isManual ? 'danger' : 'success'">
            {{ currentRelease.isManual ? '手动放行' : '正常放行' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="通行闸道">
          {{ currentRelease.laneNo }}号闸道
        </el-descriptions-item>
        <el-descriptions-item label="放行原因">
          <div style="white-space: pre-wrap; color: #606266">
            {{ currentRelease.reason || (currentRelease.isManual ? '无' : '正常流程放行') }}
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="称重结果">
          {{ currentRelease.weight ? currentRelease.weight + ' kg' : '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="司机">
          {{ currentRelease.driverName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="所属车队">
          {{ currentRelease.fleetName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="值班员">
          {{ currentRelease.operator }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useAppStore } from '@/stores/app'
import type { Appointment, ReleaseRecord } from '@/types'
import dayjs from 'dayjs'

const store = useAppStore()

const selectedId = ref('')
const selectedLane = ref<number | null>(null)
const manualReleaseDialog = ref(false)
const detailDialog = ref(false)
const currentRelease = ref<ReleaseRecord | null>(null)
const manualReleaseFormRef = ref<FormInstance>()

const filterPlate = ref('')
const filterLane = ref<number | null>(null)
const filterOperator = ref('')
const filterType = ref('')
const filterTimeRange = ref<string[] | null>(null)

const passingList = computed(() => store.passingAppointments)
const availableLanes = computed(() => store.gateLanes)

const currentAppointment = computed<Appointment | undefined>(() =>
  selectedId.value ? store.getAppointmentById(selectedId.value) : undefined
)

const releaseRecords = computed(() => store.releaseRecords)

const filteredReleaseRecords = computed(() => {
  let result = [...releaseRecords.value]
  if (filterPlate.value) {
    result = result.filter(r => r.plateNumber.includes(filterPlate.value))
  }
  if (filterLane.value !== null) {
    result = result.filter(r => r.laneNo === filterLane.value)
  }
  if (filterOperator.value) {
    result = result.filter(r => r.operator === filterOperator.value)
  }
  if (filterType.value) {
    result = result.filter(r => filterType.value === 'manual' ? r.isManual : !r.isManual)
  }
  if (filterTimeRange.value && filterTimeRange.value.length === 2) {
    const [startTime, endTime] = filterTimeRange.value
    result = result.filter(r => {
      const releaseTime = dayjs(r.releaseTime)
      return releaseTime.isAfter(dayjs(startTime)) && releaseTime.isBefore(dayjs(endTime).add(1, 'second'))
    })
  }
  return result
})

const manualReleaseForm = reactive({
  plateNumber: '',
  reason: '',
  laneNo: null as number | null
})

const manualReleaseRules: FormRules = {
  plateNumber: [{ required: true, message: '请输入车牌号', trigger: 'blur' }],
  reason: [{ required: true, message: '请输入放行原因', trigger: 'blur' }],
  laneNo: [{ required: true, message: '请选择闸道', trigger: 'change' }]
}

function selectVehicle(row: Appointment) {
  selectedId.value = row.id
  selectedLane.value = null
}

function confirmRelease() {
  if (!currentAppointment.value || !selectedLane.value) return
  ElMessageBox.confirm(
    `确认放行车辆 ${currentAppointment.value.plateNumber}？`,
    '放行确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'success'
    }
  ).then(() => {
    store.releaseVehicle(currentAppointment.value!.id)
    ElMessage.success(`车辆 ${currentAppointment.value!.plateNumber} 已放行`)
    selectedId.value = ''
    selectedLane.value = null
  }).catch(() => {})
}

function returnToCheck() {
  if (!currentAppointment.value) return
  ElMessageBox.confirm(
    `将车辆 ${currentAppointment.value.plateNumber} 退回箱单核对？`,
    '退回确认',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    store.returnToCheck(currentAppointment.value!.id)
    ElMessage.success(`车辆 ${currentAppointment.value!.plateNumber} 已退回箱单核对`)
    selectedId.value = ''
  }).catch(() => {})
}

function confirmManualRelease() {
  if (!manualReleaseFormRef.value) return
  manualReleaseFormRef.value.validate((valid) => {
    if (valid && manualReleaseForm.laneNo) {
      store.manualRelease(manualReleaseForm.plateNumber, manualReleaseForm.reason, manualReleaseForm.laneNo)
      ElMessage.success('手动放行完成')
      manualReleaseDialog.value = false
      manualReleaseForm.plateNumber = ''
      manualReleaseForm.reason = ''
      manualReleaseForm.laneNo = null
    }
  })
}

function viewReleaseDetail(record: ReleaseRecord) {
  currentRelease.value = record
  detailDialog.value = true
}

function filterRecords() {}

function resetFilter() {
  filterPlate.value = ''
  filterLane.value = null
  filterOperator.value = ''
  filterType.value = ''
  filterTimeRange.value = null
}
</script>
