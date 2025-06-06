export interface CriteriaProjectDTO {
  criterium: string;
  levelOfRealization: 'IN_PROGRESS' | 'PARTIALLY_COMPLETED' | 'COMPLETED';
  semester: 'FIRST' | 'SECOND';
  projectId: number;
  userId: number;
  enableForModification: boolean;
  type: 'Required' | 'Expected' | 'Implementation Indicator';
}

export interface CriteriaProject {
  id: number;
  criterium: string;
  levelOfRealization: number;
  semester: string;
  userThatAddedTheCriterium: {
    id: number;
  };
  project: {
    id: number;
  };
  createdAt: string;
  updatedAt: string;
}