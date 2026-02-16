import { useState } from 'react';
import { useFinancialMetrics } from '../hooks/useMetrics';
import { Card } from '../components/ui';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { AdviceItem, FinancialMetricsResponse } from '../types';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
}

// ============================================================
// Advice Banner
// ============================================================
function AdviceBanner({ advice }: { advice: AdviceItem[] }) {
    if (!advice || advice.length === 0) return null;

    const typeStyles = {
        warning: 'bg-red-50 border-red-200 text-red-800',
        tip: 'bg-amber-50 border-amber-200 text-amber-800',
        positive: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    };

    const typeIcons = {
        warning: '⚠️',
        tip: '💡',
        positive: '✅',
    };

    return (
        <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="text-xl">📋</span> Financial Advice & Suggestions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {advice.map((item, idx) => (
                    <div
                        key={idx}
                        className={`p-3 rounded-lg border ${typeStyles[item.type]} text-sm flex items-start gap-2`}
                    >
                        <span className="text-base flex-shrink-0 mt-0.5">{typeIcons[item.type]}</span>
                        <div>
                            <span className="font-medium capitalize">{item.category}</span>
                            <p className="mt-0.5">{item.message}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================================
// Health Score
// ============================================================
function HealthScoreCard({ data }: { data: FinancialMetricsResponse['financial_health_score'] }) {
    const gradeColors: Record<string, string> = {
        'Excellent': 'text-emerald-600',
        'Good': 'text-blue-600',
        'Fair': 'text-amber-600',
        'Needs Improvement': 'text-red-600',
    };

    const scoreColor = data.total_score >= 80 ? '#10B981' : data.total_score >= 60 ? '#3B82F6' : data.total_score >= 40 ? '#F59E0B' : '#EF4444';

    const breakdownItems = [
        { label: 'Savings Rate', key: 'savings_rate' as const, unit: '%' },
        { label: 'Debt-to-Income', key: 'debt_to_income' as const, unit: '%' },
        { label: 'Emergency Fund', key: 'emergency_fund' as const, unit: ' months' },
        { label: 'Credit Utilization', key: 'credit_utilization' as const, unit: '%' },
        { label: 'Investment Rate', key: 'investment_rate' as const, unit: '%' },
    ];

    return (
        <Card>
            <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-xl">🏥</span> Financial Health Score
                </h3>
                <div className="flex items-center gap-8 mb-6">
                    <div className="relative w-32 h-32 flex-shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <circle cx="50" cy="50" r="42" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                            <circle cx="50" cy="50" r="42" stroke={scoreColor} strokeWidth="8" fill="none"
                                strokeDasharray={`${data.total_score * 2.64} 264`}
                                strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold" style={{ color: scoreColor }}>{data.total_score}</span>
                            <span className="text-xs text-gray-500">/ 100</span>
                        </div>
                    </div>
                    <div>
                        <p className={`text-2xl font-bold ${gradeColors[data.grade] || 'text-gray-700'}`}>{data.grade}</p>
                        <p className="text-sm text-gray-500 mt-1">Based on 5 key financial indicators</p>
                    </div>
                </div>
                <div className="space-y-3">
                    {breakdownItems.map(({ label, key, unit }) => {
                        const item = data.breakdown[key];
                        return (
                            <div key={key}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">{label} ({item.weight}%)</span>
                                    <span className="font-medium">
                                        {item.value}{unit} <span className="text-gray-400">/ {item.target}{unit}</span>
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(100, item.score)}%`,
                                            backgroundColor: item.score >= 80 ? '#10B981' : item.score >= 50 ? '#F59E0B' : '#EF4444',
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Card>
    );
}

// ============================================================
// Spending Habits
// ============================================================
function SpendingHabitsCard({ data }: { data: FinancialMetricsResponse['spending_habits'] }) {
    return (
        <Card>
            <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-xl">💸</span> Spending Habits
                </h3>

                {/* Key stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Daily Avg</p>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(data.avg_daily_spend)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Monthly Avg</p>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(data.avg_monthly_spend)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">MoM Change</p>
                        <p className={`text-lg font-bold ${data.mom_change !== null && data.mom_change > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {data.mom_change !== null ? `${data.mom_change > 0 ? '+' : ''}${data.mom_change.toFixed(1)}%` : 'N/A'}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Peak Day</p>
                        <p className="text-lg font-bold text-gray-900">{data.highest_spending_day?.day || 'N/A'}</p>
                    </div>
                </div>

                {/* Day of week chart */}
                {data.spending_by_day.length > 0 && (
                    <div className="mb-6">
                        <p className="text-sm font-medium text-gray-600 mb-2">Spending by Day of Week</p>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={data.spending_by_day}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={(v) => v.substring(0, 3)} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                    {data.spending_by_day.map((entry, idx) => (
                                        <Cell key={idx} fill={entry.day_of_week === 0 || entry.day_of_week === 6 ? '#F59E0B' : '#3B82F6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Weekend vs Weekday */}
                <div className="flex gap-3 mb-4">
                    <div className="flex-1 rounded-lg p-3 bg-blue-50 border border-blue-100 text-center">
                        <p className="text-xs text-blue-600 uppercase tracking-wider">Weekday</p>
                        <p className="text-lg font-bold text-blue-800">{formatCurrency(data.weekday_spend)}</p>
                    </div>
                    <div className="flex-1 rounded-lg p-3 bg-amber-50 border border-amber-100 text-center">
                        <p className="text-xs text-amber-600 uppercase tracking-wider">Weekend</p>
                        <p className="text-lg font-bold text-amber-800">{formatCurrency(data.weekend_spend)}</p>
                    </div>
                </div>

                {/* Top categories */}
                {data.top_categories.length > 0 && (
                    <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Top Categories</p>
                        <div className="space-y-2">
                            {data.top_categories.map((cat, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                    <span className="text-sm text-gray-700 flex-1">{cat.category}</span>
                                    <span className="text-sm font-medium">{formatCurrency(cat.total)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}

// ============================================================
// Savings Tracker
// ============================================================
function SavingsTrackerCard({ data }: { data: FinancialMetricsResponse['savings_tracker'] }) {
    const trendEmoji = data.trend === 'improving' ? '📈' : data.trend === 'declining' ? '📉' : '➡️';
    const trendColor = data.trend === 'improving' ? 'text-emerald-600' : data.trend === 'declining' ? 'text-red-600' : 'text-gray-600';

    return (
        <Card>
            <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-xl">🐷</span> Savings Tracker
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-emerald-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-emerald-600 uppercase tracking-wider">Savings Rate</p>
                        <p className="text-xl font-bold text-emerald-800">{formatPercent(data.current_savings_rate)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Avg Rate</p>
                        <p className="text-xl font-bold text-gray-900">{formatPercent(data.avg_savings_rate)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Trend</p>
                        <p className={`text-xl font-bold capitalize ${trendColor}`}>{trendEmoji} {data.trend}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Monthly Savings</p>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(data.avg_monthly_savings)}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-blue-600 uppercase tracking-wider">Projected Annual</p>
                        <p className="text-lg font-bold text-blue-800">{formatCurrency(data.projected_annual_savings)}</p>
                    </div>
                </div>

                {data.monthly_data.length > 0 && (
                    <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Savings Rate Trend</p>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={data.monthly_data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => v.substring(5)} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                                <Tooltip formatter={(value: any, name: any) => name === 'savings_rate' ? `${value}%` : formatCurrency(Number(value))} />
                                <Line type="monotone" dataKey="savings_rate" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} name="Savings Rate" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </Card>
    );
}

// ============================================================
// Emergency Fund
// ============================================================
function EmergencyFundCard({ data }: { data: FinancialMetricsResponse['emergency_fund'] }) {
    const progress = Math.min(100, (data.months_of_coverage / 6) * 100);
    const statusColors = { healthy: '#10B981', building: '#F59E0B', critical: '#EF4444' };

    return (
        <Card>
            <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-xl">🛟</span> Emergency Fund
                </h3>

                <div className="flex items-end gap-2 mb-4">
                    <span className="text-3xl font-bold" style={{ color: statusColors[data.status] }}>
                        {data.months_of_coverage.toFixed(1)}
                    </span>
                    <span className="text-gray-500 mb-1">months of coverage</span>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>0</span>
                        <span>Target: 6 months</span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${progress}%`, backgroundColor: statusColors[data.status] }}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Current Fund</p>
                        <p className="text-sm font-bold">{formatCurrency(data.current_fund)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Bank: {formatCurrency(data.account_balance)} | Investments: {formatCurrency(data.emergency_investments)}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Target ({formatCurrency(data.avg_monthly_expenses)}/mo × 6)</p>
                        <p className="text-sm font-bold">{formatCurrency(data.target)}</p>
                        {data.gap > 0 && <p className="text-xs text-red-500 mt-0.5">Gap: {formatCurrency(data.gap)}</p>}
                    </div>
                </div>
            </div>
        </Card>
    );
}

// ============================================================
// Debt-to-Income
// ============================================================
function DebtToIncomeCard({ data }: { data: FinancialMetricsResponse['debt_to_income'] }) {
    const statusColors: Record<string, string> = { healthy: '#10B981', manageable: '#3B82F6', high: '#F59E0B', critical: '#EF4444' };
    const statusLabels: Record<string, string> = { healthy: '✅ Healthy', manageable: '🟡 Manageable', high: '⚠️ High', critical: '🔴 Critical' };
    const color = statusColors[data.status] || '#6B7280';

    return (
        <Card>
            <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-xl">📊</span> Debt-to-Income Ratio
                </h3>

                <div className="flex items-center gap-6 mb-6">
                    <div className="relative w-28 h-28 flex-shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <circle cx="50" cy="50" r="42" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                            <circle cx="50" cy="50" r="42" stroke={color} strokeWidth="8" fill="none"
                                strokeDasharray={`${Math.min(100, data.dti_ratio) * 2.64} 264`}
                                strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold" style={{ color }}>{data.dti_ratio.toFixed(1)}%</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-lg font-semibold" style={{ color }}>{statusLabels[data.status] || data.status}</p>
                        <p className="text-sm text-gray-500 mt-1">Target: ≤20%</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Monthly Debt</p>
                        <p className="text-sm font-bold">{formatCurrency(data.total_monthly_debt)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Loans: {formatCurrency(data.loan_payments)} | CC: {formatCurrency(data.credit_card_min_payments)}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Avg Monthly Income</p>
                        <p className="text-sm font-bold">{formatCurrency(data.avg_monthly_income)}</p>
                    </div>
                </div>
            </div>
        </Card>
    );
}

// ============================================================
// Retirement Planner
// ============================================================
function RetirementPlannerCard({ data }: { data: FinancialMetricsResponse['retirement_planning'] }) {
    if (!data.current_age) {
        return (
            <Card>
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-xl">🏖️</span> Retirement Planning
                    </h3>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                        <p className="font-medium">Set up your profile first</p>
                        <p className="mt-1">Please add your age/date of birth in your Profile page and configure financial preferences to see retirement projections.</p>
                    </div>
                </div>
            </Card>
        );
    }

    const readinessColor = data.retirement_readiness >= 75 ? '#10B981' : data.retirement_readiness >= 50 ? '#3B82F6' : data.retirement_readiness >= 25 ? '#F59E0B' : '#EF4444';

    // Chart data for corpus projection
    const chartData = [];
    if (data.years_to_retirement > 0 && data.current_corpus > 0) {
        const annualReturn = (data.expected_annual_return || 8) / 100;
        for (let y = 0; y <= data.years_to_retirement; y += Math.max(1, Math.floor(data.years_to_retirement / 10))) {
            chartData.push({
                year: `Age ${data.current_age + y}`,
                corpus: Math.round(data.current_corpus * Math.pow(1 + annualReturn, y)),
            });
        }
        // Always include retirement age
        if (chartData[chartData.length - 1]?.year !== `Age ${data.retirement_age}`) {
            chartData.push({
                year: `Age ${data.retirement_age}`,
                corpus: Math.round(data.projected_corpus),
            });
        }
    }

    return (
        <Card>
            <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-xl">🏖️</span> Retirement Planning
                    {!data.configured && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Using defaults</span>}
                </h3>

                {/* Readiness gauge */}
                <div className="flex items-center gap-6 mb-6">
                    <div className="relative w-28 h-28 flex-shrink-0">
                        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <circle cx="50" cy="50" r="42" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                            <circle cx="50" cy="50" r="42" stroke={readinessColor} strokeWidth="8" fill="none"
                                strokeDasharray={`${data.retirement_readiness * 2.64} 264`}
                                strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-bold" style={{ color: readinessColor }}>{data.retirement_readiness.toFixed(0)}%</span>
                            <span className="text-xs text-gray-500">Ready</span>
                        </div>
                    </div>
                    <div className="space-y-1 text-sm">
                        <p><span className="text-gray-500">Age:</span> <span className="font-medium">{data.current_age}</span> → <span className="font-medium">{data.retirement_age}</span> ({data.years_to_retirement} years)</p>
                        <p><span className="text-gray-500">Monthly Expense:</span> <span className="font-medium">{formatCurrency(data.monthly_retirement_expense || 0)}</span></p>
                        <p><span className="text-gray-500">Returns:</span> <span className="font-medium">{data.expected_annual_return}%</span> | <span className="text-gray-500">Inflation:</span> <span className="font-medium">{data.expected_inflation_rate}%</span></p>
                    </div>
                </div>

                {/* Corpus comparison */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500">Current Corpus</p>
                        <p className="text-sm font-bold">{formatCurrency(data.current_corpus)}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-blue-600">Projected</p>
                        <p className="text-sm font-bold text-blue-800">{formatCurrency(data.projected_corpus)}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-emerald-600">Required</p>
                        <p className="text-sm font-bold text-emerald-800">{formatCurrency(data.required_corpus)}</p>
                    </div>
                </div>

                {data.monthly_investment_needed > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 mb-4">
                        💡 Invest <strong>{formatCurrency(data.monthly_investment_needed)}/month</strong> additionally to close the gap of {formatCurrency(data.gap || 0)}.
                    </div>
                )}

                {/* Corpus growth chart */}
                {chartData.length > 1 && (
                    <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Projected Corpus Growth</p>
                        <ResponsiveContainer width="100%" height={180}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                                <Line type="monotone" dataKey="corpus" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                <p className="text-xs text-gray-400 mt-2 italic">
                    * Projections use invested amounts with {data.expected_annual_return}% expected annual returns. Actual returns may vary.
                </p>
            </div>
        </Card>
    );
}

// ============================================================
// Expense Forecast
// ============================================================
function ExpenseForecastCard({ data }: { data: FinancialMetricsResponse['expense_forecast'] }) {
    const chartData = [
        ...data.historical.map(h => ({ month: h.month.substring(5), total: h.total, type: 'actual' })),
        { month: 'Next', total: data.projected_next_month, type: 'forecast' },
    ];

    return (
        <Card>
            <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-xl">🔮</span> Expense Forecast
                </h3>

                <div className="bg-blue-50 rounded-lg p-4 mb-6 text-center">
                    <p className="text-xs text-blue-600 uppercase tracking-wider">Projected Next Month</p>
                    <p className="text-2xl font-bold text-blue-800">{formatCurrency(data.projected_next_month)}</p>
                    <p className="text-xs text-gray-500 mt-1">Based on trend analysis of historical data</p>
                </div>

                {chartData.length > 1 && (
                    <div className="mb-6">
                        <p className="text-sm font-medium text-gray-600 mb-2">Spending Trend & Forecast</p>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                                    {chartData.map((entry, idx) => (
                                        <Cell key={idx} fill={entry.type === 'forecast' ? '#93C5FD' : '#3B82F6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* Category projections */}
                {data.category_projections.length > 0 && (
                    <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Category-wise Monthly Averages</p>
                        <div className="space-y-2">
                            {data.category_projections.slice(0, 5).map((cat, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                    <span className="text-sm text-gray-700 flex-1">{cat.category}</span>
                                    <span className="text-sm font-medium">{formatCurrency(cat.avg_monthly)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}

// ============================================================
// Main Page
// ============================================================
export function Metrics() {
    const [months, setMonths] = useState(6);
    const { data, isLoading, error } = useFinancialMetrics(months);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
                    <p className="text-gray-500">Analyzing your finances...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                <p className="font-medium">Failed to load metrics</p>
                <p className="text-sm mt-1">Please try again later or check your connection.</p>
            </div>
        );
    }

    if (!data) return null;

    const metrics: FinancialMetricsResponse = data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Financial Metrics</h1>
                    <p className="text-gray-500 mt-1">Insights and advice based on your financial data</p>
                </div>
                <select
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value={3}>Last 3 months</option>
                    <option value={6}>Last 6 months</option>
                    <option value={12}>Last 12 months</option>
                    <option value={24}>Last 24 months</option>
                </select>
            </div>

            {/* Advice Banner */}
            <AdviceBanner advice={metrics.advice} />

            {/* Health Score + DTI */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HealthScoreCard data={metrics.financial_health_score} />
                <DebtToIncomeCard data={metrics.debt_to_income} />
            </div>

            {/* Spending + Savings */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SpendingHabitsCard data={metrics.spending_habits} />
                <SavingsTrackerCard data={metrics.savings_tracker} />
            </div>

            {/* Emergency Fund + Forecast */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EmergencyFundCard data={metrics.emergency_fund} />
                <ExpenseForecastCard data={metrics.expense_forecast} />
            </div>

            {/* Retirement Planner (full width) */}
            <RetirementPlannerCard data={metrics.retirement_planning} />
        </div>
    );
}
