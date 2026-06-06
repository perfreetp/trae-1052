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
          <div class="stat-value">{{ filteredAbsentCount }}</div>
          <div class="stat-label">爽约车辆</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)">
          <div class="stat-value">{{ filteredLateCount }}</div>
          <div class="stat-label">迟到车辆</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
          <div class="stat-value">{{ filteredRejectedCount }}</div>
          <div class="stat-label">拒绝放行</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
          <div class="stat-value">{{ filteredTotalCount }}</div>
          <div class="stat-label">异常总数</div>
        </div>
      </el-col>
    </el-row>

    <div class="card-section" style="margin-top: 20px">
      <div style="margin-bottom: 16px">
        <el-radio-group v-model="filterType" size="default">
          <el-radio-button label="all">全部异常</el-radio-button>
          <el-radio-button label="absent">爽约</el-radio-button>
          <el-radio-button label="late">迟到</el-radio-button>
          <el-radio-button label="document_mismatch">证件不符</el-radio-button>
          <el-radio-button label="container_mismatch">箱单不符</el-radio-button>
          <el-radio-button label="equipment_fault">设备故障</el-radio-button>
          <el-radio-button label="other">其他</el-radio-button>
        </el-radio-group>
        <span style="margin-left: 16px; color: #909399; font-size: 13px">
          共 {{ filteredRecords.length }} 条记录
        </span>
      </div>

      <el-table :data="filteredRecords" stripe border height="500">
        <el-table-column prop="createTime" label="记录时间" width="170" fixed="left" />
        <el-table-column prop="plateNumber" label="车牌号" width="120" />
        <el-table-column prop="appointmentNo" label="预约号" width="160" />
        <el-table-column label="异常类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getExceptionTypeColor(row.type)" size="small">
              {{ getExceptionTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="异常描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="action" label="处理措施" min-width="180" show-overflow-tooltip />
        <el-table-column prop="handler" label="处理人" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.processed ? 'success' : 'warning'" size="small">
              {{ row.processed ? '已处理' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button v-if="!row.processed" type="primary" size="small" @click="processRecord(row)">
              处理
            </el-button>
            <el-button type="info" size="small" @click="viewRecordDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="addExceptionDialog" title="新增异常记录" width="600px">
      <el-form :model="exceptionForm" label-width="110px" :rules="formRules" ref="formRef">
        <el-form-item label="车牌号" prop="plateNumber">
          <el-input v-model="exceptionForm.plateNumber" placeholder="请输入车牌号" />
        </el-form-item>
        <el-form-item label="预约号">
          <el-input v-model="exceptionForm.appointmentNo" placeholder="请输入预约号（选填）" />
        </el-form-item>
        <el-form-item label="异常类型" prop="type">
          <el-select v-model="exceptionForm.type" placeholder="选择异常类型" style="width: 100%">
            <el-option label="爽约" value="absent" />
            <el-option label="迟到" value="late" />
            <el-option label="证件不符" value="document_mismatch" />
            <el-option label="箱单不符" value="container_mismatch" />
            <el-option label="设备故障" value="equipment_fault" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="异常描述" prop="description">
          <el-input v-model="exceptionForm.description" type="textarea" :rows="3" placeholder="请描述异常情况" />
        </el-form-item>
        <el-form-item label="处理措施">
          <el-input v-model="exceptionForm.action" type="textarea" :rows="2" placeholder="请输入处理措施（选填）" />
        </el-form-item>
        <el-form-item label="处理人">
          <el-tag type="info">{{ currentUser.name }}</el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addExceptionDialog = false">取消</el-button>
        <el-button type="primary" @click="saveException">保存记录</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialog" title="异常记录详情" width="550px">
      <el-descriptions v-if="currentRecord" :column="1" border size="default">
        <el-descriptions-item label="记录时间">
          {{ currentRecord.createTime }}
        </el-descriptions-item>
        <el-descriptions-item label="车牌号">
          <el-tag type="primary">{{ currentRecord.plateNumber }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="预约号">
          {{ currentRecord.appointmentNo || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="异常类型">
          <el-tag :type="getExceptionTypeColor(currentRecord.type)">
            {{ getExceptionTypeText(currentRecord.type) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="异常描述">
          <div style="white-space: pre-wrap; color: #606266">{{ currentRecord.description }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="处理措施">
          <div style="white-space: pre-wrap; color: #606266">{{ currentRecord.action || '暂无' }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="处理人">
          {{ currentRecord.handler }}
        </el-descriptions-item>
        <el-descriptions-item label="处理状态">
          <el-tag :type="currentRecord.processed ? 'success' : 'warning'">
            {{ currentRecord.processed ? '已处理' : '待处理' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentRecord.processedTime" label="处理时间">
          {{ currentRecord.processedTime }}
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialog = false">关闭</el-button>
        <el-button v-if="currentRecord && !currentRecord.processed" type="primary" @click="processFromDetail">
          标记为已处理
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="processDialog" title="处理异常" width="500px">
      <el-form label-width="100px">
        <el-form-item label="车牌号">
          <el-tag>{{ currentRecord?.plateNumber }}</el-tag>
        </el-form-item>
        <el-form-item label="异常类型">
          <el-tag :type="getExceptionTypeColor(currentRecord?.type)">
            {{ getExceptionTypeText(currentRecord?.type) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="异常描述">
          <div style="color: #606266">{{ currentRecord?.description }}</div>
        </el-form-item>
        <el-form-item label="处理措施" required>
          <el-input v-model="processAction" type="textarea" :rows="3" placeholder="请输入处理措施" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="processDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmProcess">确认处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAppStore } from '@/stores/app'
import type { ExceptionRecord } from '@/types'

const store = useAppStore()

const addExceptionDialog = ref(false)
const detailDialog = ref(false)
const processDialog = ref(false)
const filterType = ref('all')
const currentRecord = ref<ExceptionRecord | null>(null)
const processAction = ref('')
const formRef = ref<FormInstance>()

const exceptionRecords = computed(() => store.exceptionRecords)

const filteredRecords = computed(() => {
  if (filterType.value === 'all') {
    return exceptionRecords.value
  }
  return exceptionRecords.value.filter(r => r.type === filterType.value)
})

const filteredAbsentCount = computed(() => filteredRecords.value.filter(r => r.type === 'absent').length)
const filteredLateCount = computed(() => filteredRecords.value.filter(r => r.type === 'late').length)
const filteredRejectedCount = computed(() => filteredRecords.value.filter(r => r.type === 'document_mismatch' || r.type === 'container_mismatch').length)
const filteredTotalCount = computed(() => filteredRecords.value.length)

const currentUser = computed(() => store.currentUser)

const exceptionForm = reactive({
  plateNumber: '',
  appointmentNo: '',
  type: '',
  description: '',
  action: ''
})

const formRules: FormRules = {
  plateNumber: [{ required: true, message: '请输入车牌号', trigger: 'blur' }],
  type: [{ required: true, message: '请选择异常类型', trigger: 'change' }],
  description: [{ required: true, message: '请输入异常描述', trigger: 'blur' }]
}

function getExceptionTypeText(type: string | undefined) {
  const map: Record<string, string> = {
    absent: '爽约',
    late: '迟到',
    document_mismatch: '证件不符',
    container_mismatch: '箱单不符',
    equipment_fault: '设备故障',
    other: '其他'
  }
  return type ? map[type] || type : ''
}

function getExceptionTypeColor(type: string | undefined) {
  const map: Record<string, any> = {
    absent: 'danger',
    late: 'warning',
    document_mismatch: 'danger',
    container_mismatch: 'warning',
    equipment_fault: 'info',
    other: 'info'
  }
  return type ? map[type] || 'info' : 'info'
}

function saveException() {
  if (!formRef.value) return
  formRef.value.validate((valid) => {
    if (valid) {
      store.addExceptionRecord({
        plateNumber: exceptionForm.plateNumber,
        appointmentNo: exceptionForm.appointmentNo,
        type: exceptionForm.type as any,
        description: exceptionForm.description,
        action: exceptionForm.action,
        handler: currentUser.value.name
      })
      ElMessage.success('异常记录已保存')
      addExceptionDialog.value = false
      exceptionForm.plateNumber = ''
      exceptionForm.appointmentNo = ''
      exceptionForm.type = ''
      exceptionForm.description = ''
      exceptionForm.action = ''
    }
  })
}

function viewRecordDetail(record: ExceptionRecord) {
  currentRecord.value = record
  detailDialog.value = true
}

function processFromDetail() {
  if (currentRecord.value) {
    detailDialog.value = false
    processRecord(currentRecord.value)
  }
}

function processRecord(record: ExceptionRecord) {
  currentRecord.value = record
  processAction.value = record.action || ''
  processDialog.value = true
}

function confirmProcess() {
  if (!currentRecord.value) return
  if (!processAction.value.trim()) {
    ElMessage.warning('请输入处理措施')
    return
  }
  store.processExceptionRecord(currentRecord.value.id, processAction.value)
  ElMessage.success('异常已标记为已处理')
  processDialog.value = false
  if (detailDialog.value) {
    detailDialog.value = false
  }
  currentRecord.value = null
  processAction.value = ''
}
</script>
