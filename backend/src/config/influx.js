const { InfluxDB, Point } = require('@influxdata/influxdb-client');

const url = process.env.INFLUXDB_URL || 'http://127.0.0.1:8086';
const token = process.env.INFLUXDB_TOKEN || 'intelliload-dev-token';
const org = process.env.INFLUXDB_ORG || 'intelliload';
const bucket = process.env.INFLUXDB_BUCKET || 'metrics';

let influxClient = null;
let writeApi = null;
let queryApi = null;

try {
  influxClient = new InfluxDB({ url, token });
  writeApi = influxClient.getWriteApi(org, bucket, 'ns'); // nano-second precision
  queryApi = influxClient.getQueryApi(org);
  console.log('InfluxDB client initialized successfully.');
} catch (error) {
  console.error('Failed to initialize InfluxDB client:', error.message);
}

module.exports = {
  influxClient,
  writeApi,
  queryApi,
  Point,
  org,
  bucket
};
