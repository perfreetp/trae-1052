<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">车辆排队</div>
      <div class="header-actions">
        <el-tag size="large">
          <span class="congestion-light" :class="congestionClass"></span>
          当前拥堵状态：{{ congestionText }}
        </el-tag>
        <el-tag type="info" size="large" style="margin-left: 10px">
          排队车辆：{{ waitingCount }} 辆
        </el-tag>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <div class="card-section">
          <div class="section-title">当前呼叫</div>
          <div class="queue-number-display">
            <div style="font-size: 16px; opacity: 0.8">请以下车辆进入</div>
            <div class="queue-number">{{ currentCalling?.queueNo || '--' }}</div>
            <div style="font-size: 20px; margin: 10px 0">
              {{ currentCalling?.plateNumber || '暂无车辆' }}
            </div>
            <div style="font-size: 14px; opacity: 0.7">
              {{ currentCalling ? `${currentCalling.laneNo}号闸道准备核验` : '' }}
            </div>
          </div>
        </div>

        <div class="card-section">
          <div class="section-title">呼叫车辆</div>
          <el-form label-width="80px">
            <el-form-item label="选择闸道">
              <el-select v-model="selectedLane" placeholder="请选择闸道" style="width: 100%">
                <el-option
                  v-for="lane in availableLanes"
                  :key="lane.id"
                  :label="lane.name + (lane.status === 'idle' ? ' - 空闲' : ' - ' + lane.currentVehicle)"
                  :value="lane.id"
                  :disabled="lane.status === 'maintenance'"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" style="width: 100%" @click="callNext">
                <el-icon><Bell /></el-icon>
                呼叫下一辆
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="card-section">
          <div class="section-title">排队列表</div>
          <div class="queue-list">
            <div
              v-for="(item, index) in waitingQueue"
              :key="item.id"
              class="queue-item"
              :class="{ 'is-calling': item.status === 'calling' }"
            >
              <div class="queue-rank">{{ index + 1 }}</div>
              <div class="queue-info">
                <div class="queue-no">{{ item.queueNo }}</div>
                <div class="plate">{{ item.plateNumber }}</div>
              </div>
              <div class="queue-status">
                <el-tag v-if="item.status === 'calling'" type="success" size="small">
                  已呼叫
                </el-tag>
                <span v-else class="text-muted">等待中</span>
              </div>
            </div>
            <el-empty v-if="waitingQueue.length === 0" description="暂无排队车辆" :image-size="80" />
          </div>
        </div>
      </el-col>

      <el-col :span="8">
        <div class="card-section">
          <div class="section-title">闸口状态</div>
          <el-row :gutter="10">
            <el-col :span="12" v-for="lane in gateLanes" :key="lane.id">
              <div class="lane-card" :class="lane.status">
                <div class="lane-name">{{ lane.name }}</div>
                <div class="lane-status-text">
                  <span v-if="lane.status === 'idle'" style="color: #409eff">空闲</span>
                  <span v-else-if="lane.status === 'busy'" style="color: #67c23a">处理中</span>
                  <span v-else style="color: #909399">维护中</span>
                </div>
                <div class="lane-vehicle" v-if="lane.currentVehicle">
                  {{ lane.currentVehicle }}
                </div>
                <div class="lane-count">今日处理：{{ lane.processedCount }}辆</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="card-section">
          <div class="section-title">实时数据</div>
          <el-row :gutter="10">
            <el-col :span="12">
              <div class="mini-stat">
                <div class="mini-stat-value">{{ todayTotal }}</div>
                <div class="mini-stat-label">今日预约</div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="mini-stat">
                <div class="mini-stat-value">{{ passedCount }}</div>
                <div class="mini-stat-label">已放行</div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="mini-stat">
                <div class="mini-stat-value">{{ processingCount }}</div>
                <div class="mini-stat-label">处理中</div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="mini-stat">
                <div class="mini-stat-value">{{ avgWaitTime }}分</div>
                <div class="mini-stat-label">平均等待</div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useAppStore } from '@/stores/app'

const store = useAppStore()
const selectedLane = ref(3)

const gateLanes = computed(() => store.gateLanes)
const queue = computed(() => store.queue)

const availableLanes = computed(() =>
  gateLanes.value.filter(l => l.status !== 'maintenance')
)

const waitingQueue = computed(() =>
  queue.value.filter(q => q.status === 'waiting' || q.status === 'calling')
)

const currentCalling = computed(() =>
  queue.value.find(q => q.status === 'calling' || q.status === 'processing')
)

const waitingCount = computed(() =>
  queue.value.filter(q => q.status === 'waiting').length
)

const congestionClass = computed(() => {
  const level = store.congestionLevel
  return level === 'heavy' ? 'congestion-heavy' : level === 'medium' ? 'congestion-medium' : 'congestion-light'
})

const congestionText = computed(() => {
  const level = store.congestionLevel
  return level === 'heavy' ? '拥堵' : level === 'medium' ? '缓行' : '畅通'
})

const todayTotal = computed(() => store.todayAppointments.length)
const passedCount = computed(() => store.todayAppointments.filter(a => a.status === 'passed').length)
const processingCount = computed(() => store.queuingAppointments.length)
const avgWaitTime = computed(() => store.shiftStats[0]?.avgWaitTime || 0)

function callNext() {
  if (!selectedLane.value) {
    ElMessage.warning('请先选择闸道')
    return
  }
  const result = store.callNextVehicle(selectedLane.value)
  if (result) {
    ElMessage.success(`已呼叫 ${result.plateNumber} 进入 ${selectedLane.value} 号闸道`)
  } else {
    ElMessage.info('暂无等待中的车辆')
  }
}
</script>

<style scoped>
.queue-list {
  max-height: 500px;
  overflow-y: auto;
}

.queue-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.3s;
}

.queue-item:hover {
  background: #f5f7fa;
}

.queue-item.is-calling {
  background: #f0f9eb;
  border-left: 4px solid #67c23a;
}

.queue-rank {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 12px;
}

.queue-item.is-calling .queue-rank {
  background: #67c23a;
}

.queue-info {
  flex: 1;
}

.queue-no {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.plate {
  font-size: 14px;
  color: #606266;
  margin-top: 4px;
}

.queue-status {
  text-align: right;
}

.mini-stat {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  margin-bottom: 10px;
}

.mini-stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.mini-stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.lane-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.lane-status-text {
  font-size: 14px;
  margin-bottom: 8px;
}

.lane-vehicle {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  padding: 4px 8px;
  background: #fff;
  border-radius: 4px;
  display: inline-block;
}

.lane-count {
  font-size: 12px;
  color: #909399;
}
</style>
