import axios from "axios";
import { API_URL } from "./api";

class RealtimeSensorService {
  constructor() {
    this.subscribers = new Set();
    this.ws = null;
    this.pollInterval = null;
    this.timerInterval = null;
    this.isConnected = false;
    this.lastUpdated = new Date();
    this.dataSource = "DEMO IoT STREAM";
    this.state = {
      status: "LIVE",
      dataSource: "DEMO IoT STREAM",
      lastUpdated: new Date().toISOString(),
      secondsAgo: 0,
      latestReading: null,
      activeAnomaly: null,
      table: [],
      chartHistory: []
    };

    this.init();
  }

  init() {
    // 1. Immediately fetch initial real-time snapshot
    this.fetchPollData();

    // 2. Guaranteed reliable polling every 6 seconds (Render-optimized)
    this.pollInterval = setInterval(() => {
      this.fetchPollData();
    }, 6000);

    // 3. Seconds-ago ticker every second for precise "Last updated: X seconds ago" UI
    this.timerInterval = setInterval(() => {
      if (this.lastUpdated) {
        const elapsed = Math.max(0, Math.floor((Date.now() - this.lastUpdated.getTime()) / 1000));
        if (this.state.secondsAgo !== elapsed) {
          this.state.secondsAgo = elapsed;
          this.notify();
        }
      }
    }, 1000);

    // 4. Optionally attempt WebSocket if supported
    this.connectWebSocket();
  }

  connectWebSocket() {
    try {
      const fullBase = API_URL.startsWith("http")
        ? API_URL
        : `${window.location.origin}${API_URL}`;
      const parsed = new URL(fullBase);
      const wsProtocol = parsed.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${wsProtocol}//${parsed.host}/api/ws/sensors`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.state.status = "LIVE";
        this.lastUpdated = new Date();
        this.state.lastUpdated = this.lastUpdated.toISOString();
        this.state.secondsAgo = 0;
        this.notify();

        // Heartbeat ping every 25 seconds
        this.pingTimer = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send("ping");
          }
        }, 25000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handlePacket(data);
        } catch {
          // ignore plain text ping/pong
        }
      };

      this.ws.onerror = () => {
        this.isConnected = false;
      };

      this.ws.onclose = () => {
        this.isConnected = false;
      };
    } catch {
      this.isConnected = false;
    }
  }

  async fetchPollData() {
    try {
      const res = await axios.get(`${API_URL}/sensors/realtime-feed`);
      if (res.data) {
        this.handlePacket({
          type: "POLL_UPDATE",
          data_source: res.data.data_source,
          reading: res.data.latest_reading,
          anomaly: res.data.anomaly_notification,
          active_anomaly: res.data.active_anomaly,
          table: res.data.table,
          chart_history: res.data.chart_history,
          timestamp: res.data.last_updated
        });
      }
    } catch (err) {
      // Don't show confusing technical errors - maintain status
      console.warn("Real-time telemetry poll sync:", err.message);
    }
  }

  handlePacket(data) {
    this.lastUpdated = new Date();
    this.state.lastUpdated = data.timestamp || this.lastUpdated.toISOString();
    this.state.status = "LIVE";

    if (data.data_source) {
      this.state.dataSource = data.data_source;
      this.dataSource = data.data_source;
    }

    if (data.table && Array.isArray(data.table)) {
      this.state.table = data.table;
    }

    if (data.reading) {
      this.state.latestReading = data.reading;
    }

    if (data.anomaly) {
      this.state.activeAnomaly = data.anomaly;
    } else if (data.active_anomaly) {
      this.state.activeAnomaly = data.active_anomaly;
    }

    if (data.chart_history && Array.isArray(data.chart_history)) {
      this.state.chartHistory = data.chart_history;
    } else if (data.reading) {
      // Append reading to chartHistory if not provided
      const newPoint = {
        time: new Date().toLocaleTimeString(),
        methane: data.reading.methane,
        co: data.reading.co,
        dust: data.reading.dust,
        temperature: data.reading.temperature,
        humidity: data.reading.humidity
      };
      this.state.chartHistory = [...this.state.chartHistory.slice(-39), newPoint];
    }

    this.notify();
  }

  async triggerTick() {
    try {
      const res = await axios.post(`${API_URL}/sensors/trigger-tick`);
      if (res.data && res.data.result) {
        this.handlePacket({
          type: "MANUAL_TICK",
          data_source: res.data.data_source,
          reading: res.data.result.reading,
          anomaly: res.data.result.anomaly_notification,
          timestamp: new Date().toISOString()
        });
      }
      return res.data;
    } catch (err) {
      console.error("Failed to trigger tick:", err);
      throw err;
    }
  }

  subscribe(listener) {
    this.subscribers.add(listener);
    // Immediately emit current state
    listener(this.state);
    return () => {
      this.subscribers.delete(listener);
    };
  }

  notify() {
    this.subscribers.forEach((listener) => {
      try {
        listener(this.state);
      } catch (e) {
        console.error("Error in realtime listener:", e);
      }
    });
  }

  getState() {
    return this.state;
  }
}

export const realtimeService = new RealtimeSensorService();
