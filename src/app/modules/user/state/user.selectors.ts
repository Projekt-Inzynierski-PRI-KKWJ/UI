import { createFeatureSelector, createSelector } from "@ngrx/store";
import { UserState } from "./user.state";

const getUserState = createFeatureSelector<UserState>('user');

export const getUser = createSelector(
    getUserState,
    state => state
);

export const isLogged = createSelector(
    getUserState,
    state => state?.logged
)

export const projectAcceptedByStudent = createSelector(
    getUserState,
    state => state?.acceptedProjects[0]
)

export const userRole = createSelector(
    getUserState,
    state => state.role
)

export const isProjectAdmin = createSelector(
    getUserState,
    state => state.role === 'PROJECT_ADMIN'
)

export const isStudent = createSelector(
    getUserState,
    state => state.role === 'STUDENT'
)

export const isSupervisor = createSelector(
    getUserState,
    state => state.role === 'SUPERVISOR'
)

export const isCoordinator = createSelector(
    getUserState,
    state => state?.role === 'COORDINATOR'
)

export const selectActualYear = createSelector(
  getUserState,
  (state: UserState) => state.actualYear
);



