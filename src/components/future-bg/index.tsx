import { View } from '@tarojs/components'
import './index.scss'

export default function FutureBg() {
  return (
    <View className='future-bg'>
      <View className='future-bg-fog'></View>
      <View className='future-bg-glow'></View>
      <View className='future-bg-floor'></View>
      <View className='future-bg-particles'>
        <View className='future-particle p1'></View>
        <View className='future-particle p2'></View>
        <View className='future-particle p3'></View>
        <View className='future-particle p4'></View>
        <View className='future-particle p5'></View>
        <View className='future-particle p6'></View>
        <View className='future-particle p7'></View>
        <View className='future-particle p8'></View>
      </View>
    </View>
  )
}
