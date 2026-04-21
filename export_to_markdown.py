#!/usr/bin/env python3
"""
Export agents from Redis to local markdown files
"""

import redis
import json
from pathlib import Path

AGENTS_DIR = Path('agents')
redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

def create_agent_markdown(agent_data: dict) -> str:
    """Create detailed markdown from agent metadata in Code-Generator format"""
    
    agent_id = agent_data.get('agent_id', 'unknown')
    name = agent_data.get('name', 'Unknown Agent')
    description = agent_data.get('description', 'No description')
    version = agent_data.get('version', '1.0.0')
    status = agent_data.get('status', 'stable')
    technology = agent_data.get('technology', [])
    tasks = agent_data.get('tasks', [])
    specialization = agent_data.get('specialization', {})
    primary_spec = specialization.get('primary', 'General').replace('_', ' ').title()
    organization = agent_data.get('origin', {})
    rating = agent_data.get('rating', {})
    downloads = agent_data.get('downloads', {})
    
    tech_str = ', '.join(technology) if technology else 'Python, JavaScript, API'
    
    markdown = f"""# {name}

## Purpose
Enable **GitHub Copilot** as a specialized **{primary_spec} Specialist** generating high-quality {primary_spec.lower()} solutions adhering to project standards.

**Technology:** {tech_str}

**Invocation Examples:**
- `{name}` *(reads configuration from project)*
- `{name} (custom configuration)` *(uses provided config)*
- `{name} (full execution mode)` *(generates all components)*

---

## 🔧 DEVELOPER CONFIGURATION

> **Instructions:** Modify this section to specify configuration for this agent.  
> The agent will read these settings directly from this file.

### 🎯 Execution Mode

```yaml
execution_mode:
  mode: "full"  # Options: "analysis", "generation", or "full"
  async: false
```

**Options:**
- **analysis**: Analyze requirements and provide recommendations
- **generation**: Generate {primary_spec.lower()} artifacts
- **full**: Analyze, then generate complete solution

---

### 📦 Project Settings

```yaml
project:
  name: "{name.replace(' ', '')}"
  description: "{description}"
  version: "{version}"
  status: "{status}"
```

---

### 🎯 Configuration

**Primary Specialization:**
```yaml
specialization:
  primary: "{primary_spec}"
  domain_specific: {specialization.get('domain_specific', ['Integration', 'Automation'])}
```

**Supported Technologies:**
```yaml
technologies:
  - {chr(10).join(f"  - {t}" for t in technology) if technology else "  - Python\n  - JavaScript\n  - API"}
```

---

### 📋 Task Configuration

**Available Tasks:**
```yaml
tasks:
"""
    
    for task in tasks:
        task_name = task.get('name', 'unknown')
        markdown += f"  - name: {task_name}\n"
        markdown += f"    description: {task.get('description', 'Execute task')}\n"
        markdown += f"    async: {str(task.get('async', False)).lower()}\n"
    
    markdown += f"""
```

---

### 🌐 API & Integration Configuration

```yaml
api:
  base_path: "/api/v1"
  version: "v1"
  format: "json"

integration:
  environments: ["development", "staging", "production"]
  ci_cd_systems: ["GitHub Actions", "GitLab CI", "Jenkins", "Manual API"]
  api_authentication: "token-based"
```

---

### 📚 Guidelines Configuration

```yaml
guidelines:
  strict_mode: false
  validation_level: "standard"
```

---

### 📂 Output Configuration

```yaml
output:
  format: "complete"
  include_documentation: true
  include_tests: true
  include_examples: true
```

---

## 📖 Configuration Guide

### Execution Modes

**Analysis Mode:** Analyze requirements and provide recommendations
```yaml
execution_mode: {{ mode: "analysis" }}
```

**Generation Mode:** Generate {primary_spec.lower()} artifacts
```yaml
execution_mode: {{ mode: "generation" }}
```

**Full Mode:** Complete analysis and generation
```yaml
execution_mode: {{ mode: "full" }}
```

---

## 🚨 CORE RULES

### Rule 0: Configuration Loading
**Read configuration from this file:**
1. Parse `execution_mode.mode` (analysis, generation, or full)
2. Extract project settings (name, description, version, status)
3. Load specialization and domain areas
4. Read task definitions and configurations
5. Load API, integration, guidelines, and output configurations
6. **If mode = "analysis"**: Provide recommendations only
7. **If mode = "generation"**: Generate all required artifacts
8. **If mode = "full"**: Analyze first, then generate

### Rule 1: Requirements First (MANDATORY)
**BEFORE any generation:**
1. Load embedded configuration from "DEVELOPER CONFIGURATION" section
2. Validate specialization: {primary_spec}
3. Verify all required technologies available: {tech_str}
4. If configuration incomplete: **STOP and ASK developer**

### Rule 2: Configuration-Based Execution
**Follow embedded configuration specifications exactly:**
- **If execution_mode.mode = "analysis"**: Provide analysis only
- **If execution_mode.mode = "generation"**: Generate all artifacts
- **If execution_mode.mode = "full"**: Complete workflow
- Use domain areas for context: {', '.join(specialization.get('domain_specific', ['Integration', 'Automation']))}
- Follow all guidelines and standards

### Rule 3: Complete Artifact Generation (MANDATORY)
**ALWAYS generate comprehensive documentation and examples:**

**3.1 Core Documentation (MANDATORY):**
- ✅ Detailed specification documents
- ✅ API/Integration documentation
- ✅ Configuration guides
- ✅ Troubleshooting guides
- ✅ Integration examples

**3.2 Code Quality Standards:**
- ✅ Follow best practices for {primary_spec.lower()}
- ✅ Include error handling
- ✅ Add comprehensive comments
- ✅ Provide working examples

**3.3 Testing & Validation:**
- ✅ Include test cases
- ✅ Provide validation examples
- ✅ Document expected outputs
- ✅ Include error scenarios

**3.4 Validation Rules:**
- ❌ NEVER generate incomplete solutions
- ❌ NEVER skip documentation
- ❌ NEVER omit examples
- ✅ ALWAYS verify completeness
- ✅ ALWAYS include working examples
- ✅ ALWAYS provide clear instructions

### Rule 4: Quality Assurance (MANDATORY)
**Verify all generated artifacts:**
1. **Check completeness** - All required sections present
2. **Verify examples** - All code examples working
3. **Validate documentation** - Clear and accurate
4. **Test functionality** - All features working as specified
5. **Review standards** - Follows best practices

**Quality Checklist:**
- [ ] ✅ All required artifacts generated
- [ ] ✅ Documentation complete and accurate
- [ ] ✅ Code examples working correctly
- [ ] ✅ Configuration validated
- [ ] ✅ Error handling included
- [ ] ✅ Testing guidance provided

### Rule 5: Clarify First, Execute Later
**Never execute without explicit confirmation when requirements are missing/incomplete:**
- ✅ Load configuration → Validate → Ask questions → Present options → Wait for confirmation
- ❌ Never assume, never generate placeholders, never proceed with incomplete specs
- **Goal: Production-ready, complete artifacts matching requirements exactly.**

---

## 📖 Capabilities & Features

This agent provides:

### Core Capabilities
1. **{primary_spec} Analysis**
   - Analyze requirements and specifications
   - Identify gaps and risks
   - Provide recommendations

2. **Complete Solution Generation**
   - Generate all necessary artifacts
   - Follow best practices and standards
   - Include documentation and examples

3. **Integration Support**
   - Support multiple integration environments
   - Provide CI/CD integration guides
   - Include deployment documentation

### Supported Features
- Full {primary_spec} workflow support
- Multi-environment configuration
- Comprehensive documentation generation
- Example and test case generation
- Error handling and validation
- Standard compliance checking

---

## 📊 Agent Metrics

- **Specialization:** {primary_spec}
- **Version:** {version}
- **Status:** {status}
- **Jast Score:** {rating.get('Jast score', 'N/A')}
- **Grade:** {rating.get('grade', 'N/A')}
- **Stars:** {agent_data.get('stars', 0)}
- **Total Downloads:** {downloads.get('total_download_overall', 0)}

---

## 🔗 Integration Information

### Organization
- **Organization:** {organization.get('org', 'Unknown')}
- **Division:** {organization.get('sub_org', 'Unknown')}
- **Creator:** {organization.get('creator', 'Unknown')}

### Supported Environments
{', '.join(agent_data.get('supported_harness', ['Manual API'])) if agent_data.get('supported_harness') else 'Manual API'}

### Integration Points
This agent integrates with:
- Automation workflows and pipelines
- CI/CD systems (GitHub Actions, GitLab CI, Jenkins)
- Development team processes
- API-based integrations
- Custom scripts and tools

---

## 📝 Reference Information

- **Agent ID:** {agent_id}
- **Primary Specialization:** {primary_spec}
- **Domain Areas:** {', '.join(specialization.get('domain_specific', ['General']))}
- **Supported Technologies:** {tech_str}

---

## 🎯 Objectives

1. **Complete {primary_spec} Solution Generation**
2. **High-Quality Artifact Production**
3. **Comprehensive Documentation**
4. **Best Practice Compliance**
5. **Integration Ready Output**

---

*Agent auto-generated by NVIDIA Agent Generator*  
*Agent ID: {agent_id}*  
*Generated: {agent_data.get('downloads', {}).get('last_downloaded', 'N/A')}*
"""
    
    return markdown

