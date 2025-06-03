import * as core from '@actions/core';
import axios from 'axios';

async function run() {
  try {
    const apiKey = core.getInput('api_key');
    const taskId = core.getInput('task_id');
    const apiUrl = core.getInput('api_url');
    const severityThreshold = core.getInput('severity_threshold');

    // Define severity levels and their numeric values
    const severityLevels = {
      'Critical': 4,
      'High': 3,
      'Medium': 2,
      'Low': 1,
      'Informational': 0
    };

    // Get the numeric threshold value
    const thresholdValue = severityLevels[severityThreshold as keyof typeof severityLevels];
    if (thresholdValue === undefined) {
      throw new Error(`Invalid severity threshold: ${severityThreshold}. Must be one of: ${Object.keys(severityLevels).join(', ')}`);
    }

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
    const startResponse = await client.post('api/api_security/github_actions/start_scan', body);
    if (startResponse.status !== 200) {
      throw new Error(`Failed to start scan: ${startResponse.status} ${startResponse.statusText}`);
    }
    else{
      core.info('🚀 Scan started successfully. Scan ID: ' + startResponse.data.apiscan_id);
    }

    // Poll for results
    let scanComplete = false;
    while (!scanComplete) {
      const body = {
        apiscan_id: startResponse.data.apiscan_id
      };
      const statusResponse = await client.post(`/api/api_security/integrations/get_scan_status`, body);
      
      if (statusResponse.data.status === 'Completed') {
        scanComplete = true;
        core.info('✅ Scan completed successfully');
        
        // Get scan results
        const resultsResponse = await client.post(`/api/api_security/integrations/get_scan_results`, body);
        core.setOutput('Scan Results', JSON.stringify(resultsResponse.data.vulnerabilities));
        
        // Count only vulnerabilities that meet or exceed the threshold
        let vulnerability_count = 0;
        let total_vulnerability_count = 0;
        const vulnerabilities = resultsResponse.data.vulnerabilities;
        
        // Debug log to see what we're working with
        core.info(`Current severity threshold: ${severityThreshold}`);
        core.info(`Vulnerabilities found: ${JSON.stringify(vulnerabilities)}`);

        // Count vulnerabilities that meet or exceed threshold
        for (const [severity, count] of Object.entries(vulnerabilities)) {
          const severityValue = severityLevels[severity as keyof typeof severityLevels];
          if (severityValue >= thresholdValue) {
            vulnerability_count += Number(count); // Ensure we're adding numbers
          }
          total_vulnerability_count += Number(count);
        }

        // Debug log the final count
        core.info(`Total vulnerabilities meeting threshold: ${vulnerability_count} out of ${total_vulnerability_count}`);

        // Set success/failure based on findings
        if (vulnerability_count > 0) {
          core.setFailed(`🚨 ${vulnerability_count} security vulnerabilities found with severity ${severityThreshold} or higher`);
        } else {
          core.info(`✅ No security vulnerabilities found with severity ${severityThreshold} or higher`);
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