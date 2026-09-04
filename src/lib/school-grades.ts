/** The complete grade range used by school library upload and discovery. */
export const SCHOOL_GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

export type SchoolGrade = (typeof SCHOOL_GRADES)[number];
