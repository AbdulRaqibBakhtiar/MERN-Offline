import React from "react";

const MetricHistory = ({ history = [] }) => {

    return (
        <div
            style={{
                background: "var(--bg-card)",
                padding: "20px",
                borderRadius: "16px",
                border: "1px solid var(--border-color)"
            }}
        >
            <h3
                style={{
                    margin: "0 0 16px",
                    color: "var(--text-primary)",
                    fontSize: "1.05rem",
                    fontWeight: 900,
                    letterSpacing: "-0.02em"
                }}
            >
                📊 Metric History
            </h3>
            {
                history.length === 0 ?
                    (
                        <p
                            style={{
                                color: "var(--text-secondary)",
                                textAlign: "center",
                                padding: "18px 0",
                                fontStyle: "italic"
                            }}
                        >
                            No snapshots recorded yet.
                        </p>
                    ) : (
                        <div>
                            {
                                history.map(snapshot => (
                                    <div
                                        key={snapshot._id}
                                        style={{
                                            padding: "14px",
                                            marginBottom: "12px",
                                            background: "var(--bg-main)",
                                            border: "1px solid var(--border-color)",
                                            borderRadius: "12px",
                                            transition: "all .25s ease",
                                            cursor: "default"
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = "translateY(-2px)";
                                            e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,.15)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = "translateY(0)";
                                            e.currentTarget.style.boxShadow = "none";
                                        }}
                                    >
                                        <strong
                                            style={{
                                                display: "block",
                                                color: "var(--text-primary)",
                                                fontSize: ".9rem",
                                                marginBottom: "10px"
                                            }}
                                        >
                                            {
                                                new Date(snapshot.createdAt)
                                                    .toLocaleDateString()
                                            }
                                        </strong>
                                        <p
                                            style={{
                                                margin: "6px 0",
                                                color: "var(--text-secondary)",
                                                fontSize: ".84rem",
                                                lineHeight: 1.5
                                            }}
                                        >
                                            <>
                                                📦 Items:{" "}
                                                <strong style={{ color: "var(--text-primary)" }}>
                                                    {snapshot.totalItems}
                                                </strong>
                                            </>
                                        </p>
                                        <p style={{
                                            margin: "6px 0",
                                            color: "var(--text-secondary)",
                                            fontSize: ".84rem",
                                            lineHeight: 1.5
                                        }}>
                                            <>
                                                💰 Inventory Value:{" "}
                                                <strong style={{ color: "#2563eb" }}>
                                                    ${Number(snapshot.totalInventoryValue).toLocaleString()}
                                                </strong>
                                            </>
                                        </p>
                                        <p style={{
                                            margin: "6px 0",
                                            color: "var(--text-secondary)",
                                            fontSize: ".84rem",
                                            lineHeight: 1.5
                                        }}>
                                            <>
                                                👥 Users:{" "}
                                                <strong style={{ color: "var(--text-primary)" }}>
                                                    {snapshot.totalUsers}
                                                </strong>
                                            </>
                                        </p>
                                    </div>
                                ))
                            }

                        </div>
                    )
            }
        </div >
    );
};
export default MetricHistory;