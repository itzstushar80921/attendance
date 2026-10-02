import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function AttendanceCharts({ monthlyTrends = [], summary = {} }) {
  // If no monthly trend data exists yet, create default entry
  const chartData = monthlyTrends.length > 0 ? monthlyTrends : [
    { month: 'Current', lecturePct: summary.avgLecturePercentage || 85, labPct: summary.avgLabPercentage || 80 }
  ];

  const pieData = [
    { name: '>= 75% (Eligible)', value: summary.goodAttendanceCount || 18, color: '#10b981' },
    { name: '< 75% (Shortage)', value: summary.lowAttendanceCount || 2, color: '#ef4444' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      
      {/* Monthly Lecture vs Lab Trend Bar Chart */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
              Monthly Attendance: Lecture vs Lab
            </h4>
            <p className="text-xs text-slate-500">Separated tracking comparison over time</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-indigo-700">
              <span className="w-2.5 h-2.5 rounded bg-indigo-600 inline-block" />
              Lectures
            </span>
            <span className="flex items-center gap-1.5 text-violet-700">
              <span className="w-2.5 h-2.5 rounded bg-violet-600 inline-block" />
              Labs
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
              <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderRadius: '12px',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px'
                }}
                formatter={(val) => [`${val}%`, '']}
              />
              <Bar dataKey="lecturePct" name="Lecture %" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              <Bar dataKey="labPct" name="Lab %" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Compliance / 75% Threshold Donut Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
        <div>
          <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
            Exam Eligibility Status
          </h4>
          <p className="text-xs text-slate-500">Minimum 75% attendance criteria</p>
        </div>

        <div className="h-44 w-full relative my-auto">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={50}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderRadius: '12px',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-slate-900">
              {summary.avgOverallPercentage || 87}%
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-500">Cohort Avg</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="bg-emerald-50 p-2 rounded-xl text-emerald-800">
            <span className="block font-bold text-sm">{summary.goodAttendanceCount || 0}</span>
            <span className="text-[10px] font-semibold text-emerald-600">&ge; 75% Eligible</span>
          </div>
          <div className="bg-rose-50 p-2 rounded-xl text-rose-800">
            <span className="block font-bold text-sm">{summary.lowAttendanceCount || 0}</span>
            <span className="text-[10px] font-semibold text-rose-600">&lt; 75% Shortage</span>
          </div>
        </div>
      </div>

    </div>
  );
}
