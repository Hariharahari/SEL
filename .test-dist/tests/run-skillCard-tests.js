"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const skillCard_1 = require("../lib/skillCard");
const attachmentNaming_1 = require("../lib/attachmentNaming");
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
        maintainers: [
            {
                name: 'Security Ops',
                contact: 'sec@company.com',
            },
        ],
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
        video_url: 'https://example.com/demo.mp4',
    },
};
const cases = [
    {
        name: 'normalizeSkillUploadPayload converts a valid skill card into internal agent shape',
        run: () => {
            const { skillCard, agentCard } = (0, skillCard_1.normalizeSkillUploadPayload)(validPayload);
            strict_1.default.equal(skillCard.origin.creator, 'Sec-Lead');
            strict_1.default.equal(agentCard['agent id'], 'secure-code-guard');
            strict_1.default.equal(agentCard.origin.creator, 'Sec-Lead');
            strict_1.default.deepEqual(agentCard['supported harness'], ['Windsurf']);
            strict_1.default.equal(agentCard.video_url, 'https://example.com/demo.mp4');
        },
    },
    {
        name: 'normalizeSkillUploadPayload rejects payload without creator',
        run: () => {
            const payloadWithoutCreator = {
                skill_card: Object.assign(Object.assign({}, validPayload.skill_card), { origin: {
                        org: 'SEL-Core',
                        sub_org: 'Security',
                    } }),
            };
            strict_1.default.throws(() => (0, skillCard_1.normalizeSkillUploadPayload)(payloadWithoutCreator), /origin\.creator/);
        },
    },
    {
        name: 'normalizeSkillUploadPayload rejects skill ids with spaces',
        run: () => {
            strict_1.default.throws(() => (0, skillCard_1.normalizeSkillUploadPayload)({
                skill_card: Object.assign(Object.assign({}, validPayload.skill_card), { starterkit_id: 'secure code guard' }),
            }), /Spaces are not allowed/);
        },
    },
    {
        name: 'buildSkillPayloadFromFormData parses list and JSON fields correctly',
        run: () => {
            const formData = new FormData();
            formData.set('starterkit_id', ' release-readiness-radar ');
            formData.set('name', ' Release Readiness Radar ');
            formData.set('description', ' Checks release blockers ');
            formData.set('origin_org', 'SEL-Core');
            formData.set('origin_sub_org', 'Platform');
            formData.set('origin_creator', 'Release-Lead');
            formData.set('version', '1.4.0');
            formData.set('status', 'verified');
            formData.set('technology', 'GitHub Actions, Node.js, YAML');
            formData.set('specialization_primary', 'release_engineering');
            formData.set('specialization_domain_specific', 'CI Governance, Deployment Safety');
            formData.set('documentation_readme', 'https://example.com/readme');
            formData.set('documentation_howto', 'https://example.com/howto');
            formData.set('documentation_changelog', 'v1.4');
            formData.set('supported_harness', 'Windsurf, Codex');
            formData.set('video_url', 'https://example.com/demo.mp4');
            formData.set('maintainersJson', JSON.stringify([{ name: 'Platform Reliability', contact: 'platform@example.com' }]));
            formData.set('tasksJson', JSON.stringify([{ name: 'Check Release Gates', description: 'Validates release readiness.', async: true }]));
            const payload = (0, skillCard_1.buildSkillPayloadFromFormData)(formData);
            const skill = payload.skill_card;
            strict_1.default.equal(skill.starterkit_id, 'release-readiness-radar');
            strict_1.default.equal(skill.origin.creator, 'Release-Lead');
            strict_1.default.deepEqual(skill.technology, ['GitHub Actions', 'Node.js', 'YAML']);
            strict_1.default.deepEqual(skill.supported_harness, ['Windsurf', 'Codex']);
        },
    },
    {
        name: 'buildSkillPayloadFromFormData rejects invalid maintainers JSON',
        run: () => {
            const formData = new FormData();
            formData.set('maintainersJson', '{not-json');
            formData.set('tasksJson', '[]');
            strict_1.default.throws(() => (0, skillCard_1.buildSkillPayloadFromFormData)(formData), /Maintainers JSON is invalid/);
        },
    },
    {
        name: 'buildSkillPayloadFromFormData rejects invalid tasks JSON',
        run: () => {
            const formData = new FormData();
            formData.set('maintainersJson', '[]');
            formData.set('tasksJson', '{not-json');
            strict_1.default.throws(() => (0, skillCard_1.buildSkillPayloadFromFormData)(formData), /Tasks JSON is invalid/);
        },
    },
    {
        name: 'buildSkillPayloadFromJsonText parses valid JSON',
        run: () => {
            const parsed = (0, skillCard_1.buildSkillPayloadFromJsonText)(JSON.stringify(validPayload));
            strict_1.default.deepEqual(parsed, validPayload);
        },
    },
    {
        name: 'buildSkillPayloadFromJsonText rejects malformed JSON',
        run: () => {
            strict_1.default.throws(() => (0, skillCard_1.buildSkillPayloadFromJsonText)('{bad-json'), /Skill JSON is invalid/);
        },
    },
    {
        name: 'buildSkillAttachmentFileName normalizes markdown and video names from the skill id',
        run: () => {
            strict_1.default.equal((0, attachmentNaming_1.buildSkillAttachmentFileName)('java-backend-code-generator', 'agent.md', 'text/markdown'), 'java-backend-code-generator-agent.md');
            strict_1.default.equal((0, attachmentNaming_1.buildSkillAttachmentFileName)('java-backend-code-generator', 'demo.mov', 'video/quicktime'), 'java-backend-code-generator.mp4');
        },
    },
    {
        name: 'isSkillMarkdownAttachment accepts normalized and legacy markdown file names',
        run: () => {
            strict_1.default.equal((0, attachmentNaming_1.isSkillMarkdownAttachment)('java-backend-code-generator-agent.md'), true);
            strict_1.default.equal((0, attachmentNaming_1.isSkillMarkdownAttachment)('agent.md'), true);
            strict_1.default.equal((0, attachmentNaming_1.isSkillMarkdownAttachment)('java-backend-code-generator.mp4'), false);
        },
    },
];
let passed = 0;
const failures = [];
for (const testCase of cases) {
    try {
        testCase.run();
        passed += 1;
        console.log(`PASS ${testCase.name}`);
    }
    catch (error) {
        failures.push({ name: testCase.name, error });
        console.error(`FAIL ${testCase.name}`);
        console.error(error);
    }
}
console.log(`\n${passed}/${cases.length} tests passed`);
if (failures.length > 0) {
    process.exitCode = 1;
}
//# sourceMappingURL=run-skillCard-tests.js.map