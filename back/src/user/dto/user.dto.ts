export interface createUserDto {
    name: string,
    email: string,
    password: string,
    publicKey?: string
}

export interface updateUserDto {
    name?: string,
    email?: string,
    password?: string,
    publicKey?: string,
    isActive?: boolean
}

    