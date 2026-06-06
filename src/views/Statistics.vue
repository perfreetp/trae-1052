<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">班次统计</div>
      <div class="header-actions">
        <el-date-picker
          v-model="selectedDate"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
        />
        <el-select v-model="selectedShift" placeholder="选择班次" style="width: 120px; margin-left: 10px">
          <el-option label="白班" value="day" />
          <el-option label="夜班" value="night" />
        </el-select>
        <el-button type="primary" style="margin-left: 10px" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="4">
        <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
          <div class="stat-value">{{ stats.totalAppointments }}</div>
          <div class="stat-label">总预约数</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%)">
          <div class="stat-value">{{ stats.passedCount }}</div>
          <div class="stat-label">已放行</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
          <div class="stat-value">{{ stats.rejectedCount }}</div>
          <div class="stat-label">已拒绝</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)">
          <div class="stat-value">{{ stats.absentCount }}</div>
          <div class="stat-label">爽约数</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card" style="background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)">
          <div class="stat-value">{{ stats.lateCount }}</div>
          <div class="stat-label">迟到数</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
          <div class="stat-value">{{ stats.dangerousCount }}</div>
          <div class="stat-label">危险品</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="8">
        <div class="card-section">
          <div class="section-title">拥堵情况</div>
          <div class="congestion-display">
            <div class="congestion-item" :class="congestionClass">
              <div class="congestion-light-big"></div>
              <div class="congestion-text">{{ congestionText }}</div>
            </div>
            <div class="congestion-detail">
              <div class="congestion-stat">
                <span class="cs-label">当前排队</span>
                <span class="cs-value">{{ waitingCount }} 辆</span>
              </div>
              <div class="congestion-stat">
                <span class="cs-label">平均等待</span>
                <span class="cs-value">{{ stats.avgWaitTime }} 分钟</span>
              </div>
              <div class="congestion-stat">
                <span class="cs-label">平均处理</span>
                <span class="cs-value">{{ stats.avgProcessTime }} 分钟</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="card-section">
          <div class="section-title">处理效率指标</div>
          <el-descriptions :column="1" border size="default">
            <el-descriptions-item label="平均等待时间">
              <span style="font-size: 24px; font-weight: bold; color: #409eff">
                {{ stats.avgWaitTime }}
              </span>
              <span style="margin-left: 4px">分钟</span>
            </el-descriptions-item>
            <el-descriptions-item label="平均处理时间">
              <span style="font-size: 24px; font-weight: bold; color: #67c23a">
                {{ stats.avgProcessTime }}
              </span>
              <span style="margin-left: 4px">分钟</span>
            </el-descriptions-item>
            <el-descriptions-item label="放行通过率">
              <span style="font-size: 24px; font-weight: bold; color: #e6a23c">
                {{ passRate }}%
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="准时率">
              <span style="font-size: 24px; font-weight: bold; color: #909399">
                {{ onTimeRate }}%
              </span>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="card-section">
          <div class="section-title">闸道处理统计</div>
          <el-table :data="laneStats" stripe>
            <el-table-column prop="name" label="闸道" />
            <el-table-column prop="processedCount" label="处理数量" />
            <el-table-column label="处理率">
              <template #default="{ row }">
                <el-progress :percentage="Math.round(row.processedCount / maxLaneCount * 100)" :stroke-width="10" />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>

    <div class="card-section" style="margin-top: 20px">
      <div class="section-title">
        车队服务评价
        <el-button size="small" style="margin-left: auto" @click="exportReport">
          <el-icon><Download /></el-icon>
          导出评价报表
        </el-button>
      </div>
      <el-table :data="fleetEvaluations" stripe border>
        <el-table-column prop="fleetName" label="车队名称" width="160" />
        <el-table-column prop="totalVehicles" label="运输车次" width="120" />
        <el-table-column label="准点率" width="180">
          <template #default="{ row }">
            <el-progress :percentage="row.onTimeRate" :color="getRateColor(row.onTimeRate)" :stroke-width="12" />
          </template>
        </el-table-column>
        <el-table-column label="违章率" width="180">
          <template #default="{ row }">
            <el-progress :percentage="row.violationRate" color="#f56c6c" :stroke-width="12" />
          </template>
        </el-table-column>
        <el-table-column label="综合评分" width="200">
          <template #default="{ row }">
            <span style="font-size: 18px; font-weight: bold; color: #409eff">{{ row.score }}</span>
            <span style="margin-left: 4px; color: #909399">/ 100</span>
          </template>
        </el-table-column>
        <el-table-column label="评级" width="120">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)" size="large" effect="dark">
              {{ row.level }} 级
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="评价" width="120">
          <template #default="{ row }">
            <span v-if="row.level === 'A'" style="color: #67c23a">优秀</span>
            <span v-else-if="row.level === 'B'" style="color: #409eff">良好</span>
            <span v-else-if="row.level === 'C'" style="color: #e6a23c">合格</span>
            <span v-else style="color: #f56c6c">需整改</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="card-section" v-if="manualReleaseRecords.length > 0">
      <div class="section-title">手动放行记录</div>
      <el-table :data="manualReleaseRecords" stripe border>
        <el-table-column prop="createTime" label="操作时间" width="170" />
        <el-table-column prop="plateNumber" label="车牌号" width="130" />
        <el-table-column prop="reason" label="放行原因" min-width="250" show-overflow-tooltip />
        <el-table-column prop="laneNo" label="闸道" width="80">
          <template #default="{ row }">{{ row.laneNo }}号</template>
        </el-table-column>
        <el-table-column prop="operator" label="值班员" width="120" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/stores/app'
