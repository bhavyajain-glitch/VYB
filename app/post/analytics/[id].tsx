import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, BarChart2, Heart, MessageCircle, Share2, Bookmark, Eye, Clock, TrendingUp } from 'lucide-react-native';
import { authAPI } from '../../../services/api';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface AnalyticsData {
    summary: {
        views: number;
        likes: number;
        comments: number;
        shares: number;
        saves: number;
        watchTime: number;
        completionRate: number;
    };
    breakdown: Record<string, number>;
    dailyViews: Array<{ date: string; views: number }>;
}

export default function AnalyticsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAnalytics();
    }, [id]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const res = await authAPI.getPostAnalytics(id as string);
            setData(res.data);
        } catch (err: any) {
            console.error('Failed to fetch analytics:', err);
            setError(err.message || 'Failed to load insights');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    if (error || !data) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error || 'Something went wrong'}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={fetchAnalytics}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const chartData = {
        labels: data.dailyViews.map(d => d.date.split('-')[2]), // Just the day
        datasets: [
            {
                data: data.dailyViews.map(d => d.views),
                color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                strokeWidth: 3
            }
        ]
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Post Insights</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Hero Section */}
                <LinearGradient
                    colors={['#4F46E5', '#6366F1']}
                    style={styles.heroCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View>
                        <Text style={styles.heroLabel}>Total Reach</Text>
                        <Text style={styles.heroValue}>{data.summary.views.toLocaleString()}</Text>
                    </View>
                    <View style={styles.heroIconContainer}>
                        <TrendingUp size={32} color="white" opacity={0.8} />
                    </View>
                </LinearGradient>

                {/* Primary Metrics Grid */}
                <View style={styles.metricsGrid}>
                    <MetricCard icon={<Heart size={18} color="#EF4444" />} label="Likes" value={data.summary.likes} />
                    <MetricCard icon={<MessageCircle size={18} color="#10B981" />} label="Comments" value={data.summary.comments} />
                    <MetricCard icon={<Bookmark size={18} color="#8B5CF6" />} label="Saves" value={data.summary.saves} />
                    <MetricCard icon={<Share2 size={18} color="#3B82F6" />} label="Shares" value={data.summary.shares} />
                </View>

                {/* Chart Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Eye size={20} color="#111827" />
                        <Text style={styles.sectionTitle}>Views (Last 7 Days)</Text>
                    </View>

                    <View style={styles.chartContainer}>
                        <LineChart
                            data={chartData}
                            width={SCREEN_WIDTH - 48}
                            height={220}
                            chartConfig={{
                                backgroundColor: '#ffffff',
                                backgroundGradientFrom: '#ffffff',
                                backgroundGradientTo: '#ffffff',
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                                style: { borderRadius: 16 },
                                propsForDots: { r: '4', strokeWidth: '2', stroke: '#4F46E5' },
                                propsForBackgroundLines: { strokeDasharray: '', stroke: '#F3F4F6' }
                            }}
                            bezier
                            style={styles.chart}
                        />
                    </View>
                </View>

                {/* Engagement Quality */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <BarChart2 size={20} color="#111827" />
                        <Text style={styles.sectionTitle}>Performance Breakdown</Text>
                    </View>

                    <View style={styles.detailList}>
                        <DetailItem
                            label="Engagement Rate"
                            value={`${((data.summary.likes + data.summary.comments + data.summary.saves) / (data.summary.views || 1) * 100).toFixed(1)}%`}
                            subtext="Interaction per view"
                        />
                        {data.summary.watchTime > 0 && (
                            <>
                                <DetailItem
                                    label="Total Watch Time"
                                    value={`${Math.floor(data.summary.watchTime / 60)}m ${Math.floor(data.summary.watchTime % 60)}s`}
                                    subtext="Cumulative attention"
                                />
                                <DetailItem
                                    label="Avg. Completion"
                                    value={`${(data.summary.completionRate * 100).toFixed(1)}%`}
                                    subtext="Retention quality"
                                />
                            </>
                        )}
                        <DetailItem
                            label="Viral Coefficient"
                            value={`${(data.summary.shares / (data.summary.views || 1) * 10).toFixed(2)}`}
                            subtext="Sharing velocity"
                        />
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Insights help you understand what your audience loves. High saves and shares are strong signals of content quality.</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) {
    return (
        <View style={styles.metricCard}>
            <View style={styles.metricIcon}>{icon}</View>
            <Text style={styles.metricValue}>{value.toLocaleString()}</Text>
            <Text style={styles.metricLabel}>{label}</Text>
        </View>
    );
}

function DetailItem({ label, value, subtext }: { label: string, value: string, subtext: string }) {
    return (
        <View style={styles.detailItem}>
            <View>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailSubtext}>{subtext}</Text>
            </View>
            <Text style={styles.detailValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
    },
    backBtn: {
        padding: 8,
        borderRadius: 12,
    },
    scrollContent: {
        padding: 20,
    },
    heroCard: {
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
    },
    heroLabel: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    heroValue: {
        color: 'white',
        fontSize: 32,
        fontWeight: '900',
    },
    heroIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
    },
    metricCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    metricIcon: {
        marginBottom: 8,
    },
    metricValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    metricLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        marginTop: 2,
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    chartContainer: {
        alignItems: 'center',
    },
    chart: {
        borderRadius: 16,
        marginVertical: 8,
    },
    detailList: {
        gap: 16,
    },
    detailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
    },
    detailSubtext: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#4F46E5',
    },
    errorText: {
        color: '#EF4444',
        fontSize: 16,
        marginBottom: 16,
    },
    retryBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#4F46E5',
        borderRadius: 12,
    },
    retryText: {
        color: 'white',
        fontWeight: '700',
    },
    footer: {
        marginBottom: 40,
        paddingHorizontal: 12,
    },
    footerText: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 18,
        fontStyle: 'italic',
    }
});
