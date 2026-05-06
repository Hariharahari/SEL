"use strict";
/**
 * Category and Subcategory Mapping for AI Agents
 * Maps specializations to user-friendly categories
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUBCATEGORIES_BY_CATEGORY = exports.CATEGORIES = exports.SPECIALIZATION_TO_CATEGORY = void 0;
exports.getCategoryForSpecialization = getCategoryForSpecialization;
exports.SPECIALIZATION_TO_CATEGORY = {
    'code_generation': { category: 'Frontend', subcategory: 'UI Component Generation' },
    'refactoring': { category: 'Code Quality', subcategory: 'Code Optimization' },
    'test_case_generation': { category: 'Testing', subcategory: 'Test Generation' },
    'test_data_generation': { category: 'Testing', subcategory: 'Test Data Creation' },
    'reverse_engineering': { category: 'Backend', subcategory: 'Code Analysis' },
    'architecture_extraction': { category: 'Backend', subcategory: 'Architecture Design' },
    'ci_cd_automation': { category: 'DevOps', subcategory: 'Pipeline Automation' },
    'documentation_generation': { category: 'Documentation', subcategory: 'Auto Documentation' },
    'requirement_interpretation': { category: 'Product', subcategory: 'Requirement Analysis' },
    'api_design': { category: 'Backend', subcategory: 'API Development' },
    'security_review': { category: 'Security', subcategory: 'Code Security' },
    'static_analysis': { category: 'Code Quality', subcategory: 'Code Analysis' },
    'dynamic_analysis': { category: 'Testing', subcategory: 'Performance Testing' },
    'performance_optimization': { category: 'Code Quality', subcategory: 'Performance Tuning' },
    'log_intelligence': { category: 'Monitoring', subcategory: 'Log Analysis' },
    'migration': { category: 'DevOps', subcategory: 'Data Migration' },
    'data_modeling': { category: 'Database', subcategory: 'Schema Design' },
    'monitoring_integration': { category: 'Monitoring', subcategory: 'System Monitoring' },
    'devops_automation': { category: 'DevOps', subcategory: 'Infrastructure Automation' },
    'iac_generation': { category: 'DevOps', subcategory: 'Infrastructure as Code' },
    'code_smell_detection': { category: 'Code Quality', subcategory: 'Code Smell Detection' },
    'vulnerability_review': { category: 'Security', subcategory: 'Vulnerability Assessment' },
    'release_engineering': { category: 'DevOps', subcategory: 'Release Management' },
};
exports.CATEGORIES = [
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
exports.SUBCATEGORIES_BY_CATEGORY = {
    'Frontend': [
        'UI Component Generation',
        'Style Optimization',
        'Performance Tuning',
        'Accessibility Enhancement',
    ],
    'Backend': [
        'API Development',
        'Code Analysis',
        'Architecture Design',
        'Service Integration',
    ],
    'Testing': [
        'Test Generation',
        'Test Data Creation',
        'Performance Testing',
        'End-to-End Testing',
    ],
    'DevOps': [
        'Pipeline Automation',
        'Infrastructure Automation',
        'Infrastructure as Code',
        'Release Management',
        'Data Migration',
    ],
    'Database': [
        'Schema Design',
        'Query Optimization',
        'Data Migration',
        'Indexing Strategy',
    ],
    'Security': [
        'Code Security',
        'Vulnerability Assessment',
        'Dependency Analysis',
        'Compliance Review',
    ],
    'Code Quality': [
        'Code Optimization',
        'Code Analysis',
        'Performance Tuning',
        'Code Smell Detection',
    ],
    'Monitoring': [
        'Log Analysis',
        'System Monitoring',
        'Metrics Collection',
        'Alert Management',
    ],
    'Documentation': [
        'Auto Documentation',
        'API Documentation',
        'Code Comments',
        'Architecture Docs',
    ],
    'Product': [
        'Requirement Analysis',
        'Feature Planning',
        'User Story Generation',
        'Specification Writing',
    ],
};
function getCategoryForSpecialization(specialization) {
    return exports.SPECIALIZATION_TO_CATEGORY[specialization] || { category: 'Other', subcategory: 'General' };
}
//# sourceMappingURL=categoryMapping.js.map