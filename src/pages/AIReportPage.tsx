import AIReport from '../components/AIReport'

const AIReportPage = () => {
  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold text-center mb-8">AI Analysis Report</h1>
      <div className="flex gap-8 justify-center">
        <AIReport />
      </div>
    </div>
  )
}

export default AIReportPage 