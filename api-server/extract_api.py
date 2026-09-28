import os
import re

def extract_api_docs(base_path):
    docs = []
    
    # Regex patterns
    controller_pattern = re.compile(r'@Controller\([\'"]([^\'"]+)[\'"]\)')
    method_pattern = re.compile(r'@(?:Get|Post|Patch|Put|Delete)\([\'"]([^\'"]*)[\'"](?:,\s*[\s\S]*?)?\)')
    method_type_pattern = re.compile(r'@(Get|Post|Patch|Put|Delete)')
    
    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file.endswith('.controller.ts'):
                file_path = os.path.join(root, file)
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                    controller_match = controller_pattern.search(content)
                    if not controller_match:
                        continue
                        
                    base_route = controller_match.group(1)
                    if base_route.startswith('/'):
                        base_route = base_route[1:]
                    
                    # Find all methods
                    lines = content.split('\n')
                    methods = []
                    
                    current_method_type = None
                    current_sub_route = ""
                    
                    for line in lines:
                        # Skip imports and empty lines
                        line = line.strip()
                        if not line:
                            continue
                            
                        # Try to find method decorators
                        m_type_match = method_type_pattern.search(line)
                        if m_type_match:
                            current_method_type = m_type_match.group(1).upper()
                            
                            # Check if it has a route parameter
                            m_route_match = method_pattern.search(line)
                            if m_route_match:
                                sub_route = m_route_match.group(1)
                                if sub_route.startswith('/'):
                                    sub_route = sub_route[1:]
                                current_sub_route = f"/{sub_route}" if sub_route else ""
                            else:
                                current_sub_route = ""
                            
                            full_route = f"/{base_route}{current_sub_route}"
                            full_route = full_route.replace('//', '/')
                            methods.append(f"- **{current_method_type}** `{full_route}`")
                            
                    if methods:
                        docs.append({
                            'module': file.replace('.controller.ts', ''),
                            'methods': methods
                        })
                        
    return docs

base_path = r'c:\Users\ducth\OneDrive\Tài liệu\GitHub\VietNam-Paralympic-Sport\api-server\src\modules'
docs = extract_api_docs(base_path)

print("# API Documentation\n")
print("> Base URL: `/api/v1` (Assuming default API prefix)\n")
print("> Note: All endpoints typically require a Bearer token.\n")

# Try to group them
groups = {
    "Auth & Users": ["auth", "users", "roles", "assistant-profiles", "settings"],
    "Tournaments & Sports": ["tournaments", "sub-tournaments", "sports", "events", "sport-events", "sport-classifications", "matches", "teams", "athlete-achievements", "disability-types"],
    "Learning Management System (LMS)": ["courses", "chapters", "lessons", "course-progress", "quizzes", "assignments", "documents", "document-topics"],
    "Social & Community": ["posts", "comments", "bookmarks", "tags", "categories", "companion-requests", "social-links", "organizations", "partners"],
    "Other": []
}

def get_group(module):
    for g, modules in groups.items():
        if module in modules:
            return g
    return "Other"

grouped_docs = {g: [] for g in groups.keys()}

for d in docs:
    g = get_group(d['module'])
    grouped_docs[g].append(d)

for g, modules in grouped_docs.items():
    if not modules: continue
    print(f"## {g}\n")
    for d in modules:
        print(f"### {d['module'].replace('-', ' ').title()}")
        for m in d['methods']:
            print(m)
        print("")
