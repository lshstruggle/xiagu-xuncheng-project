export default defineAppConfig({
  // 主包页面
  pages: [
    'pages/index/index',
    'pages/checkin/index',
    'pages/ai/index',
    'pages/user/index',
    'pages/bookmark-gallery/index',
    'pages/backpack/index',
    'pages/shop/index',
    'pages/bond-system/index'
  ],
  // 分包配置
  subPackages: [
    {
      root: 'packageA',
      pages: [
        'pages/hero-select/index',
        'pages/story-mode-select/index'
      ]
    }
  ],
  // 预加载配置（提升体验）
  preloadRule: {
    'pages/index/index': {
      network: 'all',
      packages: ['packageA']
    }
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1A1A2E',
    navigationBarTitleText: '峡谷寻城记',
    navigationBarTextStyle: 'white',
    backgroundColor: '#1A1A2E'
  },
  tabBar: {
    color: '#888888',
    selectedColor: '#F5C518',
    backgroundColor: '#16213E',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页'
      },
      {
        pagePath: 'pages/checkin/index',
        text: '探索'
      },
      {
        pagePath: 'pages/ai/index',
        text: 'AI伙伴'
      },
      {
        pagePath: 'pages/user/index',
        text: '我的'
      }
    ]
  },
  permission: {
    'scope.userLocation': {
      desc: '你的位置信息将用于打卡定位'
    }
  },
  requiredPrivateInfos: ['getLocation', 'onLocationChange']
})
