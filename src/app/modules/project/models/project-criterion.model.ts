export interface CriteriaProjectDTO {
  criterium: string;
  levelOfRealization: number;
  semester: 'FIRST' | 'SECOND';
  projectId: number;
  userId: number;
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