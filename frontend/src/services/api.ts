
import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
})

api.interceptors.request.use((config) => {
    const token = sessionStorage.getItem('accessToken')

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.response?.status === 401 &&
            !error.config?.url?.includes('/auth/login') &&
            !error.config?.url?.includes('/auth/register')
        ) {
            sessionStorage.removeItem('accessToken')
            sessionStorage.removeItem('user')
            window.location.href = '/'
        }

        return Promise.reject(error)
    }
)

export interface LoginResponse {
    message: string
    accessToken: string
    user: {
        id: string
        email: string
    }
}

export interface RegisterResponse {
    message: string
    user: {
        id: string
        email: string
        createdAt: string
    }
}


export type DecisionStatus =
    | 'PROPOSED'
    | 'ACCEPTED'
    | 'SUPERSEDED'
    | 'REVERSED'

export type DecisionVisibility = 'PUBLIC' | 'PRIVATE'

export interface Decision {
    id: string
    title: string
    context: string
    options: string[] | null
    decisionSummary: string
    rationale: string
    status: DecisionStatus
    visibility: DecisionVisibility
    owner: string | null
    userId: string
    createdAt: string
    updatedAt: string
    user: {
        id: string;
        email: string;
    };
}

export interface CreateDecisionPayload {
    title: string
    context: string
    decisionSummary: string
    rationale: string
    options?: string[]
    status?: DecisionStatus
    visibility?: DecisionVisibility
    owner?: string
    commitMessage?: string
}

export interface UpdateDecisionPayload {
    title?: string
    context?: string
    decisionSummary?: string
    rationale?: string
    options?: string[]
    status?: DecisionStatus
    visibility?: DecisionVisibility
    owner?: string
    commitMessage?: string
}

export interface DecisionFilters {
    search?: string
    status?: DecisionStatus
    owner?: string
    visibility?: 'PUBLIC' | 'PRIVATE';
    page?: number
    limit?: number
}

export interface DecisionsResponse {
    data: Decision[]
    pagination: {
        total: number
        page: number
        limit: number
        totalPages: number
    }
}

export interface DecisionVersion {
    id: string
    decisionId: string
    versionNumber: number
    title: string
    context: string
    options: string[] | null
    decisionSummary: string
    rationale: string
    status: DecisionStatus
    owner: string | null
    commitMessage: string | null
    restoredFromVersion: number | null
    createdAt: string
}

export interface VersionComparison {
    decisionId: string
    fromVersion: number
    toVersion: number
    changes: Record<
        string,
        {
            old: unknown
            new: unknown
        }
    >
}

export interface RestoreVersionResponse {
    message: string
    restoredFromVersion: number
    newVersionNumber: number
    decision: Decision
}

export const loginUser = async (
    email: string,
    password: string
): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>(
        '/auth/login',
        { email, password }
    )

    return response.data
}

export const registerUser = async (
    email: string,
    password: string
): Promise<RegisterResponse> => {
    const response = await api.post<RegisterResponse>(
        '/auth/register',
        { email, password }
    )

    return response.data
}
export const createDecision = async (
    data: CreateDecisionPayload
): Promise<Decision> => {
    const response = await api.post<Decision>('/decisions', data)
    return response.data
}

export const getDecisions = async (
    filters: DecisionFilters = {}
): Promise<DecisionsResponse> => {
    const response = await api.get<DecisionsResponse>(
        '/decisions',
        { params: filters }
    )

    return response.data
}

export const getDecisionById = async (
    id: string
): Promise<Decision> => {
    const response = await api.get<Decision>(`/decisions/${id}`)
    return response.data
}

export const updateDecision = async (
    id: string,
    data: UpdateDecisionPayload
): Promise<Decision> => {
    const response = await api.patch<Decision>(
        `/decisions/${id}`,
        data
    )

    return response.data
}


export const getDecisionVersions = async (
    id: string
): Promise<DecisionVersion[]> => {
    const response = await api.get<DecisionVersion[]>(
        `/decisions/${id}/versions`
    )

    return response.data
}

export const getDecisionVersion = async (
    id: string,
    versionNumber: number
): Promise<DecisionVersion> => {
    const response = await api.get<DecisionVersion>(
        `/decisions/${id}/versions/${versionNumber}`
    )

    return response.data
}

export const compareDecisionVersions = async (
    id: string,
    fromVersion: number,
    toVersion: number
): Promise<VersionComparison> => {
    const response = await api.get<VersionComparison>(
        `/decisions/${id}/versions/compare`,
        {
            params: {
                from: fromVersion,
                to: toVersion,
            },
        }
    )

    return response.data
}

export const restoreDecisionVersion = async (
    id: string,
    versionNumber: number,
    commitMessage?: string
): Promise<RestoreVersionResponse> => {
    const response = await api.post<RestoreVersionResponse>(
        `/decisions/${id}/versions/${versionNumber}/restore`,
        { commitMessage }
    )

    return response.data
}


export default api
