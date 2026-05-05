# Java Spring Boot Project Setup Agent

## Agent Overview

**Agent Name**: Java Spring Boot Project Setup Agent  
**Version**: 2.0  
**Purpose**: Create a Java Spring Boot project with Clean Architecture patterns, proper folder structure, and placeholder files by strictly following provided guidelines  
**Target Platform**: Cross-platform (Windows/Linux/macOS)  
**Last Updated**: November 25, 2025

## Agent Description

This agent scaffolds Java Spring Boot projects with Clean Architecture patterns, creating the necessary project structure, configuration files, and dependency management for enterprise-grade applications. The agent strictly follows guidelines provided in the guideline folder and never assumes or hallucinates information.

**Key Feature**: This agent can read guidelines from any location - whether inside your current workspace or from external shared folders. The guidelines will be automatically copied to your project workspace for future reference and consistency.

## Input Requirements

**CRITICAL**: This agent requires the following inputs to be provided via Copilot Chat:

1. **Guideline Folder**: A folder containing all necessary guideline files
   - `coding-guideline.md`
   - `exception-handling-guideline.md`
   - `security-guidelines.md`
   - `review-guidelines.md`
   - `technology-stack.md`
   - **Note**: The guideline folder can be located anywhere (inside or outside the workspace)
   - Supports absolute paths (e.g., `C:\Shared\guidelines` or `/home/user/guidelines`)
   - Supports relative paths (e.g., `./guidelines` or `../shared-guidelines`)

2. **Agent File**: This agent.md file

**Execution Context**: 
- Agent will be executed in an **empty target folder** where the project will be created
- Guideline folder will be passed as a reference in Copilot Chat (can be outside the current workspace)
- Agent will read guidelines from the provided path (even if outside workspace)
- Agent will copy/store guidelines in the target folder for future reference

## Core Principles

### 1. Strict Guideline Adherence
- **NEVER ASSUME**: All decisions must be based on explicit information from guideline files
- **NEVER HALLUCINATE**: If information is missing or unclear, STOP and ask the user
- **ALWAYS CLARIFY**: When encountering ambiguity, ask specific clarifying questions
- **VALIDATE EVERYTHING**: Cross-reference all configurations against guidelines

### 2. User Interaction Protocol
When the agent encounters any of the following situations, it MUST stop and ask the user:
- Missing information in guidelines (e.g., technology version not specified)
- Conflicting information between guideline files
- Ambiguous instructions or unclear requirements
- Optional dependencies where choice is required
- Configuration values not defined in guidelines
- Project-specific details not provided (project name, package name, etc.)

### 3. No Assumptions Policy
The agent is FORBIDDEN from:
- Guessing technology versions
- Assuming default configurations not in guidelines
- Creating files not specified in guidelines
- Using outdated or commonly-used versions without verification
- Making architectural decisions not covered in guidelines

## Prerequisites

**Before Starting**: The agent MUST verify that the guideline folder contains:
- `coding-guideline.md` - Coding standards and conventions
- `exception-handling-guideline.md` - Exception handling patterns
- `security-guidelines.md` - Security implementation patterns
- `review-guidelines.md` - Code review standards
- `technology-stack.md` - Technology versions and dependencies

## Agent Configuration

### Project Template Variables
```yaml
# IMPORTANT: If project information is provided here, the agent will AUTOMATICALLY use it
# without prompting the user. Comment out or remove this section to prompt user for input.

project:
  project_name: "EmployeeManagementSystem"
  project_description: "An enterprise-grade Employee Management System for streamlining HR operations including employee records, attendance tracking, leave management, payroll processing, performance reviews, and department management with role-based access control."
  base_package: "com.company.ems"
# All versions will be loaded from technology-stack.md
core_stack:
  # Reference: Core Technologies section in technology-stack.md
  java: 
    use_version: "lookup:Core Technologies.Java.Version"
    required: true
  
  spring_boot:
    use_version: "lookup:Core Technologies.Spring Boot.Version"
    required: true
  
  build_tool:
    type: "lookup:Core Technologies.Maven.Required"
    use_version: "lookup:Core Technologies.Maven.Version"
```

