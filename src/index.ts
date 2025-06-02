import * as core from '@actions/core';
import axios from 'axios';

async function run() {
  try {
    const apiKey = core.getInput('api_key');
    const taskId = core.getInput('task_id');
    const apiUrl = core.getInput('api_url');

    // Initialize API client
    const client = axios.create({
      baseURL: apiUrl,
      headers: {
        'X-APYGUARD-TOKEN': apiKey,
        'Content-Type': 'application/json'
      }
    });

    const body = {
      scan_task_id: taskId
    };

    // Start the scan
    core.info('🚀 Starting ApyGuard scan...');
    const startResponse = await client.post('api/api_security/start_github_api_scan', body);
    if (startResponse.status !== 200) {
      throw new Error(`Failed to start scan: ${startResponse.status} ${startResponse.statusText}`);
    }

    // Poll for results
    let scanComplete = false;
    while (!scanComplete) {
      const statusResponse = await client.get(`/tasks/${taskId}/status`);
      
      if (statusResponse.data.status === 'completed') {
        scanComplete = true;
        core.info('✅ Scan completed successfully');
        
        // Get scan results
        const resultsResponse = await client.get(`/tasks/${taskId}/results`);
        core.setOutput('results', JSON.stringify(resultsResponse.data));
        
        // Set success/failure based on findings
        if (resultsResponse.data.findings.length > 0) {
          core.setFailed('Security vulnerabilities found');
        }
      } else if (statusResponse.data.status === 'failed') {
        throw new Error('Scan failed: ' + statusResponse.data.error);
      } else {
        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}

run();