import { View, Text } from '@tarojs/components';
import { useState } from 'react';
import TreasureMap from '../treasure-map';
import './index.scss';

interface MapFloatBtnProps {
  routeId?: number;
  onLoadRoute?: (routeId: number) => void;
}

export default function MapFloatBtn({ routeId = 1, onLoadRoute }: MapFloatBtnProps) {
  const [expanded, setExpanded] = useState(false);
  const [treasureMapVisible, setTreasureMapVisible] = useState(false);

  const handleFloatTap = () => {
    setExpanded(true);
    setTreasureMapVisible(true);
  };

  const handleMapClose = () => {
    setTreasureMapVisible(false);
    setExpanded(false);
  };

  const handleStartFromMap = (id: number) => {
    setTreasureMapVisible(false);
    setExpanded(false);
    if (onLoadRoute) {
      onLoadRoute(id);
    }
  };

  return (
    <>
      {/* 悬浮按钮 */}
      <View className={`float-btn ${expanded ? 'hide' : 'show'}`} onClick={handleFloatTap}>
        <View className='float-btn-inner'>
          <Text className='float-icon'>🗺️</Text>
          <Text className='float-label'>路线</Text>
        </View>
        {/* 呼吸光圈 */}
        <View className='float-pulse'></View>
      </View>

      {/* 藏宝图组件 */}
      <TreasureMap
        visible={treasureMapVisible}
        routeId={routeId}
        onClose={handleMapClose}
        onStartExplore={handleStartFromMap}
      />
    </>
  );
}
