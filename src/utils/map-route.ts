/**
 * 腾讯地图路线规划
 * 文档：https://lbs.qq.com/service/webService/webServiceGuide/route
 */

import Taro from '@tarojs/taro'

const QQ_MAP_KEY = '5ETBZ-LELYW-L7QR6-Y5L42-37DKV-3RFN6'

// 出行方式类型
export type TravelMode = 'walking' | 'driving' | 'bicycling' | 'ebicycling' | 'transit'

export interface RoutePoint {
  latitude: number
  longitude: number
}

// 公交路线步骤详情
export interface TransitStep {
  mode: 'TRANSIT' | 'WALKING' | string  // 出行方式：TRANSIT=公共交通, WALKING=步行
  vehicle?: 'BUS' | 'SUBWAY' | 'RAIL' | string  // 交通工具类型（仅TRANSIT模式有）
  distance: number     // 距离（米）
  duration: number     // 时长（分钟）
  instruction: string  // 文字指引
  // 公交/地铁特有字段
  lines?: {
    title: string      // 线路名称，如"438路"
    vehicle: string    // 交通工具类型，如"BUS"
    id?: string        // 线路ID
  }[]
  getOn?: {
    id: string         // 站点ID
    name: string       // 上车站名
    location?: { lat: number; lng: number }
  }
  getOff?: {
    id: string         // 站点ID
    name: string       // 下车站名
    location?: { lat: number; lng: number }
  }
  destination?: {      // 线路终点站（用于指示乘坐方向）
    id: string
    name: string
  }
  stationCount?: number  // 经停站数
  price?: number        // 票价（分）
  // 步行特有字段
  polyline?: number[]  // 路线坐标
  steps?: {            // 步行分路段诱导信息
    instruction: string
    distance: number
    road_name?: string
  }[]
}

// 公交路线详情
export interface TransitRouteDetail {
  steps: TransitStep[]
  walkingDistance: number  // 步行总距离
  transferCount: number    // 换乘次数
  startName?: string       // 起点名称（从API返回的步行段提取）
  endName?: string         // 终点名称（从API返回的最后一步提取）
}

export interface RouteResult {
  polyline: RoutePoint[]   // 路线坐标点数组
  distance: number         // 总距离（米）
  duration: number         // 预计时长（分钟）
  mode: TravelMode         // 出行方式
  transitDetail?: TransitRouteDetail  // 公交详情（仅公交模式有）
}

/**
 * 将腾讯地图返回的 polyline 压缩编码解压
 * 腾讯地图 API 返回的 coors 格式：
 * - 第0,1个值是起点实际坐标（lat, lng）
 * - 后续值是差值（需要累加到前一个同类型值上）
 * 解压公式: coors[i] = coors[i-2] + coors[i]/1000000
 */
function decodePolyline(coors: number[]): RoutePoint[] {
  // 先解压整个数组
  const decoded = [...coors]
  for (let i = 2; i < decoded.length; i++) {
    decoded[i] = decoded[i - 2] + decoded[i] / 1000000
  }
  
  // 然后每两个一组组成坐标点
  const points: RoutePoint[] = []
  for (let i = 0; i < decoded.length; i += 2) {
    points.push({ 
      latitude: decoded[i], 
      longitude: decoded[i + 1] 
    })
  }

  return points
}

/**
 * 通用路线规划函数
 * 支持多种出行方式
 */
