"use client"

import { useState } from "react"
import Image from "next/image"
import { Home, Compass, Package, User } from "lucide-react"
import { cn } from "@/lib/utils"

const routes = [
  {
    id: 1,
    name: "宽窄巷子探秘",
    image: "/images/route-kuanzhai.jpg",
    poiCount: 8,
    duration: "2小时",
    tags: ["🏮1个荣耀灯塔", "⭐2个选手足迹"],
  },
  {
    id: 2,
    name: "锦里古街漫游",
    image: "/images/route-jinli.jpg",
    poiCount: 6,
    duration: "1.5小时",
    tags: ["🏮2个荣耀灯塔", "⭐1个选手足迹"],
  },
  {
    id: 3,
    name: "武侯祠寻踪",
    image: "/images/route-wuhou.jpg",
    poiCount: 5,
    duration: "1小时",
    tags: ["🏮1个荣耀灯塔", "⭐3个选手足迹"],
  },
]

const tabs = [
  { id: "home", label: "首页", icon: Home },
  { id: "explore", label: "探索", icon: Compass },
  { id: "bag", label: "背包", icon: Package },
  { id: "profile", label: "我的", icon: User },
]

export function GameHomePage() {
  const [activeTab, setActiveTab] = useState("home")

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex justify-center">
      <div className="relative w-[393px] min-h-screen flex flex-col overflow-hidden">
        {/* Ink wash texture overlay */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-[0.03] z-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Main scrollable content */}
        <div className="relative z-10 flex-1 overflow-y-auto pb-24">
          {/* Top Bar */}
          <header className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">📍</span>
              <span className="text-white font-medium text-lg">成都</span>
            </div>
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F5C518] to-[#B8860B] p-[2px]">
                <div className="w-full h-full rounded-full bg-[#16213E] flex items-center justify-center overflow-hidden">
                  <User className="w-5 h-5 text-[#F5C518]" />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[10px] text-white font-bold">3</span>
              </div>
            </div>
          </header>

          {/* City Banner Card */}
          <section className="px-5 mt-2">
            <div className="relative rounded-2xl overflow-hidden border border-[#F5C518]/20 shadow-lg shadow-[#F5C518]/5">
              <div className="relative h-[200px]">
                <Image
                  src="/images/chengdu-banner.jpg"
                  alt="成都城市风景"
                  fill
                  className="object-cover"
                  priority
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E] via-[#1A1A2E]/60 to-transparent" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h2 className="text-2xl font-bold text-white mb-1 tracking-wide">
                    成都·天府之国
                  </h2>
                  <p className="text-[#F5C518]/80 text-sm mb-4">千年蓉城，美食与文化的交汇</p>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/70">已探索</span>
                      <span className="text-[#F5C518] font-bold">12%</span>
                    </div>
                    <div className="h-2 bg-[#16213E]/80 rounded-full overflow-hidden backdrop-blur-sm">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-[#F5C518] to-[#FFD700]"
                        style={{ width: "12%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section Title */}
          <section className="px-5 mt-8">
            <div className="flex items-center gap-3">
              <div className="h-5 w-1 bg-gradient-to-b from-[#F5C518] to-[#B8860B] rounded-full" />
              <h3 className="text-[#F5C518] text-lg font-bold tracking-wider">推荐路线</h3>
            </div>
          </section>

          {/* Horizontal Scrollable Route Cards */}
          <section className="mt-4">
            <div className="flex gap-4 overflow-x-auto px-5 pb-4 scrollbar-hide snap-x snap-mandatory">
              {routes.map((route) => (
                <RouteCard key={route.id} route={route} />
              ))}
            </div>
          </section>

          {/* CTA Button */}
          <section className="px-5 mt-6">
            <button className="w-full py-4 rounded-2xl font-bold text-lg text-[#1A1A2E] bg-gradient-to-r from-[#F5C518] via-[#FFD700] to-[#F5C518] shadow-lg shadow-[#F5C518]/30 hover:shadow-[#F5C518]/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
              <span className="flex items-center justify-center gap-2">
                <span>⚔️</span>
                <span>选择英雄，开始探索</span>
              </span>
            </button>
          </section>
        </div>

        {/* Bottom Tab Bar */}
        <nav className="absolute bottom-0 left-0 right-0 z-20">
          {/* Glass effect background */}
          <div className="absolute inset-0 bg-[#16213E]/90 backdrop-blur-xl border-t border-[#F5C518]/10" />
          
          <div className="relative flex items-center justify-around py-3 px-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
                    isActive 
                      ? "text-[#F5C518]" 
                      : "text-white/50 hover:text-white/70"
                  )}
                >
                  <div className={cn(
                    "relative",
                    isActive && "drop-shadow-[0_0_8px_rgba(245,197,24,0.5)]"
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={cn(
                    "text-xs font-medium",
                    isActive && "text-shadow-glow"
                  )}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#F5C518]" />
                  )}
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </div>
  )
}

interface Route {
  id: number
  name: string
  image: string
  poiCount: number
  duration: string
  tags: string[]
}

function RouteCard({ route }: { route: Route }) {
  return (
    <div className="flex-shrink-0 w-[260px] snap-start">
      <div className="rounded-2xl overflow-hidden bg-[#16213E] border border-white/5 shadow-xl">
        {/* Card Image */}
        <div className="relative h-[140px]">
          <Image
            src={route.image}
            alt={route.name}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#16213E] to-transparent" />
          
          {/* Duration Badge */}
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-[#1A1A2E]/80 backdrop-blur-sm border border-[#F5C518]/30">
            <span className="text-[#F5C518] text-xs font-medium">🕐 {route.duration}</span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-white font-bold text-base">{route.name}</h4>
            <span className="text-white/60 text-sm">{route.poiCount}个地点</span>
          </div>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {route.tags.map((tag, index) => (
              <span 
                key={index}
                className="text-xs text-[#F5C518]/80 bg-[#F5C518]/10 px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
