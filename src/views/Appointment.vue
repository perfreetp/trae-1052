<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">预约登记</div>
      <div class="header-actions">
        <el-button type="primary" @click="openAddDialog">
          <el-icon><Plus /></el-icon>
          新增预约
        </el-button>
      </div>
    </div>

    <div class="card-section">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="车牌号">
          <el-input v-model="searchForm.plateNumber" placeholder="请输入车牌号" clearable />
        </el-form-item>
        <el-form-item label="预约号">
          <el-input v-model="searchForm.appointmentNo" placeholder="请输入预约号" clearable />
        </el-form-item>
        <el-form-item label="车队">
          <el-select v-model="searchForm.fleetName" placeholder="选择车队" clearable style="width: 160px">
            <el-option v-for="fleet in fleets" :key="fleet" :label="fleet" :value="fleet" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务类型">
          <el-select v-model="searchForm.businessType" placeholder="选择类型" clearable style="width: 140px">
            <el-option label="进口提箱" value="import" />
            <el-option label="出口还箱" value="export" />
            <el-option label="中转" value="transfer" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="选择状态" clearable style="width: 140px">
            <el-option label="待排队" value="pending" />
            <el-option label="排队中" value="queuing" />
            <el-option label="核验中" value="verifying" />
            <el-option label="核对中" value="checking" />
            <el-option label="已放行" value="passed" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="爽约" value="absent" />
            <el-option label="迟到" value="late" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" @click="checkVehicleQualification">
            <el-icon><Search /></el-icon>
            车辆资质查询
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card-section">
      <div class="section-title">预约列表</div>
      <el-table :data="filteredAppointments" stripe border style="width: 100%">
        <el-table-column prop="appointmentNo" label="预约号" width="160" />
        <el-table-column prop="plateNumber" label="车牌号" width="120" />
        <el-table-column prop="vehicleType" label="车辆类型" width="120" />
        <el-table-column prop="driverName" label="司机" width="100" />
        <el-table-column prop="driverPhone" label="联系电话" width="140" />
        <el-table-column prop="fleetName" label="所属车队" width="140" />
        <el-table-column prop="businessType" label="业务类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.businessType === 'import' ? 'primary' : row.businessType === 'export' ? 'success' : 'warning'" size="small">
              {{ row.businessType === 'import' ? '进口' : row.businessType === 'export' ? '出口' : '中转' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="containerNo" label="箱号" width="140" />
        <el-table-column prop="appointmentTime" label="预约时间" width="160" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <span class="status-tag" :class="'status-' + row.status">
              {{ getStatusText(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="isDangerous" label="危险品" width="90">
          <template #default="{ row }">
            <el-tag v-if="row.isDangerous" type="danger" size="small">是</el-tag>
            <span v-else class="text-muted">否</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" type="primary" size="small" @click="addToQueue(row)">
              排入队列
            </el-button>
            <el-button v-if="row.status === 'pending' || row.status === 'queuing'" type="success" size="small" @click="openEditDialog(row)">
              修改时段
            </el-button>
            <el-button type="info" size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="addDialogVisible" :title="editingId ? '修改预约' : '新增预约'" width="700px">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车牌号" prop="plateNumber">
              <el-input v-model="formData.plateNumber" placeholder="请输入车牌号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车辆类型" prop="vehicleType">
              <el-select v-model="formData.vehicleType" placeholder="选择车辆类型" style="width: 100%">
                <el-option label="集装箱货车" value="集装箱货车" />
                <el-option label="危险品运输车" value="危险品运输车" />
                <el-option label="普通货车" value="普通货车" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="司机姓名" prop="driverName">
              <el-input v-model="formData.driverName" placeholder="请输入司机姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="驾驶证号" prop="driverLicense">
              <el-input v-model="formData.driverLicense" placeholder="请输入驾驶证号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="driverPhone">
              <el-input v-model="formData.driverPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属车队" prop="fleetName">
              <el-select v-model="formData.fleetName" placeholder="选择车队" style="width: 100%">
                <el-option v-for="fleet in fleets" :key="fleet" :label="fleet" :value="fleet" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="业务类型" prop="businessType">
              <el-select v-model="formData.businessType" placeholder="选择业务类型" style="width: 100%">
                <el-option label="进口提箱" value="import" />
                <el-option label="出口还箱" value="export" />
                <el-option label="中转" value="transfer" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预约时间" prop="appointmentTime">
              <el-date-picker
                v-model="formData.appointmentTime"
                type="datetime"
                placeholder="选择预约时间"
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="集装箱号">
              <el-input v-model="formData.containerNo" placeholder="请输入箱号（选填）" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="箱型尺寸">
              <el-select v-model="formData.containerSize" placeholder="选择箱型（选填）" style="width: 100%" clearable>
                <el-option label="20GP" value="20GP" />
                <el-option label="40GP" value="40GP" />
                <el-option label="40HQ" value="40HQ" />
                <el-option label="45HQ" value="45HQ" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="危险品">
              <el-switch v-model="formData.isDangerous" />
              <span style="margin-left: 10px; color: #909399">是否为危险品运输</span>
            </el-form-item>
          </el-col>
          <el-col v-if="formData.isDangerous" :span="24">
            <el-form-item label="危险品信息">
              <el-input v-model="formData.dangerousInfo" placeholder="请输入危险品类别和说明" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="备注信息（选填）" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="qualificationDialogVisible" title="车辆资质查询" width="600px">
      <el-form :model="qualificationForm" label-width="100px">
        <el-form-item label="车牌号">
          <el-input v-model="qualificationForm.plateNumber" placeholder="请输入车牌号查询" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="queryQualification">查询</el-button>
        </el-form-item>
      </el-form>
      <div v-if="qualificationResult" class="qualification-result">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="车牌号">{{ qualificationResult.plateNumber }}</el-descriptions-item>
          <el-descriptions-item label="车辆类型">{{ qualificationResult.vehicleType }}</el-descriptions-item>
          <el-descriptions-item label="所属车队">{{ qualificationResult.fleetName }}</el-descriptions-item>
          <el-descriptions-item label="资质状态">
            <el-tag :type="qualificationResult.qualified ? 'success' : 'danger'">
              {{ qualificationResult.qualified ? '资质有效' : '资质过期' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="年检有效期">{{ qualificationResult.inspectionValid }}</el-descriptions-item>
          <el-descriptions-item label="保险有效期">{{ qualificationResult.insuranceValid }}</el-descriptions-item>
          <el-descriptions-item label="危险品运输证">
            <el-tag :type="qualificationResult.dangerousLicense ? 'success' : 'info'">
              {{ qualificationResult.dangerousLicense ? '已办理' : '未办理' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="历史违章">{{ qualificationResult.violationCount }}次</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="预约详情" width="650px">
      <el-descriptions v-if="currentDetail" :column="2" border>
        <el-descriptions-item label="预约号" :span="2">{{ currentDetail.appointmentNo }}</el-descriptions-item>
        <el-descriptions-item label="车牌号">{{ currentDetail.plateNumber }}</el-descriptions-item>
        <el-descriptions-item label="车辆类型">{{ currentDetail.vehicleType }}</el-descriptions-item>
        <el-descriptions-item label="司机">{{ currentDetail.driverName }}</el-descriptions-item>
        <el-descriptions-item label="驾驶证号">{{ currentDetail.driverLicense }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentDetail.driverPhone }}</el-descriptions-item>
        <el-descriptions-item label="所属车队">{{ currentDetail.fleetName }}</el-descriptions-item>
        <el-descriptions-item label="业务类型">
          {{ currentDetail.businessType === 'import' ? '进口提箱' : currentDetail.businessType === 'export' ? '出口还箱' : '中转' }}
        </el-descriptions-item>
        <el-descriptions-item label="集装箱号">{{ currentDetail.containerNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="箱型">{{ currentDetail.containerSize || '-' }}</el-descriptions-item>
        <el-descriptions-item label="预约时间">{{ currentDetail.appointmentTime }}</el-descriptions-item>
        <el-descriptions-item label="排队号">{{ currentDetail.queueNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <span class="status-tag" :class="'status-' + currentDetail.status">
            {{ getStatusText(currentDetail.status) }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="危险品">
          <el-tag v-if="currentDetail.isDangerous" type="danger">是 - {{ currentDetail.dangerousInfo }}</el-tag>
          <span v-else>否</span>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ currentDetail.createTime }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentDetail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAppStore } from '@/stores/app'
import { fleets } from '@/mock'
import type { Appointment } from '@/types'
import dayjs from 'dayjs'

const store = useAppStore()

const searchForm = reactive({
  plateNumber: '',
  appointmentNo: '',
  fleetName: '',
  businessType: '',
  status: ''
})

const addDialogVisible = ref(false)
const editingId = ref<string | null>(null)
const detailDialogVisible = ref(false)
const qualificationDialogVisible = ref(false)
const currentDetail = ref<Appointment | null>(null)
const formRef = ref<FormInstance>()

const formData = reactive({
  plateNumber: '',
  vehicleType: '集装箱货车',
  driverName: '',
  driverLicense: '',
  driverPhone: '',
  fleetName: '',
  businessType: 'import' as 'import' | 'export' | 'transfer',
  appointmentTime: dayjs().format('YYYY-MM-DD HH:mm'),
  containerNo: '',
  containerSize: '',
  isDangerous: false,
  dangerousInfo: '',
  remark: ''
})

const formRules: FormRules = {
  plateNumber: [{ required: true, message: '请输入车牌号', trigger: 'blur' }],
  vehicleType: [{ required: true, message: '请选择车辆类型', trigger: 'change' }],
  driverName: [{ required: true, message: '请输入司机姓名', trigger: 'blur' }],
  driverLicense: [{ required: true, message: '请输入驾驶证号', trigger: 'blur' }],
  driverPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  fleetName: [{ required: true, message: '请选择所属车队', trigger: 'change' }],
  businessType: [{ required: true, message: '请选择业务类型', trigger: 'change' }],
  appointmentTime: [{ required: true, message: '请选择预约时间', trigger: 'change' }]
}

const qualificationForm = reactive({
  plateNumber: ''
})

const qualificationResult = ref<any>(null)

const filteredAppointments = computed(() => {
  return store.appointments.filter(a => {
    if (searchForm.plateNumber && !a.plateNumber.includes(searchForm.plateNumber)) return false
    if (searchForm.appointmentNo && !a.appointmentNo.includes(searchForm.appointmentNo)) return false
    if (searchForm.fleetName && a.fleetName !== searchForm.fleetName) return false
    if (searchForm.businessType && a.businessType !== searchForm.businessType) return false
    if (searchForm.status && a.status !== searchForm.status) return false
    return true
  })
})

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending: '待排队',
    queuing: '排队中',
    verifying: '核验中',
    checking: '核对中',
    passing: '待放行',
    passed: '已放行',
    rejected: '已拒绝',
    absent: '爽约',
    late: '迟到'
  }
  return map[status] || status
}

function handleSearch() {
  ElMessage.success('查询完成')
}

function handleReset() {
  searchForm.plateNumber = ''
  searchForm.appointmentNo = ''
  searchForm.fleetName = ''
  searchForm.businessType = ''
  searchForm.status = ''
}

function openAddDialog() {
  editingId.value = null
  resetForm()
  addDialogVisible.value = true
}

function openEditDialog(row: Appointment) {
  editingId.value = row.id
  Object.assign(formData, {
    plateNumber: row.plateNumber,
    vehicleType: row.vehicleType,
    driverName: row.driverName,
    driverLicense: row.driverLicense,
    driverPhone: row.driverPhone,
    fleetName: row.fleetName,
    businessType: row.businessType,
    appointmentTime: row.appointmentTime,
    containerNo: row.containerNo || '',
    containerSize: row.containerSize || '',
    isDangerous: row.isDangerous,
    dangerousInfo: row.dangerousInfo || '',
    remark: row.remark || ''
  })
  addDialogVisible.value = true
}

function resetForm() {
  Object.assign(formData, {
    plateNumber: '',
    vehicleType: '集装箱货车',
    driverName: '',
    driverLicense: '',
    driverPhone: '',
    fleetName: '',
    businessType: 'import' as const,
    appointmentTime: dayjs().format('YYYY-MM-DD HH:mm'),
    containerNo: '',
    containerSize: '',
    isDangerous: false,
    dangerousInfo: '',
    remark: ''
  })
}

async function submitForm() {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (valid) {
      if (editingId.value) {
        store.updateAppointment(editingId.value, formData)
        ElMessage.success('修改成功')
      } else {
        store.addAppointment(formData)
        ElMessage.success('预约登记成功')
      }
      addDialogVisible.value = false
    }
  })
}

function addToQueue(row: Appointment) {
  const result = store.addToQueue(row.id)
  if (result) {
    ElMessage.success(`车辆 ${row.plateNumber} 已排入队列，排队号：${result.queueNo}`)
  }
}

function viewDetail(row: Appointment) {
  currentDetail.value = row
  detailDialogVisible.value = true
}

function checkVehicleQualification() {
  qualificationForm.plateNumber = ''
  qualificationResult.value = null
  qualificationDialogVisible.value = true
}

function queryQualification() {
  if (!qualificationForm.plateNumber) {
    ElMessage.warning('请输入车牌号')
    return
  }
  qualificationResult.value = {
    plateNumber: qualificationForm.plateNumber,
    vehicleType: '集装箱货车',
    fleetName: '中远海运',
    qualified: true,
    inspectionValid: dayjs().add(6, 'month').format('YYYY-MM-DD'),
    insuranceValid: dayjs().add(10, 'month').format('YYYY-MM-DD'),
    dangerousLicense: false,
    violationCount: 2
  }
  ElMessage.success('查询成功')
}
</script>
