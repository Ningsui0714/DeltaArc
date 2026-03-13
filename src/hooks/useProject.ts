import { useEffect, useState } from 'react';
import { createBlankProject, demoProject } from '../data/mockData';
import type { ProjectSnapshot } from '../types';
import { normalizeProjectSnapshot } from '../../shared/schema';

const storageKey = 'wind-tunnel-project';

function isDemoProject(project: ProjectSnapshot) {
  return JSON.stringify(project) === JSON.stringify(demoProject);
}

function readStoredProject() {
  const blankProject = createBlankProject();

  if (typeof window === 'undefined') {
    return blankProject;
  }

  const saved = window.localStorage.getItem(storageKey);
  if (!saved) {
    return blankProject;
  }

  try {
    const normalizedProject = normalizeProjectSnapshot(JSON.parse(saved)) ?? blankProject;
    return isDemoProject(normalizedProject) ? blankProject : normalizedProject;
  } catch {
    return blankProject;
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

  return {
    project,
    updateProject,
    replaceProject,
    resetToBlankProject,
  };
}
