<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">证件核验</div>
      <div class="header-actions">
        <el-tag v-if="currentAppointment" type="warning" size="large">
          当前处理：{{ currentAppointment.plateNumber }} - {{ currentAppointment.driverName }}
        </el-tag>
        <el-tag v-else type="info" size="large">
          待核验车辆：{{ verifyingList.length }} 辆
        </el-tag>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="9">
        <div class="card-section">
          <div class="section-title">待核验车辆列表</div>
          <el-table
            :data="verifyingList"
            stripe
            style="width: 100%"
            @row-click="selectVehicle"
            highlight-current-row
            height="500"
          >
            <el-table-column prop="queueNo" label="排队号" width="90" />
            <el-table-column prop="plateNumber" label="车牌号" width="120" />
            <el-table-column prop="driverName" label="司机" width="100" />
            <el-table-column prop="fleetName" label="车队" width="130" show-overflow-tooltip />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag size="small" type="success">待核验</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="verifyingList.length === 0" description="暂无待核验车辆" :image-size="80" />
        </div>
      </el-col>

      <el-col :span="15">
        <div v-if="currentAppointment" class="card-section">
          <div class="section-title">司机证件信息</div>
          <el-descriptions :column="2" border size="default">
            <el-descriptions-item label="司机姓名">
              <span style="font-weight: 600">{{ currentAppointment.driverName }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="驾驶证号">
              <span style="font-family: 'Courier New', monospace">{{ currentAppointment.driverLicense }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="联系电话">
              {{ currentAppointment.driverPhone }}
            </el-descriptions-item>
            <el-descriptions-item label="所属车队">
              {{ currentAppointment.fleetName }}
            </el-descriptions-item>
            <el-descriptions-item label="车辆类型">
              {{ currentAppointment.vehicleType }}
            </el-descriptions-item>
            <el-descriptions-item label="车牌号">
              <el-tag type="primary" size="large">{{ currentAppointment.plateNumber }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="业务类型">
              <el-tag :type="currentAppointment.businessType === 'import' ? 'primary' : 'success'">
                {{ currentAppointment.businessType === 'import' ? '进口提箱' : currentAppointment.businessType === 'export' ? '出口还箱' : '中转' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="预约号">
              {{ currentAppointment.appointmentNo }}
            </el-descriptions-item>
          </el-descriptions>

          <el-divider />

          <div class="section-title" style="margin-top: 0">证件核验状态</div>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="verify-item" :class="{ pass: verifiedInfo.nameOk, fail: !verifiedInfo.nameOk }">
                <el-icon :size="24"><User /></el-icon>
                <div class="verify-label">姓名匹配</div>
                <div class="verify-result">
                  <el-checkbox v-model="verifiedInfo.nameOk">已核验</el-checkbox>
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="verify-item" :class="{ pass: verifiedInfo.licenseOk, fail: !verifiedInfo.licenseOk }">
                <el-icon :size="24"><Postcard /></el-icon>
                <div class="verify-label">驾驶证有效</div>
                <div class="verify-result">
                  <el-checkbox v-model="verifiedInfo.licenseOk">已核验</el-checkbox>
                </div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="verify-item" :class="{ pass: verifiedInfo.plateOk, fail: !verifiedInfo.plateOk }">
                <el-icon :size="24"><Van /></el-icon>
                <div class="verify-label">车牌一致</div>
                <div class="verify-result">
                  <el-checkbox v-model="verifiedInfo.plateOk">已核验</el-checkbox>
                </div>
              </div>
            </el-col>
          </el-row>

          <el-divider />

          <div class="section-title" style="margin-top: 0">拍照留存</div>
          <el-row :gutter="12">
            <el-col :span="6" v-for="(photo, index) in photos" :key="index">
              <div class="photo-item">
                <img :src="photo" alt="" />
                <div class="photo-label">照片 {{ index + 1 }}</div>
              </div>
            </el-col>
            <el-col :span="6" v-if="photos.length < 4">
              <div class="photo-placeholder" @click="takePhoto">
                <el-icon :size="32"><Camera /></el-icon>
                <span style="margin-top: 8px; font-size: 12px">点击拍照</span>
              </div>
            </el-col>
          </el-row>
          <div style="margin-top: 8px; color: #909399; font-size: 12px">
            已拍摄 {{ photos.length }} / 4 张照片
          </div>

          <el-divider />

          <div class="section-title" style="margin-top: 0">危险品检查</div>
          <el-alert
            v-if="currentAppointment.isDangerous"
            :title="'危险品车辆：' + (currentAppointment.dangerousInfo || '未标注类别')"
            type="error"
            :closable="false"
            show-icon
          >
            <template #default>
              <div style="margin-top: 12px">
                <el-checkbox v-model="dangerousCheck.licenseChecked">危险品运输证已核验</el-checkbox>
                <el-checkbox v-model="dangerousCheck.routeChecked" style="margin-left: 20px">行驶路线已确认</el-checkbox>
                <el-checkbox v-model="dangerousCheck.protectionChecked" style="margin-left: 20px">防护措施已检查</el-checkbox>
              </div>
            </template>
          </el-alert>
          <div v-else style="display: flex; align-items: center; gap: 12px">
            <el-tag type="success">非危险品车辆</el-tag>
            <el-button size="small" type="warning" @click="markDangerous">
              <el-icon><Warning /></el-icon>
              标记为危险品
            </el-button>
          </div>

          <el-divider />

          <div class="verify-actions">
            <el-checkbox v-model="allVerified" style="margin-bottom: 16px">
              确认所有证件信息已核验无误，照片已留存
            </el-checkbox>
            <div class="action-buttons">
              <el-button size="large" type="danger" @click="rejectVerify">
                <el-icon><Close /></el-icon>
                核验不通过
              </el-button>
              <el-button size="large" type="success" :disabled="!canVerifyPass" @click="passVerify">
                <el-icon><Check /></el-icon>
                核验通过，进入箱单核对
              </el-button>
            </div>
          </div>

          <el-divider />

          <div class="section-title" style="margin-top: 0">核验历史记录</div>
          <el-timeline v-if="currentAppointment.verifyRecords && currentAppointment.verifyRecords.length > 0">
            <el-timeline-item
              v-for="record in currentAppointment.verifyRecords"
              :key="record.id"
              :timestamp="record.createTime"
              :type="getTimelineType(record.action)"
            >
              <div>
                <div style="font-weight: 600; color: #303133">
                  {{ getActionText(record.action) }}
                </div>
                <div style="color: #606266; font-size: 13px; margin-top: 4px">
                  {{ record.description }}
                </div>
                <div style="color: #909399; font-size: 12px; margin-top: 4px">
                  操作人：{{ record.operator }}
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无核验记录" :image-size="60" />
        </div>

        <el-empty v-else description="请从左侧列表选择待核验车辆" :image-size="120" style="margin-top: 100px">
          <template #description>
            <p style="font-size: 16px; color: #909399">点击左侧列表中的车辆开始核验</p>
          </template>
        </el-empty>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAppStore } from '@/stores/app'
import type { Appointment } from '@/types'

const store = useAppStore()

const selectedId = ref<string | null>(null)
const photos = ref<string[]>([])
const allVerified = ref(false)

const verifiedInfo = reactive({
  nameOk: true,
  licenseOk: true,
  plateOk: true
})

const dangerousCheck = reactive({
  licenseChecked: false,
  routeChecked: false,
  protectionChecked: false
})

const verifyingList = computed(() => {
  return store.verifyingAppointments
})

const currentAppointment = computed<Appointment | undefined>(() =>
  selectedId.value ? store.getAppointmentById(selectedId.value) : undefined
)

const canVerifyPass = computed(() => {
  if (!currentAppointment.value) return false
  if (!allVerified.value) return false
  if (!verifiedInfo.nameOk || !verifiedInfo.licenseOk || !verifiedInfo.plateOk) return false
  if (photos.value.length === 0) return false
  if (currentAppointment.value.isDangerous) {
    return dangerousCheck.licenseChecked && dangerousCheck.routeChecked && dangerousCheck.protectionChecked
  }
  return true
})

watch(currentAppointment, (val) => {
  if (val) {
    photos.value = [...val.photos]
    verifiedInfo.nameOk = true
    verifiedInfo.licenseOk = true
    verifiedInfo.plateOk = true
    dangerousCheck.licenseChecked = false
    dangerousCheck.routeChecked = false
    dangerousCheck.protectionChecked = false
    allVerified.value = false
  }
})

function selectVehicle(row: Appointment) {
  selectedId.value = row.id
}

function takePhoto() {
  if (!currentAppointment.value) return
  const mockPhoto = `https://picsum.photos/300/200?random=${Date.now()}`
  photos.value.push(mockPhoto)
  store.addPhoto(currentAppointment.value.id, mockPhoto)
  ElMessage.success(`拍照成功，已拍摄 ${photos.value.length} 张`)
}

async function passVerify() {
  if (!currentAppointment.value) return
  store.verifyDriver(currentAppointment.value.id, true)
  ElMessage.success(`车辆 ${currentAppointment.value.plateNumber} 核验通过，已进入箱单核对环节`)
  selectedId.value = null
  allVerified.value = false
}

async function rejectVerify() {
  if (!currentAppointment.value) return
  try {
    const { value } = await ElMessageBox.prompt('请输入拒绝原因', '核验不通过', {
      confirmButtonText: '确定拒绝',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入证件核验不通过的原因',
      inputValidator: (value) => {
        if (!value || value.trim().length === 0) {
          return '请输入拒绝原因'
        }
        return true
      }
    })
    store.verifyDriver(currentAppointment.value.id, false, value)
    ElMessage.success('已记录拒绝原因，车辆已退回')
    selectedId.value = null
    allVerified.value = false
  } catch {
    // user cancelled
  }
}

function markDangerous() {
  if (!currentAppointment.value) return
  ElMessageBox.prompt('请输入危险品类别说明', '标记危险品车辆', {
    confirmButtonText: '确认标记',
    cancelButtonText: '取消',
    inputValue: currentAppointment.value.dangerousInfo || ''
  }).then(({ value }) => {
    store.updateAppointment(currentAppointment.value!.id, {
      isDangerous: true,
      dangerousInfo: value || '危险品'
    })
    store.addVerifyRecord(currentAppointment.value!.id, 'mark_dangerous', `标记为危险品：${value || '危险品'}`)
    ElMessage.success('已标记为危险品车辆')
  }).catch(() => {})
}

function getTimelineType(action: string) {
  const map: Record<string, any> = {
    'verify_pass': 'success',
    'verify_reject': 'danger',
    'photo': 'primary',
    'mark_dangerous': 'warning'
  }
  return map[action] || 'primary'
}

function getActionText(action: string) {
  const map: Record<string, string> = {
    'verify_pass': '核验通过',
    'verify_reject': '核验拒绝',
    'photo': '拍照留存',
    'mark_dangerous': '标记危险品'
  }
  return map[action] || action
}
</script>

<style scoped>
.photo-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.photo-item img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
}

.photo-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  padding: 4px 8px;
  text-align: center;
}

.verify-item {
  text-align: center;
  padding: 20px 12px;
  border-radius: 8px;
  border: 2px solid #e4e7ed;
  transition: all 0.3s;
}

.verify-item.pass {
  border-color: #67c23a;
  background: #f0f9eb;
}

.verify-item.fail {
  border-color: #f56c6c;
  background: #fef0f0;
}

.verify-label {
  font-size: 14px;
  color: #606266;
  margin: 8px 0;
}

.verify-result {
  margin-top: 8px;
}

.verify-actions {
  padding-top: 10px;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
}
</style>
