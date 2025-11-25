// 模块入口：仅负责装配 TabsContainer，不承载业务逻辑
import './style.css'
import TabsContainer from './TabsContainer'
/**
 * LoadApp 模块入口
 * @component
 * @description 仅负责装配 TabsContainer，不承载业务逻辑。
 */
export default function LoadApp() {
  return <TabsContainer />
}
