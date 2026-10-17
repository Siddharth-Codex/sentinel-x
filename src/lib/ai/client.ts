import { Alert } from '../../types/alerts';
import { FlowRecord } from '../../types/network';

export interface AIAnalysisRequest {
  alert: Alert;
  supportingFlows?: FlowRecord[];
  prompt: string;
  model?: string;
  enableSearch?: boolean;
}

export interface AIAnalysisResponse {
  source: 'gemini-live' | 'deterministic-fallback';
  modelUsed?: string;
  summary: string;
  threatAssessment: string;
  benignExplanations: string[];
  recommendedDefensiveSteps: string[];
  confidenceAssessment: string;
  missingInformation: string[];
  isSimulatedDemo: boolean;
}

export async function consultAISecurityAnalyst(
  request: AIAnalysisRequest
): Promise<AIAnalysisResponse> {
  // Attempt to call server-side endpoint first
  try {
    const payload = {
      alertId: request.alert.id,
      detectorId: request.alert.detectorId,
      title: request.alert.title,
      description: request.alert.description,
      source_ip: request.alert.source_ip,
      destination_ip: request.alert.destination_ip,
      destination_port: request.alert.destination_port,
      anomalyScore: request.alert.anomalyScore,
      severity: request.alert.severity,
      confidence: request.alert.confidence,
      evidence: request.alert.evidence,
      userPrompt: request.prompt,
      isSynthetic: request.alert.isSynthetic,
      model: request.model || 'gemini-3.8-flash',
      enableSearch: request.enableSearch ?? true
    };

    const response = await fetch('/api/gemini/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.success && data.analysis) {
        return {
          source: data.isLive ? 'gemini-live' : 'deterministic-fallback',
          modelUsed: data.model || 'gemini-3.8-flash',
          summary: data.analysis.summary,
          threatAssessment: data.analysis.threatAssessment,
          benignExplanations: data.analysis.benignExplanations || [],
          recommendedDefensiveSteps: data.analysis.recommendedDefensiveSteps || [],
          confidenceAssessment: data.analysis.confidenceAssessment || '',
          missingInformation: data.analysis.missingInformation || [],
          isSimulatedDemo: request.alert.isSynthetic
        };
      }
    }
  } catch (err) {
    console.info('Server AI endpoint unavailable, using deterministic offline analyst fallback:', err);
  }

  // High-fidelity deterministic fallback engine for 100% reliable offline/demo operation
  return generateDeterministicAnalysis(request.alert, request.prompt);
}

function generateDeterministicAnalysis(alert: Alert, userPrompt: string): AIAnalysisResponse {
  const promptLower = userPrompt.toLowerCase();
  const alertId = alert.id;
  const src = alert.source_ip;
  const dst = alert.destination_ip || 'endpoints';

  let specificAssessment = alert.explanation;
  let benignList: string[] = [];
  let actionsList: string[] = alert.recommendedSteps;

  if (alert.detectorId === 'DET_CONN_COUNT') {
    specificAssessment = `Source ${src} contacted an unusually elevated number of endpoints within a short observation window. The statistical dispersion (Z-score ${alert.evidence[0]?.zScore || 'N/A'}) indicates high fan-out behavior.`;
    benignList = [
      'Approved administrative inventory scanning (e.g., Qualys, Nessus, Ansible).',
      'Local network service discovery (mDNS / SSDP broadcast agents).',
      'Web proxy or DNS forwarder redistributing aggregated client requests.'
    ];
  } else if (alert.detectorId === 'DET_PORT_ANOMALY') {
    specificAssessment = `Port activity from ${src} targeted destination ${dst} across abnormal port ranges or known risky ports.`;
    benignList = [
      'Internal penetration test or vulnerability audit scheduled by security operations.',
      'Software developer debugging multi-port microservices or custom RPC interfaces.',
      'Misconfigured local client retrying failed services on alternate ports.'
    ];
  } else if (alert.detectorId === 'DET_REPEATED_CONN') {
    specificAssessment = `A rigid, low-jitter recurrence pattern (~5-second intervals) links ${src} to ${dst}. Timing jitter is below normal human interaction thresholds.`;
    benignList = [
      'Automated telemetry or health-check heartbeat agent.',
      'NTP (Network Time Protocol) or dynamic DNS update daemon.',
      'Active WebSocket or long-polling client session.'
    ];
  } else if (alert.detectorId === 'DET_OUTBOUND_SURGE' || alert.detectorId === 'DET_TRAFFIC_VOLUME') {
    specificAssessment = `An unusually massive outbound data transmission was observed from ${src}. Upload volume substantially exceeds peer baselines.`;
    benignList = [
      'Scheduled enterprise cloud backup or database replication job.',
      'Legitimate video file upload, software build distribution, or OS update package push.',
      'Workstation migrating data to OneDrive, Google Drive, or SharePoint.'
    ];
  } else if (alert.detectorId === 'DET_MULTI_SIGNAL') {
    specificAssessment = `Entity ${src} exhibits correlated anomalous indicators across multiple independent detection engines, significantly reducing the probability of an isolated benign outlier.`;
    benignList = [
      'Comprehensive red-team exercise executing simultaneous reconnaissance and payload staging.',
      'Multi-purpose development bastion host running simultaneous bulk backups and API tests.'
    ];
  }

  // Tailor answer if user asked specific question
  if (promptLower.includes('benign') || promptLower.includes('false positive')) {
    specificAssessment += ` When evaluating benign hypotheses, verify whether the host has historical authority for this behavior.`;
  } else if (promptLower.includes('missing') || promptLower.includes('what else')) {
    specificAssessment += ` Additional host telemetry (EDR process trees, parent-child process hashes) would be needed to verify execution intent.`;
  }

  return {
    source: 'deterministic-fallback',
    modelUsed: 'Sentinel-X Deterministic Security Engine',
    summary: `Technical analysis of alert [${alertId}] affecting ${src}: ${alert.title}.`,
    threatAssessment: specificAssessment,
    benignExplanations: benignList.length > 0 ? benignList : [
      'Legitimate scheduled maintenance window or administrative task.',
      'Internal software deployment or automated build artifact retrieval.'
    ],
    recommendedDefensiveSteps: actionsList,
    confidenceAssessment: `Rated at ${alert.confidence}% based on evidence consistency and sample volume in current dataset.`,
    missingInformation: [
      'Host-level process command lines and PID trees (Sysmon / EDR).',
      'Decrypted TLS SNI / HTTP Host headers if payload was encrypted.',
      'Active Directory authentication logs (Kerberos / NTLM ticket requests).'
    ],
    isSimulatedDemo: alert.isSynthetic
  };
}
