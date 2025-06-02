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
            // Initialize API client
            const client = axios_1.default.create({
                baseURL: apiUrl,
                headers: {
                    'X-APYGUARD-TOKEN': `${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            const body = {
                "scan_task_id": taskId
            };
            // Start the scan
            core.info('🚀 Starting ApyGuard scan...');
            const startResponse = yield client.post(`api/api_security/start_github_api_scan`, body);
            if (startResponse.status !== 200) {
                throw new Error('Failed to start scan');
            }
            // Poll for results
            let scanComplete = false;
            while (!scanComplete) {
                const statusResponse = yield client.get(`/tasks/${taskId}/status`);
                if (statusResponse.data.status === 'completed') {
                    scanComplete = true;
                    core.info('✅ Scan completed successfully');
                    // Get scan results
                    const resultsResponse = yield client.get(`/tasks/${taskId}/results`);
                    core.setOutput('results', JSON.stringify(resultsResponse.data));
                    // Set success/failure based on findings
                    if (resultsResponse.data.findings.length > 0) {
                        core.setFailed('Security vulnerabilities found');
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
