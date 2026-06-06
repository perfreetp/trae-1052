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
        <el-button type="primary" style="margin-left: 10px" @click="exportReport">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="4">
        <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
          <div class="stat-value">{{ shiftStats.totalAppointments }}</div>
          <div class="stat-label">总预约数</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card" style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%)">
          <div class="stat-value">{{ shiftStats.passedCount }}</div>
          <div class="stat-label">已放行</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
          <div class="stat-value">{{ shiftStats.rejectedCount }}</div>
          <div class="stat-label">已拒绝</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%)">
          <div class="stat-value">{{ shiftStats.absentCount }}</div>
          <div class="stat-label">爽约数</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card" style="background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)">
          <div class="stat-value">{{ shiftStats.lateCount }}</div>
          <div class="stat-label">迟到数</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
          <div class="stat-value">{{ shiftStats.dangerousCount }}</div>
          <div class="stat-label">危险品</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <div class="card-section">
          <div class="section-title">预约时段分布</div>
          <v-chart class="chart" :option="timeChartOption" autoresize />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card-section">
          <div class="section-title">业务类型占比</div>
          <v-chart class="chart" :option="businessChartOption" autoresize />
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <div class="card-section">
          <div class="section-title">处理效率指标</div>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="平均等待时间">
              <span style="font-size: 24px; font-weight: bold; color: #409eff">
                {{ shiftStats.avgWaitTime }}
              </span>
              <span style="margin-left: 4px">分钟</span>
            </el-descriptions-item>
            <el-descriptions-item label="平均处理时间">
              <span style="font-size: 24px; font-weight: bold; color: #67c23a">
                {{ shiftStats.avgProcessTime }}
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
      <el-col :span="12">
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
      <div class="section-title">车队服务评价</div>
      <el-table :data="fleetEvaluations" stripe border>
        <el-table-column prop="fleetName" label="车队名称" width="160" />
        <el-table-column prop="totalVehicles" label="运输车次" width="120" />
        <el-table-column label="准点率" width="150">
          <template #default="{ row }">
            <el-progress :percentage="row.onTimeRate" :color="getRateColor(row.onTimeRate)" :stroke-width="10" />
          </template>
        </el-table-column>
        <el-table-column label="违章率" width="150">
          <template #default="{ row }">
            <el-progress :percentage="row.violationRate" color="#f56c6c" :stroke-width="10" />
          </template>
        </el-table-column>
        <el-table-column label="综合评分" width="180">
          <template #default="{ row }">
            <el-rate v-model="row.score" disabled :max="100" show-text />
          </template>
        </el-table-column>
        <el-table-column label="评级" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)" size="large">{{ row.level }}级</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/stores/app'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import dayjs from 'dayjs'

use([
  CanvasRenderer,
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const store = useAppStore()

const selectedDate = ref(dayjs().format('YYYY-MM-DD'))
const selectedShift = ref('day')

const shiftStats = computed(() => store.shiftStats[0] || {
  totalAppointments: 0,
  passedCount: 0,
  rejectedCount: 0,
  absentCount: 0,
  lateCount: 0,
  avgWaitTime: 0,
  avgProcessTime: 0,
  dangerousCount: 0
})

const fleetEvaluations = computed(() => store.fleetEvaluations)

const passRate = computed(() => {
  const total = shiftStats.value.totalAppointments
  if (total === 0) return 0
  return Math.round(shiftStats.value.passedCount / total * 100)
})

const onTimeRate = computed(() => {
  const total = shiftStats.value.totalAppointments
  if (total === 0) return 0
  const onTime = total - shiftStats.value.lateCount - shiftStats.value.absentCount
  return Math.round(onTime / total * 100)
})

const laneStats = computed(() => store.gateLanes)

const maxLaneCount = computed(() =>
  Math.max(...laneStats.value.map(l => l.processedCount), 1)
)

const timeChartOption = markRaw({
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
  },
  yAxis: { type: 'value' },
  series: [{
    type: 'bar',
    data: [12, 18, 25, 22, 8, 10, 15, 20, 18, 10],
    itemStyle: {
      color: {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: '#667eea' },
          { offset: 1, color: '#764ba2' }
        ]
      }
    }
  }]
})

const businessChartOption = markRaw({
  tooltip: { trigger: 'item' },
  legend: { bottom: '5%', left: 'center' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
    label: { show: false },
    emphasis: {
      label: { show: true, fontSize: 16, fontWeight: 'bold' }
    },
    labelLine: { show: false },
    data: [
      { value: 45, name: '进口提箱', itemStyle: { color: '#667eea' } },
      { value: 32, name: '出口还箱', itemStyle: { color: '#11998e' } },
      { value: 9, name: '中转', itemStyle: { color: '#f093fb' } }
    ]
  }]
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

function exportReport() {
  ElMessage.success('报表导出成功')
}
</script>

<style scoped>
.chart {
  height: 300px;
  width: 100%;
}
</style>