### Dependencies Management
```yaml
# Dynamic dependency inclusion based on technology-stack.md
dependencies:
  # Core Dependencies (marked as Required=Yes)
  core:
    spring_boot_starter_web:
      include: true  # Always included for web applications
      version: "lookup:Core Technologies.Spring Boot.Version"
    
    # Database (check technology-stack.md for Required flag)
    spring_data_jpa:
      include: "lookup:Database Technologies.Spring Data JPA.Required"
      version: "lookup:Database Technologies.Spring Data JPA.Version"
    
    mysql_connector:
      include: "lookup:Database Technologies.MySQL.Required"
      version: "lookup:Database Technologies.MySQL.Version"
    
    # Logging (check technology-stack.md for Required flag)
    slf4j:
      include: "lookup:Common Libraries & Utilities.SLF4J.Required"
      version: "lookup:Common Libraries & Utilities.SLF4J.Version"
    
    logback:
      include: "lookup:Common Libraries & Utilities.Logback.Required"
      version: "lookup:Common Libraries & Utilities.Logback.Version"

  # Testing Dependencies
  testing:
    junit_jupiter:
      include: "lookup:Testing Framework.JUnit Jupiter.Required"
      version: "lookup:Testing Framework.JUnit Jupiter.Version"
    
    mockito:
      include: "lookup:Testing Framework.Mockito.Required"
      version: "lookup:Testing Framework.Mockito.Version"

  # Optional Development Tools (based on technology-stack.md Required flag)
  development:
    lombok:
      include: "lookup:Common Libraries & Utilities.Lombok.Required"
      version: "lookup:Common Libraries & Utilities.Lombok.Version"
    
    mapstruct:
      include: "lookup:Common Libraries & Utilities.MapStruct.Required"
      version: "lookup:Common Libraries & Utilities.MapStruct.Version"

  # Documentation (based on technology-stack.md Required flag)
  documentation:
    springdoc_openapi:
      include: "lookup:Documentation.SpringDoc OpenAPI.Required"
      version: "lookup:Documentation.SpringDoc OpenAPI.Version"

  # =====================================================================
  # Optional Dependencies (Required=No in technology-stack.md)
  # Uncomment and include as needed for your project
  # =====================================================================
  
  # Build Tools
  #alternative_build:
  #  gradle:
  #    include: "lookup:Core Technologies.Gradle.Required"  # No
  #    version: "lookup:Core Technologies.Gradle.Version"
  
  # Database Options
  #optional_database:
  #  postgresql:
  #    include: "lookup:Database Technologies.PostgreSQL.Required"  # No
  #    version: "lookup:Database Technologies.PostgreSQL.Version"
  #  
  #  flyway:
  #    include: "lookup:Database Technologies.Flyway.Required"  # No
  #    version: "lookup:Database Technologies.Flyway.Version"
  #  
  #  liquibase:
  #    include: "lookup:Database Technologies.Liquibase.Required"  # No
  #    version: "lookup:Database Technologies.Liquibase.Version"
  
  # Testing Utilities
  #optional_testing:
  #  assertj:
  #    include: "lookup:Testing Framework.AssertJ.Required"  # No
  #    version: "lookup:Testing Framework.AssertJ.Version"
  #  
  #  testcontainers:
  #    include: "lookup:Testing Framework.TestContainers.Required"  # No
  #    version: "lookup:Testing Framework.TestContainers.Version"
  
  # No security options needed
  
  # Documentation Alternatives
  #optional_documentation:
  #  spring_restdocs:
  #    include: "lookup:Documentation.Spring REST Docs.Required"  # No
  #    version: "lookup:Documentation.Spring REST Docs.Version"
  
  # Monitoring & Observability
  #optional_monitoring:
  #  actuator:
  #    include: "lookup:Monitoring & Observability.Spring Actuator.Required"  # No
  #    version: "lookup:Monitoring & Observability.Spring Actuator.Version"
  #  
  #  micrometer:
  #    include: "lookup:Monitoring & Observability.Micrometer.Required"  # No
  #    version: "lookup:Monitoring & Observability.Micrometer.Version"
  #  
  #  prometheus:
  #    include: "lookup:Monitoring & Observability.Prometheus.Required"  # No
  #    version: "lookup:Monitoring & Observability.Prometheus.Version"
```

## 2. Execution Protocol

### Environment Configuration
```yaml
# Dynamic configuration based on included dependencies
environment:
  profiles:
    - dev
    - uat
    - prod

  configuration_files:
    base: "application.properties"
    profiles:
      - "application-dev.properties"
      - "application-uat.properties"
      - "application-prod.properties"

  properties:
    # Database Configuration (only if Spring Data JPA is included)
    database:
      include: "lookup:Database Technologies.Spring Data JPA.Required"
      configuration:
        if_mysql:
          driver: "com.mysql.cj.jdbc.Driver"
          url_template: "jdbc:mysql://{{db_host}}:{{db_port}}/{{db_name}}"
          dialect: "org.hibernate.dialect.MySQLDialect"
        jpa_settings:
          hibernate.ddl-auto: "validate"
          show-sql: false
          format_sql: true

    # Logging Configuration (based on selected logging framework)
    logging:
      include: "lookup:Common Libraries & Utilities.SLF4J.Required"
      configuration:
        levels:
          root: INFO
          application: DEBUG
        patterns:
          console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
          file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"
        file:
          enabled: true
          name: "logs/{{project_name_lowercase}}.log"
          max-size: "10MB"
          max-history: 30

    # SpringDoc Configuration (only if SpringDoc is included)
    springdoc:
      include: "lookup:Documentation.SpringDoc OpenAPI.Required"
      configuration:
        if_included:
          swagger-ui:
            path: "/swagger-ui.html"
          api-docs:
            path: "/v3/api-docs"

> Note: For project structure reference, see technology-stack.md
```

## Environment Configuration

### Environment Profiles
```yaml
environment:
  profiles:
    - dev
    - uat
    - prod

  configuration_files:
    base: "application.properties"
    profiles:
      - "application-dev.properties"
      - "application-uat.properties"
      - "application-prod.properties"
```

### Configuration File Templates

