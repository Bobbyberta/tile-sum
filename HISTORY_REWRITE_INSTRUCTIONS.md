# Instructions to Add LICENSE File to First Commit

This guide explains how to add the LICENSE file to your first commit in git history.

## ⚠️ IMPORTANT WARNINGS

1. **Backup your repository first!** Make a copy of your `.git` folder or create a backup branch
2. **This rewrites git history** - you'll need to force-push
3. **Anyone who cloned your repo will need to re-clone or reset their local copy**
4. **Commit or stash your current changes first!**

## Method 1: Using Interactive Rebase (Recommended)

This is the simplest and safest method:

### Step 1: Commit or stash current changes
```bash
# Option A: Commit your changes
git add .
git commit -m "Your commit message"

# Option B: Stash your changes
git stash
```

### Step 2: Start interactive rebase from root
```bash
git rebase -i --root
```

### Step 3: In the editor that opens
- Change the first line from `pick` to `edit` (or just `e`)
- Save and close the editor

### Step 4: Add LICENSE file to the first commit
```bash
git add LICENSE
git commit --amend --no-edit
git rebase --continue
```

### Step 5: Force push (after reviewing changes)
```bash
# Review the changes first
git log --oneline

# If everything looks good, force push
git push --force origin main
```

## Method 2: Using git filter-branch

If you prefer using filter-branch:

```bash
# First commit or stash your changes
git add .
git commit -m "Temporary commit"

# Get the first commit hash
FIRST_COMMIT=$(git log --reverse --format="%H" | head -1)

# Rewrite history to add LICENSE to first commit
git filter-branch -f --index-filter \
  'if [ "$GIT_COMMIT" = "'$FIRST_COMMIT'" ]; then git add LICENSE; fi' \
  --tag-name-filter cat -- --all

# Force push
git push --force origin main
```

## Reverting If Something Goes Wrong

If you need to undo the rewrite:

```bash
# Remove filter-branch backup refs
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now

# Or restore from a backup if you made one
```

## After Force-Pushing

Tell anyone who cloned your repository to:

```bash
# Option 1: Re-clone (safest)
cd ..
rm -rf tile-sum
git clone https://github.com/bobbyberta/tile-sum.git

# Option 2: Reset their local copy (if they have no local changes)
cd tile-sum
git fetch origin
git reset --hard origin/main
```
