import { useEffect, useState } from 'react';
import { createBlankProject, demoProject } from '../data/mockData';
import { ensureCurrentWorkspaceStorageEpoch } from '../lib/workspaceStorage';
import type { ProjectSnapshot } from '../types';
import { normalizeProjectSnapshot } from '../../shared/schema';

const legacyProjectStorageKey = 'wind-tunnel-project';
const workspaceStorageKey = 'wind-tunnel-workspace';

function buildProjectStorageKey(workspaceId: string) {
  return `wind-tunnel-project:${workspaceId}`;
}

type WorkspaceProjectState = {
  workspaceId: string;
  project: ProjectSnapshot;
};

function createWorkspaceId() {
  return `workspace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function isDemoProject(project: ProjectSnapshot) {
  return JSON.stringify(project) === JSON.stringify(demoProject);
}

function readStoredProject(workspaceId: string) {
  const blankProject = createBlankProject();

  if (typeof window === 'undefined') {
    return blankProject;
  }

  ensureCurrentWorkspaceStorageEpoch();

  const saved =
    window.localStorage.getItem(buildProjectStorageKey(workspaceId)) ??
    window.localStorage.getItem(legacyProjectStorageKey);
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

function readStoredWorkspaceId() {
  if (typeof window === 'undefined') {
    return createWorkspaceId();
  }

  ensureCurrentWorkspaceStorageEpoch();

  const saved = window.localStorage.getItem(workspaceStorageKey);
  return saved && /^[A-Za-z0-9_-]+$/.test(saved) ? saved : createWorkspaceId();
}

function readStoredWorkspaceProjectState(): WorkspaceProjectState {
  const workspaceId = readStoredWorkspaceId();
  return {
    workspaceId,
    project: readStoredProject(workspaceId),
  };
}

export function useProject() {
  const [state, setState] = useState<WorkspaceProjectState>(readStoredWorkspaceProjectState);
  const { workspaceId, project } = state;

  useEffect(() => {
    window.localStorage.setItem(buildProjectStorageKey(workspaceId), JSON.stringify(project));
  }, [project, workspaceId]);

  useEffect(() => {
    window.localStorage.setItem(workspaceStorageKey, workspaceId);
  }, [workspaceId]);

  function updateProject(patch: Partial<ProjectSnapshot>) {
    setState((current) => ({
      ...current,
      project: {
        ...current.project,
        ...patch,
      },
    }));
  }

  function replaceProject(nextProject: ProjectSnapshot) {
    setState((current) => ({
      ...current,
      project: nextProject,
    }));
  }

  function resetToBlankProject() {
    setState((current) => {
      const nextWorkspaceId = createWorkspaceId();
      const blankProject = createBlankProject();

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(buildProjectStorageKey(current.workspaceId));
        window.localStorage.removeItem(legacyProjectStorageKey);
        window.localStorage.setItem(workspaceStorageKey, nextWorkspaceId);
        window.localStorage.setItem(
          buildProjectStorageKey(nextWorkspaceId),
          JSON.stringify(blankProject),
        );
      }

      return {
        workspaceId: nextWorkspaceId,
        project: blankProject,
      };
    });
  }

  return {
    workspaceId,
    project,
    updateProject,
    replaceProject,
    resetToBlankProject,
  };
}