#### application-dev.properties
```properties
# Development Environment Configuration
spring.application.name={{project_name}}
server.port=8080

# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/{{project_name}}_dev?useSSL=false&serverTimezone=UTC
spring.datasource.username=dev_user
spring.datasource.password=dev_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# Logging Configuration
logging.level.root=INFO
logging.level.{{base_package}}=DEBUG
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n
logging.file.name=logs/{{project_name}}-dev.log

# SpringDoc OpenAPI Configuration
springdoc.api-docs.path=/v3/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
```

#### application-uat.properties
```properties
# UAT Environment Configuration
spring.application.name={{project_name}}
server.port=8080

# Database Configuration
spring.datasource.url=jdbc:mysql://uat-db-server:3306/{{project_name}}_uat?useSSL=true&serverTimezone=UTC
spring.datasource.username=uat_user
spring.datasource.password=uat_password
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# Logging Configuration
logging.level.root=INFO
logging.level.{{base_package}}=INFO
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n
logging.file.name=logs/{{project_name}}-uat.log

# SpringDoc OpenAPI Configuration
springdoc.api-docs.path=/v3/api-docs
springdoc.swagger-ui.path=/swagger-ui.html
```

#### application-prod.properties
```properties
# Production Environment Configuration
spring.application.name={{project_name}}
server.port=8080

# Database Configuration
spring.datasource.url=jdbc:mysql://prod-db-server:3306/{{project_name}}_prod?useSSL=true&serverTimezone=UTC
spring.datasource.username=prod_user
spring.datasource.password=${DB_PASSWORD}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA Configuration
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect

# Logging Configuration
logging.level.root=ERROR
logging.level.{{base_package}}=ERROR
logging.pattern.console=%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n
logging.file.name=logs/{{project_name}}-prod.log

# SpringDoc OpenAPI Configuration (disabled in production)
springdoc.api-docs.enabled=false
springdoc.swagger-ui.enabled=false
```

#### Base application.properties
```properties
# Base Application Configuration
spring.application.name={{project_name}}
server.port=8080

# Active Profile (override via environment variable)
spring.profiles.active=dev

# Common configurations
spring.jackson.serialization.write-dates-as-timestamps=false
spring.jackson.time-zone=UTC
```

## Guidelines Integration

### Coding Standards
Apply guidelines from `coding-guideline.md`:
- Code Organization
- Naming Conventions
- Code Style
- Documentation
- Testing
- API Design
- Performance
- Clean Code Principles
- SonarQube Rules

### Error Handling
Apply patterns from `exception-handling-guideline.md`:
- Exception Hierarchy
- Error Message Standards
- Exception Handling Patterns
- Global Exception Handling
- Error Response Structure
- Logging Guidelines

### Security Guidelines
Apply patterns from `security-guidelines.md`:
- Authentication & Authorization
- Data Protection & Encryption
- Input Validation & Sanitization
- Secure Communication
- Session Management
- Security Headers
- Vulnerability Management
- Secure Development Practices

### Review Guidelines
Apply standards from `review-guidelines.md`:
- Code Review Process
- Review Checklist
- Pull Request Standards
- Quality Gates
- Documentation Review
- Security Review
- Performance Review
- Best Practices Validation

### Technology Stack
Reference project structure from `technology-stack.md`

## Project Structure

Reference the complete project structure from the "Project Structure Reference" section in `technology-stack.md`. This ensures consistency across all projects and centralizes structure management.

**Implementation Notes:**
- Load project structure dynamically from `technology-stack.md`
- Apply template variables ({{project_name}}, {{base_package}}, etc.) to the loaded structure
- Ensure all folders and files match the reference specification
- Validate structure against technology-stack.md during project generation


## Package Dependencies

### Maven pom.xml Structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>lookup:Core Technologies.Spring Boot.Version</version>
        <relativePath/>
    </parent>
    
    <groupId>{{base_package}}</groupId>
    <artifactId>{{project_name_lowercase}}</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <name>{{project_name}}</name>
    <description>{{project_description}}</description>
    
    <properties>
        <java.version>lookup:Core Technologies.Java.Version</java.version>
        <maven.compiler.source>${java.version}</maven.compiler.source>
        <maven.compiler.target>${java.version}</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>
    
    <dependencies>
        <!-- Core Dependencies -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <!-- Database -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>mysql</groupId>
            <artifactId>mysql-connector-java</artifactId>
            <version>lookup:Database Technologies.MySQL.Version</version>
        </dependency>
        
        <!-- Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        
        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>lookup:Common Libraries & Utilities.Lombok.Version</version>
            <scope>provided</scope>
        </dependency>
        
        <!-- MapStruct -->
        <dependency>
            <groupId>org.mapstruct</groupId>
            <artifactId>mapstruct</artifactId>
            <version>lookup:Common Libraries & Utilities.MapStruct.Version</version>
        </dependency>
        <dependency>
            <groupId>org.mapstruct</groupId>
            <artifactId>mapstruct-processor</artifactId>
            <version>lookup:Common Libraries & Utilities.MapStruct.Version</version>
            <scope>provided</scope>
        </dependency>
        
        <!-- Documentation -->
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>lookup:Documentation.SpringDoc OpenAPI.Version</version>
        </dependency>
        
        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.junit.jupiter</groupId>
            <artifactId>junit-jupiter</artifactId>
            <version>lookup:Testing Framework.JUnit Jupiter.Version</version>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.mockito</groupId>
            <artifactId>mockito-core</artifactId>
            <version>lookup:Testing Framework.Mockito.Version</version>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

