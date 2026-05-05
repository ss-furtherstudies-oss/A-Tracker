import { useState, useMemo } from 'react';

/**
 * Hook to manage the manual deduplication process for university applications.
 */
export const useUAppDeduplicate = (uappData, sharedStudents, deleteApplication, showToast) => {
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [isDeduplicateModalOpen, setIsDeduplicateModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Normalize helper to identify "duplicates" (same student, uni, and program)
  const normalize = (val) => String(val || '').trim().toLowerCase();

  const findDuplicates = () => {
    const groups = new Map();

    uappData.forEach(app => {
      if (!app.student_id) return;
      
      const student = sharedStudents.find(s => s.id === app.student_id);
      const studentName = student ? `${student.name_en} (${student.student_num})` : 'Unknown Student';
      
      const key = `${app.student_id}|${normalize(app.university)}|${normalize(app.program)}`;
      
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          studentName,
          university: app.university,
          program: app.program,
          items: []
        });
      }
      groups.get(key).items.push(app);
    });

    // Filter only those with more than 1 item
    const duplicates = Array.from(groups.values()).filter(g => g.items.length > 1);
    
    // Sort groups by student name
    duplicates.sort((a, b) => a.studentName.localeCompare(b.studentName));
    
    setDuplicateGroups(duplicates);
    if (duplicates.length === 0) {
      showToast('success', 'No duplicates found in the application database.');
    } else {
      setIsDeduplicateModalOpen(true);
    }
  };

  const handleResolveGroup = async (groupKey, idToKeep) => {
    const group = duplicateGroups.find(g => g.key === groupKey);
    if (!group) return;

    const idsToDiscard = group.items.map(item => item.id).filter(id => id !== idToKeep);
    if (idsToDiscard.length === 0) {
      setDuplicateGroups(prev => prev.filter(g => g.key !== groupKey));
      return true;
    }

    setIsProcessing(true);
    try {
      const results = await Promise.all(idsToDiscard.map(id => deleteApplication(null, id)));
      const failed = results.filter(r => !r.success);
      if (failed.length > 0) {
        showToast('error', `Failed to delete some duplicates: ${failed[0].error}`);
        return false;
      }
      setDuplicateGroups(prev => prev.filter(g => g.key !== groupKey));
      return true;
    } catch (err) {
      showToast('error', `Error during deduplication: ${err.message}`);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const mergeAllExact = async () => {
    const groupsToResolve = duplicateGroups.filter(group => {
      if (group.items.length < 2) return false;
      const first = group.items[0];
      return group.items.every(item => 
        normalize(item.status) === normalize(first.status) &&
        normalize(item.decision) === normalize(first.decision) &&
        normalize(item.condition) === normalize(first.condition) &&
        !!item.has_offer === !!first.has_offer &&
        !!item.is_final === !!first.is_final
      );
    });

    if (groupsToResolve.length === 0) {
      showToast('info', 'No exact duplicates found that can be safely merged automatically.');
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    try {
      for (const group of groupsToResolve) {
        const idToKeep = group.items.find(i => i.is_final)?.id || group.items[0].id;
        const success = await handleResolveGroup(group.key, idToKeep);
        if (success) successCount++;
      }
      showToast('success', `Smart-merged ${successCount} groups of exact duplicates.`);
    } catch (err) {
      showToast('error', `Error during smart merge: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isDeduplicateModalOpen,
    setIsDeduplicateModalOpen,
    duplicateGroups,
    findDuplicates,
    handleResolveGroup,
    mergeAllExact,
    isProcessing
  };
};
