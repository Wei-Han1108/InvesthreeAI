import AIReport from '../components/AIReport'

const AIReportPage = () => {
  return (
    <div className="flex gap-8">
      <AIReport />
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-4">AI 分析报告</h1>
        {/* 这里可以添加更多内容，比如图表、分析等 */}
      </div>
    </div>
  )
}

export default AIReportPage 