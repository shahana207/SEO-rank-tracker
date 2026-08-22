import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
    ArrowLeft,
    Target,
    Globe,
    Clock,
    TrendingUp,
    TrendingDown,
    Minus,
    RefreshCw,
    AlertCircle,
    ExternalLink,
    Trophy,
    Users,
    Calendar,
    Loader2,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";

interface RankHistoryEntry {
    date: string;
    position: number | null;
    page: number | null;
    title: string;
    snippet: string;
}

interface Competitor {
    position: number;
    url: string;
    domain: string;
    title: string;
    snippet: string;
}

interface TrackingData {
    _id: string;
    keyword: string;
    url: string;
    domain: string;
    currentPosition: number | null;
    currentPage: number | null;
    bestPosition: number | null;
    positionChange: number;
    rankHistory: RankHistoryEntry[];
    competitors: Competitor[];
    active: boolean;
    lastChecked: string | null;
    status: string;
    createdAt: string;
}

export default function RankDetail() {
    const { api } = useAppContext();
    const { id } = useParams<{ id: string }>();

    const [tracking, setTracking] = useState<TrackingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState("overview");
    const [error, setError] = useState("");

    const chartRef = useRef<HTMLCanvasElement>(null);

    // =========================================================
    // FETCH TRACKING DATA
    // =========================================================

const fetchTracking = async () => {
    try {
        setLoading(true);
        setError("");

        console.log("Fetching tracking ID:", id);

        const response = await api.get(`/rank/keywords/${id}`);

        console.log("Tracking response:", response.data);

        if (response.data.success && response.data.tracking) {
            setTracking(response.data.tracking);
        } else {
            setTracking(null);
            setError(
                response.data.message ||
                "Tracking record was not found."
            );
        }
    } catch (error: any) {
        console.error(
            "Fetch tracking error:",
            error.response?.data || error
        );

        setTracking(null);

        setError(
            error.response?.data?.message ||
            "Failed to fetch tracking details."
        );
    } finally {
        setLoading(false);
    }
};

    // =========================================================
    // REFRESH RANKING
    // =========================================================

    const handleRefresh = async () => {
        if (!tracking || !id || refreshing) {
            return;
        }

        try {
            setRefreshing(true);
            setError("");

           const res = await api.post(
    `/api/rank/keywords/${id}/refresh`
);

            if (res.data?.success && res.data?.tracking) {
                // Backend will normally return status = checking
                setTracking(res.data.tracking);

                // Poll backend until checking is finished
                const pollInterval = setInterval(async () => {
                    try {
                        const check = await api.get(
                            `/rank/keywords/${id}`
                        );

                        if (
                            check.data?.success &&
                            check.data?.tracking
                        ) {
                            const updatedTracking =
                                check.data.tracking;

                            setTracking(updatedTracking);

                            if (
                                updatedTracking.status !==
                                "checking"
                            ) {
                                clearInterval(pollInterval);
                                setRefreshing(false);
                            }
                        }
                    } catch (error) {
                        console.error(
                            "Refresh status error:",
                            error
                        );

                        clearInterval(pollInterval);
                        setRefreshing(false);
                    }
                }, 3000);

                // Safety timeout after 2 minutes
                setTimeout(() => {
                    clearInterval(pollInterval);
                    setRefreshing(false);
                }, 120000);
            } else {
                setRefreshing(false);

                setError(
                    res.data?.message ||
                        "Failed to refresh ranking."
                );
            }
        } catch (error: any) {
            console.error(
                "Refresh ranking error:",
                error
            );

            setRefreshing(false);

            setError(
                error.response?.data?.message ||
                    "Failed to refresh ranking."
            );
        }
    };

    // =========================================================
    // DRAW CHART
    // =========================================================

    const drawChart = () => {
        const canvas = chartRef.current;

        if (!canvas || !tracking) {
            return;
        }

        const ctx = canvas.getContext("2d");

        if (!ctx) {
            return;
        }

        const history = tracking.rankHistory
            .filter((item) => item.position !== null)
            .sort(
                (a, b) =>
                    new Date(a.date).getTime() -
                    new Date(b.date).getTime()
            );

        if (history.length === 0) {
            return;
        }

        const dpr = window.devicePixelRatio || 1;

        const rect = canvas.getBoundingClientRect();

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const w = rect.width;
        const h = rect.height;

        const padding = {
            top: 30,
            right: 30,
            bottom: 50,
            left: 50,
        };

        const chartW =
            w - padding.left - padding.right;

        const chartH =
            h - padding.top - padding.bottom;

        ctx.clearRect(0, 0, w, h);

        const positions = history.map(
            (item) => item.position!
        );

        const minPos = Math.max(
            1,
            Math.min(...positions) - 2
        );

        const maxPos =
            Math.max(...positions) + 2;

        // Theme colors
        const styles =
            getComputedStyle(
                document.documentElement
            );

        const borderColor =
            styles
                .getPropertyValue("--border")
                .trim() ||
            "rgba(128,128,128,0.2)";

        const primaryColor =
            styles
                .getPropertyValue("--accent")
                .trim() ||
            "#3b82f6";

        const textColor =
            styles
                .getPropertyValue(
                    "--muted-foreground"
                )
                .trim() ||
            "rgba(128,128,128,0.5)";

        const bgColor =
            styles
                .getPropertyValue("--background")
                .trim() ||
            "#ffffff";

        // =====================================================
        // GRID
        // =====================================================

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;

        const gridLines = 5;

        for (let i = 0; i <= gridLines; i++) {
            const y =
                padding.top +
                (chartH / gridLines) * i;

            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(
                w - padding.right,
                y
            );
            ctx.stroke();

            const posVal = Math.round(
                minPos +
                    ((maxPos - minPos) /
                        gridLines) *
                        i
            );

            ctx.fillStyle = textColor;
            ctx.font = "11px Outfit";
            ctx.textAlign = "right";

            ctx.fillText(
                `#${posVal}`,
                padding.left - 8,
                y + 4
            );
        }

        // =====================================================
        // DATE LABELS
        // =====================================================

        ctx.fillStyle = textColor;
        ctx.font = "10px Outfit";
        ctx.textAlign = "center";

        const maxLabels = Math.min(
            history.length,
            7
        );

        const labelStep = Math.max(
            1,
            Math.floor(
                history.length / maxLabels
            )
        );

        for (
            let i = 0;
            i < history.length;
            i += labelStep
        ) {
            const x =
                padding.left +
                (chartW /
                    Math.max(
                        history.length - 1,
                        1
                    )) *
                    i;

            const date = new Date(
                history[i].date
            );

            ctx.fillText(
                `${date.getMonth() + 1}/${date.getDate()}`,
                x,
                h - padding.bottom + 20
            );
        }

        // =====================================================
        // LINE
        // =====================================================

        ctx.beginPath();

        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        history.forEach((entry, i) => {
            const x =
                padding.left +
                (chartW /
                    Math.max(
                        history.length - 1,
                        1
                    )) *
                    i;

            const yNorm =
                (entry.position! -
                    minPos) /
                (maxPos - minPos);

            const y =
                padding.top +
                yNorm * chartH;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // =====================================================
        // GRADIENT
        // =====================================================

        const gradient =
            ctx.createLinearGradient(
                0,
                padding.top,
                0,
                h - padding.bottom
            );

        gradient.addColorStop(
            0,
            "rgba(59, 130, 246, 0.15)"
        );

        gradient.addColorStop(
            1,
            "rgba(59, 130, 246, 0)"
        );

        ctx.beginPath();

        history.forEach((entry, i) => {
            const x =
                padding.left +
                (chartW /
                    Math.max(
                        history.length - 1,
                        1
                    )) *
                    i;

            const yNorm =
                (entry.position! -
                    minPos) /
                (maxPos - minPos);

            const y =
                padding.top +
                yNorm * chartH;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.lineTo(
            padding.left + chartW,
            h - padding.bottom
        );

        ctx.lineTo(
            padding.left,
            h - padding.bottom
        );

        ctx.closePath();

        ctx.fillStyle = gradient;
        ctx.fill();

        // =====================================================
        // DOTS
        // =====================================================

        history.forEach((entry, i) => {
            const x =
                padding.left +
                (chartW /
                    Math.max(
                        history.length - 1,
                        1
                    )) *
                    i;

            const yNorm =
                (entry.position! -
                    minPos) /
                (maxPos - minPos);

            const y =
                padding.top +
                yNorm * chartH;

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                4,
                0,
                Math.PI * 2
            );

            ctx.fillStyle = primaryColor;
            ctx.fill();

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                2,
                0,
                Math.PI * 2
            );

            ctx.fillStyle = bgColor;
            ctx.fill();
        });

        // =====================================================
        // Y AXIS
        // =====================================================

        ctx.save();

        ctx.translate(12, h / 2);

        ctx.rotate(-Math.PI / 2);

        ctx.fillStyle = textColor;

        ctx.font = "11px Outfit";

        ctx.textAlign = "center";

        ctx.fillText(
            "Position",
            0,
            0
        );

        ctx.restore();
    };

    // =========================================================
    // CHANGE INDICATOR
    // =========================================================

    const getChangeIndicator = (
        change: number
    ) => {
        if (change > 0) {
            return {
                icon: (
                    <TrendingUp size={16} />
                ),
                text: `+${change}`,
                class: "text-emerald-500",
            };
        }

        if (change < 0) {
            return {
                icon: (
                    <TrendingDown size={16} />
                ),
                text: `${change}`,
                class: "text-danger",
            };
        }

        return {
            icon: <Minus size={16} />,
            text: "—",
            class: "text-muted-foreground",
        };
    };

    // =========================================================
    // POSITION COLOR
    // =========================================================

    const getPositionColor = (
        pos: number | null
    ) => {
        if (pos === null) {
            return "text-muted-foreground";
        }

        if (pos <= 3) {
            return "text-emerald-500";
        }

        if (pos <= 10) {
            return "text-primary";
        }

        if (pos <= 20) {
            return "text-accent";
        }

        return "text-danger";
    };

    // =========================================================
    // INITIAL LOAD
    // =========================================================

    useEffect(() => {
    if (!id) return;

    fetchTracking();
}, [id]);


useEffect(() => {
    if (!id || !tracking) return;

    if (tracking.status !== "checking") {
        return;
    }

    console.log(
        "Ranking is checking. Starting polling..."
    );

    const interval = setInterval(async () => {
        try {
            const response = await api.get(
                `/rank/keywords/${id}`
            );

            if (
                response.data?.success &&
                response.data?.tracking
            ) {
                const updatedTracking =
                    response.data.tracking;

                console.log(
                    "Ranking status:",
                    updatedTracking.status
                );

                setTracking(updatedTracking);

                if (
                    updatedTracking.status !==
                    "checking"
                ) {
                    clearInterval(interval);
                }
            }
        } catch (error) {
            console.error(
                "Polling ranking error:",
                error
            );

            clearInterval(interval);
        }
    }, 3000);

    return () => {
        clearInterval(interval);
    };
}, [id, tracking?.status]);
    // =========================================================
    // DRAW CHART
    // =========================================================

    useEffect(() => {
        if (
            tracking &&
            tracking.rankHistory?.length > 0 &&
            activeTab === "overview"
        ) {
            setTimeout(() => {
                drawChart();
            }, 100);
        }
    }, [tracking, activeTab]);

    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // =========================================================
    // NOT FOUND
    // =========================================================

    if (!tracking) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="text-center glass-strong rounded-2xl p-10">
                    <AlertCircle
                        size={48}
                        className="mx-auto text-danger mb-4"
                    />

                    <h2 className="text-xl font-bold text-foreground mb-2">
                        Tracking Not Found
                    </h2>

                    <p className="text-sm text-muted-foreground mb-5">
                        {error ||
                            "Unable to find this keyword tracking."}
                    </p>

                    <Link
                        to="/rank-tracker"
                        className="bg-primary px-5 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground inline-block"
                        style={{
                            color: "var(--background)",
                        }}
                    >
                        Back to Rank Tracker
                    </Link>
                </div>
            </div>
        );
    }

    const change = getChangeIndicator(
        tracking.positionChange || 0
    );

    const tabs = [
        {
            id: "overview",
            label: "Overview",
        },
        {
            id: "competitors",
            label: `Competitors (${tracking.competitors?.length || 0})`,
        },
        {
            id: "history",
            label: "History",
        },
    ];

    // =========================================================
    // PAGE
    // =========================================================

    return (
        <div className="min-h-screen pt-16 md:pt-24 bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

                {/* BACK */}
                <div className="mb-8">
                    <Link
                        to="/rank-tracker"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back to Rank Tracker
                    </Link>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                        <div>
                            <h1 className="text-2xl sm:text-3xl font-medium text-foreground">
                                "
                                <span className="gradient-text">
                                    {tracking.keyword}
                                </span>
                                "
                            </h1>

                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                <Globe size={14} />

                                <span>
                                    {tracking.domain}
                                </span>

                                <a
                                    href={tracking.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline flex items-center gap-1"
                                >
                                    Visit
                                    <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>

                        <button
                            onClick={handleRefresh}
                            disabled={
                                refreshing ||
                                tracking.status ===
                                    "checking"
                            }
                            className="glass px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-muted/50 transition-all disabled:opacity-50 self-start text-foreground"
                        >
                            <RefreshCw
                                size={16}
                                className={
                                    refreshing
                                        ? "animate-spin"
                                        : ""
                                }
                            />

                            {refreshing
                                ? "Checking..."
                                : "Refresh Now"}
                        </button>
                    </div>
                </div>

                {/* ERROR */}
                {error && (
                    <div className="mb-6 px-4 py-3 rounded-xl border border-danger/30 bg-danger/10 text-danger text-sm flex items-center gap-2">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {/* CHECKING MESSAGE */}
                {tracking.status ===
                    "checking" && (
                    <div className="mb-6 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 text-primary text-sm flex items-center gap-2">
                        <Loader2
                            size={16}
                            className="animate-spin"
                        />
                        Google ranking is being checked.
                        This may take a few seconds...
                    </div>
                )}

                {/* SCORE CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

                    {/* CURRENT POSITION */}
                    <div className="glass-strong rounded-2xl p-6 text-center">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
                            <Target size={14} />
                            Current Position
                        </p>

                        {tracking.status ===
                        "checking" ? (
                            <Loader2
                                size={32}
                                className="animate-spin mx-auto text-primary"
                            />
                        ) : (
                            <p
                                className={`text-4xl font-bold ${getPositionColor(
                                    tracking.currentPosition
                                )}`}
                            >
                                {tracking.currentPosition
                                    ? `#${tracking.currentPosition}`
                                    : "Not Ranked"}
                            </p>
                        )}

                        {tracking.currentPage && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Page{" "}
                                {
                                    tracking.currentPage
                                }
                            </p>
                        )}
                    </div>

                    {/* CHANGE */}
                    <div className="glass rounded-2xl p-6 text-center">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
                            <TrendingUp size={14} />
                            Position Change
                        </p>

                        <div
                            className={`text-3xl font-bold flex items-center justify-center gap-2 ${change.class}`}
                        >
                            {change.icon}
                            {change.text}
                        </div>

                        <p className="text-xs text-muted-foreground mt-1">
                            since last check
                        </p>
                    </div>

                    {/* BEST */}
                    <div className="glass rounded-2xl p-6 text-center">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
                            <Trophy size={14} />
                            Best Position
                        </p>

                        <p
                            className={`text-3xl font-bold ${getPositionColor(
                                tracking.bestPosition
                            )}`}
                        >
                            {tracking.bestPosition
                                ? `#${tracking.bestPosition}`
                                : "—"}
                        </p>

                        <p className="text-xs text-muted-foreground mt-1">
                            all time
                        </p>
                    </div>

                    {/* DATA POINTS */}
                    <div className="glass rounded-2xl p-6 text-center">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
                            <Calendar size={14} />
                            Data Points
                        </p>

                        <p className="text-3xl font-bold text-accent">
                            {tracking.rankHistory
                                ?.length || 0}
                        </p>

                        <p className="text-xs text-muted-foreground mt-1">
                            {tracking.lastChecked
                                ? `Last: ${new Date(
                                      tracking.lastChecked
                                  ).toLocaleDateString()}`
                                : "Never checked"}
                        </p>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() =>
                                setActiveTab(
                                    tab.id
                                )
                            }
                            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                                activeTab ===
                                tab.id
                                    ? "bg-primary text-primary-foreground"
                                    : "glass text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                            style={
                                activeTab ===
                                tab.id
                                    ? {
                                          color: "var(--background)",
                                      }
                                    : {}
                            }
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* =====================================================
                    OVERVIEW
                ===================================================== */}

                {activeTab ===
                    "overview" && (
                    <div className="space-y-6">

                        {/* CHART */}
                        <div className="glass rounded-2xl p-6">
                            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <TrendingUp
                                    size={20}
                                    className="text-primary"
                                />
                                Ranking History
                            </h3>

                            {tracking.rankHistory?.filter(
                                (h) =>
                                    h.position !==
                                    null
                            ).length >
                            0 ? (
                                <div
                                    className="relative"
                                    style={{
                                        height: "300px",
                                    }}
                                >
                                    <canvas
                                        ref={
                                            chartRef
                                        }
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                        }}
                                        className="rounded-xl"
                                    />
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Calendar
                                        size={32}
                                        className="mx-auto mb-2 opacity-50"
                                    />

                                    <p className="text-sm">
                                        No ranking data
                                        yet.
                                    </p>
                                </div>
                            )}

                            <p className="text-xs text-muted-foreground mt-3 text-center">
                                ↑ Lower position
                                number = higher
                                rank.
                            </p>
                        </div>

                        {/* TOP COMPETITORS */}
                        {tracking.competitors
                            ?.length >
                            0 && (
                            <div className="glass rounded-2xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                        <Users
                                            size={
                                                20
                                            }
                                            className="text-accent"
                                        />
                                        Top Competitors
                                    </h3>

                                    <button
                                        onClick={() =>
                                            setActiveTab(
                                                "competitors"
                                            )
                                        }
                                        className="text-sm text-primary hover:underline"
                                    >
                                        View All →
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {tracking.competitors
                                        .slice(
                                            0,
                                            3
                                        )
                                        .map(
                                            (
                                                comp
                                            ) => (
                                                <div
                                                    key={`${comp.position}-${comp.domain}`}
                                                    className="glass rounded-xl p-4 flex items-start gap-4"
                                                >
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 bg-primary/15 text-primary border border-primary/30">
                                                        #
                                                        {
                                                            comp.position
                                                        }
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-foreground truncate">
                                                            {comp.title ||
                                                                comp.domain}
                                                        </p>

                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {
                                                                comp.domain
                                                            }
                                                        </p>
                                                    </div>

                                                    <a
                                                        href={
                                                            comp.url
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-muted-foreground hover:text-primary shrink-0"
                                                    >
                                                        <ExternalLink
                                                            size={
                                                                14
                                                            }
                                                        />
                                                    </a>
                                                </div>
                                            )
                                        )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* =====================================================
                    COMPETITORS
                ===================================================== */}

                {activeTab ===
                    "competitors" && (
                    <div className="glass rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Users
                                size={20}
                                className="text-accent"
                            />
                            Competitors for "
                            {tracking.keyword}"
                        </h3>

                        {tracking.competitors
                            ?.length >
                        0 ? (
                            <div className="space-y-3">
                                {tracking.competitors.map(
                                    (
                                        comp
                                    ) => (
                                        <div
                                            key={`${comp.position}-${comp.domain}`}
                                            className="glass rounded-xl p-4 hover:bg-muted/50 transition-all"
                                        >
                                            <div className="flex items-start gap-4">

                                                <div
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                                                        comp.position <=
                                                        3
                                                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                                            : comp.position <=
                                                                10
                                                              ? "bg-primary/15 text-primary border border-primary/30"
                                                              : "bg-accent/15 text-accent border border-accent/30"
                                                    }`}
                                                >
                                                    #
                                                    {
                                                        comp.position
                                                    }
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground">
                                                        {comp.title ||
                                                            "Untitled"}
                                                    </p>

                                                    <p className="text-xs text-primary mt-0.5">
                                                        {
                                                            comp.domain
                                                        }
                                                    </p>

                                                    {comp.snippet && (
                                                        <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                                                            {
                                                                comp.snippet
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                <a
                                                    href={
                                                        comp.url
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary"
                                                >
                                                    <ExternalLink
                                                        size={
                                                            16
                                                        }
                                                    />
                                                </a>
                                            </div>
                                        </div>
                                    )
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <Users
                                    size={32}
                                    className="mx-auto mb-2 opacity-50"
                                />

                                <p className="text-sm">
                                    No competitor
                                    data available
                                    yet.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* =====================================================
                    HISTORY
                ===================================================== */}

                {activeTab ===
                    "history" && (
                    <div className="glass rounded-2xl p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <Clock
                                size={20}
                                className="text-accent"
                            />
                            Ranking History
                        </h3>

                        {tracking.rankHistory
                            ?.length >
                        0 ? (
                            <div className="space-y-2">
                                {[
                                    ...tracking.rankHistory,
                                ]
                                    .sort(
                                        (
                                            a,
                                            b
                                        ) =>
                                            new Date(
                                                b.date
                                            ).getTime() -
                                            new Date(
                                                a.date
                                            ).getTime()
                                    )
                                    .map(
                                        (
                                            entry
                                        ) => (
                                            <div
                                                key={`${entry.date}-${entry.position}`}
                                                className="glass rounded-xl p-4 flex items-center gap-4 hover:bg-muted/50 transition-all"
                                            >
                                                <div
                                                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                                                        entry.position ===
                                                        null
                                                            ? "bg-muted text-muted-foreground border border-border"
                                                            : entry.position <=
                                                                3
                                                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                                              : entry.position <=
                                                                  10
                                                                ? "bg-primary/15 text-primary border border-primary/30"
                                                                : entry.position <=
                                                                    20
                                                                  ? "bg-accent/15 text-accent border border-accent/30"
                                                                  : "bg-danger/15 text-danger border border-danger/30"
                                                    }`}
                                                >
                                                    {entry.position
                                                        ? `#${entry.position}`
                                                        : "—"}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground">
                                                        {new Date(
                                                            entry.date
                                                        ).toLocaleDateString(
                                                            "en-US",
                                                            {
                                                                weekday:
                                                                    "short",
                                                                year:
                                                                    "numeric",
                                                                month:
                                                                    "short",
                                                                day:
                                                                    "numeric",
                                                            }
                                                        )}
                                                    </p>

                                                    <div className="flex items-center gap-3 mt-0.5">
                                                        {entry.page && (
                                                            <span className="text-xs text-muted-foreground">
                                                                Page{" "}
                                                                {
                                                                    entry.page
                                                                }
                                                            </span>
                                                        )}

                                                        {entry.title && (
                                                            <span className="text-xs text-muted-foreground truncate">
                                                                {
                                                                    entry.title
                                                                }
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <p
                                                        className={`text-lg font-bold ${getPositionColor(
                                                            entry.position
                                                        )}`}
                                                    >
                                                        {entry.position ||
                                                            "N/R"}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    )}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                <Calendar
                                    size={32}
                                    className="mx-auto mb-2 opacity-50"
                                />

                                <p className="text-sm">
                                    No history data
                                    yet.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}