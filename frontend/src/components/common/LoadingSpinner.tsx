import { Spin } from 'antd'

const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-[300px]">
    <Spin size="large" />
  </div>
)

export default LoadingSpinner