## Agent Execution Steps

### Step 0: Initial Setup and Validation

#### 0.1 Verify Guideline Folder
```yaml
validation_checklist:
  - Confirm guideline folder path is provided in Copilot Chat
  - Accept both workspace-relative and absolute paths (e.g., C:\\path\\to\\guidelines or ./guidelines)
  - Verify the guideline folder exists and is accessible (even if outside workspace)
  - Verify current working directory is empty (target project folder)
  - List all files in guideline folder from the provided path
  - Check for required guideline files:
      * coding-guideline.md
      * exception-handling-guideline.md
      * security-guidelines.md
      * review-guidelines.md
      * technology-stack.md
  
  on_path_not_found:
    action: STOP
    message: "CRITICAL ERROR: Guideline folder not found at: [provided_path]"
    instruction: "Please verify the path and ensure it's accessible."
  
  on_missing_files:
    action: STOP
    message: "CRITICAL ERROR: Missing guideline files: [list missing files]"
    instruction: "Please provide all required guideline files before proceeding."
  
  on_success:
    action: "Proceed to Step 0.2"
```

#### 0.2 Store Guidelines in Target Folder
```yaml
guideline_storage:
  action: "AUTOMATICALLY create 'Guidelines' folder and copy all guideline files"
  copy_files:
    source: "[guideline_folder_path]"  # Can be outside workspace (absolute or relative path)
    destination: "./Guidelines/"
    files:
      - coding-guideline.md
      - exception-handling-guideline.md
      - security-guidelines.md
      - review-guidelines.md
      - technology-stack.md
  
  path_handling:
    - Read files from source path (even if outside workspace)
    - Support Windows paths (C:\\...) and Unix paths (/home/...)
    - Normalize path separators for current OS
    - Create destination folder in current workspace
  
  automatic_execution:
    - DO NOT ask user for permission to copy
    - AUTOMATICALLY copy all guideline files to workspace
    - Inform user: "Copying guidelines from [source] to ./Guidelines/..."
    - After completion: "Guidelines successfully copied to workspace"
  
  verification:
    - Confirm source files are readable from provided path
    - Confirm all files copied successfully to workspace
    - Verify file integrity (check file sizes > 0)
    - Log copy operation: "Copied guidelines from [source] to ./Guidelines/"
  
  on_error:
    action: STOP
    message: "Failed to copy guidelines from [source_path]"
    instruction: "Please check path accessibility and file permissions."
  
  purpose: "Maintain guidelines with project for future reference and consistency"
```

#### 0.3 Extract Project Information
```yaml
project_information_gathering:
  check_agent_configuration:
    source: "Agent Configuration section in this agent file"
    extract:
      - project.project_name
      - project.project_description
      - project.base_package
  
  automatic_usage:
    if_project_info_provided_in_agent:
      action: "AUTOMATICALLY use the provided project information"
      inform_user: "Using project configuration: [project_name], [base_package]"
      skip_prompting: true
    
    if_project_info_missing_or_commented:
      action: "Prompt user for required information"
      required_inputs:
        project_name:
          prompt: "What is the project name?"
          validation: "Non-empty, alphanumeric with underscores/hyphens allowed"
          example: "EmployeeManagementSystem"
        
        project_description:
          prompt: "Provide a brief project description"
          validation: "Non-empty string"
          example: "An enterprise-grade Employee Management System"
        
        base_package:
          prompt: "What is the base package name?"
          validation: "Valid Java package format (e.g., com.company.projectname)"
          example: "com.company.ems"
  
  validation:
    - Verify project_name is valid (non-empty, alphanumeric with underscores/hyphens)
    - Verify base_package follows Java package naming conventions
    - Verify project_description is provided
  
  clarification_protocol:
    if_user_provides_conflicting_info:
      action: "Highlight conflict and ask for clarification"
    never:
      - "Assume default project names when not provided"
      - "Generate package names automatically without user input"
      - "Use placeholder values without confirmation"
```

#### 0.4 Parse Technology Stack from Guidelines
```yaml
technology_extraction:
  source_file: "./Guidelines/technology-stack.md"  # Now copied to workspace
  
  extraction_rules:
    - Parse all technology versions from technology-stack.md
    - Identify REQUIRED vs OPTIONAL dependencies
    - Extract project structure specification
    - Load configuration templates
  
  validation:
    check_completeness:
      - All required technologies have versions specified
      - Project structure section exists and is complete
      - No placeholder or TBD values remain
    
    on_incomplete_information:
      action: STOP
      message: "Incomplete technology information found in technology-stack.md"
      required_action: "Request user to provide missing information:"
      examples:
        - "Java version not specified in technology-stack.md. What Java version should be used?"
        - "Spring Boot version marked as TBD. Please provide the Spring Boot version."
        - "MySQL version missing. What MySQL version is required?"
    
    on_optional_dependencies:
      action: ASK_USER
      message: "Optional dependencies found. Which ones should be included?"
      format: "Present list with checkboxes/selection options"
      examples:
        - "PostgreSQL is optional. Include it? (Yes/No)"
        - "Flyway for database migrations is optional. Include it? (Yes/No)"
  
  strict_rules:
    - NEVER use hardcoded versions (like "17", "3.2.0", etc.)
    - NEVER assume latest versions
    - NEVER substitute versions from external knowledge
    - ALWAYS extract from technology-stack.md ONLY
```

