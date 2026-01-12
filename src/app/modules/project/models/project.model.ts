import { Student } from "../../user/models/student.model";
import { Supervisor } from "../../user/models/supervisor.model";
import { User } from "../../user/models/user.model";
import { ExternalLink } from "./external-link.model";

export interface Project {
    id?: string;
    name: string;
    supervisor: Supervisor,
    accepted: boolean;
    externalLinks?: ExternalLink[] | null;
    criteriaMet?: boolean | null;
    firstSemesterGrade?: string | null;
    secondSemesterGrade?: string | null;
    confirmed?: boolean;
    defenseDay?: string | null;
    defenseTime?: string | null;
    evaluationPhase?: string | null;   
    classroom?: string | null;
    committee?: string[] | null;
    students?: string | null;
    technologies?: string[];
    description?: string;
    currentMembers?: any[];
    currentMembersCount?: number;
    maxMembers?: number;
    availableSlots?: number;
    status?: string;
    isActive?: boolean;
    contactData?: string;
    ownerDetails?: any;
    creationDate?: string;
    modificationDate?: string;
    studyYear?: string;
}

export interface ProjectDetails {
    id?: string;
    name: string;
    description: string
    students: Student[];
    admin: string;
    technologies: string[];
    supervisor: Supervisor;
    accepted: boolean;
    confirmed: boolean;
    publishButtonShown?: boolean;
    freezeButtonShown?: boolean;
    retakeButtonShown?: boolean;
    externalLinks?: ExternalLink[],
    firstSemesterGrade?: string | null;
    secondSemesterGrade?: string | null;
    defenseDay?: string | null;
    defenseTime?: string | null;
    evaluationPhase?: string | null;   
    classroom?: string | null;
    committee?: string[] | null;
}

export interface ProjectFilters {
    searchValue: string;
    supervisorIndexNumber: string | undefined;
    acceptanceStatus: boolean | undefined;
    columns: string[];
    criteriaMetStatus: boolean | undefined;
}

export interface ProjectFormData {
    supervisors: Supervisor[];
    students: Student[];
    user: User;
    projectDetails?: ProjectDetails;
}