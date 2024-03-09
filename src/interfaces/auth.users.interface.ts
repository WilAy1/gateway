export interface UserRegisterResponse {
    message: string;
    success: boolean;
    emailExists?: boolean;
    hash?: string;
}

export interface UseLoginResponse {
    message: string;
    success: boolean;
    token?: string;
}

export interface UserVerificationResponse {
    success: boolean;
    message: string;
}

export enum UserAccountState {
    ACTIVE = 'active',
    DISABLED = 'inactive',
    SUSPENDED = 'suspended'
}

export interface UserLoginParams {
    email: string; password: string; deviceId: string;
    ip: string; userAgent: string; deviceType: string;
}