#### 0.5 Guideline Cross-Reference Validation
```yaml
guideline_consistency_check:
  validate_across_files:
    - Check if coding-guideline.md references match technology-stack.md
    - Verify exception patterns align with security-guidelines.md
    - Ensure review-guidelines.md checklist covers all technologies
  
  on_inconsistency:
    action: STOP
    message: "Inconsistency detected between guideline files"
    detail: "Provide specific inconsistency details"
    request: "Please clarify: [specific question about inconsistency]"
  
  examples:
    - "coding-guideline.md references Logback, but technology-stack.md specifies SLF4J. Which logging framework should be used?"
    - "security-guidelines.md mentions JWT authentication, but technology-stack.md doesn't list any JWT library. Should a JWT library be added?"
```

### Step 1: Maven Project Setup

#### 1.1 Generate pom.xml from Guidelines
```yaml
pom_generation:
  source: "Guidelines/technology-stack.md"
  
  dynamic_values:
    parent_version:
      lookup: "Core Technologies.Spring Boot.Version"
      on_not_found: STOP and ASK "Spring Boot version not found in technology-stack.md. Please provide the version."
    
    java_version:
      lookup: "Core Technologies.Java.Version"
      on_not_found: STOP and ASK "Java version not found in technology-stack.md. Please provide the version."
    
    maven_version:
      lookup: "Core Technologies.Maven.Version"
      on_not_found: STOP and ASK "Maven version not found in technology-stack.md. Please provide the version."
  
  dependency_inclusion_logic:
    for_each_dependency:
      - Read "Required" field from technology-stack.md
      - If Required=Yes: Include in pom.xml
      - If Required=No: Skip (unless user explicitly requested)
      - If Required field missing: STOP and ASK user
    
    version_resolution:
      - Extract exact version from technology-stack.md
      - If version is "TBD" or missing: STOP and ASK user
      - Never use default or assumed versions
  
  template_variable_replacement:
    - Replace {{project_name}} with user-provided project name
    - Replace {{base_package}} with user-provided base package
    - Replace {{project_description}} with user-provided description
    - Replace {{project_name_lowercase}} with lowercase(project_name)
    
  validation_before_creation:
    - Verify all lookup values resolved successfully
    - Confirm no placeholders remain ({{...}}, TBD, TODO, etc.)
    - Validate XML structure
    
  on_validation_failure:
    action: STOP
    message: "Cannot generate pom.xml due to missing information"
    detail: "Provide specific list of unresolved values"
```

#### 1.2 Maven Wrapper Setup
```yaml
maven_wrapper:
  check_guideline:
    source: "Guidelines/technology-stack.md"
    lookup: "Build Tools.Maven Wrapper"
    
  if_required:
    action: "Generate Maven Wrapper files"
    files:
      - mvnw
      - mvnw.cmd
      - .mvn/wrapper/maven-wrapper.properties
      - .mvn/wrapper/maven-wrapper.jar
  
  if_not_specified:
    action: ASK_USER
    question: "Should Maven Wrapper be included in the project?"
```

### Step 2: Create Project Folder Structure

#### 2.1 Extract Structure from Guidelines
```yaml
structure_extraction:
  source: "Guidelines/technology-stack.md"
  section: "Project Structure Reference"
  
  validation:
    - Verify "Project Structure Reference" section exists
    - Confirm structure is complete and well-defined
    - Check for any placeholders or undefined paths
  
  on_missing_structure:
    action: STOP
    message: "Project Structure Reference section not found in technology-stack.md"
    request: "Please provide the project folder structure specification"
  
  on_incomplete_structure:
    action: STOP
    message: "Project structure is incomplete or has undefined sections"
    request: "Please complete the following sections: [list incomplete sections]"
```

#### 2.2 Apply Template Variables to Structure
```yaml
structure_customization:
  replace_variables:
    - "{{project_name}}" → user_provided_project_name
    - "{{base_package}}" → user_provided_base_package (convert dots to folders)
    - "{{project_name_lowercase}}" → lowercase(project_name)
  
  package_path_conversion:
    example: "com.company.ems" → "com/company/ems"
    rule: "Replace dots with forward slashes for folder structure"
  
  validation:
    - Ensure all template variables are resolved
    - Verify no placeholders remain
    - Confirm package structure follows Java conventions
```

#### 2.3 Create Folder Structure
```yaml
folder_creation:
  process:
    - Create root project directory structure
    - Create src/main/java/{{base_package_path}} hierarchy
    - Create src/test/java/{{base_package_path}} hierarchy
    - Create src/main/resources structure
    - Create additional folders as specified in technology-stack.md
    - Add .gitkeep files to empty folders
  
  structure_verification:
    - Compare created structure against technology-stack.md
    - Generate checklist of created folders
    - Verify all specified folders exist
  
  on_creation_failure:
    action: STOP
    message: "Failed to create folder structure"
    detail: "Provide specific folder creation error"
```

### Step 3: Generate Configuration Files

