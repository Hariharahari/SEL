/**
 * Seed endpoint for development - populates Redis with sample agents
 * GET /api/seed - Adds 10 sample agents to Redis
 */

import { NextResponse } from 'next/server';
import { SELAgentCard } from '@/types';

const SAMPLE_AGENTS: SELAgentCard[] = [
  {
    'agent id': 'agent.nlp.summarizer',
    name: 'Text Summarization Agent',
    description: 'Intelligently summarizes long texts using advanced NLP techniques',
    origin: {
      org: 'TechCorp AI',
      sub_org: 'NLP Division',
      creator: 'Alice Johnson',
    },
    maintainers: [
      { name: 'Alice Johnson', contact: 'alice@techcorp.com' },
      { name: 'Bob Smith', contact: 'bob@techcorp.com' },
    ],
    version: '2.1.0',
    status: 'stable',
    technology: ['Python', 'PyTorch', 'BERT', 'FastAPI'],
    specialization: {
      primary: 'Natural Language Processing',
      'domain specific': ['Text Analysis', 'Summarization', 'Document Processing'],
    },
    tasks: [
      {
        name: 'Summarize Text',
        description: 'Generate a concise summary of input text',
        async: true,
      },
      {
        name: 'Extract Keywords',
        description: 'Extract key topics from text',
        async: false,
      },
    ],
    documentation: {
      readme: 'Advanced text summarization using transformer models',
      howto: 'Send text to the agent via API, get summary in response',
      changelog: 'v2.1.0: Added batch processing support',
    },
    'supported harness': ['OpenAI', 'Claude', 'LangChain', 'Anthropic'],
    rating: { 'Jast score': 4.8, grade: 'A+' },
    stars: 285,
    downloads: {
      last_downloaded: '2024-04-16',
      total_download_7_days: 450,
      total_download_30_days: 1820,
      total_download_overall: 12450,
    },
  },
  {
    'agent id': 'agent.vision.detector',
    name: 'Object Detection Agent',
    description: 'Detects and localizes objects in images using YOLO v8',
    origin: {
      org: 'AI Systems Inc',
      sub_org: 'Computer Vision',
      creator: 'Charlie Brown',
    },
    maintainers: [
      { name: 'Charlie Brown', contact: 'charlie@aisystems.com' },
    ],
    version: '1.5.2',
    status: 'stable',
    technology: ['Python', 'YOLO', 'OpenCV', 'TensorRT'],
    specialization: {
      primary: 'Computer Vision',
      'domain specific': ['Object Detection', 'Image Analysis', 'Real-time Processing'],
    },
    tasks: [
      {
        name: 'Detect Objects',
        description: 'Identify and locate objects in images',
        async: true,
      },
      {
        name: 'Count Objects',
        description: 'Count specific object types',
        async: false,
      },
    ],
    documentation: {
      readme: 'Real-time object detection with high accuracy',
      howto: 'Upload image, get bounding boxes and confidence scores',
      changelog: 'v1.5.2: Performance improvements',
    },
    'supported harness': ['TensorFlow Serving', 'ONNX Runtime'],
    rating: { 'Jast score': 4.6, grade: 'A' },
    stars: 156,
    downloads: {
      last_downloaded: '2024-04-16',
      total_download_7_days: 320,
      total_download_30_days: 980,
      total_download_overall: 8234,
    },
  },
  {
    'agent id': 'agent.data.cleaner',
    name: 'Data Cleaning Agent',
    description: 'Automatically cleans and normalizes messy datasets',
    origin: {
      org: 'DataFlow Ltd',
      sub_org: 'Data Engineering',
      creator: 'Diana Prince',
    },
    maintainers: [
      { name: 'Diana Prince', contact: 'diana@dataflow.com' },
    ],
    version: '3.0.1',
    status: 'stable',
    technology: ['Python', 'Pandas', 'Polars', 'Great Expectations'],
    specialization: {
      primary: 'Data Engineering',
      'domain specific': ['Data Cleaning', 'ETL', 'Quality Assurance'],
    },
    tasks: [
      {
        name: 'Clean Dataset',
        description: 'Remove duplicates, handle missing values, normalize data',
        async: true,
      },
      {
        name: 'Validate Quality',
        description: 'Check data quality metrics',
        async: false,
      },
    ],
    documentation: {
      readme: 'Enterprise-grade data cleaning pipelines',
      howto: 'Provide dirty dataset, get clean output in standard formats',
      changelog: 'v3.0.1: Support for 50+ data formats',
    },
    'supported harness': ['Apache Airflow', 'Prefect'],
    rating: { 'Jast score': 4.5, grade: 'A' },
    stars: 198,
    downloads: {
      last_downloaded: '2024-04-16',
      total_download_7_days: 390,
      total_download_30_days: 1450,
      total_download_overall: 9876,
    },
  },
  {
    'agent id': 'agent.ml.predictor',
    name: 'Machine Learning Predictor',
    description: 'Trains and deploys ML models with AutoML capabilities',
    origin: {
      org: 'ML Labs',
      sub_org: 'AutoML Team',
    },
    maintainers: [
      { name: 'Eva Martinez', contact: 'eva@mllabs.com' },
    ],
    version: '1.2.0',
    status: 'beta',
    technology: ['Python', 'scikit-learn', 'XGBoost', 'LightGBM'],
    specialization: {
      primary: 'Machine Learning',
      'domain specific': ['Regression', 'Classification', 'Time Series'],
    },
    tasks: [
      {
        name: 'Train Model',
        description: 'Automatically train optimal ML model',
        async: true,
      },
      {
        name: 'Make Prediction',
        description: 'Generate predictions on new data',
        async: false,
      },
    ],
    documentation: {
      readme: 'AutoML for predictive analytics',
      howto: 'Upload training data, get trained model and predictions',
    },
    'supported harness': ['MLflow', 'Kubeflow'],
    rating: { 'Jast score': 4.3, grade: 'A-' },
    stars: 142,
    downloads: {
      last_downloaded: '2024-04-15',
      total_download_7_days: 230,
      total_download_30_days: 650,
      total_download_overall: 5432,
    },
  },
  {
    'agent id': 'agent.api.monitor',
    name: 'API Performance Monitor',
    description: 'Monitors API health, latency, and uptime in real-time',
    origin: {
      org: 'DevOps Pro',
      creator: 'Frank Wilson',
    },
    maintainers: [
      { name: 'Frank Wilson', contact: 'frank@devopspro.com' },
    ],
    version: '2.0.0',
    status: 'stable',
    technology: ['Go', 'Prometheus', 'Grafana', 'Datadog'],
    specialization: {
      primary: 'DevOps',
      'domain specific': ['Monitoring', 'Alerting', 'Performance Analysis'],
    },
    tasks: [
      {
        name: 'Monitor API',
        description: 'Track API performance metrics continuously',
        async: true,
      },
      {
        name: 'Alert on Issues',
        description: 'Send alerts when thresholds exceeded',
        async: true,
      },
    ],
    documentation: {
      readme: 'Enterprise API monitoring and alerting',
      howto: 'Configure API endpoints to monitor, receive real-time insights',
      changelog: 'v2.0.0: Added custom metrics support',
    },
    'supported harness': ['Kubernetes', 'Docker'],
    rating: { 'Jast score': 4.7, grade: 'A+' },
    stars: 267,
    downloads: {
      last_downloaded: '2024-04-16',
      total_download_7_days: 520,
      total_download_30_days: 1920,
      total_download_overall: 15678,
    },
  },
];

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message:
        'Seeding is disabled. SEL Ignite now keeps only manually uploaded skills in the live catalog.',
      sampleCount: SAMPLE_AGENTS.length,
    },
    { status: 410 }
  );
}