import dayjs from 'dayjs'

const store = useAppStore()

const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const selectedShift = ref('day')

const stats = computed(() => ({
  totalAppointments: store.shiftStats[0]?.totalAppointments || 0,
  passedCount: store.passedCount,
  rejectedCount: store.rejectedCount,
  absentCount: store.absentCount,
  lateCount: store.lateCount,
  avgWaitTime: store.shiftStats[0]?.avgWaitTime || 0,
  avgProcessTime: store.shiftStats[0]?.avgProcessTime || 0,
  dangerousCount: store.shiftStats[0]?.dangerousCount || 0
}))

const fleetEvaluations = computed(() => store.fleetEvaluations)
const laneStats = computed(() => store.gateLanes)
const manualReleaseRecords = computed(() => store.manualReleaseRecords)

const waitingCount = computed(() =>
  store.queue.filter(q => q.status === 'waiting').length
)

const maxLaneCount = computed(() =>
  Math.max(...laneStats.value.map(l => l.processedCount), 1)
)

const passRate = computed(() => {
  const total = stats.value.totalAppointments
  if (total === 0) return 0
  return Math.round(stats.value.passedCount / total * 100)
})

const onTimeRate = computed(() => {
  const total = stats.value.totalAppointments
  if (total === 0) return 0
  const onTime = total - stats.value.lateCount - stats.value.absentCount
  return Math.round(Math.max(0, onTime) / total * 100)
})

const congestionClass = computed(() => {
  const level = store.congestionLevel
  return level === 'heavy' ? 'congestion-heavy' : level === 'medium' ? 'congestion-medium' : 'congestion-light'
})

const congestionText = computed(() => {
  const level = store.congestionLevel
  return level === 'heavy' ? '拥堵' : level === 'medium' ? '缓行' : '畅通'
})

function getRateColor(rate: number) {
  if (rate >= 90) return '#67c23a'
  if (rate >= 80) return '#e6a23c'
  return '#f56c6c'
}

function getLevelType(level: string) {
  const map: Record<string, any> = {
    'A': 'success',
    'B': 'primary',
    'C': 'warning',
    'D': 'danger'
  }
  return map[level] || 'info'
}

function refreshData() {
  ElMessage.success('数据已刷新')
}

function exportReport() {
  ElMessage.success('车队服务评价报表导出成功')
}
</script>

<style scoped>
.congestion-display {
  text-align: center;
  padding: 10px 0;
}

.congestion-item {
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.congestion-item.congestion-light {
  background: linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%);
}

.congestion-item.congestion-medium {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
}

.congestion-item.congestion-heavy {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
}

.congestion-light-big {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: inline-block;
  background: #67c23a;
  box-shadow: 0 0 16px #67c23a;
}

.congestion-item.congestion-medium .congestion-light-big {
  background: #e6a23c;
  box-shadow: 0 0 16px #e6a23c;
}

.congestion-item.congestion-heavy .congestion-light-big {
  background: #f56c6c;
  box-shadow: 0 0 16px #f56c6c;
}

.congestion-text {
  font-size: 24px;
  font-weight: bold;
  margin-top: 10px;
  color: #303133;
}

.congestion-detail {
  display: flex;
  justify-content: space-around;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.congestion-stat {
  text-align: center;
}

.cs-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.cs-value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.section-title {
  display: flex;
  align-items: center;
}
</style>