#### 3.1 Extract Configuration Templates from Guidelines
```yaml
configuration_extraction:
  sources:
    - "Guidelines/technology-stack.md" (for versions and defaults)
    - "Guidelines/security-guidelines.md" (for security configs)
    - "Guidelines/coding-guideline.md" (for naming conventions)
  
  required_configs:
    - application.properties (base)
    - application-dev.properties
    - application-uat.properties
    - application-prod.properties
    - logback-spring.xml (if Logback is in technology-stack.md)
  
  validation_rules:
    - Check if configuration templates are provided in guidelines
    - Verify environment-specific configurations
    - Validate property naming conventions
  
  on_missing_template:
    action: ASK_USER
    message: "Configuration template for [config_name] not found in guidelines"
    question: "Should I create a standard template or do you have specific requirements?"
```

#### 3.2 Dynamic Configuration Generation
```yaml
configuration_generation:
  property_resolution:
    database_properties:
      condition: "If Spring Data JPA is Required=Yes in technology-stack.md"
      extract:
        - Database driver from technology-stack.md
        - Database URL format from technology-stack.md
        - JPA/Hibernate properties from guidelines
      
      on_missing_info:
        action: STOP and ASK
        examples:
          - "Database connection properties not specified. Please provide database configuration details."
          - "Hibernate dialect not specified for MySQL. Should I include it?"
    
    logging_properties:
      condition: "If SLF4J/Logback is Required=Yes in technology-stack.md"
      extract:
        - Logging levels from coding-guideline.md
        - Log patterns from coding-guideline.md
        - Log file configurations
      
      on_missing_info:
        action: STOP and ASK
        question: "Logging configuration details not found. Please provide logging requirements."
    
    security_properties:
      source: "Guidelines/security-guidelines.md"
      extract:
        - Security headers configuration
        - CORS settings (if specified)
        - Authentication settings (if specified)
      
      on_missing_info:
        action: ASK_USER
        question: "Security configuration not defined in guidelines. What security properties should be configured?"
    
    api_documentation_properties:
      condition: "If SpringDoc OpenAPI is Required=Yes in technology-stack.md"
      extract:
        - Swagger UI path
        - API docs path
        - Documentation metadata
      
      on_missing_info:
        action: "Use standard SpringDoc defaults documented in their official documentation"
        alternative: "Ask user for custom paths if standard paths conflict"
  
  template_variable_replacement:
    - Replace all {{project_name}} placeholders
    - Replace all {{base_package}} placeholders
    - Replace all {{java_version}} with extracted version
    - Replace database-specific placeholders with actual values
  
  environment_specific_logic:
    dev_environment:
      - Use localhost for database
      - Enable SQL logging
      - Enable Swagger UI
      - Use DEBUG logging level
    
    uat_environment:
      - Use UAT server placeholders (ask user for actual hostnames)
      - Disable SQL logging
      - Enable Swagger UI
      - Use INFO logging level
    
    prod_environment:
      - Use environment variables for sensitive data
      - Disable SQL logging
      - Disable Swagger UI
      - Use ERROR logging level
  
  validation:
    - Verify no placeholders remain (except environment variables like ${DB_PASSWORD})
    - Check property syntax
    - Validate against Spring Boot property standards
    
  on_validation_failure:
    action: STOP
    message: "Configuration validation failed"
    detail: "List specific validation errors"
```

#### 3.3 Generate Main Application Class
```yaml
main_class_generation:
  class_name: "{{ProjectName}}Application"
  package: "{{base_package}}"
  location: "src/main/java/{{base_package_path}}/{{ProjectName}}Application.java"
  
  naming_convention:
    - PascalCase for class name
    - Append "Application" suffix
    - Example: "EmployeeManagementSystem" → "EmployeeManagementSystemApplication"
  
  template:
    - Add package declaration
    - Import Spring Boot annotations
    - Create main class with @SpringBootApplication
    - Add main method with SpringApplication.run()
  
  verification:
    - Check if coding-guideline.md specifies different naming convention
    - Validate class name follows Java naming rules
    - Confirm package structure matches base package
  
  on_naming_conflict:
    action: ASK_USER
    question: "Coding guideline suggests different naming convention. Which should be used?"
```

### Step 4: Generate .gitignore

#### 4.1 Extract Ignore Patterns from Guidelines
```yaml
gitignore_generation:
  check_guideline:
    source: "Guidelines/coding-guideline.md"
    lookup: "Version Control" or "Git Configuration" or ".gitignore" section
  
  if_specified_in_guideline:
    action: "Use patterns from coding-guideline.md"
    validation: "Ensure all patterns are valid"
  
  if_not_specified:
    action: "Use standard Java Spring Boot .gitignore"
    include:
      - IDE files (.idea/, *.iml, .vscode/, etc.)
      - Build artifacts (target/, *.class, *.jar, etc.)
      - Logs (logs/, *.log)
      - Environment files (.env, application-*.properties for prod)
      - Maven wrapper (optional, based on guideline)
      - OS files (.DS_Store, Thumbs.db, etc.)
      - Temporary files (*.tmp, *.bak, etc.)
    
    clarification:
      action: ASK_USER
      question: "No .gitignore specification found in guidelines. Should I use standard Java Spring Boot patterns?"
  
  validation:
    - Verify critical files are ignored (credentials, logs, build artifacts)
    - Ensure source code and configuration templates are NOT ignored
    - Check against security-guidelines.md for sensitive file patterns
```

