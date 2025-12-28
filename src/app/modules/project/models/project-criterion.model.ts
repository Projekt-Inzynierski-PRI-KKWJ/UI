export interface CriteriaProjectDTO {
  id?: number;
  criterium: string;
  levelOfRealization: 'IN_PROGRESS' | 'PARTIALLY_COMPLETED' | 'COMPLETED';
  semester: 'FIRST' | 'SECOND';
  projectId: number;
  index: string;
  enableForModification: boolean;
  type: 'REQUIRED' | 'EXPECTED' | 'MEASURABLE_IMPLEMENTATION_INDICATORS';
  comment?: string;
}

export interface CriteriaProject {
  id: number;
  criterium: string;
  levelOfRealization: string;
  semester: string;
  userThatAddedTheCriterium: {
    index: string;
  };
  project: {
    id: number;
  };
  createdAt: string;
  updatedAt: string;
  comment?: string;
}