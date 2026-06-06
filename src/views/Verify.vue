<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">证件核验</div>
      <div class="header-actions">
        <el-tag v-if="currentAppointment" type="warning">
          当前处理：{{ currentAppointment.plateNumber }}
        </el-tag>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="10">
        <div class="card-section">
          <div class="section-title">选择待核验车辆</div>
          <el-table :data="verifyingList" stripe style="width: 100%" @row-click="selectVehicle" highlight-current-row>
            <el-table-column prop="queueNo" label="排队号" width="80" />
            <el-table-column prop="plateNumber" label="车牌号" width="120" />
            <el-table-column prop="driverName" label="司机" width="80" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="row.status === 'verifying' ? 'success' : 'warning'">
                  {{ row.status === 'verifying' ? '核验中' : '待核验' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="card-section">
          <div class="section-title">拍照留存</div>
          <el-row :gutter="10">
            <el-col :span="12" v-for="(photo, index) in photos" :key="index">
              <div class="photo-item">
                <img :src="photo" alt="" />
                <div class="photo-label">照片 {{ index + 1 }}</div>
              </div>
            </el-col>
            <el-col :span="12" v-if="photos.length < 4">
              <div class="photo-placeholder" @click="takePhoto">
                <el-icon :size="32"><Camera /></el-icon>
                <span style="margin-top: 8px">点击拍照</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-col>

      <el-col :span="14">
        <div v-if="currentAppointment" class="card-section">
          <div class="section-title">司机证件核验</div>
          <el-descriptions :column="2" border size="default">
            <el-descriptions-item label="司机姓名">
              <span :class="{ 'text-success': verifiedInfo.nameOk }">{{ currentAppointment.driverName }}</span>
              <el-icon v-if="verifiedInfo.nameOk" color="#67c23a"><CircleCheck /></el-icon>
              <el-icon v-else color="#f56c6c"><CircleClose /></el-icon>
            </el-descriptions-item>
            <el-descriptions-item label="驾驶证号">
              <span :class="{ 'text-success': verifiedInfo.licenseOk }">{{ currentAppointment.driverLicense }}</span>
              <el-icon v-if="verifiedInfo.licenseOk" color="#67c23a"><CircleCheck /></el-icon>
              <el-icon v-else color="#f56c6c"><CircleClose /></el-icon>
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
              <span :class="{ 'text-success': verifiedInfo.plateOk }">{{ currentAppointment.plateNumber }}</span>
              <el-icon v-if="verifiedInfo.plateOk" color="#67c23a"><CircleCheck /></el-icon>
              <el-icon v-else color="#f56c6c"><CircleClose /></el-icon>
            </el-descriptions-item>
          </el-descriptions>

          <el-divider />

          <div class="section-title" style="margin-top: 0">危险品检查</div>
          <el-alert
            v-if="currentAppointment.isDangerous"
            :title="'危险品车辆：' + currentAppointment.dangerousInfo"
            type="error"
            :closable="false"
            show-icon
          >
            <template #default>
              <div style="margin-top: 10px">
                <el-checkbox v-model="dangerousCheck.licenseChecked">危险品运输证已核验</el-checkbox>
                <el-checkbox v-model="dangerousCheck.routeChecked">行驶路线已确认</el-checkbox>
                <el-checkbox v-model="dangerousCheck.protectionChecked">防护措施已检查</el-checkbox>
              </div>
            </template>
          </el-alert>
          <el-alert v-else title="非危险品车辆" type="success" :closable="false" show-icon />

          <el-divider />

          <div class="verify-actions">
            <el-checkbox v-model="allVerified">确认所有证件信息已核验无误</el-checkbox>
            <div class="action-buttons" style="margin-top: 20px">
              <el-button size="large" @click="markDangerous">
                <el-icon><Warning /></el-icon>
                标记危险品
              </el-button>
              <el-button type="danger" size="large" @click="rejectVerify">
                <el-icon><Close /></el-icon>
                核验不通过
              </el-button>
              <el-button type="success" size="large" :disabled="!canVerifyPass" @click="passVerify">
                <el-icon><Check /></el-icon>
                核验通过
              </el-button>
            </div>
          </div>
        </div>

        <el-empty v-else description="请选择待核验车辆" :image-size="120" />
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

const verifyingList = computed(() =>
  store.appointments.filter(a => a.status === 'queuing' || a.status === 'verifying')
)

const currentAppointment = computed<Appointment | undefined>(() =>
  selectedId.value ? store.getAppointmentById(selectedId.value) : undefined
)

const canVerifyPass = computed(() => {
  if (!currentAppointment.value) return false
  if (!allVerified.value) return false
  if (currentAppointment.value.isDangerous) {
    return dangerousCheck.licenseChecked && dangerousCheck.routeChecked && dangerousCheck.protectionChecked
  }
  return verifiedInfo.nameOk && verifiedInfo.licenseOk && verifiedInfo.plateOk
})

watch(currentAppointment, (val) => {
  if (val) {
    photos.value = [...val.photos]
    if (val.status === 'queuing') {
      store.updateAppointment(val.id, { status: 'verifying' })
    }
  }
})

function selectVehicle(row: Appointment) {
  selectedId.value = row.id
}

function takePhoto() {
  const mockPhoto = `https://picsum.photos/300/200?random=${Date.now()}`
  photos.value.push(mockPhoto)
  if (currentAppointment.value) {
    store.addPhoto(currentAppointment.value.id, mockPhoto)
  }
  ElMessage.success('拍照成功')
}

function passVerify() {
  if (!currentAppointment.value) return
  store.verifyDriver(currentAppointment.value.id, true)
  ElMessage.success(`车辆 ${currentAppointment.value.plateNumber} 核验通过，进入箱单核对环节`)
  selectedId.value = null
  allVerified.value = false
}

async function rejectVerify() {
  if (!currentAppointment.value) return
  try {
    const { value } = await ElMessageBox.prompt('请输入拒绝原因', '核验不通过', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入拒绝原因'
    })
    store.rejectVehicle(currentAppointment.value.id, value)
    ElMessage.success('已记录拒绝原因')
    selectedId.value = null
    allVerified.value = false
  } catch {
    // user cancelled
  }
}

function markDangerous() {
  if (!currentAppointment.value) return
  store.updateAppointment(currentAppointment.value.id, {
    isDangerous: true,
    dangerousInfo: '人工标记危险品'
  })
  ElMessage.success('已标记为危险品车辆')
}
</script>

<style scoped>
.photo-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
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

.text-success {
  color: #67c23a;
  font-weight: 600;
}

.verify-actions {
  margin-top: 20px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
