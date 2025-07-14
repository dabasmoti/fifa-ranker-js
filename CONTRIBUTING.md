# 🤝 Contributing to FIFA Ranker

Thank you for your interest in contributing to FIFA Ranker! This guide will help you understand how to work with the Git repository and contribute effectively.

## 📋 Prerequisites

Before contributing, make sure you have:

- **Git** installed on your system
- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- A **GitHub account** (if contributing to a remote repository)

## 🚀 Getting Started

### 1. Fork & Clone (for contributors)

If you're contributing to someone else's repository:

```bash
# Fork the repository on GitHub first, then:
git clone https://github.com/YOUR-USERNAME/fifa-ranker-js.git
cd fifa-ranker-js
```

### 2. Set Up Development Environment

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## 🌿 Git Workflow

### Branch Naming Convention

Use descriptive branch names:

- **Feature branches**: `feature/add-player-avatars`
- **Bug fixes**: `fix/ranking-calculation-bug`
- **Documentation**: `docs/update-readme`
- **Refactoring**: `refactor/simplify-match-logic`

### Daily Workflow

#### 1. **Start a New Feature**

```bash
# Make sure you're on main branch
git checkout main

# Pull latest changes (if working with remote)
git pull origin main

# Create and switch to new feature branch
git checkout -b feature/your-feature-name
```

#### 2. **Make Changes**

- Edit your files
- Test your changes: `npm run dev`
- Check for linting issues: `npm run lint`

#### 3. **Commit Your Changes**

```bash
# Add specific files
git add src/components/NewComponent.jsx

# Or add all changes
git add .

# Commit with descriptive message
git commit -m "Add new player avatar component with upload functionality"
```

#### 4. **Push Your Changes**

```bash
# Push to your feature branch
git push origin feature/your-feature-name
```

#### 5. **Create Pull Request**

- Go to GitHub and create a Pull Request
- Describe what you changed and why
- Link any related issues

### Commit Message Guidelines

Write clear, descriptive commit messages:

```bash
# ✅ Good commit messages
git commit -m "Add edit functionality to match cards"
git commit -m "Fix ranking calculation for draw scenarios"
git commit -m "Update README with deployment instructions"
git commit -m "Refactor Player entity to use async/await"

# ❌ Poor commit messages
git commit -m "fix bug"
git commit -m "update stuff"
git commit -m "changes"
```

### Commit Message Format

```
[type]: [short description]

[optional longer description]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat: add player search functionality to matches page"
git commit -m "fix: resolve sidebar overlay z-index issue on mobile"
git commit -m "docs: add installation instructions to README"
```

## 🔍 Before Committing

### Run These Checks

```bash
# 1. Make sure the app builds
npm run build

# 2. Check for linting errors
npm run lint

# 3. Test the application
npm run dev
# Visit http://localhost:5173 and test your changes

# 4. Check what files you're committing
git status
git diff --staged
```

### Files to Never Commit

The `.gitignore` file prevents these from being committed:

- `node_modules/` - Dependencies (too large, can be reinstalled)
- `dist/` - Build output (generated files)
- `.env` - Environment variables (may contain secrets)
- `*.log` - Log files
- `.DS_Store` - macOS system files
- Editor configs (VS Code, WebStorm, etc.)

## 🛠️ Common Git Commands

### Checking Status
```bash
git status                 # See what files are changed
git log --oneline -10      # See last 10 commits
git diff                   # See unstaged changes
git diff --staged          # See staged changes
```

### Managing Changes
```bash
git add file.js            # Stage specific file
git add src/               # Stage entire directory
git add .                  # Stage all changes
git add -A                 # Stage all changes (including deletes)

git reset file.js          # Unstage specific file
git reset                  # Unstage all files
git checkout -- file.js   # Discard changes to file
```

### Branch Management
```bash
git branch                 # List local branches
git branch -a              # List all branches (local + remote)
git checkout main          # Switch to main branch
git checkout -b new-branch # Create and switch to new branch
git branch -d branch-name  # Delete local branch
```

### Synchronizing with Remote
```bash
git fetch                  # Download remote changes
git pull                   # Fetch and merge remote changes
git push                   # Upload local commits
git push origin branch     # Push specific branch
```

## 🐛 Troubleshooting

### "I committed to the wrong branch"
```bash
# Move last commit to a new branch
git branch new-branch-name
git reset HEAD~1
git checkout new-branch-name
```

### "I need to undo my last commit"
```bash
# Undo commit but keep changes
git reset --soft HEAD~1

# Undo commit and discard changes (careful!)
git reset --hard HEAD~1
```

### "I have merge conflicts"
```bash
# 1. Edit conflicted files manually
# 2. Remove conflict markers (<<<<, ====, >>>>)
# 3. Stage resolved files
git add resolved-file.js

# 4. Complete the merge
git commit
```

### "My branch is behind main"
```bash
git checkout main
git pull origin main
git checkout your-branch
git merge main
# or
git rebase main
```

## 📝 Code Style Guidelines

### JavaScript/React Conventions
- Use **camelCase** for variables and functions
- Use **PascalCase** for components
- Use **kebab-case** for file names
- Add **semicolons** at the end of statements
- Use **const/let** instead of var
- Use **arrow functions** for short functions

### File Organization
```
src/
├── components/          # Reusable components
│   ├── ui/             # Basic UI components
│   └── matches/        # Feature-specific components
├── pages/              # Page components
├── entities/           # Data models
└── utils/              # Helper functions
```

## 🚀 Release Process

### For Maintainers

1. **Update version** in `package.json`
2. **Update CHANGELOG.md** with new features/fixes
3. **Create release commit**:
   ```bash
   git commit -m "chore: release v1.2.0"
   ```
4. **Create and push tag**:
   ```bash
   git tag v1.2.0
   git push origin v1.2.0
   ```
5. **Create GitHub release** with release notes

## 🎯 Best Practices

### Development
- **Small, focused commits** - One feature/fix per commit
- **Test your changes** before committing
- **Write descriptive commit messages**
- **Keep feature branches short-lived**
- **Pull latest changes** before starting new work

### Collaboration
- **Review code** before merging
- **Discuss major changes** in issues first
- **Be respectful** in code reviews
- **Help others** learn and improve

## 📚 Learning Resources

- [Git Handbook](https://guides.github.com/introduction/git-handbook/)
- [Learn Git Branching](https://learngitbranching.js.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [JavaScript Standard Style](https://standardjs.com/)

---

**Happy coding!** 🎮 If you have questions, don't hesitate to ask in issues or discussions. 