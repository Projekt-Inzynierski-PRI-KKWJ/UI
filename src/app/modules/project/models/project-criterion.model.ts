export interface CriteriaProjectDTO {
  criterium: string;
  levelOfRealization: number;
  semester: 'WINTER_2024' | 'SUMMER_2024' | 'WINTER_2025' | 'SUMMER_2025';
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