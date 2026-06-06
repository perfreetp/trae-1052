<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">班次统计</div>
      <div class="header-actions">
        <el-radio-group v-model="selectedShift" size="default" style="margin-right: 16px">
          <el-radio-button label="all">全部班次</el-radio-button>
          <el-radio-button label="day">白班</el-radio-button>
          <el-radio-button label="night">夜班</el-radio-button>
        </el-radio-group>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          style="width: 280px; margin-right: 16px"
        />
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="4">
        <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
          <div class="stat-value">{{ currentStats.totalAppointments }}</div>
          <div class="stat-label">总预约量</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%)">
          <div class="stat-value">{{ currentStats.passedCount }}</div>
          <div class="stat-label">已放行</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
          <div class="stat-value">{{ currentStats.rejectedCount }}</div>
          <div class="stat-label">已拒绝</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)">
          <div class="stat-value">{{ currentStats.absentCount }}</div>
          <div class="stat-label">爽约数</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card" style="background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)">
          <div class="stat-value">{{ currentStats.lateCount }}</div>
          <div class="stat-label">迟到数</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
          <div class="stat-value">{{ currentStats.dangerousCount }}</div>
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
                <span class="cs-value">{{ currentStats.avgWaitTime }} 分钟</span>
              </div>
              <div class="congestion-stat">
                <span class="cs-label">平均办理</span>
                <span class="cs-value">{{ currentStats.avgProcessTime }} 分钟</span>
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
                {{ currentStats.avgWaitTime }}
              </span>
              <span style="margin-left: 4px">分钟</span>
            </el-descriptions-item>
            <el-descriptions-item label="平均办理时间">
              <span style="font-size: 24px; font-weight: bold; color: #67c23a">
                {{ currentStats.avgProcessTime }}
              </span>
              <span style="margin-left: 4px">分钟</span>
            </el-descriptions-item>
            <el-descriptions-item label="放行通过率">
              <span style="font-size: 24px; font-weight: bold; color: #e6a23c">
                {{ passRate }}%
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="异常率">
              <span style="font-size: 24px; font-weight: bold; color: #f56c6c">
                {{ exceptionRate }}%
              </span>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="card-section">
          <div class="section-title">各闸道放行量</div>
          <el-table :data="gateLaneStats" stripe>
            <el-table-column prop="name" label="闸道" width="100" />
            <el-table-column prop="processedCount" label="放行量" width="100" align="center" />
            <el-table-column label="占比">
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
        车队服务评价排行
        <el-button size="small" style="margin-left: auto" @click="exportReport">
          <el-icon><Download /></el-icon>
          导出评价报表
        </el-button>
      </div>
      <el-table :data="sortedFleetEvaluations" stripe border>
        <el-table-column label="排名" width="80" align="center">
          <template #default="{ $index }">
            <span v-if="$index === 0" style="color: #f56c6c; font-weight: bold; font-size: 18px">🏆</span>
            <span v-else-if="$index === 1" style="color: #e6a23c; font-weight: bold; font-size: 18px">🥈</span>
            <span v-else-if="$index === 2" style="color: #67c23a; font-weight: bold; font-size: 18px">🥉</span>
            <span v-else style="color: #909399">{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="fleetName" label="车队名称" width="160" />
        <el-table-column prop="totalVehicles" label="运输车次" width="120" align="center" />
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
        <el-table-column label="评级" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)" size="large" effect="dark">
              {{ row.level }} 级
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="评价" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.level === 'A'" style="color: #67c23a">优秀</span>
            <span v-else-if="row.level === 'B'" style="color: #409eff">良好</span>
            <span v-else-if="row.level === 'C'" style="color: #e6a23c">合格</span>
            <span v-else style="color: #f56c6c">需整改</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="card-section" style="margin-top: 20px">
      <div class="section-title">放行记录明细</div>
      <el-table :data="releaseRecords" stripe border height="300">
        <el-table-column prop="releaseTime" label="放行时间" width="170" fixed="left" />
        <el-table-column prop="plateNumber" label="车牌号" width="120" />
        <el-table-column label="类型" width="90">
          <template #default="{ row }">
            <el-tag :type="row.isManual ? 'danger' : 'success'" size="small">
              {{ row.isManual ? '手动' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="laneNo" label="闸道" width="70">
          <template #default="{ row }">{{ row.laneNo }}号</template>
        </el-table-column>
        <el-table-column prop="operator" label="值班员" width="100" />
        <el-table-column prop="appointmentNo" label="预约号" width="160" show-overflow-tooltip />
        <el-table-column prop="fleetName" label="车队" width="140" show-overflow-tooltip />
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

const selectedShift = ref('all')
const dateRange = ref([
  dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD')
])

const filteredShiftStats = computed(() => {
  let stats = [...store.shiftStats]
  if (selectedShift.value !== 'all') {
    stats = stats.filter(s => s.shift === selectedShift.value)
  }
  if (dateRange.value && dateRange.value.length === 2) {
    const [start, end] = dateRange.value
    stats = stats.filter(s => s.date >= start && s.date <= end)
  }
  return stats
})

const currentStats = computed(() => {
  const stats = filteredShiftStats.value
  if (stats.length === 0) {
    return {
      totalAppointments: 0,
      passedCount: 0,
      rejectedCount: 0,
      absentCount: 0,
      lateCount: 0,
      avgWaitTime: 0,
      avgProcessTime: 0,
      dangerousCount: 0
    }
  }
  return {
    totalAppointments: stats.reduce((sum, s) => sum + s.totalAppointments, 0),
    passedCount: stats.reduce((sum, s) => sum + s.passedCount, 0),
    rejectedCount: stats.reduce((sum, s) => sum + s.rejectedCount, 0),
    absentCount: stats.reduce((sum, s) => sum + s.absentCount, 0),
    lateCount: stats.reduce((sum, s) => sum + s.lateCount, 0),
    avgWaitTime: Math.round(stats.reduce((sum, s) => sum + s.avgWaitTime, 0) / stats.length),
    avgProcessTime: Math.round(stats.reduce((sum, s) => sum + s.avgProcessTime, 0) / stats.length),
    dangerousCount: stats.reduce((sum, s) => sum + s.dangerousCount, 0)
  }
})

const fleetEvaluations = computed(() => store.fleetEvaluations)
const releaseRecords = computed(() => store.releaseRecords)
const gateLaneStats = computed(() => store.gateLanes)

const sortedFleetEvaluations = computed(() => {
  return [...fleetEvaluations.value].sort((a, b) => b.score - a.score)
})

const waitingCount = computed(() =>
  store.queue.filter(q => q.status === 'waiting').length
)

const maxLaneCount = computed(() =>
  Math.max(...gateLaneStats.value.map(l => l.processedCount), 1)
)

const passRate = computed(() => {
  const total = currentStats.value.totalAppointments
  if (total === 0) return 0
  return Math.round(currentStats.value.passedCount / total * 100)
})

const exceptionRate = computed(() => {
  const total = currentStats.value.totalAppointments
  if (total === 0) return 0
  const exceptions = currentStats.value.rejectedCount + currentStats.value.absentCount + currentStats.value.lateCount
  return Math.round(exceptions / total * 100)
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
