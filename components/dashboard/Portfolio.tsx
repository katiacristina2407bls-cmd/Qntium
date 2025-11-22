import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  Zap, 
  Shield, 
  Download, 
  Activity,
  PlusCircle,
  MoreHorizontal,
  PieChart,
  AlertCircle,
  Briefcase,
  Globe,
  Award,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Investment {
  id: number;
  name: string;
  type: string;
  balance: number;
  initial_investment: number;
  total_return_percent: number;
  daily_return_percent: number;
  status: string;
  risk_level: 'Baixo' | 'Médio' | 'Alto';
  color_theme: string;
}

interface PortfolioProps {
  onNavigateToMarketplace?: () => void;
}

export const Portfolio: React.FC<PortfolioProps> = ({ onNavigateToMarketplace }) => {
  const { user, profile } = useAuth();
  const [timeframe, setTimeframe] = useState('1M');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Data from Supabase
  const fetchInvestments = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true);
      // Only show full page loading on first load
      if (investments.length === 0) setLoading(true); 
      setError(null);

      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;

      if (data) {
        setInvestments(data);
      }
    } catch (err: any) {
      console.error('Error fetching investments:', err);
      setError('Não foi possível carregar seus investimentos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInvestments();
  }, [fetchInvestments]);

  // Calculate totals dynamically
  const totalBalance = investments.reduce((acc, curr) => acc + curr.balance, 0);
  const totalInvested = investments.reduce((acc, curr) => acc + curr.initial_investment, 0);
  const totalProfit = totalBalance - totalInvested;
  const totalProfitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  // Helper to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Helper to get theme styles based on DB color_theme
  const getThemeStyles = (theme: string) => {
    switch (theme) {
      case 'purple':
        return {
          icon: <Zap className="w-5 h-5" />,
          color: 'text-purple-400',
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/20',
          progressBg: 'bg-purple-500'
        };
      case 'blue':
        return {
          icon: <Shield className="w-5 h-5" />,
          color: 'text-blue-400',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          progressBg: 'bg-blue-500'
        };
      case 'orange':
        return {
          icon: <TrendingUp className="w-5 h-5" />,
          color: 'text-orange-400',
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/20',
          progressBg: 'bg-orange-500'
        };
      case 'green':
        return {
          icon: <Globe className="w-5 h-5" />,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20',
          progressBg: 'bg-emerald-500'
        };
      case 'yellow':
        return {
          icon: <Award className="w-5 h-5" />,
          color: 'text-yellow-400',
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/20',
          progressBg: 'bg-yellow-500'
        };
      default:
        return {
          icon: <Briefcase className="w-5 h-5" />,
          color: 'text-gray-400',
          bg: 'bg-gray-500/10',
          border: 'border-gray-500/20',
          progressBg: 'bg-gray-500'
        };
    }
  };

  const handleDownloadReport = () => {
    const doc = new jsPDF();

    // Add logo/brand text
    doc.setFontSize(22);
    doc.setTextColor(37, 99, 235); // Blue color
    doc.text('Quantium', 14, 22);
    doc.setFontSize(22);
    doc.setTextColor(0);
    doc.text('Investments', 48, 22);

    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Relatório de Performance', 14, 32);

    // User Info & Date
    doc.setFontSize(10);
    doc.setTextColor(60);
    const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    doc.text(`Gerado em: ${dateStr}`, 14, 42);
    doc.text(`Investidor: ${profile?.full_name || user?.email}`, 14, 48);

    // Summary Box
    doc.setFillColor(240, 245, 255);
    doc.setDrawColor(37, 99, 235);
    doc.roundedRect(14, 55, 182, 28, 2, 2, 'FD');
    
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text('Saldo Total', 22, 66);
    doc.text('Total Investido', 85, 66);
    doc.text('Lucro Líquido', 150, 66);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(totalBalance), 22, 76);
    doc.text(formatCurrency(totalInvested), 85, 76);
    
    const profitColor = totalProfit >= 0 ? [22, 163, 74] : [220, 38, 38];
    doc.setTextColor(profitColor[0], profitColor[1], profitColor[2]);
    doc.text((totalProfit > 0 ? '+' : '') + formatCurrency(totalProfit), 150, 76);
    
    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');

    // Table Data Preparation
    const tableData = investments.map(inv => [
        inv.name,
        inv.type,
        inv.risk_level,
        formatCurrency(inv.initial_investment),
        formatCurrency(inv.balance),
        `${inv.total_return_percent > 0 ? '+' : ''}${inv.total_return_percent}%`
    ]);

    // Generate Table
    autoTable(doc, {
        startY: 95,
        head: [['Ativo', 'Tipo', 'Risco', 'Investido', 'Saldo Atual', 'Retorno']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
            fillColor: [37, 99, 235],
            textColor: 255,
            fontStyle: 'bold'
        },
        styles: { 
            fontSize: 10, 
            cellPadding: 4 
        },
        alternateRowStyles: {
            fillColor: [245, 247, 250]
        }
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Quantium Investments - O futuro do seu patrimônio.', 14, doc.internal.pageSize.height - 10);
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
    }

    doc.save(`quantium_relatorio_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Generate dynamic chart data based on selected timeframe
  const chartData = useMemo(() => {
    const points: { label: string; value: number }[] = [];
    const now = new Date();
    const balance = totalBalance || 10000; // Default fallback for visual if 0

    // Simulate volatility function
    const getHistoricalValue = (baseValue: number, daysAgo: number, volatility: number) => {
        // More days ago = more potential variance
        const randomFactor = 1 - (Math.random() * volatility * (daysAgo / 10));
        return baseValue * randomFactor;
    };

    if (timeframe === '1S') { // 1 Week
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            points.push({
                label: i === 0 ? 'Hoje' : date.toLocaleDateString('pt-BR', { weekday: 'short' }),
                value: i === 0 ? balance : getHistoricalValue(balance, i, 0.05)
            });
        }
    } else if (timeframe === '1M') { // 1 Month
        for (let i = 4; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - (i * 7));
            points.push({
                label: i === 0 ? 'Hoje' : date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                value: i === 0 ? balance : getHistoricalValue(balance, i * 7, 0.08)
            });
        }
    } else if (timeframe === '3M') { // 3 Months
        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - (i * 15));
            points.push({
                label: i === 0 ? 'Hoje' : date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                value: i === 0 ? balance : getHistoricalValue(balance, i * 15, 0.12)
            });
        }
    } else if (timeframe === '6M') { // 6 Months
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now);
            date.setMonth(date.getMonth() - i);
            points.push({
                label: i === 0 ? 'Hoje' : date.toLocaleDateString('pt-BR', { month: 'short' }),
                value: i === 0 ? balance : getHistoricalValue(balance, i * 30, 0.15)
            });
        }
    } else if (timeframe === '1A') { // 1 Year
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now);
            date.setMonth(date.getMonth() - i);
            points.push({
                label: i === 0 ? 'Hoje' : date.toLocaleDateString('pt-BR', { month: 'short' }),
                value: i === 0 ? balance : getHistoricalValue(balance, i * 30, 0.25)
            });
        }
    } else { // Todo (All Time - Simulated 2 Years)
        for (let i = 8; i >= 0; i--) {
            const date = new Date(now);
            date.setMonth(date.getMonth() - (i * 3));
            points.push({
                label: i === 0 ? 'Hoje' : date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
                value: i === 0 ? balance : getHistoricalValue(balance, i * 90, 0.40)
            });
        }
    }
    return points;
  }, [timeframe, totalBalance]);

  const maxValue = Math.max(...chartData.map(d => d.value));
  const minValue = Math.min(...chartData.map(d => d.value));
  const range = maxValue - minValue || 1; // Avoid divide by zero
  
  // Calculate points for SVG
  const getPoints = () => {
    return chartData.map((point, index) => {
      const x = (index / (chartData.length - 1)) * 100;
      // Normalize value between 0 and 100, flip Y axis (100 is bottom)
      const y = 100 - ((point.value - minValue) / range) * 80 - 10; 
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="animate-entry space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white">Performance</h2>
                <p className="text-gray-400 text-sm md:text-base">Visão detalhada dos seus investimentos.</p>
            </div>
            
            {/* Mobile-friendly controls */}
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                {/* Timeframe Selector - Scrollable on mobile */}
                <div className="flex overflow-x-auto pb-2 sm:pb-0 no-scrollbar -mx-6 px-6 sm:mx-0 sm:px-0 gap-2 sm:gap-0 sm:bg-[#0a0a0a] sm:border sm:border-white/10 sm:rounded-lg sm:p-1">
                    {['1S', '1M', '3M', '6M', '1A', 'Todo'].map(t => (
                        <button 
                            key={t}
                            onClick={() => setTimeframe(t)}
                            className={`px-4 sm:px-3 py-2 sm:py-1.5 text-xs font-medium rounded-full sm:rounded-md transition-all whitespace-nowrap flex-shrink-0 ${
                                timeframe === t 
                                ? 'bg-blue-600 sm:bg-white/10 text-white shadow-sm' 
                                : 'bg-white/5 sm:bg-transparent text-gray-400 hover:text-gray-200'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={handleDownloadReport}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                >
                    <Download className="w-4 h-4" /> 
                    <span>Relatório</span>
                </button>
            </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 md:p-8 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none"></div>
        
        {/* Header inside chart */}
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 md:mb-10">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-gray-400">Saldo Total Estimado</p>
                    <div className="group relative">
                        <Activity className="w-3 h-3 text-gray-600 cursor-help" />
                    </div>
                </div>
                
                {loading && !refreshing ? (
                  <div className="h-12 w-48 bg-white/5 rounded animate-pulse mb-3"></div>
                ) : (
                  <h3 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-3">
                    {formatCurrency(totalBalance)}
                  </h3>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                    <span className={`bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-lg text-sm font-bold flex items-center gap-1.5 ${totalProfit < 0 ? 'text-red-400 bg-red-500/10 border-red-500/20' : ''}`}>
                        {totalProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {formatCurrency(totalProfit)} ({totalProfitPercent.toFixed(1)}%)
                    </span>
                    <span className="text-sm text-gray-500">total acumulado</span>
                </div>
            </div>
            
            {/* Key Metrics - Scrollable on very small screens */}
            <div className="flex gap-6 md:gap-12 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
                <div className="flex-shrink-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Investido</p>
                    <p className="text-lg md:text-xl font-bold text-white">
                        {loading ? '...' : formatCurrency(totalInvested)}
                    </p>
                </div>
                <div className="flex-shrink-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Dividendos</p>
                    <p className="text-lg md:text-xl font-bold text-white">
                       R$ 0,00
                    </p>
                </div>
                <div className="flex-shrink-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ativos</p>
                    <p className="text-lg md:text-xl font-bold text-purple-400">
                        {investments.length}
                    </p>
                </div>
            </div>
        </div>

        {/* CSS/SVG Chart */}
        <div className="relative h-[250px] md:h-[300px] w-full z-10 touch-none">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                
                {/* Grid Lines */}
                <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.05)" strokeDasharray="2" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="2" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.05)" strokeDasharray="2" vectorEffect="non-scaling-stroke" />

                {/* Area */}
                <path 
                    d={`M0,100 L0,${100 - ((chartData[0].value - minValue) / range) * 80 - 10} ${getPoints().split(' ').map(p => `L${p}`).join(' ')} L100,100 Z`} 
                    fill="url(#chartGradient)" 
                    stroke="none"
                />

                {/* Line */}
                <polyline 
                    points={getPoints()} 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="2" 
                    vectorEffect="non-scaling-stroke"
                    filter="url(#glow)"
                    className="transition-all duration-500"
                />

                {/* Interactive Points */}
                {chartData.map((point, index) => {
                    const x = (index / (chartData.length - 1)) * 100;
                    const y = 100 - ((point.value - minValue) / range) * 80 - 10;
                    const isHovered = hoveredPoint === index;
                    
                    return (
                        <g 
                            key={index} 
                            className="group" 
                            onMouseEnter={() => setHoveredPoint(index)} 
                            onMouseLeave={() => setHoveredPoint(null)}
                            onClick={() => setHoveredPoint(isHovered ? null : index)}
                        >
                            {/* Larger invisible hit area for touch */}
                            <circle cx={`${x}%`} cy={`${y}%`} r="12" fill="transparent" className="cursor-pointer" />
                            
                            {/* Visible Dot */}
                            <circle 
                                cx={`${x}%`} 
                                cy={`${y}%`} 
                                r={isHovered ? 6 : 3}
                                className={`transition-all duration-300 cursor-pointer ${isHovered ? 'fill-blue-500 stroke-white stroke-2' : 'fill-blue-500 stroke-transparent stroke-0'}`} 
                            />
                            
                            {/* Tooltip */}
                            <g className={`transition-opacity duration-200 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                                <rect 
                                    x={x > 80 ? `${x - 25}%` : x < 20 ? `${x}%` : `${x - 12.5}%`} 
                                    y={`${y - 18}%`} 
                                    width="25%" 
                                    height="12%" 
                                    rx="4"
                                    fill="#1e293b"
                                    className="stroke-white/10"
                                />
                                <text 
                                    x={x > 80 ? `${x - 12.5}%` : x < 20 ? `${x + 12.5}%` : `${x}%`} 
                                    y={`${y - 10}%`} 
                                    textAnchor="middle" 
                                    fill="white" 
                                    fontSize="3.5"
                                    fontWeight="bold"
                                >
                                    {formatCurrency(point.value)}
                                </text>
                            </g>
                        </g>
                    );
                })}
            </svg>
            
            {/* X Axis Labels */}
            <div className="flex justify-between mt-4 text-[10px] md:text-xs text-gray-500 font-mono px-1">
                {chartData.map((d, i) => (
                    // Only show some labels to avoid crowding
                    (chartData.length > 7 && i % 2 !== 0 && i !== chartData.length - 1) ? null :
                    <span key={i}>{d.label}</span>
                ))}
            </div>
        </div>
      </div>

      {/* Smart Investments Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Investimentos Ativos
            </h3>
            <button 
                onClick={onNavigateToMarketplace}
                className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors group self-start md:self-auto"
            >
                Ver Marketplace <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
        </div>
        
        {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-red-400 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
                <button 
                    onClick={fetchInvestments}
                    disabled={refreshing}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Carregando...' : 'Tentar Novamente'}
                </button>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
            
            {loading && !refreshing ? (
                // Loading Skeletons
                [1, 2, 3].map(i => (
                    <div key={i} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 h-64 animate-pulse flex flex-col justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/5 rounded-xl"></div>
                            <div className="space-y-2">
                                <div className="w-32 h-4 bg-white/5 rounded"></div>
                                <div className="w-20 h-3 bg-white/5 rounded"></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="h-16 bg-white/5 rounded-lg"></div>
                             <div className="h-16 bg-white/5 rounded-lg"></div>
                        </div>
                        <div className="h-10 bg-white/5 rounded-lg"></div>
                    </div>
                ))
            ) : (
                investments.map((portfolio) => {
                    const styles = getThemeStyles(portfolio.color_theme);
                    return (
                        <div 
                            key={portfolio.id} 
                            className={`bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 md:p-6 hover:border-blue-500/30 transition-all duration-300 group hover:-translate-y-1 flex flex-col relative overflow-hidden`}
                        >
                            {/* Subtle Background Gradient based on type */}
                            <div className={`absolute top-0 right-0 w-32 h-32 ${styles.bg} blur-[60px] rounded-full -mr-10 -mt-10 pointer-events-none opacity-50`}></div>

                            {/* Header */}
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${styles.bg} ${styles.color} group-hover:scale-110 transition-transform`}>
                                        {styles.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">{portfolio.name}</h4>
                                        <span className="text-xs text-gray-400 px-2 py-0.5 rounded border border-white/10 bg-black/20 backdrop-blur-sm">{portfolio.type}</span>
                                    </div>
                                </div>
                                <button className="text-gray-500 hover:text-white transition-colors p-1">
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                    <p className="text-xs text-gray-400 mb-1">Saldo Atual</p>
                                    <p className="text-base md:text-lg font-bold text-white">{formatCurrency(portfolio.balance)}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                    <p className="text-xs text-gray-400 mb-1">Retorno Total</p>
                                    <p className={`text-base md:text-lg font-bold ${portfolio.total_return_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {portfolio.total_return_percent > 0 ? '+' : ''}{portfolio.total_return_percent}%
                                    </p>
                                </div>
                            </div>

                            {/* Footer / Progress */}
                            <div className="mt-auto relative z-10">
                                <div className="flex justify-between text-xs text-gray-400 mb-2">
                                    <span>Diário: <span className={portfolio.daily_return_percent >= 0 ? "text-green-400" : "text-red-400"}>
                                        {portfolio.daily_return_percent > 0 ? '+' : ''}{portfolio.daily_return_percent}%
                                    </span></span>
                                    <span>Risco {portfolio.risk_level}</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                    {/* Randomizing progress bar width slightly for visual effect based on ID */}
                                    <div className={`h-full ${styles.progressBg} rounded-full`} style={{ width: `${Math.min((portfolio.balance / (portfolio.initial_investment * 1.5)) * 100, 100)}%` }}></div>
                                </div>
                                <div className="mt-4 flex gap-3">
                                    <button className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-colors active:scale-95">
                                        Detalhes
                                    </button>
                                    <button className="flex-1 py-3 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/20 hover:border-blue-600/40 rounded-lg text-sm font-medium text-blue-400 transition-colors flex items-center justify-center gap-2 active:scale-95">
                                        <PlusCircle className="w-4 h-4" /> Aportar
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}

            {/* Add New Card - Always Visible */}
            {!loading && (
                <div 
                    onClick={onNavigateToMarketplace}
                    className="bg-[#0a0a0a] border border-dashed border-white/10 rounded-2xl p-6 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300 group cursor-pointer flex flex-col items-center justify-center min-h-[180px] md:min-h-[300px] active:scale-[0.99]"
                >
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-all text-gray-500">
                        <PlusCircle className="w-8 h-8" />
                    </div>
                    <h4 className="font-bold text-lg text-white mb-2">Novo Investimento</h4>
                    <p className="text-center text-sm text-gray-500 max-w-[200px]">
                        Explore nosso marketplace e encontre novas oportunidades.
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};