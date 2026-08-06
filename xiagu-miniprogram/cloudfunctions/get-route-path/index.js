// cloudfunctions/get-route-path/index.js
// 调用腾讯地图步行路径规划API，返回每段路径的折线坐标

const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const MAP_KEY = '5ETBZ-LELYW-L7QR6-Y5L42-37DKV-3RFN6' // 腾讯地图Key
const WALKING_API = 'https://apis.map.qq.com/ws/direction/v1/walking/'

exports.main = async (event) => {
  const { pois } = event  // [{lat, lng}, {lat, lng}, ...]

  if (!pois || pois.length < 2) {
    return { code: 400, message: 'At least 2 POIs required' }
  }

  try {
    // 并行请求每段步行路径
    const segments = []
    for (let i = 0; i < pois.length - 1; i++) {
      segments.push({
        from: pois[i],
        to: pois[i + 1],
        index: i
      })
    }

    const results = await Promise.allSettled(
      segments.map(seg => fetchWalkingRoute(seg.from, seg.to))
    )

    // 组装完整路径
    const allPoints = []
    let totalDistance = 0
    let totalDuration = 0
    const segmentDistances = []

    results.forEach((result, i) => {
      if (result.status === 'fulfilled' && result.value) {
        const data = result.value
        const decoded = decodePolyline(data.polyline)
        // 简化折线：每段最多保留25个点
        const simplified = simplify(decoded, 25)

        // 去掉与前一段重叠的起点
        if (allPoints.length > 0 && simplified.length > 0) {
          simplified.shift()
        }
        allPoints.push(...simplified)
        totalDistance += data.distance || 0
        totalDuration += data.duration || 0
        segmentDistances.push(data.distance || 0)
      } else {
        // 该段请求失败，用直线代替
        console.warn(`Segment ${i} failed, using straight line`)
        const from = segments[i].from
        const to = segments[i].to
        if (allPoints.length === 0) {
          allPoints.push({ lat: from.lat, lng: from.lng })
        }
        allPoints.push({ lat: to.lat, lng: to.lng })
        segmentDistances.push(
          haversine(from.lat, from.lng, to.lat, to.lng)
        )
      }
    })

    return {
      code: 200,
      data: {
        points: allPoints,
        totalDistance,
        totalDuration,
        segmentDistances,
        segmentCount: segments.length
      }
    }
  } catch (err) {
    console.error('get-route-path error:', err)
    return { code: 500, message: err.message }
  }
}

// ============ 调用腾讯地图步行路径规划API ============

async function fetchWalkingRoute(from, to) {
  const url = `${WALKING_API}?from=${from.lat},${from.lng}&to=${to.lat},${to.lng}&key=${MAP_KEY}`
  
  console.log(`Fetching route: ${from.lat},${from.lng} -> ${to.lat},${to.lng}`)

  try {
    const resp = await axios.get(url, { timeout: 8000 })
    
    console.log('API Response status:', resp.data.status, 'message:', resp.data.message)

    if (resp.data.status !== 0 || !resp.data.result || !resp.data.result.routes || resp.data.result.routes.length === 0) {
      throw new Error(`API error: ${resp.data.message || 'No routes found'}`)
    }

    const route = resp.data.result.routes[0]
    console.log(`Route found: distance=${route.distance}, duration=${route.duration}, polyline points=${route.polyline ? route.polyline.length / 2 : 0}`)
    
    return {
      polyline: route.polyline,
      distance: route.distance,
      duration: route.duration
    }
  } catch (err) {
    console.error('Fetch route error:', err.message)
    if (err.response) {
      console.error('Response data:', err.response.data)
    }
    throw err
  }
}

// ============ 解码腾讯地图压缩折线 ============
// 前两个值是绝对坐标(×1e6)，后续每两个值是相对于前一点的偏移(×1e6)

function decodePolyline(polyline) {
  if (!polyline || polyline.length < 2) return []

  const points = []
  let lat = polyline[0]
  let lng = polyline[1]
  points.push({ lat: lat / 1e6, lng: lng / 1e6 })

  for (let i = 2; i < polyline.length; i += 2) {
    lat += polyline[i]
    lng += polyline[i + 1]
    points.push({ lat: lat / 1e6, lng: lng / 1e6 })
  }
  
  // 过滤掉明显错误的坐标（ latitude 应该在 -90~90 之间，longitude 在 -180~180 之间）
  // 且成都地区的 lat 约 30.x，lng 约 104.x
  const validPoints = points.filter(p => {
    return p.lat >= -90 && p.lat <= 90 && p.lng >= -180 && p.lng <= 180 &&
           (p.lat > 20 && p.lat < 40 && p.lng > 100 && p.lng < 110) // 大致在成都范围
  })
  
  return validPoints.length > 0 ? validPoints : points
}

// ============ 折线简化（均匀采样） ============

function simplify(points, maxCount) {
  if (points.length <= maxCount) return points
  const step = (points.length - 1) / (maxCount - 1)
  const result = []
  for (let i = 0; i < maxCount - 1; i++) {
    result.push(points[Math.round(i * step)])
  }
  result.push(points[points.length - 1])
  return result
}

// ============ Haversine距离（直线距离备用） ============

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
