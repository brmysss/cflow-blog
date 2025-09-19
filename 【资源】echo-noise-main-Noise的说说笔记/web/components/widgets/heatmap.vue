<template>
    <UCard class="mx-auto sm:max-w-2xl hover:shadow-md backdrop-blur-sm bg-black/40 shadow-lg text-white">
      <div class="heatmap-header">
        <h3>内容发布日历</h3>
        <div class="heatmap-legend">
          <span>少</span>
          <div class="legend-colors">
            <div v-for="n in 5" :key="n" :style="{ backgroundColor: getColor(n) }"></div>
          </div>
          <span>多</span>
        </div>
      </div>
      
      <div class="calendar-wrapper">
        <div class="calendar-container" ref="calendarContainer">
        <!-- 月份标题 -->
        <div class="month-labels">
          <div class="month-label" v-for="(month, index) in monthLabels" :key="index">{{ month }}</div>
        </div>
        
        <!-- 星期标签 -->
        <div class="weekday-labels">
          <div class="weekday-label" v-for="day in weekdays" :key="day">{{ day }}</div>
        </div>
        
        <!-- 热力图网格 -->
        <div class="heatmap-grid">
          <div v-for="(week, i) in calendarData" :key="i" class="heatmap-week">
            <div 
              v-for="(day, j) in week" 
              :key="j" 
              class="heatmap-day"
              :style="{ backgroundColor: getBackgroundColor(day) }"
              :title="`${day.date}: ${day.count || 0} 条内容`"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
  
  <script setup lang="ts">
  import { ref, onMounted, computed, nextTick } from 'vue'
  
  const rawData = ref([])
  const calendarData = ref([])
  const calendarContainer = ref(null)
  
  // 生成月份标签
  const monthLabels = computed(() => {
  if (!rawData.value.length) return Array(12).fill('').map((_, i) => `${i + 1}月`);
  
  const dates = rawData.value.map(item => new Date(item.date));
  const firstDate = new Date(Math.min(...dates));
  
  const labels = [];
  let currentDate = new Date(firstDate);
  currentDate.setDate(1);
  
  let currentYear = currentDate.getFullYear();
  
  // 生成12个月的标签
  for (let i = 0; i < 12; i++) {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    
    // 只在年份变化时或第一个月显示年份
    if (year !== currentYear || i === 0) {
      labels.push(`${year}年${month + 1}月`);
      currentYear = year;
    } else {
      labels.push(`${month + 1}月`);
    }
    
    currentDate.setMonth(month + 1);
  }
  
  return labels;
})
  
  // 中文星期
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  
  const getColor = (level: number) => {
    const colors = ['#9be9a8', '#40c463', '#30a14e', '#216e39', '#0e4429']
    return colors[Math.min(level - 1, 4)] || '#ebedf0'
  }
  // 优化颜色计算
