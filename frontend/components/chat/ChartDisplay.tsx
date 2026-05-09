'use client'
import { useMemo } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar, Line, Pie } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend)

interface Props { data: Record<string, unknown>[] }

function detectChartType(keys: string[]): 'bar' | 'line' | 'pie' {
  const timeKeys = ['date', 'month', 'year', 'week', 'day', 'time', 'period']
  const hasTime  = keys.some((k) => timeKeys.some((t) => k.toLowerCase().includes(t)))
  if (hasTime) return 'line'
  if (keys.length === 2) return 'bar'
  return 'bar'
}

const COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#F97316','#EC4899']

export function ChartDisplay({ data }: Props) {
  const chart = useMemo(() => {
    if (!data || data.length === 0) return null
    const keys      = Object.keys(data[0])
    const labelKey  = keys[0]
    const valueKeys = keys.slice(1).filter((k) => typeof data[0][k] === 'number')
    if (valueKeys.length === 0) return null

    const type    = detectChartType(keys)
    const labels  = data.map((r) => String(r[labelKey]))
    const datasets = valueKeys.map((key, i) => ({
      label: key,
      data: data.map((r) => Number(r[key])),
      backgroundColor: type === 'pie' ? data.map((_, j) => COLORS[j % COLORS.length]) : COLORS[i % COLORS.length] + (type === 'bar' ? 'CC' : ''),
      borderColor: COLORS[i % COLORS.length],
      borderWidth: type === 'line' ? 2 : 0,
      borderRadius: type === 'bar' ? 6 : 0,
      tension: 0.4, fill: false, pointRadius: 3,
    }))
    return { type, labels, datasets }
  }, [data])

  if (!chart) return null

  const options = {
    responsive: true,
    plugins: {
      legend: { display: chart.datasets.length > 1, labels: { color: '#71717a', font: { size: 12 } } },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: chart.type !== 'pie' ? {
      x: { ticks: { color: '#71717a', font: { size: 11 } }, grid: { color: '#27272a' } },
      y: { ticks: { color: '#71717a', font: { size: 11 } }, grid: { color: '#27272a' } },
    } : undefined,
  }

  const chartData = { labels: chart.labels, datasets: chart.datasets }

  return (
    <div className="mt-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
      {chart.type === 'bar'  && <Bar  data={chartData} options={options} />}
      {chart.type === 'line' && <Line data={chartData} options={options} />}
      {chart.type === 'pie'  && <div className="max-w-xs mx-auto"><Pie data={chartData} options={options} /></div>}
    </div>
  )
}
