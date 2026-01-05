import * as AppState from '../../../app.state';
import { User } from '../models/user.model';

export interface UserState extends User {
    logged: boolean;
    lang: string;
    token?: string;
}

export interface State extends AppState.State {
    user: UserState
}

export const initialState: UserState = {
    indexNumber: '',
    name: '',
    role: 'STUDENT',
    studyYears: [],
    email: '',
    projects: [],
    acceptedProjects: [],
    logged: false,
    lang: 'pl',
    actualYear: '',
}
