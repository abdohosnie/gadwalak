export interface StudentInfo {
  id: number;
  full_name: string;
  level: string;
  department: string;
}

export interface Course {
  course_name: string;
  course_code: string;
}

export interface ScheduleItem extends Course {
  scheduled_time: string;
  duration: number;
  location: string;
}

export interface StudentScheduleResponse {
  student: StudentInfo;
  courses: Course[];
  schedule: ScheduleItem[];
}

export interface DepartmentInfo {
  name: string;
  levels: string[];
}

export interface DepartmentScheduleResponse {
  department: string;
  level: string;
  courses: Course[];
  schedule: ScheduleItem[];
}

export interface CourseScheduleResponse {
  course: Course;
  schedule: ScheduleItem[];
}

export type SearchMode = "student" | "department" | "course";
export type Language = "en" | "ar";
export type ViewMode = "list" | "calendar";
