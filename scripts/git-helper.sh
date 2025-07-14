#!/bin/bash

# 🎮 FIFA Ranker - Git Helper Script
# This script provides shortcuts for common Git operations

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}🎮 FIFA Ranker Git Helper${NC}"
    echo "=========================="
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a Git repository!"
        exit 1
    fi
}

# Main menu
show_menu() {
    print_header
    echo ""
    echo "Choose an option:"
    echo "1) 📊 Check status"
    echo "2) 🌿 Create new feature branch"
    echo "3) 💾 Quick commit (add all & commit)"
    echo "4) 🚀 Push current branch"
    echo "5) 🔄 Sync with main (pull latest)"
    echo "6) 🏷️  Create release tag"
    echo "7) 🧹 Clean up merged branches"
    echo "8) 📋 Show recent commits"
    echo "9) 🔍 Search commits"
    echo "0) 🚪 Exit"
    echo ""
}

# Option 1: Check status
check_status() {
    print_header
    echo -e "${BLUE}Current Git Status:${NC}"
    echo ""
    
    # Current branch
    current_branch=$(git branch --show-current)
    echo -e "📍 Current branch: ${GREEN}$current_branch${NC}"
    
    # Status
    echo ""
    git status --short
    
    # Last commit
    echo ""
    echo -e "${BLUE}Last commit:${NC}"
    git log --oneline -1
    
    echo ""
    read -p "Press Enter to continue..."
}

# Option 2: Create new feature branch
create_feature_branch() {
    print_header
    echo -e "${BLUE}Create New Feature Branch${NC}"
    echo ""
    
    # Make sure we're on main
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ]; then
        print_warning "You're not on main branch. Switching to main first..."
        git checkout main
    fi
    
    # Pull latest changes
    print_warning "Pulling latest changes from main..."
    git pull origin main 2>/dev/null || print_warning "Could not pull from origin (maybe no remote set)"
    
    # Get feature name
    echo ""
    read -p "Enter feature name (e.g., 'add-player-avatars'): " feature_name
    
    if [ -z "$feature_name" ]; then
        print_error "Feature name cannot be empty!"
        return
    fi
    
    # Create and switch to new branch
    branch_name="feature/$feature_name"
    git checkout -b "$branch_name"
    
    print_success "Created and switched to branch: $branch_name"
    echo ""
    read -p "Press Enter to continue..."
}

# Option 3: Quick commit
quick_commit() {
    print_header
    echo -e "${BLUE}Quick Commit${NC}"
    echo ""
    
    # Show what will be committed
    echo "Files to be committed:"
    git status --short
    echo ""
    
    read -p "Enter commit message: " commit_message
    
    if [ -z "$commit_message" ]; then
        print_error "Commit message cannot be empty!"
        return
    fi
    
    # Add all files and commit
    git add .
    git commit -m "$commit_message"
    
    print_success "Committed successfully!"
    echo ""
    read -p "Press Enter to continue..."
}

# Option 4: Push current branch
push_branch() {
    print_header
    echo -e "${BLUE}Push Current Branch${NC}"
    echo ""
    
    current_branch=$(git branch --show-current)
    echo -e "Pushing branch: ${GREEN}$current_branch${NC}"
    
    # Check if branch exists on remote
    if git ls-remote --heads origin "$current_branch" | grep -q "$current_branch"; then
        git push origin "$current_branch"
    else
        print_warning "Branch doesn't exist on remote. Creating..."
        git push -u origin "$current_branch"
    fi
    
    print_success "Pushed successfully!"
    echo ""
    read -p "Press Enter to continue..."
}

# Option 5: Sync with main
sync_with_main() {
    print_header
    echo -e "${BLUE}Sync with Main Branch${NC}"
    echo ""
    
    current_branch=$(git branch --show-current)
    
    # Switch to main
    git checkout main
    
    # Pull latest changes
    print_warning "Pulling latest changes..."
    git pull origin main 2>/dev/null || print_warning "Could not pull from origin"
    
    # Switch back to original branch if it wasn't main
    if [ "$current_branch" != "main" ]; then
        git checkout "$current_branch"
        echo ""
        read -p "Merge main into current branch? (y/n): " merge_main
        if [ "$merge_main" = "y" ] || [ "$merge_main" = "Y" ]; then
            git merge main
            print_success "Merged main into $current_branch"
        fi
    fi
    
    print_success "Sync completed!"
    echo ""
    read -p "Press Enter to continue..."
}

# Option 6: Create release tag
create_release_tag() {
    print_header
    echo -e "${BLUE}Create Release Tag${NC}"
    echo ""
    
    # Show current version
    if [ -f "package.json" ]; then
        current_version=$(grep '"version"' package.json | cut -d '"' -f 4)
        echo -e "Current version in package.json: ${GREEN}$current_version${NC}"
    fi
    
    echo ""
    read -p "Enter new version tag (e.g., v1.2.0): " version_tag
    
    if [ -z "$version_tag" ]; then
        print_error "Version tag cannot be empty!"
        return
    fi
    
    read -p "Enter release message: " release_message
    
    if [ -z "$release_message" ]; then
        release_message="Release $version_tag"
    fi
    
    # Create tag
    git tag -a "$version_tag" -m "$release_message"
    
    # Push tag
    git push origin "$version_tag" 2>/dev/null || print_warning "Could not push tag to origin"
    
    print_success "Created tag: $version_tag"
    echo ""
    read -p "Press Enter to continue..."
}

# Option 7: Clean up merged branches
cleanup_branches() {
    print_header
    echo -e "${BLUE}Clean Up Merged Branches${NC}"
    echo ""
    
    # List merged branches (excluding main)
    merged_branches=$(git branch --merged main | grep -v main | grep -v \* | xargs)
    
    if [ -z "$merged_branches" ]; then
        print_success "No merged branches to clean up!"
    else
        echo "Merged branches that can be deleted:"
        echo "$merged_branches"
        echo ""
        read -p "Delete these branches? (y/n): " delete_branches
        
        if [ "$delete_branches" = "y" ] || [ "$delete_branches" = "Y" ]; then
            echo "$merged_branches" | xargs git branch -d
            print_success "Deleted merged branches!"
        fi
    fi
    
    echo ""
    read -p "Press Enter to continue..."
}

# Option 8: Show recent commits
show_commits() {
    print_header
    echo -e "${BLUE}Recent Commits${NC}"
    echo ""
    
    git log --oneline -10 --graph --decorate
    
    echo ""
    read -p "Press Enter to continue..."
}

# Option 9: Search commits
search_commits() {
    print_header
    echo -e "${BLUE}Search Commits${NC}"
    echo ""
    
    read -p "Enter search term: " search_term
    
    if [ -z "$search_term" ]; then
        print_error "Search term cannot be empty!"
        return
    fi
    
    echo ""
    echo "Commits matching '$search_term':"
    git log --oneline --grep="$search_term"
    
    echo ""
    read -p "Press Enter to continue..."
}

# Main script
main() {
    check_git_repo
    
    while true; do
        clear
        show_menu
        read -p "Enter your choice (0-9): " choice
        
        case $choice in
            1) check_status ;;
            2) create_feature_branch ;;
            3) quick_commit ;;
            4) push_branch ;;
            5) sync_with_main ;;
            6) create_release_tag ;;
            7) cleanup_branches ;;
            8) show_commits ;;
            9) search_commits ;;
            0) 
                clear
                print_success "Happy coding! 🎮"
                exit 0 
                ;;
            *)
                print_error "Invalid option. Please try again."
                sleep 2
                ;;
        esac
        
        clear
    done
}

# Run the script
main 