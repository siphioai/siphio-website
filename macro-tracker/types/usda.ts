export interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  value: number;
}

export interface USDASearchResult {
  fdcId: number;
  description: string;
  dataType: string; // "Foundation", "SR Legacy", etc.
  foodNutrients: USDANutrient[];
}

export interface USDASearchResponse {
  foods: USDASearchResult[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}
