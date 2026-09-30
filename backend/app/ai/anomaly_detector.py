import numpy as np
from sklearn.ensemble import IsolationForest
from typing import Tuple, Dict, Any

class SensorAnomalyDetector:
    """
    AI Anomaly Detection Engine for Coal Mine Telemetry using Scikit-Learn Isolation Forest.
    Monitors 8 critical telemetric parameters:
    [Methane (%), CO (ppm), Dust PM10 (ug/m3), Temp (C), Humidity (%), Noise (dB), AQI, Water pH]
    """
    def __init__(self):
        self.feature_names = [
            "methane", "co", "dust", "temperature",
            "humidity", "noise", "air_quality", "water_quality"
        ]
        self.thresholds = {
            "methane": {"warning": 1.0, "critical": 2.0},      # % volume
            "co": {"warning": 25.0, "critical": 50.0},          # ppm
            "dust": {"warning": 100.0, "critical": 250.0},      # ug/m3
            "temperature": {"warning": 35.0, "critical": 42.0}, # Celsius
            "humidity": {"warning": 80.0, "critical": 90.0},    # %
            "noise": {"warning": 85.0, "critical": 105.0},      # dB
            "air_quality": {"warning": 150.0, "critical": 250.0}, # AQI
            "water_quality": {"min": 6.5, "max": 8.5}          # pH
        }
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.08,
            random_state=42
        )
        self._train_baseline()

    def _train_baseline(self):
        """Train baseline model using representative normal operational distribution for underground coal mines"""
        np.random.seed(42)
        n_samples = 1500
        # Normal operational ranges:
        methane = np.random.uniform(0.1, 0.8, n_samples)
        co = np.random.uniform(2.0, 18.0, n_samples)
        dust = np.random.uniform(30.0, 85.0, n_samples)
        temp = np.random.uniform(22.0, 32.0, n_samples)
        humidity = np.random.uniform(45.0, 72.0, n_samples)
        noise = np.random.uniform(60.0, 78.0, n_samples)
        aqi = np.random.uniform(40.0, 95.0, n_samples)
        ph = np.random.uniform(6.8, 7.8, n_samples)

        X_train = np.column_stack([methane, co, dust, temp, humidity, noise, aqi, ph])
        self.model.fit(X_train)

    def analyze_reading(self, reading: Dict[str, float]) -> Dict[str, Any]:
        """
        Analyze a telemetric sensor reading vector.
        Returns:
            - is_anomaly (bool)
            - anomaly_score (float, between -1 and 1)
            - risk_flag ('NORMAL', 'WARNING', 'CRITICAL', 'ANOMALY')
            - triggers (List of specific parameters breaching thresholds)
        """
        vector = np.array([[
            float(reading.get("methane", 0.3)),
            float(reading.get("co", 8.0)),
            float(reading.get("dust", 45.0)),
            float(reading.get("temperature", 26.0)),
            float(reading.get("humidity", 60.0)),
            float(reading.get("noise", 70.0)),
            float(reading.get("air_quality", 65.0)),
            float(reading.get("water_quality", 7.2))
        ]])

        # Isolation Forest prediction: -1 = outlier/anomaly, 1 = inlier/normal
        prediction = self.model.predict(vector)[0]
        # decision_function: lower values indicate more abnormal instances
        score = float(self.model.decision_function(vector)[0])

        triggers = []
        is_critical = False
        is_warning = False

        if vector[0][0] >= self.thresholds["methane"]["critical"]:
            triggers.append(f"Methane level critical: {vector[0][0]:.2f}% (Limit: 2.0%)")
            is_critical = True
        elif vector[0][0] >= self.thresholds["methane"]["warning"]:
            triggers.append(f"Methane warning: {vector[0][0]:.2f}%")
            is_warning = True

        if vector[0][1] >= self.thresholds["co"]["critical"]:
            triggers.append(f"Carbon Monoxide critical: {vector[0][1]:.1f} ppm (Limit: 50 ppm)")
            is_critical = True
        elif vector[0][1] >= self.thresholds["co"]["warning"]:
            triggers.append(f"CO warning: {vector[0][1]:.1f} ppm")
            is_warning = True

        if vector[0][2] >= self.thresholds["dust"]["critical"]:
            triggers.append(f"Dust PM10 critical: {vector[0][2]:.1f} ug/m3")
            is_critical = True
        elif vector[0][2] >= self.thresholds["dust"]["warning"]:
            triggers.append(f"Dust PM10 elevated: {vector[0][2]:.1f} ug/m3")
            is_warning = True

        if vector[0][3] >= self.thresholds["temperature"]["critical"]:
            triggers.append(f"Mine temperature critical: {vector[0][3]:.1f} C")
            is_critical = True

        # Check underground life-support parameters if passed in reading
        o2 = reading.get("oxygen")
        if o2 is not None:
            if o2 < 18.0:
                triggers.append(f"Oxygen critical depletion: {o2:.1f}% (Safe: 19.5-23.5%)")
                is_critical = True
            elif o2 < 19.5:
                triggers.append(f"Oxygen warning: {o2:.1f}%")
                is_warning = True

        co2 = reading.get("co2")
        if co2 is not None and co2 > 1.0:
            triggers.append(f"Carbon Dioxide critical: {co2:.2f}% (Limit: 1.0%)")
            is_critical = True

        smoke = reading.get("smoke")
        if smoke is not None and smoke > 0.5:
            triggers.append(f"Underground smoke detected: {smoke:.2f} obscuration (Fire/Combustion Risk)")
            is_critical = True

        vent = reading.get("ventilation_flow")
        if vent is not None:
            if vent < 10.0:
                triggers.append(f"Ventilation flow failure: {vent:.1f} m³/min (Statutory Min: 15 m³/min)")
                is_critical = True
            elif vent < 15.0:
                triggers.append(f"Ventilation flow degraded: {vent:.1f} m³/min")
                is_warning = True

        if vector[0][7] < self.thresholds["water_quality"]["min"] or vector[0][7] > self.thresholds["water_quality"]["max"]:
            triggers.append(f"Water pH abnormal: {vector[0][7]:.2f} (Acid Mine Drainage risk)")
            is_warning = True

        is_anomaly = bool(prediction == -1 or is_critical or is_warning)

        if is_critical:
            risk_flag = "CRITICAL"
        elif is_anomaly and (is_warning or score < -0.15):
            risk_flag = "ANOMALY"
        elif is_warning:
            risk_flag = "WARNING"
        else:
            risk_flag = "NORMAL"

        return {
            "is_anomaly": is_anomaly,
            "anomaly_score": round(score, 4),
            "risk_flag": risk_flag,
            "triggers": triggers
        }

# Singleton instance for consistent use across API and simulation
anomaly_detector = SensorAnomalyDetector()
