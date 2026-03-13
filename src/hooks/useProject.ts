import { useEffect, useState } from 'react';
import { createBlankProject, demoProject } from '../data/mockData';
import type { ProjectSnapshot } from '../types';
import { normalizeProjectSnapshot } from '../../shared/schema';

const storageKey = 'wind-tunnel-project';

function readStoredProject() {
  if (typeof window === 'undefined') {
    return demoProject;
  }

  const saved = window.localStorage.getItem(storageKey);
  if (!saved) {
    return demoProject;
  }

  try {
    return normalizeProjectSnapshot(JSON.parse(saved)) ?? demoProject;
  } catch {
    return demoProject;
  }
}

export function useProject() {
  const [project, setProject] = useState<ProjectSnapshot>(readStoredProject);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(project));
  }, [project]);

  function updateProject(patch: Partial<ProjectSnapshot>) {
    setProject((current) => ({
      ...current,
      ...patch,
    }));
  }

  function replaceProject(nextProject: ProjectSnapshot) {
    setProject(nextProject);
  }

  function resetToBlankProject() {
    setProject(createBlankProject());
  }

  function loadDemoProject() {
    setProject(demoProject);
  }

  return {
    project,
    updateProject,
    replaceProject,
    resetToBlankProject,
    loadDemoProject,
  };
}
