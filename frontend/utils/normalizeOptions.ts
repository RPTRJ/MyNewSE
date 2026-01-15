export type Option = {
  id: number;
  name: string;
};

export type SchoolOption = Option & {
  is_project_based?: boolean | null;
  school_type_id?: number | null;
};

export const normalizeOptions = (items: any[]): Option[] => {
  if (!Array.isArray(items)) return [];
  
  return items
    .filter((item) => {
      // ต้องมี id และ name ที่ valid
      const hasId = item?.id !== undefined && item?.id !== null;
      const hasName = item?.name !== undefined && item?.name !== null;
      return hasId && hasName;
    })
    .map((item) => ({
      id: Number(item.id),
      name: String(item.name).trim(),
    }));
};

export const normalizeSchoolOptions = (items: any[]): SchoolOption[] => {
  if (!Array.isArray(items)) return [];
  
  return items
    .filter((item) => {
      const hasId = item?.id !== undefined && item?.id !== null;
      const hasName = item?.name !== undefined && item?.name !== null;
      return hasId && hasName;
    })
    .map((item) => ({
      id: Number(item.id),
      name: String(item.name).trim(),
      is_project_based: item.is_project_based ?? null,
      school_type_id: item.school_type_id ?? item.schoolTypeID ?? null,
    }));
};

export const coerceId = (value: any): number | null => {
  if (value === null || value === undefined || value === "" || value === 0) {
    return null;
  }
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
};

export const pickArrayFromResponse = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
};