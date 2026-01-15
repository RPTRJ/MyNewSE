import { UserInterface } from "./IUser";

export type EducationStatus = "current" | "graduated" | "other";

export interface EducationInterface {
  ID?: number;
  CreatedAt?: string;
  UpdatedAt?: string;

  UserID?: number;
  User?: UserInterface;

  EducationLevelID?: number;
  EducationLevel?: EducationLevelInterface;

  SchoolID?: number | null;
  School?: SchoolInterface | null;
  SchoolName?: string;

  SchoolTypeID?: number | null;
  SchoolType?: SchoolTypeInterface | null;

  CurriculumTypeID?: number | null;
  CurriculumType?: CurriculumTypeInterface | null;

  IsProjectBased?: boolean | null;
  Status?: EducationStatus;
  StartDate?: string | null;
  EndDate?: string | null;
  GraduationYear?: number | null;
}

export interface EducationLevelInterface {
  ID?: number;
  Name?: string;
}

export interface SchoolTypeInterface {
  ID?: number;
  Name?: string;
}

export interface CurriculumTypeInterface {
  ID?: number;
  Name?: string;
}

export interface SchoolInterface {
  ID?: number;
  Code?: string;
  Name?: string;
  SchoolTypeID?: number;
  SchoolType?: SchoolTypeInterface;
  IsProjectBased?: boolean;
}