export type HotelStars = "all" | "1" | "2" | "3" | "4" | "5";

export const HOTEL_STAR_OPTIONS: Array<{ value: HotelStars; label: string }> = [
  { value: "all", label: "Alle hotelklasser" },
  { value: "1", label: "★ 1 stjerne" },
  { value: "2", label: "★★ 2 stjerner" },
  { value: "3", label: "★★★ 3 stjerner" },
  { value: "4", label: "★★★★ 4 stjerner" },
  { value: "5", label: "★★★★★ 5 stjerner" },
];