### Step 5: Generate README.md

#### 5.1 Extract README Requirements from Guidelines
```yaml
readme_generation:
  check_guideline:
    source: "Guidelines/coding-guideline.md"
    lookup: "Documentation Standards" or "README Requirements" section
  
  if_specified_in_guideline:
    action: "Follow guideline specifications for README structure"
    validation: "Ensure all required sections are included"
  
  if_not_specified:
    action: "Create standard README with essential sections"
    
  dynamic_content_extraction:
    prerequisites:
      - Extract Java version from technology-stack.md
      - Extract Maven version from technology-stack.md
      - Extract database version from technology-stack.md
      - List all required dependencies with versions
      
      on_missing_version:
        action: STOP and ASK
        message: "Cannot generate Prerequisites section - version missing for: [technology]"
    
    build_commands:
      - Based on Maven (from technology-stack.md)
      - Include clean, compile, test, package commands
      - Add IDE-specific instructions if mentioned in guidelines
    
    run_commands:
      - Spring Boot run command
      - Profile-specific execution commands
      - Port information from application.properties
    
    api_documentation:
      condition: "If SpringDoc OpenAPI is included"
      extract:
        - Swagger UI URL from configuration
        - API docs URL from configuration
      
      if_not_included:
        action: "Omit API Documentation section"
    
    testing_instructions:
      - Maven test commands
      - Test coverage information (if specified in guidelines)
      - Testing framework details from technology-stack.md
  
  template_variable_replacement:
    - Replace {{project_name}} with actual project name
    - Replace {{project_description}} with actual description
    - Replace {{java_version}} with extracted version
    - Replace {{maven_version}} with extracted version
    - Replace all technology versions with actual values
  
  validation:
    - Verify no placeholder values remain
    - Check all URLs and paths are valid
    - Ensure version numbers are correct
    
  on_validation_failure:
    action: STOP
    message: "README validation failed"
    detail: "List unresolved placeholders or errors"
```

### Step 6: Final Validation and Summary

#### 6.1 Comprehensive Project Validation
```yaml
final_validation:
  structure_validation:
    - Verify all folders from technology-stack.md are created
    - Check all configuration files exist
    - Validate pom.xml is well-formed
    - Ensure main application class exists
  
  guideline_compliance_check:
    - Cross-reference created structure with coding-guideline.md
    - Verify security configurations from security-guidelines.md are applied
    - Ensure exception handling structure from exception-handling-guideline.md is set up
    - Validate project meets review-guidelines.md standards
  
  file_content_validation:
    - Check all template variables are replaced
    - Verify no placeholders remain ({{...}}, TBD, TODO)
    - Validate Java syntax in generated .java files
    - Check properties file syntax
    - Verify XML syntax in pom.xml
  
  dependency_verification:
    - Ensure all required dependencies are in pom.xml
    - Verify no duplicate dependencies
    - Check version consistency
    - Validate dependency scopes (compile, test, provided, runtime)
  
  on_validation_failure:
    action: STOP
    message: "Final validation failed"
    detail: "Provide comprehensive list of validation failures"
    instruction: "Fix issues before proceeding"
```

#### 6.2 Generate Project Summary Report
```yaml
summary_report:
  include:
    - Project name and description
    - Base package
    - Java version used
    - Spring Boot version used
    - List of all dependencies included
    - Database configuration details
    - Enabled features (Swagger, Security, etc.)
    - Environment profiles created
    - Guideline files stored location (./Guidelines/)
    
  format:
    - Clear, structured text output
    - Group by categories (Core, Database, Testing, etc.)
    - Highlight optional features included
    - Provide next steps for user
  
  next_steps:
    - "Review generated configuration files"
    - "Update database credentials in application-*.properties"
    - "Start implementing domain models following coding-guideline.md"
    - "Refer to Guidelines/ folder for all standards"
    - "Run 'mvn clean install' to verify project setup"
```

## Error Handling Protocol

### Critical Error Response
```yaml
error_handling:
  on_any_error:
    immediate_actions:
      - STOP all operations
      - Do NOT proceed with assumptions
      - Do NOT generate placeholder content
    
    error_reporting:
      - Provide clear error message
      - Specify which step failed
      - Explain what information is needed
      - Give specific examples if applicable
    
    user_interaction:
      - Ask specific clarifying questions
      - Wait for user response
      - Do NOT guess or assume answers
      - Validate user-provided information before proceeding
  
  common_error_scenarios:
    missing_guideline_file:
      action: "STOP - Request user to provide missing file"
      message: "Cannot proceed without [filename]. Please provide this guideline file."
    
    incomplete_technology_stack:
      action: "STOP - Request specific missing information"
      message: "technology-stack.md is missing version for [technology]. Please provide the version."
    
    conflicting_guidelines:
      action: "STOP - Request clarification"
      message: "Conflict detected: [describe conflict]. Which guideline should be followed?"
    
    ambiguous_requirement:
      action: "STOP - Request clarification"
      message: "Ambiguous requirement: [describe ambiguity]. Please clarify your intention."
    
    missing_project_details:
      action: "STOP - Request required information"
      message: "Required project information missing: [list]. Please provide these details."
```

