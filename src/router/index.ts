import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/appointment'
  },
  {
    path: '/appointment',
    name: 'Appointment',
    component: () => import('@/views/Appointment.vue'),
    meta: { title: '预约登记', icon: 'EditPen' }
  },
  {
    path: '/queue',
    name: 'Queue',
    component: () => import('@/views/Queue.vue'),
    meta: { title: '车辆排队', icon: 'List' }
  },
  {
    path: '/verify',
    name: 'Verify',
    component: () => import('@/views/Verify.vue'),
    meta: { title: '证件核验', icon: 'Postcard' }
  },
  {
    path: '/check',
    name: 'Check',
    component: () => import('@/views/Check.vue'),
    meta: { title: '箱单核对', icon: 'Tickets' }
  },
  {
    path: '/release',
    name: 'Release',
    component: () => import('@/views/Release.vue'),
    meta: { title: '闸道放行', icon: 'Right' }
  },
  {
    path: '/exception',
    name: 'Exception',
    component: () => import('@/views/Exception.vue'),
    meta: { title: '异常补录', icon: 'Warning' }
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: () => import('@/views/Statistics.vue'),
    meta: { title: '班次统计', icon: 'DataAnalysis' }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
