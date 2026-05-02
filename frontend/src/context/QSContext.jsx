import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import * as db from '../lib/supabaseService';
import { useAuth } from './AuthContext';

const QSContext = createContext();

const normalize = (str) => {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/university of|university|college|institute|of|the/g, '')
    .replace(/[^a-z0-9]/g, '');
};

const buildNameVariants = (name) => {
  const upper = String(name || '').toUpperCase().trim();
  if (!upper) return [];
  const noParen = upper.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const noLeadingThe = upper.replace(/^THE\s+/, '').trim();
  const noParenNoThe = noParen.replace(/^THE\s+/, '').trim();
  return Array.from(new Set([upper, noParen, noLeadingThe, noParenNoThe].filter(Boolean)));
};

const levenshtein = (a, b) => {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
  for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
};

export const QSProvider = ({ children }) => {
  const [overallData, setOverallData] = useState([]);
  const [subjectData, setSubjectData] = useState([]);
  const [customMappings, setCustomMappings] = useState({});
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      initQSData();
    } else {
      setOverallData([]);
      setSubjectData([]);
      setCustomMappings({});
      setLoading(false);
    }
  }, [user?.id]);

  const initQSData = async () => {
    setLoading(true);
    try {
      const { data: rankData } = await db.fetchQSRankings();
      setOverallData(rankData || []);

      const { data: mapData } = await db.fetchUniversityMappings();
      
      const mappingObj = {};
      mapData?.forEach(m => {
        mappingObj[m.original_name.toUpperCase().trim()] = m.resolved_name.toUpperCase().trim();
      });
      setCustomMappings(mappingObj);
    } catch (err) {
      console.error("Error initializing QS data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const addCustomMapping = useCallback(async (originalName, resolvedName) => {
    if (!originalName || !resolvedName) return;
    
    const cleanOriginal = originalName.toUpperCase().trim();
    const cleanResolved = resolvedName.toUpperCase().trim();
    
    setCustomMappings(prev => ({ ...prev, [cleanOriginal]: cleanResolved }));

    try {
      await db.upsertUniversityMapping(cleanOriginal, cleanResolved);
    } catch (err) {
      console.error("Failed to persist mapping:", err);
    }
  }, []);

  const addBulkCustomMappings = useCallback(async (mappings) => {
    if (!mappings || mappings.length === 0) return;
    
    const newMappings = {};
    const dbRows = [];
    
    mappings.forEach(({ originalName, resolvedName }) => {
      if (!originalName || !resolvedName) return;
      const cleanOriginal = originalName.toUpperCase().trim();
      const cleanResolved = resolvedName.toUpperCase().trim();
      newMappings[cleanOriginal] = cleanResolved;
      dbRows.push({ original_name: cleanOriginal, resolved_name: cleanResolved });
    });
    
    if (dbRows.length === 0) return;

    setCustomMappings(prev => ({ ...prev, ...newMappings }));

    try {
      await db.upsertUniversityMappings(dbRows);
    } catch (err) {
      console.error("Failed to persist bulk mappings:", err);
    }
  }, []);

  const lookupMaps = useMemo(() => {
    const exactMap = new Map();
    const acronymMap = new Map();
    const normalizedMap = new Map();

    overallData.forEach(u => {
      const upper = u.university.toUpperCase().trim();
      buildNameVariants(upper).forEach((variant) => {
        exactMap.set(variant, u);
        const norm = normalize(variant);
        if (norm.length > 3 && !normalizedMap.has(norm)) normalizedMap.set(norm, u);
      });
      const acroMatch = upper.match(/\((.*?)\)/);
      if (acroMatch) acronymMap.set(acroMatch[1].trim(), u);
    });

    return { exactMap, acronymMap, normalizedMap };
  }, [overallData]);

  // Use a ref for the cache to prevent re-creating lookup functions on every cache update
  const lookupCache = useRef(new Map());
  
  // Clear cache when base data changes
  useEffect(() => {
    lookupCache.current.clear();
  }, [overallData, customMappings]);

  const findUniversityByName = useCallback((name) => {
    if (!name || name === '-' || name === 'N.A.') return null;
    const cleanName = name.toUpperCase().trim();

    if (cleanName === 'TBC') return { university: 'TBC', rank_latest: null };

    if (lookupCache.current.has(cleanName)) return lookupCache.current.get(cleanName);

    const { exactMap, acronymMap, normalizedMap } = lookupMaps;
    
    const variants = buildNameVariants(cleanName);
    const mappedName = variants.map((k) => customMappings[k]).find(Boolean) || null;
    
    if (mappedName) {
      const match = buildNameVariants(mappedName).map((k) => exactMap.get(k)).find(Boolean) || null;
      if (match) {
        lookupCache.current.set(cleanName, match);
        return match;
      }
      const result = { university: mappedName, rank_latest: null };
      lookupCache.current.set(cleanName, result);
      return result;
    }

    let found = exactMap.get(cleanName) ?? acronymMap.get(cleanName) ?? null;
    
    if (!found) {
      const normName = normalize(cleanName);
      if (normName.length > 3) found = normalizedMap.get(normName) ?? null;
    }

    if (!found && cleanName.length > 3) {
      const normName = normalize(cleanName);
      let bestDist = 4; // Threshold
      let bestMatch = null;
      
      for (const u of overallData) {
        const uNorm = normalize(u.university);
        // Only run Levenshtein if length difference is small
        if (Math.abs(uNorm.length - normName.length) > 3) continue;
        
        const dist = levenshtein(uNorm, normName);
        if (dist < bestDist) {
          bestDist = dist;
          bestMatch = u;
          if (dist === 1) break; // Good enough
        }
      }
      if (bestMatch) found = bestMatch;
    }

    lookupCache.current.set(cleanName, found);
    return found;
  }, [lookupMaps, overallData, customMappings]);

  const findRankByName = useCallback((name) => {
    const u = findUniversityByName(name);
    return u?.rank_latest ?? null;
  }, [findUniversityByName]);

  const updateQSData = async (newData) => {
    try {
      const { error } = await db.upsertQSRankings(newData);
      if (error) throw error;
      await initQSData();
      return { success: true };
    } catch (err) {
      console.error("Failed to update QS data:", err.message);
      return { success: false, error: err.message };
    }
  };

  return (
    <QSContext.Provider value={{
      overallData, setOverallData, updateQSData,
      subjectData, setSubjectData,
      customMappings, addCustomMapping, addBulkCustomMappings,
      findRankByName, findUniversityByName,
      loading, refreshData: initQSData
    }}>
      {children}
    </QSContext.Provider>
  );
};

export const useQS = () => {
  const context = useContext(QSContext);
  if (!context) throw new Error('useQS must be used within a QSProvider');
  return context;
};
