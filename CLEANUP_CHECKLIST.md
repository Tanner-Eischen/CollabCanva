# Codebase Cleanup Execution Checklist

Use this checklist to track your cleanup progress.

---

## 🔄 Pre-Cleanup

- [ ] Read `CLEANUP_SUMMARY.md` for overview
- [ ] Review `CLEANUP_PLAN.md` for detailed analysis
- [ ] Create backup: `git commit -am "Pre-cleanup snapshot"`
- [ ] Verify git status is clean: `git status`
- [ ] Note current disk usage: `du -sh .` (optional)

---

## 🗑️ Phase 1: Safe Deletions (No Code Impact)

### Generated Files
- [ ] Delete `dist/` directory
- [ ] Delete `coverage/` directory
- [ ] Delete `src/constants/New folder/` (empty directory)

### Commands:
```bash
rm -rf dist
rm -rf coverage
rmdir "src/constants/New folder"
```

### Outdated Documentation (33 files)
- [ ] Delete entire `context/` directory

### Command:
```bash
rm -rf context
```

### Verify:
- [ ] Run `npm run build` to regenerate dist
- [ ] Run `npm test` to regenerate coverage
- [ ] Ensure no broken imports

### Commit:
```bash
git add -A
git commit -m "chore: remove generated files and outdated documentation"
```

---

## 💾 Phase 2: Remove Unused Source Files

### Unused Migration Script
- [ ] Delete `src/utils/migrateToAutoTiles.ts` (297 lines, not imported)

### Unused Utilities
- [ ] Delete `src/utils/downloadHelper.ts` (117 lines, not imported)
- [ ] Delete `src/utils/performance.ts` (310 lines, not imported)

### Standalone Scripts
- [ ] Delete `test-firebase.js` (55 lines, standalone test)

### Obsolete Files
- [ ] Delete `spritesheetInfo.txt` (6 lines, not referenced)

### Commands:
```bash
rm src/utils/migrateToAutoTiles.ts
rm src/utils/downloadHelper.ts
rm src/utils/performance.ts
rm test-firebase.js
rm spritesheetInfo.txt
```

### Verify:
- [ ] Run `npm test` - all tests should pass
- [ ] Run `npm run build` - should build successfully
- [ ] Check for any TypeScript errors: `npm run lint`

### Commit:
```bash
git add -A
git commit -m "chore: remove unused utilities and scripts"
```

---

## 📄 Phase 3: Documentation Cleanup (Optional)

### Historical Phase Documentation
- [ ] Delete `prd_phase2and3.md` (510 lines)
- [ ] Delete `tasks_phase2and3.md` (1229 lines)
- [ ] Delete `Architecture.md` (239 lines)

### Tool Configuration
- [ ] Review: Do you use repomix? 
  - [ ] YES → Keep `repomix.config.json`
  - [ ] NO → Delete `repomix.config.json`

### Commands:
```bash
# Delete historical docs
rm prd_phase2and3.md
rm tasks_phase2and3.md
rm Architecture.md

# Delete repomix config (if not used)
rm repomix.config.json
```

### Commit:
```bash
git add -A
git commit -m "chore: remove historical documentation files"
```

---

## ✅ Phase 4: Final Verification

### Clean Install
- [ ] Remove node_modules: `rm -rf node_modules`
- [ ] Clean install: `npm install`

### Run Tests
- [ ] Unit tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] No linter errors: `npm run lint`

### Manual Testing
- [ ] Start dev server: `npm run dev`
- [ ] Login works
- [ ] Canvas loads
- [ ] Can create shapes
- [ ] Can use tilemap
- [ ] All tools functional

### Check File Counts
```bash
# Count remaining files (optional)
find src -type f | wc -l
```

---

## 📊 Post-Cleanup Summary

### Space Freed
- [ ] Check disk usage: `du -sh .`
- [ ] Compare to pre-cleanup size

### Files Removed
- [ ] 33 files in `context/` directory
- [ ] 5 unused source files
- [ ] 1 empty directory
- [ ] Build artifacts (dist, coverage)
- [ ] Optional: 3-4 historical docs

**Total:** ~42 files removed

### Git Status
- [ ] All changes committed
- [ ] Working directory clean: `git status`
- [ ] Consider pushing: `git push`

---

## 🎯 Success Criteria

Mark complete when ALL are true:

- [x] ✅ All generated files removed (dist, coverage)
- [x] ✅ All outdated docs removed (context/)
- [x] ✅ All unused code files removed
- [x] ✅ Tests pass (`npm test`)
- [x] ✅ Build succeeds (`npm run build`)
- [x] ✅ App runs correctly (`npm run dev`)
- [x] ✅ No TypeScript errors (`npm run lint`)
- [x] ✅ All changes committed
- [x] ✅ Working directory clean

---

## ⚠️ If Something Breaks

### Rollback Plan
```bash
# Undo last commit
git reset --soft HEAD~1

# Or restore specific file
git checkout HEAD~1 -- path/to/file
```

### Common Issues

**"Cannot find module" error:**
- Check if you accidentally deleted an imported file
- Verify the file was truly unused with: `grep -r "filename" src/`

**Tests failing:**
- Revert: `git checkout HEAD~1`
- Review test output for clues
- Delete files one at a time instead of batch

**Build errors:**
- Clear cache: `rm -rf node_modules/.vite`
- Reinstall: `npm install`
- Check TypeScript: `npm run lint`

---

## 📋 Notes & Observations

Use this space to track any issues or notes during cleanup:

```
Date: _____________
Issue: _____________________________________________
Resolution: ________________________________________

Date: _____________
Issue: _____________________________________________
Resolution: ________________________________________
```

---

## 🎉 Completion

Cleanup completed successfully! 

**Completed by:** _____________  
**Date:** _____________  
**Files removed:** _____________  
**Space freed:** _____________  
**Time taken:** _____________

---

**Next Steps:**
- Update README.md if needed
- Push changes to remote
- Inform team of cleanup
- Monitor for any issues in production

---

*For detailed analysis, see CLEANUP_PLAN.md*  
*For quick overview, see CLEANUP_SUMMARY.md*

