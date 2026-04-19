import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const QSContext = createContext();

const normalize = (str) => {
  if (!str) return '';
  return str.toLowerCase()
    .replace(/university of|university|college|institute|of|the/g, '')
    .replace(/[^a-z0-9]/g, '');
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

  useEffect(() => {
    initQSData();
  }, []);

  const initQSData = async () => {
    setLoading(true);
    try {
      const { data: rankData } = await supabase
        .from('qs_rankings')
        .select('*')
        .order('rank_latest', { ascending: true });
      setOverallData(rankData || []);

      const { data: mapData } = await supabase
        .from('university_mappings')
        .select('original_name, resolved_name');
      
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
      await supabase
        .from('university_mappings')
        .upsert({ 
          original_name: cleanOriginal, 
          resolved_name: cleanResolved 
        }, { onConflict: 'original_name' });
    } catch (err) {
      console.error("Failed to persist mapping:", err);
    }
  }, []);

  const lookupMaps = useMemo(() => {
    const exactMap = new Map();
    const acronymMap = new Map();
    const normalizedMap = new Map();

    overallData.forEach(u => {
      const upper = u.university.toUpperCase().trim();
      exactMap.set(upper, u);
      const acroMatch = upper.match(/\((.*?)\)/);
      if (acroMatch) acronymMap.set(acroMatch[1].trim(), u);
      const norm = normalize(upper);
      if (norm.length > 3) normalizedMap.set(norm, u);
    });

    return { exactMap, acronymMap, normalizedMap };
  }, [overallData]);

  const lookupCache = useMemo(() => new Map(), [overallData, customMappings]);

  const findUniversityByName = useCallback((name) => {
    if (!name || name === '-') return null;
    const cleanName = name.toUpperCase().trim();

    // Requirement: TBC doesn't need mapping
    if (cleanName === 'TBC') return { university: 'TBC', rank_latest: null };

    if (lookupCache.has(cleanName)) return lookupCache.get(cleanName);

    const { exactMap, acronymMap, normalizedMap } = lookupMaps;
    
    const mappedName = customMappings[cleanName];
    if (mappedName) {
      const match = exactMap.get(mappedName);
      if (match) {
        lookupCache.set(cleanName, match);
        return match;
      }
      return { university: mappedName, rank_latest: null };
    }

    let found = null;
    found = exactMap.get(cleanName) ?? null;
    if (!found) found = acronymMap.get(cleanName) ?? null;
    if (!found) {
      const normName = normalize(cleanName);
      if (normName.length > 3) found = normalizedMap.get(normName) ?? null;
    }

    if (!found) {
      const normName = normalize(cleanName);
      if (normName.length > 3) {
        let bestDist = Infinity;
        let bestMatch = null;
        overallData.forEach(u => {
          const uNorm = normalize(u.university);
          const dist = levenshtein(uNorm, normName);
          if (dist <= 3 && dist < bestDist) {
            bestDist = dist;
            bestMatch = u;
          }
        });
        if (bestMatch) found = bestMatch;
      }
    }

    lookupCache.set(cleanName, found);
    return found;
  }, [lookupMaps, lookupCache, overallData, customMappings]);

  const findRankByName = useCallback((name) => {
    if (!name || name === '-') return null;
    const cleanName = name.toUpperCase().trim();

    if (cleanName === 'TBC') return null;

    const mappedName = customMappings[cleanName];
    if (mappedName) {
      const match = lookupMaps.exactMap.get(mappedName);
      if (match) return match.rank_latest ?? 'N.A.';
      return 'N.A.';
    }

    const u = findUniversityByName(name);
    if (!u) return null;
    return u.rank_latest ?? 'N.A.';
  }, [findUniversityByName, customMappings, lookupMaps]);

  const updateQSData = async (newData) => {
    try {
      const { error } = await supabase
        .from('qs_rankings')
        .upsert(newData, { onConflict: 'university' });
      
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
      customMappings, addCustomMapping,
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
