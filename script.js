document.getElementById('calculate-button').addEventListener('click', calculateTotalHours);
document.getElementById('calendar-button').addEventListener('click', generateICal);

function calculateTotalHours() {
    const data = document.getElementById('shift-data').value;
    const lines = data.split('\n');
    let totalWorkMinutes = 0;
    let totalCommuteCost = 0;

    let currentDate = null;

    lines.forEach((line, index) => {
        line = line.trim();

        const dateMatch = line.match(/^(\d{1,2})\/(\d{1,2})(?:\((\w+)\))?/);
        if (dateMatch) {
            const month = dateMatch[1].padStart(2, '0');
            const day = dateMatch[2].padStart(2, '0');
            let year = new Date().getFullYear();

            const currentMonth = new Date().getMonth() + 1;
            if (currentMonth === 12 && parseInt(month) === 1) {
                year += 1;
            }

            currentDate = { year, month, day };
            return;
        }

        const workMatch = line.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
        if (workMatch && currentDate) {
            const startHours = parseInt(workMatch[1], 10);
            const startMinutes = parseInt(workMatch[2], 10);
            const endHours = parseInt(workMatch[3], 10);
            const endMinutes = parseInt(workMatch[4], 10);
            const start = startHours * 60 + startMinutes;
            const end = endHours * 60 + endMinutes;
            let workMinutes = end - start;

            const nextLine = lines[index + 1]?.trim();
            if (nextLine && nextLine.match(/^\[休/)) {
                const breakMatch = nextLine.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
                if (breakMatch) {
                    const breakStartHours = parseInt(breakMatch[1], 10);
                    const breakStartMinutes = parseInt(breakMatch[2], 10);
                    const breakEndHours = parseInt(breakMatch[3], 10);
                    const breakEndMinutes = parseInt(breakMatch[4], 10);
                    const breakStart = breakStartHours * 60 + breakStartMinutes;
                    const breakEnd = breakEndHours * 60 + breakEndMinutes;
                    const breakMinutes = breakEnd - breakStart;
                    workMinutes -= breakMinutes;
                }
            }

            totalWorkMinutes += workMinutes;

            const commuteCost = parseFloat(document.getElementById('commute-cost').value) || 0;
            totalCommuteCost += commuteCost * 2;
        }
    });

    const totalWorkHours = (totalWorkMinutes / 60).toFixed(2);
    document.getElementById('total-work-hours').innerText = totalWorkHours;

    const hourlyWage = parseFloat(document.getElementById('hourly-wage').value) || 0;

    const estimatedSalary = (totalWorkMinutes / 60 * hourlyWage) + totalCommuteCost;
    document.getElementById('estimated-salary').innerText = Math.max(estimatedSalary, 0).toFixed(0);
}

function generateICal() {
    const data = document.getElementById('shift-data').value;
    const lines = data.split('\n');
    let events = [];

    let currentDate = null;

    lines.forEach((line, index) => {
        line = line.trim();

        const dateMatch = line.match(/^(\d{1,2})\/(\d{1,2})(?:\((\w+)\))?/);
        if (dateMatch) {
            const month = dateMatch[1].padStart(2, '0');
            const day = dateMatch[2].padStart(2, '0');
            let year = new Date().getFullYear();

            const currentMonth = new Date().getMonth() + 1;
            if (currentMonth === 12 && parseInt(month) === 1) {
                year += 1;
            }

            currentDate = { year, month, day };
            return;
        }

        const workMatch = line.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
        if (workMatch && currentDate) {
            const startHour = workMatch[1].padStart(2, '0');
            const startMinute = workMatch[2].padStart(2, '0');
            const endHour = workMatch[3].padStart(2, '0');
            const endMinute = workMatch[4].padStart(2, '0');
            const startDateTime = `${currentDate.year}${currentDate.month}${currentDate.day}T${startHour}${startMinute}00`;
            const endDateTime = `${currentDate.year}${currentDate.month}${currentDate.day}T${endHour}${endMinute}00`;
            events.push({
                start: startDateTime,
                end: endDateTime,
                summary: "USJ勤務"
            });
        }
    });

    if (events.length === 0) {
        alert("有効なシフトデータがありません。");
        return;
    }

    let icsContent = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Shift Calculator//EN\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\n";
    events.forEach((event, index) => {
        icsContent += `BEGIN:VEVENT\r\nUID:${Date.now() + index}@shiftcalculator.com\r\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\nDTSTART;TZID=Asia/Tokyo:${event.start}\r\nDTEND;TZID=Asia/Tokyo:${event.end}\r\nSUMMARY:${event.summary}\r\nEND:VEVENT\r\n`;
    });
    icsContent += "END:VCALENDAR\r\n";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'shifts.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}