def export_agents_to_markdown():
    """Export all agents from Redis to markdown files"""
    
    try:
        count = redis_client.hlen('agents_catalog')
        print(f"\n📥 Exporting {count} agents from Redis to local markdown files...")
        print("="*70)
        
        agent_ids = redis_client.hkeys('agents_catalog')
        exported = 0
        failed = 0
        
        for i, agent_id in enumerate(agent_ids, 1):
            try:
                # Get agent data from Redis
                agent_json = redis_client.hget('agents_catalog', agent_id)
                agent_data = json.loads(agent_json)
                
                # Create agent folder
                agent_folder = AGENTS_DIR / agent_id
                agent_folder.mkdir(parents=True, exist_ok=True)
                
                # Generate markdown
                markdown_content = create_agent_markdown(agent_data)
                
                # Save to file
                md_file = agent_folder / 'agent.md'
                with open(md_file, 'w', encoding='utf-8') as f:
                    f.write(markdown_content)
                
                if i % 100 == 0:
                    print(f"  [{i:4d}/{count}] Exported {agent_id}...")
                
                exported += 1
                
            except Exception as e:
                print(f"  ✗ Failed to export {agent_id}: {str(e)}")
                failed += 1
        
        print()
        print("="*70)
        print(f"✅ Export Complete!")
        print(f"   Exported: {exported} agents")
        print(f"   Failed: {failed} agents")
        print(f"   Location: agents/[agent-id]/agent.md")
        print()
        
        return exported > 0
        
    except Exception as e:
        print(f"✗ Export failed: {str(e)}")
        return False

if __name__ == '__main__':
    export_agents_to_markdown()
