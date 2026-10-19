// src/hooks/useMetrics.js
import { useState, useEffect, useCallback } from "react";
import { useSocket } from "../context/SocketContext"; // 🛰️ Live WebSocket listener hook
import api from "../api/axios";

function useMetrics(enabled = true) {
  const [metricHistory, setMetricHistory] = useState([]);
  const [metricLoading, setMetricLoading] = useState(false);
  const [snapshotStatus, setSnapshotStatus] = useState("");
  const { socket } = useSocket();

  const fetchMetricHistory = useCallback(async () => {
    if (!enabled) { setMetricHistory([]); return; }
    try {
      setMetricLoading(true);
      const response = await api.get("/metrics/history");
      
      // Safe fallback validation check to keep charts operational
      setMetricHistory(Array.isArray(response.data) ? response.data : []);
      setSnapshotStatus("synchronized");
    } catch (error) {
      // 🚀 INSULATION GATEWAY: Catches connection timeouts gracefully 
      console.error("💥 ANALYTICS ENGINE FAULT (Metric history fetch failed):", error.message || error);
      setMetricHistory([]); // Safe empty fallback assignment
      setSnapshotStatus("error");
    } finally {
      setMetricLoading(false);
    }
  }, [enabled]);

  // 🛰️ INTERCEPT EVENT BROADCASTS TO AUTO-REFRESH CHARTS INSTANTLY
  useEffect(() => {
    if (!socket) return;

    const handleRefresh = () => {
      fetchMetricHistory();
    };

    socket.on('metrics_updated', handleRefresh);
    socket.on('inventory_updated', handleRefresh); // Re-fetch analytics immediately when database values shift

    return () => {
      socket.off('metrics_updated', handleRefresh);
      socket.off('inventory_updated', handleRefresh);
    };
  }, [socket, fetchMetricHistory]);

  useEffect(() => {
    if (enabled) fetchMetricHistory();
  }, [enabled, fetchMetricHistory]);

  return { metricHistory, metricLoading, snapshotStatus, refreshMetrics: fetchMetricHistory };
}

export default useMetrics;