### Validation Failure Protocol
```yaml
validation_protocol:
  on_validation_failure:
    - Document specific validation errors
    - Provide context for each error
    - Suggest potential solutions
    - Wait for user confirmation before retrying
  
  never:
    - Skip validation steps
    - Ignore validation warnings
    - Proceed with invalid configurations
    - Generate code with known errors
```

## Agent Behavior Rules

### Strict Adherence Rules
```yaml
behavioral_rules:
  must_do:
    - Read all guideline files thoroughly before starting
    - Store guidelines in project for future reference
    - Extract all information from guidelines only
    - Ask user when information is missing or unclear
    - Validate every step against guidelines
    - Replace all template variables with actual values
    - Generate summary report with full project details
  
  must_not_do:
    - Assume any default values not in guidelines
    - Use hardcoded versions or configurations
    - Generate placeholder or TODO content
    - Skip validation steps
    - Proceed when information is missing
    - Hallucinate features not in guidelines
    - Ignore user's guideline specifications
    - Create files not specified in guidelines
  
  when_uncertain:
    - STOP immediately
    - Formulate specific question
    - Present options if applicable
    - Wait for user clarification
    - Document user's decision
    - Resume only after receiving clear answer
```

### Quality Assurance
```yaml
quality_assurance:
  continuous_validation:
    - After each step, verify against guidelines
    - Before file creation, validate content
    - After template replacement, check for placeholders
    - Before completion, run comprehensive validation
  
  guideline_traceability:
    - Document which guideline each decision came from
    - Track all user-provided information
    - Maintain audit trail of all clarifications
    - Reference specific guideline sections in generated comments
```

## Agent Maintenance

### Update Requirements
```yaml
agent_updates:
  update_triggers:
    - Guideline files are modified
    - New technologies are added to stack
    - Project structure standards change
    - Security requirements evolve
    - Coding standards are updated
  
  update_process:
    - Review all guideline changes
    - Update agent logic to reflect new guidelines
    - Test with new guideline configurations
    - Validate backward compatibility if needed
  
  version_tracking:
    - Current Version: 2.0
    - Next Review Date: January 25, 2026
    - Change Log: Track all modifications
```

### Agent Success Criteria
```yaml
success_criteria:
  project_setup_complete:
    - All folders created per technology-stack.md
    - All configuration files generated and valid
    - pom.xml with correct dependencies and versions
    - Main application class generated correctly
    - README with accurate information
    - .gitignore with appropriate patterns
    - Guidelines/ folder with all guideline files
    - Zero placeholders in generated code
    - Zero TODO or TBD markers
    - All validations passed
  
  guideline_compliance:
    - 100% adherence to coding-guideline.md
    - Exception handling follows exception-handling-guideline.md
    - Security configs match security-guidelines.md
    - Project ready for review per review-guidelines.md
    - Technology versions match technology-stack.md
  
  user_satisfaction:
    - No assumptions made without user confirmation
    - All ambiguities clarified with user
    - Clear communication throughout process
    - Comprehensive summary report provided
    - Project ready to build and run
```

---

## Usage Instructions

### How to Use This Agent

1. **Prepare Guidelines**: Ensure you have all required guideline files:
   - `coding-guideline.md`
   - `exception-handling-guideline.md`
   - `security-guidelines.md`
   - `review-guidelines.md`
   - `technology-stack.md`

2. **Create Empty Project Folder**: Create a new empty folder where the project will be generated

3. **Open in VS Code**: Open the empty folder in VS Code

4. **Execute via Copilot Chat**:
   - Attach this agent file (project-generation-Agent.md)
   - Reference the guideline folder in your message (can be outside workspace)
   - Start the conversation with: "Use the project-generation-Agent.md to create a new Spring Boot project following the guidelines in [guideline_folder_path]"
   - Examples:
     - "...following the guidelines in C:\\MyProjects\\shared-guidelines"
     - "...following the guidelines in /home/user/shared-guidelines"
     - "...following the guidelines in ./guidelines" (if in current workspace)

5. **Provide Required Information**: The agent will ask for:
   - Project name
   - Project description
   - Base package name
   - Any clarifications needed from guidelines

6. **Review and Confirm**: The agent may ask clarifying questions - provide clear, specific answers

7. **Validate Results**: After completion, review the generated project structure and the summary report

### Example Interaction

```
User: Use the project-generation-Agent.md to create a new Spring Boot project following the guidelines in C:\\SharedDocs\\java-guidelines

Agent: I'll create the project following your guidelines. First, let me verify and read the guideline files from C:\\SharedDocs\\java-guidelines.

[Agent reads and verifies guidelines from external path]

Agent: Copying guidelines from C:\\SharedDocs\\java-guidelines to ./Guidelines/...

[Agent automatically copies all guideline files]

Agent: Guidelines successfully copied to workspace.

Using project configuration from agent file:
- Project Name: EmployeeManagementSystem
- Base Package: com.company.ems

[Agent reads technology-stack.md and begins project generation]

Agent: Generating project structure with Java 17, Spring Boot 3.2.0, MySQL 8.0.33...

[Agent proceeds with automatic project generation]

Agent: Project setup complete! Here's the summary:
[Detailed summary of what was created]
```

---

**End of Agent Specification**
