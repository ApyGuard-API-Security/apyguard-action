"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const axios_1 = __importDefault(require("axios"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
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
            const thresholdValue = severityLevels[severityThreshold];
            if (thresholdValue === undefined) {
                throw new Error(`Invalid severity threshold: ${severityThreshold}. Must be one of: ${Object.keys(severityLevels).join(', ')}`);
            }
            // Initialize API client
            const client = axios_1.default.create({
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
            const startResponse = yield client.post('api/api_security/github_actions/start_scan', body);
            if (startResponse.status !== 200) {
                throw new Error(`Failed to start scan: ${startResponse.status} ${startResponse.statusText}`);
            }
            else {
                core.info('🚀 Scan started successfully. Scan ID: ' + startResponse.data.apiscan_id);
            }
            // Poll for results
            let scanComplete = false;
            while (!scanComplete) {
                const body = {
                    apiscan_id: startResponse.data.apiscan_id
                };
                const statusResponse = yield client.post(`/api/api_security/integrations/get_scan_status`, body);
                if (statusResponse.data.status === 'Completed') {
                    scanComplete = true;
                    core.info('✅ Scan completed successfully');
                    // Get scan results
                    const resultsResponse = yield client.post(`/api/api_security/integrations/get_scan_results`, body);
                    core.setOutput('Scan Results', JSON.stringify(resultsResponse.data.vulnerabilities));
                    // Count only vulnerabilities that meet or exceed the threshold
                    let vulnerability_count = 0;
                    const vulnerabilities = resultsResponse.data.vulnerabilities;
                    // Debug log to see what we're working with
                    core.info(`Current severity threshold: ${severityThreshold} (value: ${thresholdValue})`);
                    core.info(`Vulnerabilities found: ${JSON.stringify(vulnerabilities)}`);
                    // Count vulnerabilities that meet or exceed threshold
                    for (const [severity, count] of Object.entries(vulnerabilities)) {
                        const severityValue = severityLevels[severity];
                        if (severityValue >= thresholdValue) {
                            vulnerability_count += Number(count); // Ensure we're adding numbers
                        }
                    }
                    // Debug log the final count
                    core.info(`Total vulnerabilities meeting threshold: ${vulnerability_count}`);
                    // Set success/failure based on findings
                    if (vulnerability_count > 0) {
                        core.setFailed(`🚨 ${vulnerability_count} security vulnerabilities found with severity ${severityThreshold} or higher`);
                    }
                    else {
                        core.info(`✅ No security vulnerabilities found with severity ${severityThreshold} or higher`);
                    }
                }
                else if (statusResponse.data.status === 'failed') {
                    throw new Error('Scan failed: ' + statusResponse.data.error);
                }
                else {
                    // Wait before polling again
                    yield new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        }
        catch (error) {
            if (error instanceof Error) {
                core.setFailed(error.message);
            }
            else {
                core.setFailed('An unknown error occurred');
            }
        }
    });
}
run();
