import KoreanLunarCalendar from "korean-lunar-calendar";

const fixedHolidays: Array<[number, number]> = [
  [1, 1],   // 신정
  [3, 1],   // 삼일절
  [5, 5],   // 어린이날
  [6, 6],   // 현충일
  [8, 15],  // 광복절
  [10, 3],  // 개천절
  [10, 9],  // 한글날
  [12, 25], // 성탄절
];

// 음력 -> 양력 변환
function lunarToSolar(year: number, lunarMonth: number, lunarDay: number): Date | null {
  try {
    const cal = new KoreanLunarCalendar();
    cal.setLunarDate(year, lunarMonth, lunarDay, false);
    const s = cal.getSolarCalendar();
    return new Date(s.year, s.month - 1, s.day);
  } catch {
    return null;
  }
}

function getLunarHolidays(year: number): Date[] {
  const dates: Date[] = [];

  // 설날 (음력 1/1) + 전날, 다음날
  const seollal = lunarToSolar(year, 1, 1);
  if (seollal) {
    const prev = new Date(seollal);
    prev.setDate(prev.getDate() - 1);
    const next = new Date(seollal);
    next.setDate(next.getDate() + 1);
    dates.push(prev, seollal, next);
  }

  // 부처님오신날 (음력 4/8)
  const buddha = lunarToSolar(year, 4, 8);
  if (buddha) dates.push(buddha);

  // 추석 (음력 8/15) + 전날, 다음날
  const chuseok = lunarToSolar(year, 8, 15);
  if (chuseok) {
    const prev = new Date(chuseok);
    prev.setDate(prev.getDate() - 1);
    const next = new Date(chuseok);
    next.setDate(next.getDate() + 1);
    dates.push(prev, chuseok, next);
  }

  return dates;
}

const holidayCache = new Map<number, Set<string>>();

function getHolidaySet(year: number): Set<string> {
  if (holidayCache.has(year)) return holidayCache.get(year)!;

  const set = new Set<string>();

  for (const [m, d] of fixedHolidays) {
    set.add(`${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  }

  for (const d of getLunarHolidays(year)) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    set.add(key);
  }

  holidayCache.set(year, set);
  return set;
}

export function isKoreanHoliday(date: Date): boolean {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return getHolidaySet(date.getFullYear()).has(key);
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function getActualPayDate(year: number, month: number, day: number): Date {
  let date: Date;

  if (day === 0) {
    date = new Date(year, month, 0); // 해당 월의 마지막 날
  } else {
    date = new Date(year, month - 1, day);
  }

  while (isWeekend(date) || isKoreanHoliday(date)) {
    date.setDate(date.getDate() - 1);
  }

  return date;
}
