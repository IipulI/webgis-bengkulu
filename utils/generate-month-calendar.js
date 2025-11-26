export const generateMonthCalendar = (year, month) => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const daysInMonth = new Date(year, month, 0).getDate();
    const headers = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    });

    const monthInfo = { year, month, headers };

    return { monthInfo, startDate, endDate };
}