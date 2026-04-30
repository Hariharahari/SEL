import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import redis from "@/lib/redis";
import { SkillCardSchema, StoredSkillCard } from "@/lib/skillSchema";
import { createCategorizer } from "@/lib/categorization";
import { z } from "zod";

const UploadSchema = z.object({
  skill_card: SkillCardSchema,
  file_url:   z.string().min(1, "File URL is required"),
});

export const POST = withAuth(async (req: NextRequest, { user }) => {
  // 1. parse and validate body
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = UploadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { skill_card: skill, file_url } = parsed.data;
  const redisKey = `skill:${skill.starterkit_id}:${skill.version}`;

  // 2. reject if same version already exists
  const exists = await redis.exists(redisKey);
  if (exists) {
    return NextResponse.json(
      { error: `Skill ${skill.starterkit_id} version ${skill.version} already exists` },
      { status: 409 }
    );
  }

  // 3. build stored skill card
  const storedSkill: StoredSkillCard = {
    ...skill,
    uploaded_by:    user.user_id,
    uploaded_at:    new Date().toISOString(),
    file_url,
    is_approved:    false,
    is_rejected:    false,
    approved_by:    null,
    rejected_by:    null,
    approved_at:    null,
    rejected_at:    null,
    rejection_note: null,
  };

  // 4. categorize the skill using GROK
  let categorization;
  try {
    const categorizer = createCategorizer();
    categorization = await categorizer.categorizeSkill(
      skill.name,
      skill.description,
      skill.technology || [],
      skill.tasks || []
    );
    
    // Update stored skill with categorization
    storedSkill.category = categorization.category;
    storedSkill.subcategory = categorization.subcategory;
  } catch (error) {
    console.error('Categorization failed:', error);
    // Continue without categorization - it's optional
  }

  // 5. store in Redis
  await redis.set(redisKey, JSON.stringify(storedSkill));

  // 6. update latest pointer
  await redis.set(`skill:${skill.starterkit_id}:latest`, skill.version);

  // 7. add to skills index
  await redis.sadd("skills:index", skill.starterkit_id);

  return NextResponse.json({
    success: true,
    message: "Skill uploaded successfully — pending approval",
    skill: {
      id:          skill.starterkit_id,
      version:     skill.version,
      name:        skill.name,
      file_url,
      is_approved: false,
      is_rejected: false,
      uploaded_by: user.user_id,
      uploaded_at: storedSkill.uploaded_at,
      category: storedSkill.category,
      subcategory: storedSkill.subcategory,
    },
  });
});