import 'server-only';

import OpenAI from 'openai';
import { readFile } from 'fs/promises';
import type { AgentMdIssue, AgentMdReviewReport, SELAgentCard } from '@/types';
import { resolveSubmissionFile } from './submissionFiles';
import { isSkillMarkdownAttachment } from './attachmentNaming';

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const DEFAULT_ANALYSIS_MODEL = process.env.NVIDIA_ANALYSIS_MODEL || 'meta/llama-3.1-70b-instruct';

type RiskLevel = AgentMdReviewReport['riskLevel'];
type ScoreBucket = AgentMdReviewReport['scores'];

function getNvidiaClient() {
  if (!process.env.NVIDIA_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: NVIDIA_BASE_URL,
  });
}

function addIssue(
  issues: AgentMdIssue[],
  issue: AgentMdIssue,
  scoreBucket: ScoreBucket
) {
  issues.push(issue);
  if (issue.category === 'malicious_intent') scoreBucket.maliciousIntent += issue.severity === 'critical' ? 55 : issue.severity === 'high' ? 35 : 18;
  if (issue.category === 'verbosity') scoreBucket.verbosity += issue.severity === 'high' ? 35 : issue.severity === 'medium' ? 20 : 10;
  if (issue.category === 'optimization') scoreBucket.optimization += issue.severity === 'high' ? 30 : issue.severity === 'medium' ? 18 : 8;
  if (issue.category === 'clarity' || issue.category === 'conflict') scoreBucket.clarity += issue.severity === 'high' ? 28 : issue.severity === 'medium' ? 16 : 8;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function toRiskLevel(scores: ScoreBucket, issues: AgentMdIssue[]): RiskLevel {
  const maxScore = Math.max(scores.maliciousIntent, scores.verbosity, scores.optimization, scores.clarity);
  const criticalIssue = issues.some((issue) => issue.severity === 'critical');
  const highIssues = issues.filter((issue) => issue.severity === 'high').length;

  if (scores.maliciousIntent >= 70 || criticalIssue || maxScore >= 82) return 'critical';
  if (scores.maliciousIntent >= 45 || highIssues >= 2 || maxScore >= 58) return 'high';
  if (maxScore >= 24 || issues.length >= 2) return 'medium';
  return 'low';
}

function snippet(content: string, match: RegExp) {
  const result = content.match(match);
  return result?.[0]?.slice(0, 180);
}

function countMatches(content: string, pattern: RegExp) {
  return content.match(pattern)?.length || 0;
}

function deriveOverallScore(scores: ScoreBucket, strengths: string[], issues: AgentMdIssue[]) {
  const weightedPenalty =
    scores.maliciousIntent * 0.45 +
    scores.verbosity * 0.2 +
    scores.optimization * 0.18 +
    scores.clarity * 0.17;
  const bonus = Math.min(14, strengths.length * 2);
  const severityPenalty = issues.reduce((total, issue) => {
    if (issue.severity === 'critical') return total + 10;
    if (issue.severity === 'high') return total + 6;
    if (issue.severity === 'medium') return total + 3;
    return total + 1;
  }, 0);

  return clampScore(100 - weightedPenalty - severityPenalty + bonus);
}

function toRating(score: number) {
  return Math.max(1, Math.min(5, Number((score / 20).toFixed(1))));
}

function buildDeterministicReport(agent: SELAgentCard, fileName: string, content: string): AgentMdReviewReport {
  const issues: AgentMdIssue[] = [];
  const strengths: string[] = [];
  const scores: ScoreBucket = {
    maliciousIntent: 0,
    verbosity: 0,
    optimization: 0,
    clarity: 0,
  };

  const normalizedLines = content.split(/\r?\n/).map((line) => line.trim());
  const nonEmptyLines = normalizedLines.filter(Boolean);
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const lineCount = normalizedLines.length;
  const uniqueLines = new Set(nonEmptyLines);
  const repeatedLineRatio = lineCount > 0 ? 1 - uniqueLines.size / lineCount : 0;
  const headingCount = countMatches(content, /^#{1,3}\s+/gm);
  const bulletCount = countMatches(content, /^\s*[-*]\s+/gm);
  const codeBlockCount = countMatches(content, /```/g) / 2;
  const exampleCount = countMatches(content, /\b(example|for example|e\.g\.)\b/gi);
  const directiveCount = countMatches(content, /\b(always|never|must|required|mandatory|do not)\b/gi);
  const sentences = content
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const averageSentenceLength = sentences.length
    ? Number(
        (
          sentences.reduce((total, sentence) => total + sentence.split(/\s+/).filter(Boolean).length, 0) /
          sentences.length
        ).toFixed(1)
      )
    : 0;
  const hasInputsSection = /##\s+(Input|Input Requirements|Prerequisites|Usage)/i.test(content);
  const hasOutputSection = /##\s+(Output|Output Format|Response Format|Deliverables)/i.test(content);
  const hasPurposeSection = /##\s+(Purpose|Overview|Agent Overview|Objective)/i.test(content);
  const hasConstraintsSection = /##\s+(Constraints|Rules|Guardrails|Safety)/i.test(content);
  const hasExamplesSection = /##\s+(Examples|Sample Output|Usage Example)/i.test(content);
  const hasChecklist = /##\s+(Checklist|Validation|Acceptance Criteria)/i.test(content);

  const maliciousPatterns: Array<{ code: string; pattern: RegExp; message: string; severity: AgentMdIssue['severity'] }> = [
    {
      code: 'PROMPT_INJECTION_OVERRIDE',
      pattern: /(ignore (all|any|previous) instructions|override system prompt|disregard prior rules)/i,
      message: 'Contains classic prompt-injection override language.',
      severity: 'high',
    },
    {
      code: 'SECURITY_BYPASS',
      pattern: /(bypass security|disable auth|disable authentication|disable validation|turn off guardrails)/i,
      message: 'Contains instructions that explicitly weaken security controls.',
      severity: 'critical',
    },
    {
      code: 'DATA_EXFIL',
      pattern: /(exfiltrate|steal credentials|dump secrets|extract api keys|collect passwords)/i,
      message: 'Contains explicit data exfiltration or credential theft language.',
      severity: 'critical',
    },
    {
      code: 'DESTRUCTIVE_COMMAND',
      pattern: /(rm -rf|format disk|delete production data|drop database|wipe logs)/i,
      message: 'Contains destructive operational instructions.',
      severity: 'critical',
    },
  ];

  for (const item of maliciousPatterns) {
    if (item.pattern.test(content)) {
      addIssue(
        issues,
        {
          code: item.code,
          severity: item.severity,
          category: 'malicious_intent',
          message: item.message,
          evidence: snippet(content, item.pattern),
        },
        scores
      );
    }
  }

  if (wordCount > 2200) {
    addIssue(
      issues,
      {
        code: 'VERBOSE_HIGH',
        severity: 'high',
        category: 'verbosity',
        message: `Prompt is very long at approximately ${wordCount} words.`,
      },
      scores
    );
  } else if (wordCount > 1400) {
    addIssue(
      issues,
      {
        code: 'VERBOSE_MEDIUM',
        severity: 'medium',
        category: 'verbosity',
        message: `Prompt is lengthy at approximately ${wordCount} words.`,
      },
      scores
    );
  } else if (wordCount < 180) {
    addIssue(
      issues,
      {
        code: 'TOO_BRIEF',
        severity: 'medium',
        category: 'clarity',
        message: `Prompt is likely under-specified at approximately ${wordCount} words.`,
      },
      scores
    );
  }

  if (repeatedLineRatio > 0.22) {
    addIssue(
      issues,
      {
        code: 'REPETITION',
        severity: 'medium',
        category: 'optimization',
        message: 'Prompt contains a high ratio of repeated or near-duplicate lines.',
      },
      scores
    );
  }

  if (directiveCount > 35) {
    addIssue(
      issues,
      {
        code: 'DIRECTIVE_DENSITY',
        severity: 'medium',
        category: 'optimization',
        message: 'Prompt is directive-heavy and may be more rigid than necessary.',
      },
      scores
    );
  }

  if (averageSentenceLength > 28) {
    addIssue(
      issues,
      {
        code: 'DENSE_SENTENCES',
        severity: 'medium',
        category: 'verbosity',
        message: `Average sentence length is ${averageSentenceLength} words, which makes the prompt harder to scan.`,
      },
      scores
    );
  }

  if (/\{\{[^}]+\}\}/.test(content) || /\b(TODO|TBD)\b/i.test(content)) {
    addIssue(
      issues,
      {
        code: 'UNRESOLVED_PLACEHOLDERS',
        severity: 'high',
        category: 'clarity',
        message: 'Prompt still contains unresolved placeholders or TODO/TBD markers.',
        evidence: snippet(content, /\{\{[^}]+\}\}|\b(TODO|TBD)\b/i),
      },
      scores
    );
  }

  if (!hasPurposeSection) {
    addIssue(
      issues,
      {
        code: 'MISSING_PURPOSE_SECTION',
        severity: 'low',
        category: 'clarity',
        message: 'Prompt does not expose a clearly labeled purpose or overview section.',
      },
      scores
    );
  } else {
    strengths.push('Clear purpose or overview section is present.');
  }

  if (!hasInputsSection) {
    addIssue(
      issues,
      {
        code: 'MISSING_INPUT_CONTRACT',
        severity: 'medium',
        category: 'clarity',
        message: 'Prompt does not clearly define the required inputs or operating contract.',
      },
      scores
    );
  } else {
    strengths.push('Input expectations are documented.');
  }

  if (!hasOutputSection) {
    addIssue(
      issues,
      {
        code: 'MISSING_OUTPUT_CONTRACT',
        severity: 'medium',
        category: 'clarity',
        message: 'Prompt does not clearly define the expected output format or deliverables.',
      },
      scores
    );
  } else {
    strengths.push('Output expectations are clearly defined.');
  }

  if (!hasConstraintsSection) {
    addIssue(
      issues,
      {
        code: 'MISSING_CONSTRAINTS',
        severity: 'low',
        category: 'clarity',
        message: 'Prompt does not clearly state constraints, guardrails, or non-goals.',
      },
      scores
    );
  } else {
    strengths.push('Constraints or guardrails are explicitly documented.');
  }

  if (headingCount < 3) {
    addIssue(
      issues,
      {
        code: 'WEAK_SECTIONING',
        severity: 'medium',
        category: 'optimization',
        message: 'Prompt has too little structural sectioning for enterprise review and maintenance.',
      },
      scores
    );
  } else {
    strengths.push(`Structured with ${headingCount} headings for scanability.`);
  }

  if (bulletCount >= 6) {
    strengths.push('Uses bullet lists to break down instructions for quick scanning.');
  }

  if (codeBlockCount > 0 || hasExamplesSection || exampleCount > 0) {
    strengths.push('Includes examples or code blocks that improve execution fidelity.');
  } else {
    addIssue(
      issues,
      {
        code: 'MISSING_EXAMPLES',
        severity: 'low',
        category: 'optimization',
        message: 'Prompt does not include examples or code blocks to anchor expected behavior.',
      },
      scores
    );
  }

  if (hasChecklist) {
    strengths.push('Includes validation or acceptance criteria for self-checking.');
  }

  if (/whole project mode/i.test(content) && /selective mode/i.test(content) && !/mode:/i.test(content)) {
    addIssue(
      issues,
      {
        code: 'AMBIGUOUS_MODE_SWITCH',
        severity: 'medium',
        category: 'conflict',
        message: 'Prompt references multiple operating modes without a clear selection mechanism.',
      },
      scores
    );
  }

  if (/do not ask questions/i.test(content) && /(ask clarifying questions|request clarification)/i.test(content)) {
    addIssue(
      issues,
      {
        code: 'CONFLICTING_INTERACTION_MODEL',
        severity: 'high',
        category: 'conflict',
        message: 'Prompt contains conflicting instructions about whether the agent should ask clarifying questions.',
      },
      scores
    );
  }

  scores.maliciousIntent = clampScore(scores.maliciousIntent);
  scores.verbosity = clampScore(scores.verbosity);
  scores.optimization = clampScore(scores.optimization);
  scores.clarity = clampScore(scores.clarity);

  const riskLevel = toRiskLevel(scores, issues);
  const overallScore = deriveOverallScore(scores, strengths, issues);
  const overallRating = toRating(overallScore);
  const recommendations = [
    scores.verbosity >= 30 ? 'Reduce repetitive instructional blocks and split long sentences into tighter, outcome-focused guidance.' : 'Prompt length is within a manageable range.',
    scores.optimization >= 30 ? 'Consolidate duplicated guidance and add stronger structural sections or examples to improve execution consistency.' : 'Prompt structure is reasonably compact.',
    scores.clarity >= 30 ? 'Tighten the input/output contract and make guardrails or deliverables more explicit before approval.' : 'Prompt contract is mostly clear.',
    scores.maliciousIntent >= 30 ? 'Escalate for security review before approval because the prompt contains potentially unsafe instruction patterns.' : 'No strong malicious-intent signal was found deterministically.',
  ].filter((value, index, array) => array.indexOf(value) === index);

  const summary =
    issues.length === 0
      ? `${agent.name} is well-structured and low risk. The prompt reads clearly, has a solid operating contract, and scores ${overallRating}/5 overall.`
      : `${agent.name} scores ${overallRating}/5 overall with ${issues.length} notable findings in ${fileName}. The biggest concerns are ${issues
          .slice(0, 3)
          .map((issue) => issue.category.replace(/_/g, ' '))
          .filter((value, index, array) => array.indexOf(value) === index)
          .join(', ')}.`;

  return {
    fileName,
    generatedAt: new Date().toISOString(),
    model: 'deterministic-rules',
    riskLevel,
    summary,
    overallScore,
    overallRating,
    scores,
    strengths: strengths.slice(0, 5),
    metrics: {
      wordCount,
      headingCount,
      bulletCount,
      codeBlockCount,
      exampleCount,
      directiveCount,
      averageSentenceLength,
    },
    issues,
    recommendations,
  };
}

async function enrichWithLlm(
  report: AgentMdReviewReport,
  content: string
): Promise<AgentMdReviewReport> {
  const client = getNvidiaClient();
  if (!client) {
    return report;
  }

  try {
    const response = await client.chat.completions.create({
      model: DEFAULT_ANALYSIS_MODEL,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'You are an enterprise prompt-review analyst evaluating a single agent markdown file for admin approval. Judge the actual content, not just the deterministic hints. Return strict JSON with keys summary, riskLevel, overallScore, overallRating, strengths, recommendations, scores, issues. overallScore must be 0-100. overallRating must be 1-5. scores must include maliciousIntent, verbosity, optimization, clarity as integers 0-100. issues must be an array of objects with keys code, severity, category, message, evidence. Be specific, cite concrete evidence from the markdown, avoid repeating the same criticism across every file, and balance strengths with weaknesses. Use riskLevel low/medium/high/critical based on practical approval risk.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            fileType: 'agent.md',
            deterministicReport: report,
            content,
          }),
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim() || '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as Partial<AgentMdReviewReport>;

    const llmIssues = Array.isArray(parsed.issues) ? parsed.issues : [];
    const mergedIssues = [...report.issues];
    for (const issue of llmIssues) {
      if (!issue || typeof issue !== 'object') continue;
      if (typeof issue.code !== 'string' || typeof issue.message !== 'string') continue;
      mergedIssues.push({
        code: issue.code,
        severity:
          issue.severity === 'critical' || issue.severity === 'high' || issue.severity === 'medium'
            ? issue.severity
            : 'low',
        category:
          issue.category === 'malicious_intent' ||
          issue.category === 'verbosity' ||
          issue.category === 'optimization' ||
          issue.category === 'clarity' ||
          issue.category === 'conflict'
            ? issue.category
            : 'clarity',
        message: issue.message,
        evidence: typeof issue.evidence === 'string' ? issue.evidence : undefined,
      });
    }

    const mergedScores = {
      maliciousIntent: Math.max(report.scores.maliciousIntent, Number(parsed.scores?.maliciousIntent || 0)),
      verbosity: Math.max(report.scores.verbosity, Number(parsed.scores?.verbosity || 0)),
      optimization: Math.max(report.scores.optimization, Number(parsed.scores?.optimization || 0)),
      clarity: Math.max(report.scores.clarity, Number(parsed.scores?.clarity || 0)),
    };

    return {
      fileName: report.fileName,
      generatedAt: new Date().toISOString(),
      model: DEFAULT_ANALYSIS_MODEL,
      riskLevel:
        parsed.riskLevel === 'critical' || parsed.riskLevel === 'high' || parsed.riskLevel === 'medium'
          ? parsed.riskLevel
          : toRiskLevel(mergedScores, mergedIssues),
      summary: typeof parsed.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : report.summary,
      overallScore: clampScore(Number(parsed.overallScore || report.overallScore)),
      overallRating: Math.max(1, Math.min(5, Number(parsed.overallRating || report.overallRating))),
      scores: mergedScores,
      strengths:
        Array.isArray(parsed.strengths) && parsed.strengths.length
          ? parsed.strengths.filter((item): item is string => typeof item === 'string').slice(0, 5)
          : report.strengths,
      metrics: report.metrics,
      issues: mergedIssues,
      recommendations:
        Array.isArray(parsed.recommendations) && parsed.recommendations.length
          ? parsed.recommendations.filter((item): item is string => typeof item === 'string')
          : report.recommendations,
    };
  } catch (error) {
    console.error('Failed to enrich agent.md review with LLM:', error);
    return report;
  }
}

export async function generateAgentMdReview(
  agent: SELAgentCard,
  options?: { skipLlm?: boolean }
): Promise<AgentMdReviewReport | null> {
  const agentMdFile = agent.sourceFiles?.find((file) => isSkillMarkdownAttachment(file.name));
  if (!agentMdFile) {
    return null;
  }

  try {
    const content = await readFile(resolveSubmissionFile(agentMdFile), 'utf-8');
    const deterministicReport = buildDeterministicReport(agent, agentMdFile.name, content);
    if (options?.skipLlm) {
      return deterministicReport;
    }

    return enrichWithLlm(deterministicReport, content);
  } catch (error) {
    console.error('Failed to generate agent.md review report:', error);
    return null;
  }
}
