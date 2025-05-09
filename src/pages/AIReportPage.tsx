import AIReport from '../components/AIReport'

const AIReportPage = () => {
  return (
    <div className="flex gap-8">
      <AIReport />
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-4">AI Analysis Report</h1>
        {/* Here you can add more content like charts, analysis, etc. */}
      </div>
    </div>
  )
}

export default AIReportPage 