const getBackgroundColor = (day: { count: number; level: number }) => {
  if (!day.count) return 'rgba(235, 237, 240, 0.4)'
  return getColor(day.level)
}
  const fetchHeatmapData = async () => {
    try {
      const response = await fetch('/api/messages/calendar')
      const data = await response.json()
      
      if (data && data.code === 1 && data.data && data.data.length > 0) {
        rawData.value = data.data
        generateCalendarData()
      } else {
        generateTestData()
      }
    } catch (error) {
      console.error('获取热力图数据失败:', error)
      generateTestData()
    }
  }
  
  const generateTestData = () => {
    const today = new Date()
    const startDate = new Date(today)
    startDate.setMonth(today.getMonth() - 11) // 从11个月前开始
    startDate.setDate(1) // 从月初开始
    
    const testData = []
    let currentDate = new Date(startDate)
    
    while (currentDate <= today) {
      const count = Math.random() > 0.7 ? Math.floor(Math.random() * 10) + 1 : 0
      testData.push({
        date: formatDate(currentDate),
        count: count
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    rawData.value = testData
    generateCalendarData()
  }
  
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  const generateCalendarData = () => {
    if (!rawData.value.length) return;
    
    // 获取最早和最新的日期
    const dates = rawData.value.map(item => new Date(item.date));
    const firstDate = new Date(Math.min(...dates));
    const lastDate = new Date(Math.max(...dates));
    
    // 确保显示完整的一年
    const startDate = new Date(firstDate);
    startDate.setDate(1); // 从月初开始
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + 11); // 确保显示12个月
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // 确保最后一周完整
    
    // 创建日期映射
    const dateMap = new Map();
    rawData.value.forEach(item => {
      if (item && item.date && item.count !== undefined) {
        dateMap.set(item.date, item.count);
      }
    });
    
    // 生成日历网格
    const calendar = [];
    
    // 确保从周日开始
    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() - currentDate.getDay());
    
    // 生成完整的网格数据
    while (currentDate <= endDate) {
      const weekData = [];
      
      for (let day = 0; day < 7; day++) {
        const dateStr = formatDate(currentDate);
        const count = dateMap.get(dateStr) || 0;
        
        weekData.push({
          date: dateStr,
          count: count,
          level: count ? Math.min(Math.ceil(count / 2), 5) : 0
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      calendar.push(weekData);
    }
    
    calendarData.value = calendar;
  }
  
  onMounted(() => {
    fetchHeatmapData()
  })
  </script>
  
  <style scoped>
  .calendar-wrapper {
  position: relative;
  overflow: hidden;
  margin: 0 -16px;
  padding: 16px;
}

.calendar-container {
  position: relative;
  padding-top: 20px;
  padding-left: 30px;
  overflow: visible;
}

  .heatmap-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .heatmap-header h3 {
    margin: 0;
    font-size: 16px;
    color: white;
  }
  
  .heatmap-legend {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .legend-colors {
    display: flex;
    gap: 2px;
  }
  
  .legend-colors div {
    width: 12px;
    height: 12px;
    border-radius: 2px;
  }
  
  .calendar-container {
    position: relative;
    padding-top: 20px;
    padding-left: 30px;
  }
  
  .month-label {
  flex: 1;
  text-align: center;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  padding: 0 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
  
.month-labels {
  display: flex;
  position: absolute;
  top: 0;
  left: 30px;
  right: 0;
  padding-bottom: 4px;
}
  
  .weekday-labels {
    position: absolute;
    left: 0;
    top: 20px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .weekday-label {
    height: 12px;
    line-height: 12px;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.7);
    text-align: right;
    padding-right: 4px;
  }
  
  .heatmap-grid {
   display: flex;
   gap: 3px;
   overflow-x: auto;
   padding-bottom: 5px;
   scroll-behavior: smooth;
   -webkit-overflow-scrolling: touch;
   scrollbar-width: thin;
   mask-image: linear-gradient(to right, transparent, black 30px, black 90%, transparent);
   -webkit-mask-image: linear-gradient(to right, transparent, black 30px, black 90%, transparent);
  }
  .heatmap-grid::-webkit-scrollbar {
  height: 6px;
}

.heatmap-grid::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.heatmap-grid::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}
  .heatmap-week {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  
  .heatmap-day {
    width: 12px;
    height: 12px;
    border-radius: 2px;
    transition: all 0.2s ease;
  }
  
  .heatmap-day:hover {
    transform: scale(1.2);
  }
  
  @media screen and (max-width: 768px) {
    .heatmap-day {
      width: 8px;
      height: 8px;
    }
    
    .month-label {
      font-size: 10px;
    }
    
    .weekday-label {
      font-size: 8px;
      height: 8px;
      line-height: 8px;
      padding-right: 2px;
    }
    .weekday-labels {
  position: absolute;
  left: 0;
  top: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.8) 80%, transparent);
  padding-right: 10px;
  z-index: 1;
}
  }
  </style>