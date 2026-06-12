import os
import pandas as pd
from influxdb_client import InfluxDBClient

INFLUXDB_URL = os.getenv("INFLUXDB_URL", "http://127.0.0.1:8086")
INFLUXDB_TOKEN = os.getenv("INFLUXDB_TOKEN", "intelliload-dev-token")
INFLUXDB_ORG = os.getenv("INFLUXDB_ORG", "intelliload")
INFLUXDB_BUCKET = os.getenv("INFLUXDB_BUCKET", "metrics")

class InfluxQueryClient:
    def __init__(self):
        self.url = INFLUXDB_URL
        self.token = INFLUXDB_TOKEN
        self.org = INFLUXDB_ORG
        self.bucket = INFLUXDB_BUCKET
        self.client = None
        self.query_api = None
        
        try:
            self.client = InfluxDBClient(url=self.url, token=self.token, org=self.org)
            self.query_api = self.client.query_api()
            print("Successfully initialized InfluxDB Python query client.")
        except Exception as e:
            print(f"Failed to initialize InfluxDB client: {str(e)}")

    def query_metrics_history(self, test_run_id: str, minutes_ago: int = 15) -> pd.DataFrame:
        """
        Query metric timeseries from InfluxDB for a specific test run and load into a pandas DataFrame.
        """
        if not self.query_api:
            raise ConnectionError("InfluxDB query API client is not connected.")

        flux_query = f'''
        from(bucket: "{self.bucket}")
          |> range(start: -{minutes_ago}m)
          |> filter(fn: (r) => r["_measurement"] == "request_metrics")
          |> filter(fn: (r) => r["testRunId"] == "{test_run_id}")
          |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
          |> sort(columns: ["_time"], desc: false)
        '''

        try:
            result = self.query_api.query_data_frame(flux_query)
            # If query returned list of dataframes (multiple tables), concat them
            if isinstance(result, list):
                if len(result) == 0:
                    return pd.DataFrame()
                result = pd.concat(result, ignore_index=True)
            
            if result.empty:
                return pd.DataFrame()

            # Clean and standardise column names
            rename_map = {
                "_time": "timestamp",
                "avg_latency": "avg_latency",
                "p50_latency": "p50_latency",
                "p95_latency": "p95_latency",
                "p99_latency": "p99_latency",
                "max_latency": "max_latency",
                "throughput": "throughput",
                "error_rate": "error_rate",
                "total_requests": "total_requests",
                "active_users": "active_users"
            }
            
            # Map columns present in InfluxDB schema
            result = result.rename(columns={k: v for k, v in rename_map.items() if k in result.columns})
            
            # Set datetime index
            result['timestamp'] = pd.to_datetime(result['timestamp'])
            
            return result

        except Exception as e:
            print(f"Error querying InfluxDB: {str(e)}")
            return pd.DataFrame()

    def close(self):
        if self.client:
            self.client.close()

# Singleton instance
influx_query_client = InfluxQueryClient()
