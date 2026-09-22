import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Student, AttendanceRecord } from '../types';

interface AttendanceTrendChartProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  selectedDate: string;
  selectedClass?: string;
}

interface DayTrendData {
  dateStr: string;
  displayDay: string;
  displayDate: string;
  fullLabel: string;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  izinSakit: number;
  alpa: number;
  totalHadir: number;
  totalSiswa: number;
  attendanceRate: number;
  onTimeRate: number;
}

export const AttendanceTrendChart: React.FC<AttendanceTrendChartProps> = ({
  students,
  attendanceRecords,
  selectedDate,
  selectedClass = 'Semua',
}) => {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  const [chartMetric, setChartMetric] = useState<'rate' | 'counts'>('counts');

  // Filter students based on class if selected
  const activeStudents = useMemo(() => {
    if (selectedClass === 'Semua') return students;
    return students.filter((s) => s.classRoom === selectedClass);
  }, [students, selectedClass]);

  const totalClassStudents = activeStudents.length || 1;

  // Generate 7-day trend leading up to selectedDate
  const trendData = useMemo<DayTrendData[]>(() => {
    const data: DayTrendData[] = [];
    const baseDate = selectedDate ? new Date(selectedDate) : new Date();

    // Check if valid date
    const isValidDate = !isNaN(baseDate.getTime());
    const anchor = isValidDate ? baseDate : new Date();

    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(anchor);
      d.setDate(d.getDate() - i);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const dayName = dayNames[d.getDay()];
      const monthName = monthNames[d.getMonth()];
      const displayDay = `${dayName}`;
      const displayDate = `${d.getDate()} ${monthName}`;
      const fullLabel = `${dayName}, ${dd}/${mm}/${yyyy}`;

      // Filter records for this date and class
      const dayRecords = attendanceRecords.filter((rec) => {
        const matchDate = rec.date === dateStr;
        const matchClass = selectedClass === 'Semua' || rec.classRoom === selectedClass;
        return matchDate && matchClass;
      });

      const hadir = dayRecords.filter((r) => r.status === 'Hadir').length;
      const terlambat = dayRecords.filter((r) => r.status === 'Terlambat').length;
      const izin = dayRecords.filter((r) => r.status === 'Izin').length;
      const sakit = dayRecords.filter((r) => r.status === 'Sakit').length;
      const izinSakit = izin + sakit;
      const alpa = dayRecords.filter((r) => r.status === 'Alpa').length;
      const totalHadir = hadir + terlambat;

      const attendanceRate = Math.min(
        100,
        Math.round((totalHadir / totalClassStudents) * 100)
      );

      const onTimeRate = totalHadir > 0 ? Math.round((hadir / totalHadir) * 100) : 0;

      data.push({
        dateStr,
        displayDay,
        displayDate,
        fullLabel,
        hadir,
        terlambat,
        izin,
        sakit,
        izinSakit,
        alpa,
        totalHadir,
        totalSiswa: totalClassStudents,
        attendanceRate,
        onTimeRate,
      });
    }

    return data;
  }, [selectedDate, attendanceRecords, selectedClass, totalClassStudents]);

  // Overall 7-day summary metrics
  const summaryMetrics = useMemo(() => {
    const totalRecords = trendData.reduce((sum, d) => sum + d.totalHadir, 0);
    const avgAttendanceRate = Math.round(
      trendData.reduce((sum, d) => sum + d.attendanceRate, 0) / trendData.length
    );
    const totalLate = trendData.reduce((sum, d) => sum + d.terlambat, 0);
    const totalOnTime = trendData.reduce((sum, d) => sum + d.hadir, 0);

    // Day with highest attendance
    let highestDay = trendData[0];
    trendData.forEach((d) => {
      if (d.totalHadir > (highestDay?.totalHadir || 0)) {
        highestDay = d;
      }
    });

    return {
      totalRecords,
      avgAttendanceRate,
      totalLate,
      totalOnTime,
      highestDay,
    };
  }, [trendData]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DayTrendData = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white border border-slate-700/80 p-3 rounded-xl shadow-xl text-xs space-y-2 backdrop-blur-md min-w-[200px]">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
            <span className="font-bold text-slate-200">{data.fullLabel}</span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-bold border border-indigo-500/30">
              {data.attendanceRate}% Hadir
            </span>
          </div>

          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Hadir Tepat Waktu:</span>
              </span>
              <span className="font-bold font-mono">{data.hadir} siswa</span>
            </div>

            <div className="flex items-center justify-between text-amber-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Terlambat:</span>
              </span>
              <span className="font-bold font-mono">{data.terlambat} siswa</span>
            </div>

            <div className="flex items-center justify-between text-sky-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span>Izin / Sakit:</span>
              </span>
              <span className="font-bold font-mono">{data.izinSakit} siswa</span>
            </div>

            <div className="flex items-center justify-between text-rose-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                <span>Alpa:</span>
              </span>
              <span className="font-bold font-mono">{data.alpa} siswa</span>
            </div>
          </div>

          <div className="border-t border-slate-700/60 pt-1.5 flex items-center justify-between text-[11px] text-slate-400">
            <span>Total Kehadiran:</span>
            <span className="font-bold text-white font-mono">
              {data.totalHadir} / {data.totalSiswa} siswa
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs transition-colors space-y-4">
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold">
              <i className="fa-solid fa-chart-line"></i>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Tren Kehadiran 7 Hari Terakhir
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {selectedClass === 'Semua' ? 'Semua Kelas' : `Kelas ${selectedClass}`}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Grafik pemantauan fluktuasi kehadiran, ketepatan waktu, dan izin siswa selama seminggu terakhir.
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector (Jumlah Siswa vs Persentase %) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setChartMetric('counts')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                chartMetric === 'counts'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <i className="fa-solid fa-users text-[10px]"></i>
              <span>Jumlah Siswa</span>
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('rate')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                chartMetric === 'rate'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <i className="fa-solid fa-percent text-[10px]"></i>
              <span>Persentase (%)</span>
            </button>
          </div>

          {/* Chart Style Switcher (Area vs Bar) */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                chartType === 'area'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Grafik Area Halus"
            >
              <i className="fa-solid fa-chart-area text-[10px]"></i>
              <span>Area</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs font-bold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Diagram Batang Komposisi"
            >
              <i className="fa-solid fa-chart-column text-[10px]"></i>
              <span>Batang</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mini Insight Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <i className="fa-solid fa-user-check text-xs"></i>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
              Rata-rata Kehadiran
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-100">
              {summaryMetrics.avgAttendanceRate}%
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <i className="fa-solid fa-calendar-check text-xs"></i>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
              Tepat Waktu (7 Hari)
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-100 font-mono">
              {summaryMetrics.totalOnTime} siswa
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <i className="fa-solid fa-clock-rotate-left text-xs"></i>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
              Total Terlambat
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-100 font-mono">
              {summaryMetrics.totalLate} kali
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <i className="fa-solid fa-trophy text-xs"></i>
          </div>
          <div className="truncate">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
              Kehadiran Terbaik
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">
              {summaryMetrics.highestDay ? `${summaryMetrics.highestDay.displayDay} (${summaryMetrics.highestDay.attendanceRate}%)` : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Recharts Visualization */}
      <div className="w-full h-64 sm:h-72 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={trendData} margin={{ top: 10, right: 12, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorTerlambat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorIzin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1', strokeOpacity: 0.5 }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                domain={chartMetric === 'rate' ? [0, 100] : [0, 'auto']}
                unit={chartMetric === 'rate' ? '%' : ''}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={32}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingBottom: '4px' }}
              />
              {chartMetric === 'rate' ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="attendanceRate"
                    name="Tingkat Kehadiran (%)"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRate)"
                  />
                  <Area
                    type="monotone"
                    dataKey="onTimeRate"
                    name="Ketepatan Waktu (%)"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorHadir)"
                  />
                </>
              ) : (
                <>
                  <Area
                    type="monotone"
                    dataKey="hadir"
                    name="Hadir Tepat Waktu"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorHadir)"
                  />
                  <Area
                    type="monotone"
                    dataKey="terlambat"
                    name="Terlambat"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTerlambat)"
                  />
                  <Area
                    type="monotone"
                    dataKey="izinSakit"
                    name="Izin / Sakit"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorIzin)"
                  />
                </>
              )}
            </AreaChart>
          ) : (
            <BarChart data={trendData} margin={{ top: 10, right: 12, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
              <XAxis
                dataKey="displayDate"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1', strokeOpacity: 0.5 }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={32}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingBottom: '4px' }}
              />
              <Bar dataKey="hadir" name="Hadir Tepat Waktu" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="terlambat" name="Terlambat" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="izinSakit" name="Izin / Sakit" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
              <Bar dataKey="alpa" name="Alpa" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
