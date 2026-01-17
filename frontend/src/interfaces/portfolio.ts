export interface UserPortfolio {
    ID: number;
    user_id: number;
    portfolio_name: string;
    description: string;
    template_id: number;
    created_at: string;
    updated_at: string;
}

export interface UserDetail {
    ID: number;
    first_name: string;
    last_name: string;
    email: string;
    profile_image_url?: string;
    education?: {
        school?: {
            ID: number;
            name: string;
            type: string;
            address: string;
            created_at: string;
            updated_at: string;
        };
        school_name?: string;
        curriculum_type?: {
            ID: number;
            name: string;
            created_at: string;
            updated_at: string;
        };
    };
    academic_score?: {
        gpax: string;
        math?: string;
        eng?: string;
        sci?: string;
        lang?: string;
        social?: string;
        created_at: string;
        updated_at: string;
    };
    gpax?: string;
    major?: string;

}

export interface School{
    ID: number;
    name: string;
    type: string;
    address: string;
    created_at: string;
    updated_at: string;
}

export interface AcademicScore{
    gpax: string;
    math?: string;
    eng?: string;
    sci?: string;
    lang?: string;
    social?: string;
    created_at: string;
    updated_at: string;
    transcript_file_url?: string;
}

export interface DisplayUser {
    firstname: string;
    lastname: string;
    major: string;
    school: string;
    profile_image: string;
    gpa: string;
    academic_score?: {
        math?: number;
        eng?: number;
        sci?: number;
        lang?: number;
        social?: number;
        gpax?: string;
    };
}