export async function fetchRoute(
  from: RoutePoint,
  to: RoutePoint,
  mode: TravelMode = 'walking'
): Promise<RouteResult> {
  const modeEndpoints: Record<TravelMode, string> = {
    walking: 'walking',
    driving: 'driving',
    bicycling: 'bicycling',
    ebicycling: 'ebicycling',
    transit: 'transit'
  }

  const endpoint = modeEndpoints[mode]
  const url = [
    `https://apis.map.qq.com/ws/direction/v1/${endpoint}/`,
    `?from=${from.latitude},${from.longitude}`,
    `&to=${to.latitude},${to.longitude}`,
    `&key=${QQ_MAP_KEY}`,
    `&output=json`
  ].join('')

  return new Promise((resolve, reject) => {
    Taro.request({
      url,
      method: 'GET',
      success: (res: any) => {
        console.log(`🗺️ [${mode}] 腾讯地图API返回:`, res.data)
        const data = res.data
        if (data.status !== 0) {
          reject(new Error(`路线规划失败: ${data.message}`))
          return
        }

        let route: any
        let polyline: RoutePoint[]

        // 公交API返回格式不同
        if (mode === 'transit') {
          route = data.result.routes[0]
          // 公交需要特殊处理polyline
          polyline = decodeTransitPolyline(route)
        } else {
          route = data.result.routes[0]
          polyline = decodePolyline(route.polyline)
        }

        console.log(`🗺️ [${mode}] 路线数据:`, {
          distance: route.distance,
          duration: route.duration,
          polylinePoints: polyline.length
        })

        const result: RouteResult = {
          polyline,
          distance: route.distance,
          duration: route.duration,
          mode
        }

        // 公交模式：提取详细换乘信息
        if (mode === 'transit' && route.steps) {
          console.log('🚌 原始steps数据:', JSON.stringify(route.steps, null, 2))
          
          const steps: TransitStep[] = route.steps.map((step: any) => {
            // TRANSIT模式：数据主要在lines[0]中
            const lineInfo = step.lines?.[0]
            
            // 提取vehicle类型
            const vehicle = step.vehicle || lineInfo?.vehicle || ''
            
            // 提取线路信息
            const lines = step.lines?.map((line: any) => ({
              title: line.title,
              vehicle: line.vehicle,
              id: line.id
            }))
            
            // 提取上下车站点信息（优先从lines[0]中获取）
            const getOn = lineInfo?.geton ? {
              id: lineInfo.geton.id,
              name: lineInfo.geton.title,
              location: lineInfo.geton.location
            } : (step.geton ? {
              id: step.geton.id,
              name: step.geton.title,
              location: step.geton.location
            } : undefined)
            
            const getOff = lineInfo?.getoff ? {
              id: lineInfo.getoff.id,
              name: lineInfo.getoff.title,
              location: lineInfo.getoff.location
            } : (step.getoff ? {
              id: step.getoff.id,
              name: step.getoff.title,
              location: step.getoff.location
            } : undefined)
            
            // 提取终点站信息（用于指示方向）
            const destination = lineInfo?.destination ? {
              id: lineInfo.destination.id,
              name: lineInfo.destination.title
            } : (step.destination ? {
              id: step.destination.id,
              name: step.destination.title
            } : undefined)
            
            // 距离、时间、价格、站点数优先从lines[0]获取
            const distance = lineInfo?.distance ?? step.distance ?? 0
            const duration = lineInfo?.duration ?? step.duration ?? 0
            const price = lineInfo?.price ?? step.price
            const stationCount = lineInfo?.station_count ?? step.station_count
            
            return {
              mode: step.mode,
              vehicle: vehicle,
              distance: distance,
              duration: duration,
              instruction: step.instruction || '',
              lines: lines,
              getOn: getOn,
              getOff: getOff,
              destination: destination,
              stationCount: stationCount,
              price: price,
              polyline: step.polyline,
              steps: step.steps?.map((s: any) => ({
                instruction: s.instruction,
                distance: s.distance,
                road_name: s.road_name
              }))
            }
          })
          
          console.log('🚌 解析后的steps:', steps)

          // 计算步行总距离
          const walkingDistance = steps
            .filter(s => s.mode === 'WALKING')
            .reduce((sum, s) => sum + s.distance, 0)

          // 计算换乘次数（BUS和SUBWAY之间的转换）
          const transitSteps = steps.filter(s => s.mode === 'BUS' || s.mode === 'SUBWAY')
          const transferCount = Math.max(0, transitSteps.length - 1)

          // 提取起点和终点名称
          // 起点：第一步步行段的起点（通常是用户当前位置附近的地点）
          const firstStep = steps[0]
          const startName = firstStep?.mode === 'WALKING' && firstStep.steps && firstStep.steps.length > 0
            ? firstStep.steps[0].road_name || firstStep.steps[0].instruction?.split('，')[0]?.replace('从', '')
            : undefined
          
          // 终点：最后一步的终点
          const lastStep = steps[steps.length - 1]
          const endName = lastStep?.getOff?.name || lastStep?.destination?.name

          result.transitDetail = {
            steps,
            walkingDistance,
            transferCount,
            startName,
            endName
          }

          console.log('🚌 公交详情:', {
            stepsCount: steps.length,
            transferCount,
            walkingDistance
          })
        }

        resolve(result)
      },
      fail: (err: any) => {
        reject(new Error(`请求失败: ${JSON.stringify(err)}`))
      }
    })
  })
}

/**
 * 解码公交路线的polyline
 * 公交API返回的是分段polyline
 */
function decodeTransitPolyline(route: any): RoutePoint[] {
  const points: RoutePoint[] = []
  
  if (route.steps) {
    for (const step of route.steps) {
      if (step.polyline) {
        const stepPoints = decodePolyline(step.polyline)
        points.push(...stepPoints)
      }
    }
  }
  
  return points
}

/**
 * 请求步行路线规划（向后兼容）
 */
export async function fetchWalkingRoute(
  from: RoutePoint,
  to: RoutePoint
): Promise<RouteResult> {
  return fetchRoute(from, to, 'walking')
}
