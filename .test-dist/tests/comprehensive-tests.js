"use strict";
/**
 * Comprehensive Test Suite for SEL Ignite
 * Covers all critical modules and functions
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.report = void 0;
exports.runTests = runTests;
const strict_1 = __importDefault(require("node:assert/strict"));
const skillCard_1 = require("../lib/skillCard");
const attachmentNaming_1 = require("../lib/attachmentNaming");
const categoryMapping_1 = require("../lib/categoryMapping");
const report = {
    passed: 0,
    failed: 0,
    total: 0,
    duration: 0,
    failures: [],
    categoryResults: new Map(),
};
exports.report = report;
// ============================================================================
// SKILL CARD TESTS
// ============================================================================
const skillCardTests = [
    {
        name: 'normalizeSkillUploadPayload: converts valid skill card into internal shape',
        category: 'SkillCard',
        run: () => {
            const validPayload = {
                skill_card: {
                    starterkit_id: 'secure-code-guard',
                    name: 'Cyber Armor Guard',
                    description: 'Audits API routes for common security issues.',
                    origin: {
                        org: 'SEL-Core',
                        sub_org: 'Security',
                        creator: 'Sec-Lead',
                    },
                    maintainers: [{ name: 'Security Ops', contact: 'sec@company.com' }],
                    version: '2.1.0',
                    status: 'verified',
                    technology: ['Next.js', 'Zod'],
                    specialization: {
                        primary: 'security_review',
                        domain_specific: ['Auth Patterns', 'Data Sanitization'],
                    },
                    tasks: [
                        {
                            name: 'Audit API Route',
                            description: 'Scans for missing validation.',
                            async: false,
                        },
                    ],
                    documentation: {
                        readme: 'https://example.com/readme',
                        howto: 'https://example.com/howto',
                        changelog: 'v2 release',
                    },
                    supported_harness: ['Windsurf'],
                },
            };
            const { skillCard, agentCard } = (0, skillCard_1.normalizeSkillUploadPayload)(validPayload);
            strict_1.default.equal(skillCard.origin.creator, 'Sec-Lead');
            strict_1.default.equal(agentCard['agent id'], 'secure-code-guard');
            strict_1.default.equal(agentCard.origin.creator, 'Sec-Lead');
            strict_1.default.deepEqual(agentCard['supported harness'], ['Windsurf']);
        },
    },
    {
        name: 'normalizeSkillUploadPayload: rejects payload without creator',
        category: 'SkillCard',
        run: () => {
            const payloadWithoutCreator = {
                skill_card: {
                    starterkit_id: 'secure-code-guard',
                    name: 'Cyber Armor Guard',
                    description: 'Audits API routes.',
                    origin: { org: 'SEL-Core', sub_org: 'Security' },
                    maintainers: [],
                    version: '2.1.0',
                    status: 'verified',
                    technology: ['Next.js'],
                    specialization: { primary: 'security_review' },
                    tasks: [],
                    documentation: { readme: '', howto: '' },
                    supported_harness: [],
                },
            };
            strict_1.default.throws(() => (0, skillCard_1.normalizeSkillUploadPayload)(payloadWithoutCreator), /origin\.creator/);
        },
    },
    {
        name: 'normalizeSkillUploadPayload: rejects skill ids with spaces',
        category: 'SkillCard',
        run: () => {
            const payload = {
                skill_card: {
                    starterkit_id: 'secure code guard',
                    name: 'Cyber Armor Guard',
                    description: 'Audits API routes.',
                    origin: { org: 'SEL-Core', sub_org: 'Security', creator: 'Lead' },
                    maintainers: [],
                    version: '2.1.0',
                    status: 'verified',
                    technology: ['Next.js'],
                    specialization: { primary: 'security_review' },
                    tasks: [],
                    documentation: { readme: '', howto: '' },
                    supported_harness: [],
                },
            };
            strict_1.default.throws(() => (0, skillCard_1.normalizeSkillUploadPayload)(payload), /Spaces are not allowed/);
        },
    },
    {
        name: 'normalizeSkillUploadPayload: rejects invalid skill IDs with uppercase',
        category: 'SkillCard',
        run: () => {
            const payload = {
                skill_card: {
                    starterkit_id: 'SecureCodeGuard',
                    name: 'Cyber Armor Guard',
                    description: 'Audits API routes.',
                    origin: { org: 'SEL-Core', sub_org: 'Security', creator: 'Lead' },
                    maintainers: [],
                    version: '2.1.0',
                    status: 'verified',
                    technology: ['Next.js'],
                    specialization: { primary: 'security_review' },
                    tasks: [],
                    documentation: { readme: '', howto: '' },
                    supported_harness: [],
                },
            };
            strict_1.default.throws(() => (0, skillCard_1.normalizeSkillUploadPayload)(payload), /lowercase letters/);
        },
    },
    {
        name: 'normalizeSkillUploadPayload: rejects missing required fields',
        category: 'SkillCard',
        run: () => {
            const payload = { skill_card: { starterkit_id: 'test' } };
            strict_1.default.throws(() => (0, skillCard_1.normalizeSkillUploadPayload)(payload), /name/);
        },
    },
    {
        name: 'buildSkillPayloadFromFormData: parses form fields correctly',
        category: 'SkillCard',
        run: () => {
            const formData = new FormData();
            formData.set('starterkit_id', ' test-skill ');
            formData.set('name', ' Test Skill ');
            formData.set('description', ' A test skill ');
            formData.set('origin_org', 'Org');
            formData.set('origin_creator', 'Creator');
            formData.set('version', '1.0.0');
            formData.set('status', 'verified');
            formData.set('technology', 'Node.js, Express');
            formData.set('specialization_primary', 'code_generation');
            formData.set('documentation_readme', 'readme');
            formData.set('documentation_howto', 'howto');
            formData.set('supported_harness', 'Windsurf');
            formData.set('maintainersJson', '[]');
            formData.set('tasksJson', '[]');
            const payload = (0, skillCard_1.buildSkillPayloadFromFormData)(formData);
            strict_1.default.equal(payload.skill_card.starterkit_id, 'test-skill');
            strict_1.default.equal(payload.skill_card.name, 'Test Skill');
            strict_1.default.deepEqual(payload.skill_card.technology, ['Node.js', 'Express']);
        },
    },
    {
        name: 'buildSkillPayloadFromFormData: rejects invalid JSON',
        category: 'SkillCard',
        run: () => {
            const formData = new FormData();
            formData.set('maintainersJson', 'not-json');
            formData.set('tasksJson', '[]');
            strict_1.default.throws(() => (0, skillCard_1.buildSkillPayloadFromFormData)(formData), /Maintainers JSON/);
        },
    },
    {
        name: 'buildSkillPayloadFromJsonText: parses valid JSON',
        category: 'SkillCard',
        run: () => {
            const json = {
                skill_card: {
                    starterkit_id: 'test',
                    name: 'Test',
                    description: 'Test',
                    origin: { org: 'Org', creator: 'Creator' },
                    maintainers: [],
                    version: '1.0.0',
                    status: 'verified',
                    technology: [],
                    specialization: { primary: 'code_generation' },
                    tasks: [],
                    documentation: { readme: '', howto: '' },
                    supported_harness: [],
                },
            };
            const parsed = (0, skillCard_1.buildSkillPayloadFromJsonText)(JSON.stringify(json));
            strict_1.default.deepEqual(parsed.skill_card.starterkit_id, 'test');
        },
    },
    {
        name: 'buildSkillPayloadFromJsonText: rejects malformed JSON',
        category: 'SkillCard',
        run: () => {
            strict_1.default.throws(() => (0, skillCard_1.buildSkillPayloadFromJsonText)('{bad'), /Skill JSON/);
        },
    },
];
// ============================================================================
// ATTACHMENT NAMING TESTS
// ============================================================================
const attachmentTests = [
    {
        name: 'sanitizeAttachmentFileName: removes invalid characters',
        category: 'AttachmentNaming',
        run: () => {
            const result = (0, attachmentNaming_1.sanitizeAttachmentFileName)('my@#$file!.txt');
            strict_1.default.equal(result, 'my___file_.txt');
        },
    },
    {
        name: 'sanitizeAttachmentFileName: preserves valid characters',
        category: 'AttachmentNaming',
        run: () => {
            const result = (0, attachmentNaming_1.sanitizeAttachmentFileName)('my-file_123.txt');
            strict_1.default.equal(result, 'my-file_123.txt');
        },
    },
    {
        name: 'buildSkillAttachmentFileName: normalizes markdown files',
        category: 'AttachmentNaming',
        run: () => {
            const result = (0, attachmentNaming_1.buildSkillAttachmentFileName)('java-backend-code-generator', 'agent.md', 'text/markdown');
            strict_1.default.equal(result, 'java-backend-code-generator-agent.md');
        },
    },
    {
        name: 'buildSkillAttachmentFileName: normalizes video files',
        category: 'AttachmentNaming',
        run: () => {
            const result = (0, attachmentNaming_1.buildSkillAttachmentFileName)('java-backend-code-generator', 'demo.mov', 'video/quicktime');
            strict_1.default.equal(result, 'java-backend-code-generator.mp4');
        },
    },
    {
        name: 'buildSkillAttachmentFileName: handles video MIME types',
        category: 'AttachmentNaming',
        run: () => {
            const result1 = (0, attachmentNaming_1.buildSkillAttachmentFileName)('test-skill', 'demo.avi', 'video/x-msvideo');
            strict_1.default.equal(result1, 'test-skill.mp4');
            const result2 = (0, attachmentNaming_1.buildSkillAttachmentFileName)('test-skill', 'demo.webm', 'video/webm');
            strict_1.default.equal(result2, 'test-skill.mp4');
        },
    },
    {
        name: 'isSkillMarkdownAttachment: recognizes normalized names',
        category: 'AttachmentNaming',
        run: () => {
            strict_1.default.equal((0, attachmentNaming_1.isSkillMarkdownAttachment)('java-backend-code-generator-agent.md'), true);
            strict_1.default.equal((0, attachmentNaming_1.isSkillMarkdownAttachment)('agent.md'), true);
            strict_1.default.equal((0, attachmentNaming_1.isSkillMarkdownAttachment)('AGENT.MD'), true);
        },
    },
    {
        name: 'isSkillMarkdownAttachment: rejects non-markdown files',
        category: 'AttachmentNaming',
        run: () => {
            strict_1.default.equal((0, attachmentNaming_1.isSkillMarkdownAttachment)('java-backend-code-generator.mp4'), false);
            strict_1.default.equal((0, attachmentNaming_1.isSkillMarkdownAttachment)('readme.txt'), false);
            strict_1.default.equal((0, attachmentNaming_1.isSkillMarkdownAttachment)('config.json'), false);
        },
    },
    {
        name: 'isSkillVideoAttachment: recognizes video MIME types',
        category: 'AttachmentNaming',
        run: () => {
            strict_1.default.equal((0, attachmentNaming_1.isSkillVideoAttachment)('demo.mp4', 'video/mp4'), true);
            strict_1.default.equal((0, attachmentNaming_1.isSkillVideoAttachment)('demo.mov', 'video/quicktime'), true);
            strict_1.default.equal((0, attachmentNaming_1.isSkillVideoAttachment)('demo.webm', 'video/webm'), true);
        },
    },
    {
        name: 'isSkillVideoAttachment: recognizes video extensions',
        category: 'AttachmentNaming',
        run: () => {
            strict_1.default.equal((0, attachmentNaming_1.isSkillVideoAttachment)('demo.mp4', ''), true);
            strict_1.default.equal((0, attachmentNaming_1.isSkillVideoAttachment)('demo.mov', ''), true);
            strict_1.default.equal((0, attachmentNaming_1.isSkillVideoAttachment)('demo.webm', ''), true);
        },
    },
    {
        name: 'getSkillAttachmentSlot: identifies markdown slot',
        category: 'AttachmentNaming',
        run: () => {
            const slot = (0, attachmentNaming_1.getSkillAttachmentSlot)('java-backend-code-generator-agent.md');
            strict_1.default.equal(slot, 'markdown');
        },
    },
    {
        name: 'getSkillAttachmentSlot: identifies video slot',
        category: 'AttachmentNaming',
        run: () => {
            const slot = (0, attachmentNaming_1.getSkillAttachmentSlot)('demo.mp4', 'video/mp4');
            strict_1.default.equal(slot, 'video');
        },
    },
    {
        name: 'getSkillAttachmentSlot: returns null for other files',
        category: 'AttachmentNaming',
        run: () => {
            const slot = (0, attachmentNaming_1.getSkillAttachmentSlot)('readme.txt', 'text/plain');
            strict_1.default.equal(slot, null);
        },
    },
];
// ============================================================================
// CATEGORY MAPPING TESTS
// ============================================================================
const categoryTests = [
    {
        name: 'SPECIALIZATION_TO_CATEGORY: contains required mappings',
        category: 'CategoryMapping',
        run: () => {
            strict_1.default.ok(categoryMapping_1.SPECIALIZATION_TO_CATEGORY['code_generation']);
            strict_1.default.ok(categoryMapping_1.SPECIALIZATION_TO_CATEGORY['security_review']);
            strict_1.default.ok(categoryMapping_1.SPECIALIZATION_TO_CATEGORY['test_case_generation']);
        },
    },
    {
        name: 'SPECIALIZATION_TO_CATEGORY: maps to valid categories',
        category: 'CategoryMapping',
        run: () => {
            const mapping = categoryMapping_1.SPECIALIZATION_TO_CATEGORY['code_generation'];
            strict_1.default.ok(categoryMapping_1.CATEGORIES.includes(mapping.category));
            strict_1.default.equal(typeof mapping.subcategory, 'string');
        },
    },
    {
        name: 'SPECIALIZATION_TO_CATEGORY: security_review maps correctly',
        category: 'CategoryMapping',
        run: () => {
            const mapping = categoryMapping_1.SPECIALIZATION_TO_CATEGORY['security_review'];
            strict_1.default.equal(mapping.category, 'Security');
            strict_1.default.equal(mapping.subcategory, 'Code Security');
        },
    },
    {
        name: 'SPECIALIZATION_TO_CATEGORY: test mappings exist',
        category: 'CategoryMapping',
        run: () => {
            strict_1.default.ok(categoryMapping_1.SPECIALIZATION_TO_CATEGORY['test_case_generation']);
            strict_1.default.ok(categoryMapping_1.SPECIALIZATION_TO_CATEGORY['test_data_generation']);
            strict_1.default.equal(categoryMapping_1.SPECIALIZATION_TO_CATEGORY['test_case_generation'].category, 'Testing');
        },
    },
    {
        name: 'SPECIALIZATION_TO_CATEGORY: devops mappings exist',
        category: 'CategoryMapping',
        run: () => {
            strict_1.default.ok(categoryMapping_1.SPECIALIZATION_TO_CATEGORY['ci_cd_automation']);
            strict_1.default.ok(categoryMapping_1.SPECIALIZATION_TO_CATEGORY['devops_automation']);
            strict_1.default.equal(categoryMapping_1.SPECIALIZATION_TO_CATEGORY['ci_cd_automation'].category, 'DevOps');
        },
    },
    {
        name: 'CATEGORIES: contains all required categories',
        category: 'CategoryMapping',
        run: () => {
            const requiredCategories = [
                'Frontend',
                'Backend',
                'Testing',
                'DevOps',
                'Database',
                'Security',
                'Code Quality',
                'Monitoring',
                'Documentation',
                'Product',
            ];
            for (const cat of requiredCategories) {
                strict_1.default.ok(categoryMapping_1.CATEGORIES.includes(cat), `Missing category: ${cat}`);
            }
        },
    },
];
// ============================================================================
// RUN ALL TESTS
// ============================================================================
const allTests = [...skillCardTests, ...attachmentTests, ...categoryTests];
function runTests() {
    const startTime = Date.now();
    for (const testCase of allTests) {
        report.total += 1;
        if (!report.categoryResults.has(testCase.category)) {
            report.categoryResults.set(testCase.category, { passed: 0, failed: 0 });
        }
        try {
            testCase.run();
            report.passed += 1;
            const catResult = report.categoryResults.get(testCase.category);
            catResult.passed += 1;
            console.log(`✓ PASS: ${testCase.name}`);
        }
        catch (error) {
            report.failed += 1;
            const catResult = report.categoryResults.get(testCase.category);
            catResult.failed += 1;
            report.failures.push({ name: testCase.name, error });
            console.error(`✗ FAIL: ${testCase.name}`);
            if (error instanceof Error) {
                console.error(`  Error: ${error.message}`);
            }
        }
    }
    report.duration = Date.now() - startTime;
}
//# sourceMappingURL=comprehensive-tests.js.map