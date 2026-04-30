import { z } from "zod";

export const SkillCardSchema = z.object({
  starterkit_id: z.string().min(1),
  name:          z.string().min(1),
  description:   z.string().max(200),

  origin: z.object({
    org:     z.string(),
    sub_org: z.string().optional(),
    creator: z.string().optional(),
  }),

  maintainers: z.array(
    z.object({
      name:    z.string(),
      contact: z.string(),
    })
  ).max(3),

  version: z.string().regex(/^\d+\.\d+\.\d+$/, "Version must be in format x.y.z"),

  status: z.enum(["alpha", "beta", "rc", "stable", "deprecated"]),

  technology: z.array(z.string()).optional(),

  specialization: z.object({
    primary: z.enum([
      "code_generation", "refactoring", "test_case_generation",
      "test_data_generation", "reverse_engineering", "architecture_extraction",
      "ci_cd_automation", "documentation_generation", "requirement_interpretation",
      "api_design", "security_review", "static_analysis", "dynamic_analysis",
      "performance_optimization", "log_intelligence", "migration", "data_modeling",
      "monitoring_integration", "devops_automation", "iac_generation",
      "code_smell_detection", "vulnerability_review", "release_engineering",
    ]),
    domain_specific: z.array(z.string()).optional(),
  }),

  tasks: z.array(
    z.object({
      name:          z.string(),
      description:   z.string(),
      async:         z.boolean(),
      input_schema:  z.string().optional(),
      output_schema: z.string().optional(),
    })
  ).min(1),

  documentation: z.object({
    readme:    z.string(),
    howto:     z.string(),
    changelog: z.string().optional(),
  }),

  supported_harness: z.array(
    z.enum([
      "Claude", "GHCP", "Gemini Code-Assist", "Cline", "RooCode",
      "Codex", "Gitlab Duo", "Amp", "Devin", "Amelia", "Kiro",
      "AntiGravity", "Windsurf", "Cursor", "Fabro",
    ])
  ),

  

  rating: z.object({
    last_score: z.number().optional(),
    grade:      z.enum(["A+", "A", "B", "C", "D", "F"]).optional(),
  }).optional(),

  downloads: z.object({
    last_downloaded:        z.string().optional(),
    total_download_7_days:  z.number().optional(),
    total_download_30_days: z.number().optional(),
    total_download_overall: z.number().optional(),
    stars:                  z.number().optional(),
  }).optional(),
});

// ── Stored skill card type (Redis) ────────────────────
// file_url is added separately by user — not part of the skill card JSON
export const StoredSkillCardSchema = SkillCardSchema.extend({
  uploaded_by:    z.string(),
  uploaded_at:    z.string(),
  file_url:       z.string(), 
  is_approved:    z.boolean().default(false),
  is_rejected:    z.boolean().default(false),
  approved_by:    z.string().nullable().default(null),
  rejected_by:    z.string().nullable().default(null),
  approved_at:    z.string().nullable().default(null),
  rejected_at:    z.string().nullable().default(null),
  rejection_note: z.string().nullable().default(null),
  category: z.string().min(1).optional(),
  subcategory: z.string().min(1).optional(),
});

export type SkillCard       = z.infer<typeof SkillCardSchema>;
export type StoredSkillCard = z.infer<typeof StoredSkillCardSchema>;