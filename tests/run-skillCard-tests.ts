import assert from 'node:assert/strict';
import {
  buildSkillPayloadFromFormData,
  buildSkillPayloadFromJsonText,
  normalizeSkillUploadPayload,
  wrapSkillCard,
} from '../lib/skillCard';
import type { SkillUploadEnvelope } from '../types';

type Case = {
  name: string;
  run: () => void;
};

const validPayload: SkillUploadEnvelope = {
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

const cases: Case[] = [
  {
    name: 'normalizeSkillUploadPayload converts a valid skill card into internal agent shape',
    run: () => {
      const { skillCard, agentCard } = normalizeSkillUploadPayload(validPayload);
      assert.equal(skillCard.origin.creator, 'Sec-Lead');
      assert.equal(agentCard['agent id'], 'secure-code-guard');
      assert.equal(agentCard.origin.creator, 'Sec-Lead');
      assert.deepEqual(agentCard['supported harness'], ['Windsurf']);
      assert.equal(agentCard.video_url, 'https://example.com/demo.mp4');
    },
  },
  {
    name: 'normalizeSkillUploadPayload rejects payload without creator',
    run: () => {
      const payloadWithoutCreator = {
        skill_card: {
          ...validPayload.skill_card,
          origin: {
            org: 'SEL-Core',
            sub_org: 'Security',
          },
        },
      };
      assert.throws(
        () => normalizeSkillUploadPayload(payloadWithoutCreator),
        /origin\.creator/
      );
    },
  },
  {
    name: 'normalizeSkillUploadPayload rejects skill ids with spaces',
    run: () => {
      assert.throws(
        () =>
          normalizeSkillUploadPayload({
            skill_card: {
              ...validPayload.skill_card,
              starterkit_id: 'secure code guard',
            },
          }),
        /Spaces are not allowed/
      );
    },
  },
  {
    name: 'normalizeSkillUploadPayload accepts an unwrapped skill payload',
    run: () => {
      const { agentCard } = normalizeSkillUploadPayload(validPayload.skill_card);
      assert.equal(agentCard['agent id'], 'secure-code-guard');
    },
  },
  {
    name: 'normalizeSkillUploadPayload rejects non-object payloads',
    run: () => {
      assert.throws(() => normalizeSkillUploadPayload('bad-payload'), /JSON object/);
    },
  },
  {
    name: 'normalizeSkillUploadPayload falls back to stable and trims optional fields',
    run: () => {
      const payload = {
        skill_card: {
          ...validPayload.skill_card,
          status: '  UNKNOWN  ',
          origin: {
            ...validPayload.skill_card.origin,
            sub_org: ' Security ',
          },
          specialization: {
            primary: 'security_review',
            domain_specific: [' Auth Patterns ', ' ', 'Data Sanitization'],
          },
          github_url: ' https://github.com/example/repo ',
          video_url: ' https://example.com/demo.mp4 ',
        },
      };

      const { skillCard } = normalizeSkillUploadPayload(payload);
      assert.equal(skillCard.status, 'unknown');
      assert.equal(skillCard.origin.sub_org, 'Security');
      assert.deepEqual(skillCard.specialization.domain_specific, [
        'Auth Patterns',
        'Data Sanitization',
      ]);
      assert.equal(skillCard.github_url, 'https://github.com/example/repo');
      assert.equal(skillCard.video_url, 'https://example.com/demo.mp4');
    },
  },
  {
    name: 'normalizeSkillUploadPayload rejects missing required arrays and documentation',
    run: () => {
      assert.throws(
        () =>
          normalizeSkillUploadPayload({
            skill_card: {
              ...validPayload.skill_card,
              maintainers: 'bad',
            },
          }),
        /maintainers/
      );

      assert.throws(
        () =>
          normalizeSkillUploadPayload({
            skill_card: {
              ...validPayload.skill_card,
              technology: 'bad',
            },
          }),
        /technology/
      );

      assert.throws(
        () =>
          normalizeSkillUploadPayload({
            skill_card: {
              ...validPayload.skill_card,
              tasks: 'bad',
            },
          }),
        /tasks/
      );

      assert.throws(
        () =>
          normalizeSkillUploadPayload({
            skill_card: {
              ...validPayload.skill_card,
              documentation: {
                readme: 7,
                howto: null,
              },
            },
          }),
        /documentation/
      );
    },
  },
  {
    name: 'normalizeSkillUploadPayload preserves task schema fields and async flag',
    run: () => {
      const { skillCard } = normalizeSkillUploadPayload({
        skill_card: {
          ...validPayload.skill_card,
          tasks: [
            {
              name: 'Audit API Route',
              description: 'Scans for missing validation.',
              input_schema: '{"route":"string"}',
              output_schema: '{"issues":"array"}',
              async: 1,
            },
          ],
        },
      });

      assert.equal(skillCard.tasks[0].input_schema, '{"route":"string"}');
      assert.equal(skillCard.tasks[0].output_schema, '{"issues":"array"}');
      assert.equal(skillCard.tasks[0].async, true);
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
      formData.set(
        'maintainersJson',
        JSON.stringify([{ name: 'Platform Reliability', contact: 'platform@example.com' }])
      );
      formData.set(
        'tasksJson',
        JSON.stringify([{ name: 'Check Release Gates', description: 'Validates release readiness.', async: true }])
      );

      const payload = buildSkillPayloadFromFormData(formData);
      const skill = payload.skill_card;
      assert.equal(skill.starterkit_id, 'release-readiness-radar');
      assert.equal(skill.origin.creator, 'Release-Lead');
      assert.deepEqual(skill.technology, ['GitHub Actions', 'Node.js', 'YAML']);
      assert.deepEqual(skill.supported_harness, ['Windsurf', 'Codex']);
    },
  },
  {
    name: 'buildSkillPayloadFromFormData omits blank optional values cleanly',
    run: () => {
      const formData = new FormData();
      formData.set('starterkit_id', 'skill-id');
      formData.set('name', 'Skill Name');
      formData.set('description', 'Description');
      formData.set('origin_org', 'SEL-Core');
      formData.set('origin_sub_org', '   ');
      formData.set('origin_creator', 'Creator');
      formData.set('version', '1.0.0');
      formData.set('status', 'stable');
      formData.set('technology', 'Next.js, , Zod');
      formData.set('specialization_primary', 'security_review');
      formData.set('specialization_domain_specific', 'Auth Patterns, , Data Sanitization');
      formData.set('documentation_readme', 'https://example.com/readme');
      formData.set('documentation_howto', 'https://example.com/howto');
      formData.set('documentation_changelog', '   ');
      formData.set('supported_harness', 'Windsurf, , Codex');
      formData.set('video_url', '   ');
      formData.set('maintainersJson', '[]');
      formData.set('tasksJson', '[]');

      const payload = buildSkillPayloadFromFormData(formData);
      assert.equal(payload.skill_card.origin.sub_org, undefined);
      assert.equal(payload.skill_card.documentation.changelog, undefined);
      assert.equal(payload.skill_card.video_url, undefined);
      assert.deepEqual(payload.skill_card.technology, ['Next.js', 'Zod']);
      assert.deepEqual(payload.skill_card.supported_harness, ['Windsurf', 'Codex']);
      assert.deepEqual(payload.skill_card.specialization.domain_specific, [
        'Auth Patterns',
        'Data Sanitization',
      ]);
    },
  },
  {
    name: 'buildSkillPayloadFromFormData uses stable default status when omitted',
    run: () => {
      const formData = new FormData();
      formData.set('maintainersJson', '[]');
      formData.set('tasksJson', '[]');
      const payload = buildSkillPayloadFromFormData(formData);
      assert.equal(payload.skill_card.status, 'stable');
      assert.deepEqual(payload.skill_card.technology, []);
      assert.deepEqual(payload.skill_card.supported_harness, []);
    },
  },
  {
    name: 'buildSkillPayloadFromFormData rejects invalid maintainers JSON',
    run: () => {
      const formData = new FormData();
      formData.set('maintainersJson', '{not-json');
      formData.set('tasksJson', '[]');
      assert.throws(() => buildSkillPayloadFromFormData(formData), /Maintainers JSON is invalid/);
    },
  },
  {
    name: 'buildSkillPayloadFromFormData rejects invalid tasks JSON',
    run: () => {
      const formData = new FormData();
      formData.set('maintainersJson', '[]');
      formData.set('tasksJson', '{not-json');
      assert.throws(() => buildSkillPayloadFromFormData(formData), /Tasks JSON is invalid/);
    },
  },
  {
    name: 'buildSkillPayloadFromJsonText parses valid JSON',
    run: () => {
      const parsed = buildSkillPayloadFromJsonText(JSON.stringify(validPayload));
      assert.deepEqual(parsed, validPayload);
    },
  },
  {
    name: 'buildSkillPayloadFromJsonText rejects malformed JSON',
    run: () => {
      assert.throws(() => buildSkillPayloadFromJsonText('{bad-json'), /Skill JSON is invalid/);
    },
  },
  {
    name: 'wrapSkillCard returns the expected envelope shape',
    run: () => {
      const wrapped = wrapSkillCard(validPayload.skill_card);
      assert.deepEqual(wrapped, validPayload);
    },
  },
];

let passed = 0;
const failures: Array<{ name: string; error: unknown }> = [];

for (const testCase of cases) {
  try {
    testCase.run();
    passed += 1;
    console.log(`PASS ${testCase.name}`);
  } catch (error) {
    failures.push({ name: testCase.name, error });
    console.error(`FAIL ${testCase.name}`);
    console.error(error);
  }
}

console.log(`\n${passed}/${cases.length} tests passed`);

if (failures.length > 0) {
  process.exitCode = 1;
}
